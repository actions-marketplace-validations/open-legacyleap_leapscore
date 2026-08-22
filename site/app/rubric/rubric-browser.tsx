"use client";

import { useState } from "react";
import { Category } from "@/lib/parse-rubric";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function RubricBrowser({ rubric }: { rubric: Category[] }) {
  const [search, setSearch] = useState("");

  console.log("Rubric data:", rubric);
  const filteredRubric = rubric
    .map(category => ({
      ...category,
      indicators: category.indicators.filter(ind => 
        ind.name.toLowerCase().includes(search.toLowerCase()) || 
        ind.id.toLowerCase().includes(search.toLowerCase())
      )
    }))
    .filter(category => category.indicators.length > 0);
  console.log("Filtered Rubric:", filteredRubric);

  return (
    <>
      <input
        type="search"
        placeholder="Search indicators by name or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-4 mb-8 border border-border rounded-lg bg-background"
      />

      <Accordion type="multiple" className="w-full space-y-4" value={rubric.map(c => c.id)}>
        {filteredRubric.map((category) => (
          <AccordionItem key={category.id} value={category.id} className="border border-border p-2 rounded-lg">
            <AccordionTrigger className="text-2xl font-semibold text-foreground px-4">
              {category.id} - {category.name}
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-2">
              <div className="space-y-4 mt-4">
                {category.indicators.map((indicator) => (
                  <div key={indicator.id} className="border-t border-border pt-4">
                    <h3 className="text-lg font-medium text-foreground">
                      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-sm mr-2">{indicator.id}</span>
                      {indicator.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{indicator.definition}</p>
                    <span className="text-xs font-semibold mt-2 inline-block bg-muted px-2 py-1 rounded">
                      Tier: {indicator.engineTier}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
