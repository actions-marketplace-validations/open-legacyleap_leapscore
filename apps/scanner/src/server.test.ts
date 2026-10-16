import { describe, it, expect } from "vitest";
import { frame, refusedFrame, parseFrameLine, validatePermalinkRunId, PROTOCOL_VERSION } from "./protocol";
import { AdmissionController } from "./admission";
import { createServer, toScanUrl } from "./server";

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
    const { repoSlugFromUrl } = await import("@leapscore/contracts");
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

describe("stateless routing", () => {
  async function withServer(fn: (base: string) => Promise<void>): Promise<void> {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    try {
      await fn(`http://127.0.0.1:${port}`);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  it("serves /health without a store", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/health`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean };
      expect(body.ok).toBe(true);
    });
  });

  it("has no report permalink — a formerly valid runId 404s", async () => {
    await withServer(async (base) => {
      const res = await fetch(`${base}/reports/vercel__next.js__abc1234__2026-08-29T053000-123Z`);
      expect(res.status).toBe(404);
    });
  });
});
