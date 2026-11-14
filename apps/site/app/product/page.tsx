import { ForwardingRedirect } from "@/components/forwarding-redirect";

/**
 * The product page is retired for launch: the method and rubric pages carry
 * the shipped story. A forwarding document keeps existing links working
 * without maintaining a second copy or a server redirect (design D3). It
 * publishes no pre-launch narrative of its own.
 */
export default function ProductPage() {
  return (
    <ForwardingRedirect sibling="method" label="The product page has moved" />
  );
}
