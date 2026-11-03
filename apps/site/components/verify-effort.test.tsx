import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { TopBlockers } from "@/components/blockers";
import { CategorySection, RowDetail } from "@/components/category-section";
import type { CategoryScore, IndicatorRow } from "@/lib/types";

function row(over: Partial<IndicatorRow> = {}): IndicatorRow {
  return {
    id: "SEC-07",
    name: "Patch Cadence",
    category_id: "SEC",
    status: "measured",
    score: 1,
    effort: "⚡ ≤30 min",
    ...over,
  };
}

function category(rows: IndicatorRow[]): CategoryScore {
  return {
    id: "SEC",
    name: "Security",
    weight: 10,
    applicable: rows.length,
    scored_sum: 1,
    category_score: 33.3,
    weighted_contribution: 3.33,
    status_counts: { measured: rows.length, estimated: 0, unknown: 0, not_applicable: 0 },
    indicator_rows: rows,
  };
}

const blocker = {
  row: "SEC-07",
  name: "Patch Cadence",
  points_lost: 1,
  weight_pp: "1.00",
  summary: "dependency lag",
};

describe("verify-effort provenance on site surfaces", () => {
  it("frames the row-detail chip as verification effort, not fix duration", () => {
    const html = renderToStaticMarkup(
      <RowDetail
        r={row({
          effort: "🔶 ~2–4 h",
          remediation: {
            quick_win: "enable Dependabot",
            structural: "wire auto-merge",
            gold_standard: "patched within the exposure window",
            effort: "⚡ ≤30 min",
          },
        })}
      />,
    );
    // The chip beside the remediation prose carries the verify framing, so the
    // tag cannot read as the duration of the fix that follows it.
    expect(html).toContain("Verify effort: ⚡ ≤30 min");
    expect(html).toContain("Remediation");
    // The tag is never rendered bare.
    expect(html).not.toMatch(/>⚡ ≤30 min</);
    // And the row-header chip uses the same framing, with its own tag.
    const header = renderToStaticMarkup(
      <CategorySection category={category([row({ effort: "🔶 ~2–4 h" })])} />,
    );
    expect(header).toContain("Verify effort: 🔶 ~2–4 h");
  });

  it("frames the blockers chip with the same verification vocabulary", () => {
    const html = renderToStaticMarkup(<TopBlockers blockers={[blocker]} />);
    expect(html).toContain("Verify effort: ⚡ ≤30 min");
    expect(html).not.toMatch(/>⚡ ≤30 min</);
  });

  it("renders an absent registry effort as unknown, never the cheapest bracket", () => {
    const html = renderToStaticMarkup(
      <TopBlockers blockers={[{ ...blocker, row: "ZZZ-99" }]} />,
    );
    expect(html).toContain("Verify effort: unknown");
    expect(html).not.toContain("⚡ ≤30 min");
  });

  it("renders a row with no effort value as unknown rather than empty", () => {
    const html = renderToStaticMarkup(
      <CategorySection category={category([row({ effort: undefined as unknown as string })])} />,
    );
    expect(html).toContain("Verify effort: unknown");
  });
});
