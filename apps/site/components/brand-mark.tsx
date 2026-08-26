/*
 * Brand mark: the dial/gauge. Monochrome line art, no read — the radial
 * tick band reads as "metered reading" before any content does.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 6.5a5.5 5.5 0 1 1-4.7 8.25" stroke="currentColor" />
      <path d="M12 3.5v3M4.9 8.2l2.1 2.1M3.5 13.5h3" opacity={0.5} />
      <path d="M13.4 10.6 10.6 13.4" stroke="currentColor" />
      <circle cx="10.6" cy="13.4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
