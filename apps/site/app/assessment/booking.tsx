"use client";

import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

import {
  assessmentAttribution,
  assessmentBookingHref,
  type AssessmentSearchParams,
} from "@/lib/assessment";

function paramsFromSearch(
  search: ReadonlyURLSearchParams,
): AssessmentSearchParams {
  const params: AssessmentSearchParams = {};
  for (const key of search.keys()) {
    const values = search.getAll(key);
    params[key] = values.length > 1 ? values : values[0];
  }
  return params;
}

/** The booking panel, rendered from a plain params object. It is also the
 *  Suspense fallback, so the static document carries the contract's default
 *  attribution instead of an empty box. */
export function BookingPanel({ params }: { params: AssessmentSearchParams }) {
  const attribution = assessmentAttribution(params);
  const booking = assessmentBookingHref(params);
  const attributionLabel = [
    `campaign ${attribution.campaign}`,
    attribution.band ? `band ${attribution.band}` : null,
    attribution.verdict ? `verdict ${attribution.verdict}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="mt-10 rounded-lg border border-hairline bg-panel/30 p-5">
      <h2 className="text-lg font-semibold">Book the assessment</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {booking.kind === "mailto"
          ? "The booking vendor is not configured yet, so this opens a pre-addressed email. Your attribution travels with the request; nothing is submitted until you send it."
          : "This opens the booking page with your report's attribution attached. Nothing is submitted until you confirm there."}
      </p>
      {attributionLabel ? (
        <p className="mt-1 text-xs text-faint">
          Attribution carried: {attributionLabel}
        </p>
      ) : null}
      <a
        href={booking.href}
        className="mt-4 inline-block rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
      >
        Book the $0 Assessment
      </a>
    </section>
  );
}

/** Reads the visitor's URL in the browser, so attribution survives static
 *  hosting instead of freezing at the build-time default (design D5). */
export function UrlBooking() {
  return <BookingPanel params={paramsFromSearch(useSearchParams())} />;
}
