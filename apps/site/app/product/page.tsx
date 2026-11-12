import { permanentRedirect } from "next/navigation";

/**
 * The product page is retired for launch: the method and rubric pages already
 * carry the shipped story, and the old product page carried the pre-launch
 * claims this change exists to remove (design D6). A permanent redirect keeps
 * existing links working without maintaining a second copy.
 */
export default function ProductPage(): never {
  permanentRedirect("/method");
}
