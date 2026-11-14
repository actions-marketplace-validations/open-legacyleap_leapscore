import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import RubricPage from "@/app/rubric/page";
import CategoryPage from "@/app/rubric/[categoryId]/page";
import IndicatorPage from "@/app/rubric/[categoryId]/[indicatorId]/page";

async function renderAll(): Promise<Array<[string, string]>> {
  return [
    ["/rubric", renderToStaticMarkup(<RubricPage />)],
    [
      "/rubric/02",
      renderToStaticMarkup(
        await CategoryPage({ params: Promise.resolve({ categoryId: "02" }) }),
      ),
    ],
    [
      "/rubric/02/ARCH-02",
      renderToStaticMarkup(
        await IndicatorPage({
          params: Promise.resolve({ categoryId: "02", indicatorId: "ARCH-02" }),
        }),
      ),
    ],
  ];
}

describe("rubric interaction affordances (spec: rubric surfaces obey interaction rules)", () => {
  it("every rubric surface shows pointer and keyboard-focus affordances", async () => {
    for (const [route, html] of await renderAll()) {
      expect(html, `${route} has no pointer affordance`).toContain(
        "cursor-pointer",
      );
      expect(html, `${route} has no keyboard-focus affordance`).toContain(
        "focus-visible:",
      );
    }
  });

  it("the index filters are operable controls, not pointer-only toggles", () => {
    const html = renderToStaticMarkup(<RubricPage />);
    expect(html).toMatch(/<input[^>]*type="search"/);
    expect(html).toMatch(/<select[^>]*class="[^"]*cursor-pointer/);
    expect(html).toContain("focus-visible:outline");
    expect(html).toContain("focus-visible:outline");
  });

  it("the contents rail links are focusable anchors", async () => {
    const html = renderToStaticMarkup(
      await IndicatorPage({
        params: Promise.resolve({ categoryId: "02", indicatorId: "ARCH-02" }),
      }),
    );
    const rail = html.match(/<nav[^>]*aria-label="On this page"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? "";
    expect(rail).toContain('href="#criteria"');
    expect(rail).toContain("focus-visible:outline");
  });
});
