"use client";

import { useState } from "react";

export function UrlBox() {
  const [value, setValue] = useState("github.com/django/django");

  return (
    <form
      action="/report/sample"
      method="get"
      className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="repo-url" className="sr-only">
        GitHub repository URL
      </label>
      <input
        id="repo-url"
        name="repo"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="github.com/owner/repo"
        autoComplete="off"
        className="h-12 flex-1 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground placeholder:text-faint focus:ring-2 focus:ring-ring focus:outline-none"
      />
      <button
        type="submit"
        className="h-12 shrink-0 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Score this repo
      </button>
    </form>
  );
}
