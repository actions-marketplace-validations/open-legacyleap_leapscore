/**
 * Relocated paths are forwarding documents, not error pages (design D3,
 * static-hosting). `permanentRedirect()` does not survive `output: "export"`;
 * both paths must render a small document that forwards and keeps a plain
 * relative link when scripts are unavailable.
 */
import { describe, expect, it } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import MethodologyPage from "@/app/methodology/page";
import ProductPage from "@/app/product/page";

function forwardingHtml(page: () => ReactElement): string {
  return renderToStaticMarkup(createElement(page));
}

describe("forwarded paths export forwarding documents", () => {
  it("methodology forwards to the sibling method path", () => {
    const html = forwardingHtml(MethodologyPage);
    expect(html).toContain('data-testid="forwarding-document"');
    expect(html).toContain('href="../method/"');
    expect(html).not.toContain("__next_error__");
  });

  it("product forwards to the method path with no page narrative", () => {
    const html = forwardingHtml(ProductPage);
    expect(html).toContain('href="../method/"');
    expect(html).not.toContain("__next_error__");
    // No duplicated content: no report, category table, or page narrative.
    expect(html).not.toContain("identity-card");
    expect(html).not.toContain("<table");
    expect(html).not.toMatch(/manifesto|roadmap|pricing/i);
  });

  it("both source routes stopped using permanentRedirect", () => {
    for (const route of ["methodology", "product"]) {
      const source = readFileSync(
        join(process.cwd(), "app", route, "page.tsx"),
        "utf8",
      );
      expect(source, route).not.toContain("permanentRedirect");
    }
  });

  it("the built artifact contains a forwarding document for each path", () => {
    if (!existsSync(join(process.cwd(), "out", ".nojekyll"))) return;
    for (const route of ["methodology", "product"]) {
      const exported = join(process.cwd(), "out", route, "index.html");
      if (!existsSync(exported)) continue;
      const html = readFileSync(exported, "utf8");
      expect(html, route).not.toContain("__next_error__");
      expect(html, route).toContain('href="../method/"');
    }
  });
});
