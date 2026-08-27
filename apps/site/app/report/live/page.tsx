import type { Metadata } from "next";
import LiveReportPage from "@/app/live/page";

export const metadata: Metadata = {
  title: "Live report · LeapScore",
};

// Alias route: /report/live shares the same live surface as /live
export default LiveReportPage;
