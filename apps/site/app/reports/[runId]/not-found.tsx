import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs tracking-wider text-faint uppercase">Persisted report</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Report not found</h1>
      <p className="mt-2 text-sm text-muted">
        No persisted run matches that id. The file may have been deleted or the id is malformed.
      </p>
      <div className="mt-4 flex gap-4 text-sm">
        <Link href="/reports" className="underline underline-offset-2 hover:text-foreground">
          ← All reports
        </Link>
        <Link href="/live?repo=vercel/next.js" className="underline underline-offset-2 hover:text-foreground">
          Scan a repo
        </Link>
      </div>
    </div>
  );
}
