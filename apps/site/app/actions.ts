"use server";

/*
 * Waitlist — Buttondown, env-keyed. When BUTTONDOWN_API_KEY is absent we
 * return a plain "not wired" acknowledgement instead of faking a subscribe.
 */

const WAITLIST_TAG = "leapscore";

export type WaitlistState = {
  status: "idle" | "success" | "error" | "not-wired";
  message: string;
};

function notWired(email: string): WaitlistState {
  return {
    status: "not-wired",
    message: `${email} noted — the waitlist isn't wired up yet. We'll reach out on launch.`,
  };
}

export async function subscribeToWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) return notWired(email);

  const res = await fetch("https://api.buttondown.email/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email, tags: [WAITLIST_TAG] }),
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      status: "error",
      message: "Could not subscribe right now — try again in a minute.",
    };
  }
  return {
    status: "success",
    message: "You're on the list — we'll email you when live scanning opens.",
  };
}
