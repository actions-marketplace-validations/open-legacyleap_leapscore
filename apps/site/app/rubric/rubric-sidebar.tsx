"use client";

import { useState } from "react";
import { Category } from "@/lib/parse-rubric";
import Link from "next/link";

export function RubricSidebar({ rubric }: { rubric: Category[] }) {
  return (
    <aside className="sticky top-20 space-y-6">
      <h2 className="text-xl font-semibold">Categories</h2>
      <nav className="space-y-2">
        {rubric.map((category) => (
          <Link
            key={category.id}
            href={`/rubric/${category.id}`}
            className="block text-muted-foreground hover:text-foreground transition-colors"
          >
            {category.id} - {category.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
