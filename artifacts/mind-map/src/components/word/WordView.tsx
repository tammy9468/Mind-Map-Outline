import React from 'react';
import { useMindMap } from "@/hooks/use-mindmap-context";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MindMapNode } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export function WordView() {
  const { root, updateNode } = useMindMap();

  if (!root) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No mind map loaded.</p>
      </div>
    );
  }

  // Helper to collect all nodes into a linear list for the Word view
  const getAllNodes = (node: MindMapNode, depth: number = 0): { node: MindMapNode; depth: number }[] => {
    let nodes = [{ node, depth }];
    if (node.children) {
      node.children.forEach(child => {
        nodes = [...nodes, ...getAllNodes(child, depth + 1)];
      });
    }
    return nodes;
  };

  const allNodes = getAllNodes(root);

  return (
    <div className="p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto pb-40 space-y-8">
        {allNodes.map(({ node, depth }, index) => (
          <div key={node.id} className="group relative">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-1.5 h-6 rounded-full",
                depth === 0 ? "bg-primary" : 
                depth === 1 ? "bg-teal-500" : 
                depth === 2 ? "bg-purple-500" : "bg-muted-foreground/30"
              )} />
              <h3 className={cn(
                "font-display font-bold text-foreground",
                depth === 0 ? "text-3xl" : 
                depth === 1 ? "text-2xl" : 
                depth === 2 ? "text-xl" : "text-lg"
              )}>
                {node.title}
              </h3>
            </div>
            
            <RichTextEditor
              content={node.content || ""}
              onChange={(newContent) => updateNode(node.id, (n) => ({ ...n, content: newContent }))}
              className="border-none shadow-none bg-transparent hover:bg-muted/10 transition-colors"
            />
            
            {index < allNodes.length - 1 && (
              <div className="h-px bg-border/30 mt-8 w-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
