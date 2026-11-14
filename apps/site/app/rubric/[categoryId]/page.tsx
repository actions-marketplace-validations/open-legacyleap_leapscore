import * as React from "react";
import { parseRubric } from "@/lib/parse-rubric";
import { notFound } from "next/navigation";
import { RubricSidebar } from "../rubric-sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Static export needs every category path present at build time (design D1).
// The tree is the source: one document per category the rubric parser returns.
export function generateStaticParams(): { categoryId: string }[] {
  return parseRubric().map((category) => ({ categoryId: category.id }));
}

export const dynamicParams = false;

export default function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = React.use(params);
  const rubric = parseRubric();
  const category = rubric.find((c) => c.id === categoryId);

  if (!category) notFound();

  return (
    <main className="container mx-auto py-12 px-6 flex gap-8">
      <div className="w-1/4">
        <RubricSidebar rubric={rubric} />
      </div>
      <div className="w-3/4 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">{category.name}</h1>
          <blockquote className="text-lg italic text-muted-foreground border-l-4 border-primary pl-4">
            {category.thesis}
          </blockquote>
          <p className="text-muted-foreground">{category.summary}</p>
          
          <div className="grid grid-cols-3 gap-4 text-sm bg-muted p-4 rounded">
              <div><span className="font-semibold block">Base Weight</span>{category.weightBase}</div>
              <div><span className="font-semibold block">FE-Active Weight</span>{category.weightFE}</div>
              <div><span className="font-semibold block">Indicators</span>{category.indicatorCounts}</div>
          </div>
        </div>
        
        <Accordion type="multiple" className="space-y-4">
          {category.indicators.map((indicator) => (
            <AccordionItem key={indicator.id} value={indicator.id} className="border border-border p-2 rounded-lg">
              <AccordionTrigger className="text-2xl font-semibold hover:no-underline px-4">
                <span className="font-mono bg-muted px-2 py-1 rounded mr-3 text-lg">{indicator.id}</span>
                {indicator.name}
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-4 space-y-4">
                
                <div className="grid grid-cols-3 gap-4 text-sm bg-muted p-4 rounded">
                    <div><span className="font-semibold block">Tier</span>{indicator.engineTier}</div>
                    <div><span className="font-semibold block">Status</span>{indicator.defaultStatus}</div>
                    <div><span className="font-semibold block">Verify Effort</span>{indicator.verifyEffort}</div>
                </div>

                <div><h4 className="font-semibold text-sm uppercase text-muted-foreground">Definition</h4><p>{indicator.definition}</p></div>
                <div><h4 className="font-semibold text-sm uppercase text-muted-foreground">Why it matters</h4><p>{indicator.whyItMatters}</p></div>
                <div><h4 className="font-semibold text-sm uppercase text-muted-foreground">Detection</h4><p>{indicator.detectionMethod}</p></div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-amber-50 p-4 rounded border border-amber-200">
                        <h4 className="font-semibold text-sm uppercase text-amber-900">Yellow Flag</h4>
                        <p className="text-amber-800">{indicator.yellowFlag}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded border border-red-200">
                        <h4 className="font-semibold text-sm uppercase text-red-900">Red Flag</h4>
                        <p className="text-red-800">{indicator.redFlag}</p>
                    </div>
                </div>

                <div><h4 className="font-semibold text-sm uppercase text-muted-foreground">Remediation</h4><p>{indicator.remediation}</p></div>
                <div><h4 className="font-semibold text-sm uppercase text-muted-foreground">Scoring Criteria</h4><p>{indicator.scoringCriteria}</p></div>
                
                <div className="text-xs text-muted-foreground mt-4 italic">Scope/overlaps: {indicator.scopeOverlaps}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </main>
  );
}
