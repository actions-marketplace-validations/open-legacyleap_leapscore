import { describe, it, expect } from "vitest";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { frame, refusedFrame, parseFrameLine, validatePermalinkRunId, PROTOCOL_VERSION } from "./protocol";
import { AdmissionController } from "./admission";
import { writeEnvelope, readEnvelope } from "./store";
import { toScanUrl } from "./server";
import { CONTRACT_VERSION } from "@leapscore/contracts";

function envelope(runId: string) {
  return {
    meta: {
      repo: "vercel/next.js",
      repoUrl: "https://github.com/vercel/next.js",
      repoSlug: "vercel__next.js",
      engineSha7: "abc1234",
      runId,
      ranAt: "2026-08-29T05:33:00.123Z",
      durationMs: 1000,
      budgetMs: 5000,
      repoSha: "unknown",
      score: 60,
      tier: "Moderate",
      status: "complete",
      engine_version: "unified/1.0",
      rubric_version: "docs/rubric@tranche-a",
      filename: `${runId}.json`,
      contractVersion: CONTRACT_VERSION,
    },
    report: { headline: { score: 60, tier: "Moderate", ci_band: "complete" } },
    trace: [{ ts: 0, elapsedMs: 0, label: "start" }],
    contractVersion: CONTRACT_VERSION,
  } as never;
}

describe("frame protocol", () => {
  it("every frame carries a protocol version", () => {
    for (const t of ["meta", "progress", "trace", "report", "refused"] as const) {
      const f = parseFrameLine(frame(t, { x: 1 }))!;
      expect(f.v).toBe(PROTOCOL_VERSION);
      expect(f.type).toBe(t);
    }
  });
  it("refused frame is terminal-shaped with reason", () => {
    const f = parseFrameLine(refusedFrame("unsupported_host", "nope", "gitlab.com/foo/bar"))!;
    expect(f.type).toBe("refused");
    expect(f.reason).toBe("unsupported_host");
  });
});

describe("scan URL normalization", () => {
  it("all three URL forms normalize to the same repoSlug", async () => {
    const { repoSlugFromUrl } = await import("../../../packages/contracts/src/index.js");
    const a = repoSlugFromUrl(toScanUrl("vercel/next.js"));
    const b = repoSlugFromUrl(toScanUrl("https://github.com/vercel/next.js"));
    const c = repoSlugFromUrl(toScanUrl("github.com/vercel/next.js/tree/canary"));
    expect(a).toBe("vercel__next.js");
    expect(b).toBe("vercel__next.js");
    expect(c).toBe("vercel__next.js");
  });
});

describe("permalink validation", () => {
  it("rejects traversal before store access", () => {
    expect(validatePermalinkRunId("..")).toEqual({ ok: false, status: 400 });
    expect(validatePermalinkRunId("a/b")).toEqual({ ok: false, status: 400 });
    expect(validatePermalinkRunId("nope")).toEqual({ ok: false, status: 404 });
    const good = "vercel__next.js__abc1234__2026-08-29T053000-123Z";
    expect(validatePermalinkRunId(good)).toEqual({ ok: true, runId: good });
  });
});

describe("admission control", () => {
  it("burst beyond the admitted rate is refused without work", () => {
    const adm = new AdmissionController(2, 60_000, 10);
    expect(adm.tryAdmit("1.2.3.4", 1000)).toBe(true);
    expect(adm.tryAdmit("1.2.3.4", 1001)).toBe(true);
    expect(adm.tryAdmit("1.2.3.4", 1002)).toBe(false);
  });
  it("concurrency cap refuses", () => {
    const adm = new AdmissionController(100, 60_000, 1);
    expect(adm.tryAdmit("9.9.9.9", 1000)).toBe(true);
    expect(adm.tryAdmit("9.9.9.9", 1001)).toBe(false);
    adm.release("9.9.9.9");
    expect(adm.tryAdmit("9.9.9.9", 1002)).toBe(true);
  });
});

describe("canonical store", () => {
  it("writes atomically with no tmp residue; second write overwrites identically", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "scanner-store-"));
    try {
      const id = "vercel__next.js__abc1234__2026-08-29T053000-123Z";
      await writeEnvelope(envelope(id), dir);
      await writeEnvelope(envelope(id), dir);
      const files = await readdir(dir);
      expect(files).toEqual([`${id}.json`]);
      const loaded = await readEnvelope(id, dir);
      expect(loaded!.meta.runId).toBe(id);
      // Stored parts equal what a terminal frame would carry.
      const terminal = JSON.parse(frame("report", { report: loaded!.report, meta: loaded!.meta, trace: loaded!.trace }));
      expect(terminal.report).toEqual(JSON.parse(await readFile(path.join(dir, `${id}.json`), "utf8")).report);
      expect(terminal.meta).toEqual(JSON.parse(await readFile(path.join(dir, `${id}.json`), "utf8")).meta);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("traversal runId never touches the store", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "scanner-store-"));
    try {
      expect(await readEnvelope("../../etc/passwd", dir)).toBeNull();
      expect((await readdir(dir)).length).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
