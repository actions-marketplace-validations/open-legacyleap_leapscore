import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CATEGORY_ORDER, INDICATOR_REGISTRY } from "./generated/rubric";
import { categoryHref, categoryPrefix, indicatorHref } from "./rubric-links";

describe("rubric links (design D8)", () => {
  it("derives the padded category prefix from CATEGORY_ORDER", () => {
    expect(categoryPrefix("ECOS")).toBe("01");
    expect(categoryPrefix("ARCH")).toBe("02");
    expect(categoryPrefix("FE")).toBe("10");
    expect(() => categoryPrefix("NOPE")).toThrow(/unknown rubric category/);
  });

  it("covers all 102 IDs with the category's own prefix", () => {
    const ids = Object.keys(INDICATOR_REGISTRY);
    expect(ids).toHaveLength(102);
    for (const id of ids) {
      const code = id.split("-")[0];
      const prefix = categoryPrefix(code);
      expect(indicatorHref(id)).toBe(`/rubric/${prefix}/${id}`);
      expect(indicatorHref(id).split("/").pop()).toBe(id);
    }
  });

  it("builds category paths for every category", () => {
    expect(CATEGORY_ORDER.map((code) => categoryHref(code))).toEqual([
      "/rubric/01",
      "/rubric/02",
      "/rubric/03",
      "/rubric/04",
      "/rubric/05",
      "/rubric/06",
      "/rubric/07",
      "/rubric/08",
      "/rubric/09",
      "/rubric/10",
    ]);
  });

  it("no served component types a /rubric/... path", () => {
    const roots = ["app", "components"];
    const files = roots.flatMap((root) =>
      readdirSync(join(process.cwd(), root), { recursive: true })
        .map((path) => join(root, String(path)))
        .filter(
          (path) =>
            /\.(ts|tsx)$/.test(path) &&
            !path.includes(".test.") &&
            !path.includes("generated"),
        ),
    );
    const offenders = files.filter((path) =>
      /\/rubric\//.test(readFileSync(join(process.cwd(), path), "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
