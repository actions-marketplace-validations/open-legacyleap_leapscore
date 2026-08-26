import { Metadata } from "next";
import { parseRubric } from "@/lib/parse-rubric";
import { RubricSidebar } from "./rubric-sidebar";

export const metadata: Metadata = {
  title: "Rubric | LeapScore",
  description: "Browse the 102 indicators used to audit codebase maintainability.",
};

export default function RubricPage() {
  const rubric = parseRubric();

  return (
    <main className="container mx-auto py-12 px-6 flex gap-8">
      <div className="w-1/4">
        <RubricSidebar rubric={rubric} />
      </div>
      <div className="w-3/4">
        <h1 className="text-4xl font-bold mb-6">Rubric Browser</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Select a category from the sidebar to explore indicators.
        </p>
      </div>
    </main>
  );
}
