import { permanentRedirect } from "next/navigation";

export const metadata = {
  title: "Methodology",
};

/**
 * In-repo resolution for the methodology link the CLI writes into reports
 * (`METHODOLOGY_URL` = https://leapscore.dev/methodology): the report link must
 * be a real route of the site, so this path permanently redirects to /method
 * (spec: release-funnel). Same `permanentRedirect` pattern as
 * `app/report/sample/page.tsx`.
 */
export default function MethodologyRedirectPage(): never {
  permanentRedirect("/method");
}
