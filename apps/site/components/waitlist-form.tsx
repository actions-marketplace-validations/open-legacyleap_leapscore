"use client";

import { useActionState } from "react";

import { subscribeToWaitlist, type WaitlistState } from "@/app/actions";

const initial: WaitlistState = { status: "idle", message: "" };

export function WaitlistForm() {
  const [state, action, pending] = useActionState(subscribeToWaitlist, initial);
  const done = state.status === "success" || state.status === "not-wired";

  return (
    <div className="w-full max-w-md">
      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          required
          disabled={pending || done}
          placeholder="you@company.com"
          className="h-11 flex-1 rounded-md border border-input bg-input px-3 font-mono text-sm text-foreground placeholder:text-faint focus:ring-2 focus:ring-ring focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || done}
          className="h-11 shrink-0 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Joining…" : done ? "On the list" : "Join the waitlist"}
        </button>
      </form>
      <p
        className={`mt-2 text-xs ${
          state.status === "error" ? "text-tier-high" : "text-muted"
        }`}
        aria-live="polite"
      >
        {state.message}
      </p>
    </div>
  );
}
