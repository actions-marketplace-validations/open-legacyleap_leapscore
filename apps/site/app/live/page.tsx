import type { Metadata } from "next";
import { LiveReportClient } from "./LiveReportClient";

export const metadata: Metadata = {
  title: "Live report · LeapScore",
};

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ repo?: string }>;
}) {
  const { repo } = await searchParams;
  const target = repo ?? "vercel/next.js";
  // Key by repo so a different target remounts with fresh scan state instead of
  // resetting it from an effect.
  return <LiveReportClient key={target} repo={target} />;
}
