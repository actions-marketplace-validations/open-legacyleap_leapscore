/**
 * apps/site/lib/assessment.ts — the assessment page's booking path.
 *
 * The destination itself is single-sourced in `@leapscore/contracts`
 * (`ASSESSMENT_BASE_URL`). Until a booking vendor is configured, this module
 * builds a working `mailto:` fallback that preserves the report CTA's campaign
 * attribution. Only the campaign, band, and verdict survive — never a repo
 * name, code, or path.
 */
import { ASSESSMENT_BASE_URL, ASSESSMENT_CAMPAIGN, ASSESSMENT_VERDICT } from "@leapscore/contracts";

/** The fallback destination's inbox, until a booking vendor is configured. */
export const ASSESSMENT_EMAIL = "assessment@leapscore.dev";

/** Optional vendor link, configured on the page (never a second contract
 *  constant). Empty until the vendor is selected. */
export const ASSESSMENT_BOOKING_URL = process.env.NEXT_PUBLIC_ASSESSMENT_BOOKING_URL ?? "";

export type AssessmentSearchParams = {
  [key: string]: string | string[] | undefined;
};

export interface AssessmentAttribution {
  campaign: string;
  band?: string;
  verdict?: string;
}

const PUBLIC_BANDS = new Set(["low", "moderate", "high", "critical"]);

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/**
 * Whitelist the attribution the report CTA carries. A band is accepted only
 * for a real public band; a suppressed run's verdict is accepted instead. The
 * two never travel together.
 */
export function assessmentAttribution(params: AssessmentSearchParams): AssessmentAttribution {
  const campaign = first(params.utm_campaign).trim() || ASSESSMENT_CAMPAIGN;
  const verdict = first(params.verdict).trim();
  if (verdict === ASSESSMENT_VERDICT) return { campaign, verdict };
  const band = first(params.band).trim().toLowerCase();
  return PUBLIC_BANDS.has(band) ? { campaign, band } : { campaign };
}

/** The destination a report CTA opens: the configured vendor link when one is
 *  set, otherwise the site route the contract advertises. */
export function assessmentDestination(): { href: string; kind: "vendor" | "site" } {
  return ASSESSMENT_BOOKING_URL.trim()
    ? { href: ASSESSMENT_BOOKING_URL, kind: "vendor" }
    : { href: ASSESSMENT_BASE_URL, kind: "site" };
}

/** The one booking href the page renders: the configured vendor link with the
 *  same whitelisted attribution, or the mailto fallback. */
export function assessmentBookingHref(params: AssessmentSearchParams): { href: string; kind: "vendor" | "mailto" } {
  if (!ASSESSMENT_BOOKING_URL.trim()) return { href: assessmentMailto(params), kind: "mailto" };
  const attribution = assessmentAttribution(params);
  const url = new URL(ASSESSMENT_BOOKING_URL);
  url.searchParams.set("utm_campaign", attribution.campaign);
  if (attribution.band) url.searchParams.set("band", attribution.band);
  if (attribution.verdict) url.searchParams.set("verdict", attribution.verdict);
  return { href: url.toString(), kind: "vendor" };
}

/** The working fallback: a mailto whose subject and body state the attribution
 *  the assessment team needs and nothing they must not have. */
export function assessmentMailto(params: AssessmentSearchParams): string {
  const attribution = assessmentAttribution(params);
  const attributionLine = [
    `Campaign: ${attribution.campaign}`,
    attribution.band ? `Band: ${attribution.band}` : null,
    attribution.verdict ? `Verdict: ${attribution.verdict}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const subject = "LeapScore $0 Assessment — booking request";
  const body = [
    "I would like to book the $0 Assessment.",
    "",
    attributionLine,
    "",
    "The scan ran locally; no code was uploaded.",
    "A report or a short screen share is available on request.",
  ].join("\n");
  return `mailto:${ASSESSMENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
