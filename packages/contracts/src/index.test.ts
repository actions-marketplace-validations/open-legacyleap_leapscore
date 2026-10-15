import { describe, it, expect } from "vitest";
import {
  CONTRACT_VERSION,
  normalizeRepoForSlug,
  repoSlugFromUrl,
  normalizeTs,
  buildRunId,
  isValidRunId,
  resolveEngineSha7,
  assertContractVersion,
  UnsupportedContractVersionError,
} from "./index";

describe("runId grammar", () => {
  it("equivalent inputs produce one slug", () => {
    expect(repoSlugFromUrl("https://github.com/Vercel/next.js.git")).toBe("vercel__next.js");
    expect(repoSlugFromUrl("github.com/vercel/next.js/tree/canary")).toBe("vercel__next.js");
    expect(repoSlugFromUrl("vercel/next.js")).toBe("vercel__next.js");
  });
  it("rejects traversal", () => {
    expect(isValidRunId("../evil")).toBe(false);
    expect(isValidRunId("a/b")).toBe(false);
    expect(isValidRunId("vercel__next.js__abc1234__2026-08-29T053000-123Z")).toBe(true);
  });
  it("buildRunId falls back to unknown", () => {
    const ts = normalizeTs("2026-08-29T05:33:00.123Z");
    expect(buildRunId("vercel__next.js", "", ts)).toBe("vercel__next.js__unknown__2026-08-29T053300-123Z");
  });
  it("normalizeRepo default", () => {
    expect(normalizeRepoForSlug(null)).toBe("django/django");
  });
});

describe("provenance", () => {
  it("explicit ref wins over checkout state", () => {
    expect(
      resolveEngineSha7({ env: {}, engineRef: "3886fde0c15", execImpl: () => "deadbee" }),
    ).toBe("3886fde");
  });
  it("no ref yields unknown", () => {
    expect(resolveEngineSha7({ env: {}, execImpl: () => { throw new Error("no git"); } })).toBe("unknown");
  });
});

describe("contract version", () => {
  it("sealed envelope carries version", () => {
    expect(CONTRACT_VERSION).toBe(1);
  });
  it("bumped version throws explicitly", () => {
    expect(() => assertContractVersion({ contractVersion: CONTRACT_VERSION + 1 })).toThrow(
      UnsupportedContractVersionError,
    );
  });
  it("current version passes", () => {
    expect(() => assertContractVersion({ contractVersion: CONTRACT_VERSION })).not.toThrow();
  });
});
