import { ForwardingRedirect } from "@/components/forwarding-redirect";

export const metadata = {
  title: "Methodology",
};

/**
 * In-repo resolution for the methodology link the CLI writes into reports
 * (`METHODOLOGY_URL` = https://leapscore.dev/methodology): the report link must
 * be a real document of the site. A static host serves no redirects, so this is
 * a forwarding document that resolves the sibling `method/` path from its own
 * location (design D3), not an HTTP redirect.
 */
export default function MethodologyPage() {
  return (
    <ForwardingRedirect
      sibling="method"
      label="The methodology page has moved"
    />
  );
}
