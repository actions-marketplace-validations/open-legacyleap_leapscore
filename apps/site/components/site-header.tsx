import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

const NAV = [
  { href: "/product", label: "Product" },
  { href: "/method", label: "Method" },
  { href: "/rubric", label: "Rubric" },
  { href: "/report/sample", label: "Sample report" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2">
          <BrandMark className="h-5 w-5 text-foreground transition-transform group-hover:rotate-6" />
          <span className="text-sm font-semibold tracking-tight">
            LeapScore
          </span>
          <span className="hidden text-xs text-faint sm:inline">
            leapscore.dev
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="transition-colors hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
          <span className="hidden rounded border border-hairline px-2 py-0.5 text-xs text-faint sm:inline">
            engine: coming
          </span>
        </nav>
      </div>
    </header>
  );
}
