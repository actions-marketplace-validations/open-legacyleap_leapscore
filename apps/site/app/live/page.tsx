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
  return <LiveReportClient repo={repo ?? "vercel/next.js"} />;
}
