import React from "react";
import { useMindMap } from "@/hooks/use-mindmap-context";
import { OutlineNode } from "./OutlineNode";

export function OutlineView() {
  const { root } = useMindMap();

  if (!root) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No mind map loaded.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto pb-40">
        <OutlineNode node={root} depth={0} />
      </div>
    </div>
  );
}
