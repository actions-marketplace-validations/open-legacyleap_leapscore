import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import RubricPage from "@/app/rubric/page";
import CategoryPage from "@/app/rubric/[categoryId]/page";
import IndicatorPage, {
  generateStaticParams as indicatorStaticParams,
} from "@/app/rubric/[categoryId]/[indicatorId]/page";
import SampleDetailPage from "@/app/samples/[slug]/page";
import {
  RUBRIC_INDEX,
  categorySummaries,
  codeForPrefix,
  registryEntries,
  releaseStatusCounts,
} from "@/lib/rubric-index";
import { indicatorHref } from "@/lib/rubric-links";
import { INDICATOR_REGISTRY } from "@/lib/generated/rubric";
import { SAMPLE_ROW_INDEX } from "@/lib/generated/samples";
import envelope from "@/lib/samples/maven-multi-module.json";

function categoryPage(categoryId: string) {
  return CategoryPage({ params: Promise.resolve({ categoryId }) });
}

function indicatorPage(categoryId: string, indicatorId: string) {
  return IndicatorPage({ params: Promise.resolve({ categoryId, indicatorId }) });
}

/** Static markup escapes prose; compare the text the reader sees, not the entities. */
function text(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

describe("rubric index (spec: rubric-browser)", () => {
  const html = renderToStaticMarkup(<RubricPage />);
  const readable = text(html);

  it("names all ten categories with weights and row counts", () => {
    const categories = categorySummaries();
    expect(categories).toHaveLength(10);
    for (const category of categories) {
      expect(readable).toContain(category.name);
      expect(readable).toContain(`>${category.count}<`);
    }
    expect(categories.reduce((sum, category) => sum + category.count, 0)).toBe(
      Object.keys(INDICATOR_REGISTRY).length,
    );
  });

  it("states the four release-status groups with counts", () => {
    const counts = releaseStatusCounts();
    expect(counts.measured + counts.estimated + counts.unknown + counts.not_implemented).toBe(102);
    for (const status of [
      "measured",
      "estimated",
      "unknown",
      "not_implemented",
    ] as const) {
      expect(html).toContain(`data-status="${status}"`);
    }
    expect(html).toContain(`>${counts.measured}<`);
    expect(html).toContain(`>${counts.estimated}<`);
    expect(html).toContain(`>${counts.unknown}<`);
    expect(html).toContain(`>${counts.not_implemented}<`);
  });

  it("carries the versioned coverage sentence and the search controls", () => {
    expect(html).toMatch(/31 of 102 indicators have a detector/);
    expect(html).toContain('type="search"');
    expect(html).toContain("Engine tier");
    expect(html).toContain("Default status");
    expect(html).toContain("Gate");
  });

  it("lists every indicator in the unfiltered search payload", () => {
    for (const entry of RUBRIC_INDEX) {
      expect(html).toContain(indicatorHref(entry.id));
    }
  });

  it("the client payload carries classification only, no prose", () => {
    for (const entry of RUBRIC_INDEX) {
      expect(Object.keys(entry).sort()).toEqual([
        "category",
        "effort",
        "gates",
        "id",
        "name",
        "status",
        "tier",
      ]);
    }
    const serialized = JSON.stringify(RUBRIC_INDEX);
    for (const prose of [
      '"definition"',
      '"why"',
      '"detection"',
      '"criteria"',
      '"remediation"',
      '"scope"',
    ]) {
      expect(serialized).not.toContain(prose);
    }
  });
});

describe("rubric category page (spec: no interaction required)", () => {
  it("renders every row with its classification and a link", async () => {
    const html = renderToStaticMarkup(await categoryPage("02"));
    const readable = text(html);
    const entries = registryEntries().filter((entry) => entry.category === "ARCH");
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(readable).toContain(entry.id);
      expect(readable).toContain(entry.name);
      expect(html).toContain(indicatorHref(entry.id));
    }
    expect(html).toContain("Rollup");
    expect(html).toContain("Gates");
    expect(html).toContain("Effort");
  });

  it("an unknown category is not a page", async () => {
    await expect(categoryPage("99")).rejects.toThrow();
  });
});

describe("rubric indicator document (spec: one stable document per indicator)", () => {
  it("generates one static param per registry ID", () => {
    const params = indicatorStaticParams();
    expect(params).toHaveLength(102);
    expect(new Set(params?.map((param) => param.indicatorId)).size).toBe(102);
  });

  it("renders the four criteria as distinct levels, both rationales, and the contract", async () => {
    const html = renderToStaticMarkup(await indicatorPage("02", "ARCH-02"));
    const readable = text(html);
    expect(readable).toContain("clean, enforced boundaries");
    expect(readable).toContain("cycles in peripheral modules");
    expect(readable).toContain("cycles across core modules");
    expect(readable).toContain("DB-coupled services");
    expect(readable).toContain("warning-level");
    expect(readable).toContain("no module is independently changeable");
    expect(readable).toContain("Quick win.");
    expect(readable).toContain("Structural fix.");
    expect(readable).toContain("Gold standard.");
    expect(readable).toContain("Statusing");
    expect(readable).toContain("slow-dissolvable");
    expect(readable).toContain('"modules": 64');
    expect(readable).toContain("Intra-module coupling/cohesion");
    expect(readable).toContain("not implemented in this release");
  });

  it("links the previous and next indicator and its category index", async () => {
    const html = renderToStaticMarkup(await indicatorPage("02", "ARCH-02"));
    expect(html).toContain(indicatorHref("ARCH-01"));
    expect(html).toContain(indicatorHref("ARCH-03"));
    expect(html).toContain('href="/rubric/02"');
  });

  it("marks an implemented indicator and links its committed evidence row", async () => {
    const html = renderToStaticMarkup(await indicatorPage("02", "ARCH-01"));
    expect(html).toContain("implemented in this release");
    expect(html).toContain(
      `href="/samples/${SAMPLE_ROW_INDEX["ARCH-01"][0].slug}#${SAMPLE_ROW_INDEX["ARCH-01"][0].anchor}"`,
    );
  });

  it("an unknown indicator ID is not a page", async () => {
    await expect(indicatorPage("02", "ARCH-99")).rejects.toThrow();
  });

  it("every registry row maps to an existing category prefix", () => {
    for (const entry of registryEntries()) {
      expect(codeForPrefix(indicatorHref(entry.id).split("/")[2])).toBe(
        entry.category,
      );
    }
  });
});

describe("report rows link to their rubric entries (spec: two-way links)", () => {
  it("every graded sample row links to its exact indicator document", async () => {
    const html = renderToStaticMarkup(
      await SampleDetailPage({ params: Promise.resolve({ slug: "maven-multi-module" }) }),
    );
    const rows = envelope.report.full_table;
    expect(rows.length).toBe(102);
    for (const row of rows) {
      expect(html).toContain(`href="${indicatorHref(row.id)}"`);
    }
  });
});
