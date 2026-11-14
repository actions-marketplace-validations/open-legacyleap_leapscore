import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <p className="text-xs tracking-wider text-faint uppercase">Not found</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        That page is not part of this site
      </h1>
      <p className="mt-2 text-sm text-muted">
        The path you requested was never exported. The sample gallery and the
        rubric are the best places to continue.
      </p>
      <p className="mt-4 flex gap-4 text-sm">
        <Link
          href="/"
          className="underline underline-offset-2 hover:text-foreground"
        >
          ← Home
        </Link>
        <Link
          href="/samples"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Samples
        </Link>
      </p>
    </div>
  );
}
