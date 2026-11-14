"use client";

import { useEffect } from "react";

/**
 * Static forwarding document (design D3).
 *
 * A static host serves no redirects and `permanentRedirect()` exports as an
 * error page, but shipped reports link to `/methodology`. This document derives
 * its target from its own pathname — `/…/methodology/` → sibling `/…/method/`
 * — so it works under the Pages base path today and at an origin root later,
 * with no rebuild-time coupling. With scripting unavailable, the rendered link
 * is still a working relative path to the sibling document.
 */
export function ForwardingRedirect({
  sibling,
  label,
}: {
  sibling: string;
  label: string;
}) {
  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    const parent = path.slice(0, path.lastIndexOf("/") + 1);
    window.location.replace(
      `${parent}${sibling}/${window.location.search}${window.location.hash}`,
    );
  }, [sibling]);

  return (
    <main
      className="mx-auto max-w-3xl px-4 py-24"
      data-testid="forwarding-document"
    >
      <p className="text-xs tracking-wider text-faint uppercase">Moved</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{label}</h1>
      <p className="mt-2 text-sm text-muted">
        Continue to the{" "}
        <a
          href={`../${sibling}/`}
          className="underline underline-offset-2 hover:text-foreground"
        >
          method page
        </a>
        .
      </p>
    </main>
  );
}
