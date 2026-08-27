"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function normalizeToLiveRepo(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Allow full URL or owner/repo
  let cleaned = trimmed.replace(/^https?:\/\//, "").replace(/^github\.com\//, "").replace(/\.git$/, "");
  // Strip tree/ref tail: vercel/next.js/tree/canary -> vercel/next.js
  cleaned = cleaned.split(/[?#]/)[0];
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const [owner, repo] = parts;
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
  return `${owner}/${repo}`;
}

export function UrlBox() {
  const [value, setValue] = useState("github.com/django/django");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeToLiveRepo(value);
    if (!normalized) {
      setError("Enter a public GitHub URL like github.com/owner/repo");
      return;
    }
    setError(null);
    router.push(`/live?repo=${encodeURIComponent(normalized)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xl flex-col gap-2 sm:flex-row" noValidate>
      <label htmlFor="repo-url" className="sr-only">
        GitHub repository URL
      </label>
      <div className="flex flex-1 flex-col">
        <input
          id="repo-url"
          name="repo"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="github.com/owner/repo"
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? "repo-url-error" : undefined}
          className="h-12 flex-1 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground placeholder:text-faint focus:ring-2 focus:ring-ring focus:outline-none"
        />
        {error && (
          <span id="repo-url-error" className="mt-1 text-xs text-tier-high">
            {error}
          </span>
        )}
      </div>
      <button
        type="submit"
        className="h-12 shrink-0 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Score this repo
      </button>
    </form>
  );
}
