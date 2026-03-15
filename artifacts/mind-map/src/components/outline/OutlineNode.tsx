import React, { useState } from "react";
import { MindMapNode } from "@workspace/api-client-react";
import { useMindMap } from "@/hooks/use-mindmap-context";
import { ChevronRight, ChevronDown, Plus, Trash2, Maximize2, FileText, GripVertical } from "lucide-react";
import { Link } from "wouter";
import { cn, generateColorsForDepth } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface OutlineNodeProps {
  node: MindMapNode;
  depth: number;
}

export function OutlineNode({ node, depth }: OutlineNodeProps) {
  const { updateNode, deleteNode, addChild, root } = useMindMap();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.title);

  const isRoot = root?.id === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const color = generateColorsForDepth(depth);

  const handleToggle = () => {
    updateNode(node.id, n => ({ ...n, collapsed: !n.collapsed }));
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() !== node.title) {
      updateNode(node.id, n => ({ ...n, title: titleInput.trim() || "Untitled Node" }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave();
    if (e.key === 'Escape') {
      setTitleInput(node.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "group flex items-start gap-2 py-1.5 px-2 rounded-lg transition-colors",
          "hover:bg-muted/50"
        )}
      >
        {/* Indentation guides */}
        <div className="flex" style={{ width: `${depth * 24}px` }}>
          {Array.from({ length: depth }).map((_, i) => (
            <div key={i} className="w-6 h-full border-l border-border/50 ml-3" />
          ))}
        </div>

        {/* Drag handle (visual only for now, full DnD complex for tree) */}
        <div className="mt-1.5 opacity-0 group-hover:opacity-40 cursor-grab">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Expand/Collapse Toggle */}
        <button 
          onClick={handleToggle}
          className={cn(
            "mt-1 w-5 h-5 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground",
            !hasChildren && "invisible"
          )}
        >
          {node.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {/* Colored Dot */}
            <div className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: color }} />
            
            {/* Title */}
            {isEditingTitle ? (
              <input
                autoFocus
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-b border-primary outline-none px-1 text-foreground font-medium"
              />
            ) : (
              <span 
                onClick={() => setIsEditingTitle(true)}
                className={cn(
                  "flex-1 cursor-text font-medium truncate",
                  node.collapsed && hasChildren ? "text-foreground" : "text-foreground/90"
                )}
              >
                {node.title}
              </span>
            )}
            
            {/* Actions (visible on hover) */}
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 bg-background/80 backdrop-blur px-2 rounded-md shadow-sm border border-border/50">
              <Link href={`/node/${node.id}`} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded hover:bg-muted" title="Open Detail Page">
                <Maximize2 className="w-3.5 h-3.5" />
              </Link>
              <button 
                onClick={() => addChild(node.id)}
                className="p-1.5 text-muted-foreground hover:text-teal-500 transition-colors rounded hover:bg-muted"
                title="Add Child Node"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {!isRoot && (
                <button 
                  onClick={() => deleteNode(node.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-muted"
                  title="Delete Node"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Description Preview */}
          {node.description && (
            <p className="text-sm text-muted-foreground mt-0.5 ml-4 truncate">
              {node.description}
            </p>
          )}
          {node.content && !node.description && (
            <p className="text-xs text-muted-foreground/60 mt-0.5 ml-4 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Has detailed content
            </p>
          )}
        </div>
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {!node.collapsed && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {node.children.map(child => (
              <OutlineNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
