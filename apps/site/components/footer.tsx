import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function Footer() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BrandMark className="h-4 w-4 text-faint" />
          <span className="font-medium text-ink">LeapScore</span>
          <span className="text-faint">·</span>
          <span className="text-faint">leapscore.dev</span>
        </div>
        <nav className="flex flex-wrap items-center gap-5">
          <Link
            href="/samples"
            className="transition-colors hover:text-foreground"
          >
            Samples
          </Link>
          <Link
            href="/method"
            className="transition-colors hover:text-foreground"
          >
            Method
          </Link>
          <Link
            href="/rubric"
            className="transition-colors hover:text-foreground"
          >
            Rubric
          </Link>
          <a
            href="mailto:hello@leapscore.dev"
            className="transition-colors hover:text-foreground"
          >
            hello@leapscore.dev
          </a>
        </nav>
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-6 text-xs text-faint">
        <p>
          Sample reports are illustrative; local CLI scans and CI scans are
          available today — see the Method page for what is and isn&apos;t
          measured.
        </p>
      </div>
    </footer>
  );
}
