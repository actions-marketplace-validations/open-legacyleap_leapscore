import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// UrlBox calls useRouter(); the homepage renders outside an App Router mount here.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  }),
}));

import Home from "@/app/page";
import MethodPage from "@/app/method/page";
import { Footer } from "@/components/footer";

describe("funnel-landing chrome tells the current truth", () => {
  it("footer links the site rubric route and drops the unshipped-engine disclaimer", () => {
    const html = renderToStaticMarkup(<Footer />);
    expect(html).toContain('href="/rubric"');
    expect(html).not.toContain("../rubric");
    expect(html).not.toMatch(/until the live engine ships/i);
    expect(html).toMatch(/sample reports are illustrative/i);
    expect(html).toMatch(/available/i);
  });

  it("homepage rubric link targets /rubric", async () => {
    const html = renderToStaticMarkup(await Home());
    expect(html).toContain('href="/rubric"');
    expect(html).not.toContain("../rubric");
  });

  it("method page names the shipped scan paths", () => {
    const html = renderToStaticMarkup(MethodPage());
    expect(html).toMatch(/local CLI scan/i);
    expect(html).toMatch(/live scan/i);
    expect(html).not.toMatch(/in development behind the waitlist/i);
  });

  it("no ../rubric/README.md relative link remains anywhere in the site source", () => {
    const files = ["app", "components", "lib"].flatMap((root) =>
      readdirSync(join(process.cwd(), root), { recursive: true })
        .map((p) => join(root, String(p)))
        .filter((p) => /\.(ts|tsx)$/.test(p) && !p.includes(".test.")),
    );
    const offenders = files.filter((f) =>
      readFileSync(join(process.cwd(), f), "utf8").includes("../rubric/README.md"),
    );
    expect(offenders).toEqual([]);
  });
});
