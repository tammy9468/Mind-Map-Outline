import React, { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import { MindMapNode } from "@workspace/api-client-react";
import { useMindMap } from "@/hooks/use-mindmap-context";
import { generateColorsForDepth } from "@/lib/utils";
import { motion } from "framer-motion";
import { Maximize2, ZoomIn, ZoomOut, Target, Plus, FileText } from "lucide-react";
import { Link } from "wouter";

interface CanvasState {
  x: number;
  y: number;
  scale: number;
}

export function MindMapCanvas() {
  const { root, updateNode, dispatch } = useMindMap();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [canvas, setCanvas] = useState<CanvasState>({ x: 0, y: 0, scale: 1 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0, origX: 0, origY: 0 });

  // Center the map initially
  useEffect(() => {
    if (containerRef.current && root && canvas.scale === 1 && canvas.x === 0 && canvas.y === 0) {
      const rect = containerRef.current.getBoundingClientRect();
      setCanvas({
        x: rect.width / 4, // Offset slightly to left to accommodate right-heavy tree
        y: rect.height / 2,
        scale: 0.9
      });
      // Force a layout recalculation on mount to ensure coordinates are set
      dispatch({ type: 'RECALCULATE_LAYOUT' });
    }
  }, [root?.id]);

  // --- Canvas Panning & Zooming ---
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const zoomFactor = 0.05;
      const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
      const newScale = Math.min(Math.max(0.2, canvas.scale + delta), 3);
      
      // Zoom towards mouse
      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newX = mouseX - (mouseX - canvas.x) * (newScale / canvas.scale);
      const newY = mouseY - (mouseY - canvas.y) * (newScale / canvas.scale);
      
      setCanvas({ x: newX, y: newY, scale: newScale });
    } else {
      // Pan
      setCanvas(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.mindmap-node')) return;
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX - canvas.x, y: e.clientY - canvas.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingCanvas) {
      setCanvas(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else if (draggingNodeId) {
      // Node dragging
      const dx = (e.clientX - nodeDragStart.x) / canvas.scale;
      const dy = (e.clientY - nodeDragStart.y) / canvas.scale;
      updateNode(draggingNodeId, n => ({
        ...n,
        x: nodeDragStart.origX + dx,
        y: nodeDragStart.origY + dy
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDraggingCanvas(false);
    setDraggingNodeId(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // --- Node Rendering ---
  const renderLines = (node: MindMapNode) => {
    if (!node.children || node.children.length === 0 || node.collapsed) return null;
    
    const startX = (node.x || 0) + 220; // Node width
    const startY = (node.y || 0) + 30;  // Node height / 2

    return (
      <g key={`lines-${node.id}`}>
        {node.children.map(child => {
          const endX = child.x || 0;
          const endY = (child.y || 0) + 30;
          
          // Draw bezier curve
          const controlPointX1 = startX + (endX - startX) / 2;
          const controlPointY1 = startY;
          const controlPointX2 = startX + (endX - startX) / 2;
          const controlPointY2 = endY;

          const d = `M ${startX} ${startY} C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${endX} ${endY}`;
          
          return (
            <React.Fragment key={`line-group-${child.id}`}>
              <path
                d={d}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="transition-all duration-300"
              />
              {renderLines(child)}
            </React.Fragment>
          );
        })}
      </g>
    );
  };

  const renderNodes = (node: MindMapNode, depth: number = 0) => {
    const x = node.x || 0;
    const y = node.y || 0;
    const color = generateColorsForDepth(depth);

    return (
      <React.Fragment key={`node-group-${node.id}`}>
        <div
          className="mindmap-node absolute select-none"
          style={{
            transform: `translate(${x}px, ${y}px)`,
            width: '220px',
            zIndex: draggingNodeId === node.id ? 10 : 1
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDraggingNodeId(node.id);
            setNodeDragStart({ x: e.clientX, y: e.clientY, origX: x, origY: y });
          }}
        >
          <div 
            className="bg-card border-2 shadow-sm rounded-xl p-3 flex flex-col gap-1 transition-all duration-200 group hover:shadow-md cursor-grab active:cursor-grabbing mindmap-node-shadow"
            style={{ borderColor: color }}
          >
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-semibold text-sm leading-tight text-foreground truncate">{node.title}</h4>
              <Link href={`/node/${node.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary">
                <Maximize2 className="w-3 h-3" />
              </Link>
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground truncate">{node.description}</p>
            )}
            {node.content && node.content !== "<p></p>" && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-primary/70 font-medium">
                <FileText className="w-2.5 h-2.5" />
                <span>Rich Content</span>
              </div>
            )}
            
            {/* Node Controls */}
            {node.children && node.children.length > 0 && (
              <button
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center text-xs shadow-sm hover:scale-110 transition-transform z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  updateNode(node.id, n => ({ ...n, collapsed: !n.collapsed }));
                }}
              >
                {node.collapsed ? node.children.length : '-'}
              </button>
            )}
          </div>
        </div>
        {!node.collapsed && node.children?.map(child => renderNodes(child, depth + 1))}
      </React.Fragment>
    );
  };

  if (!root) return <div className="h-full flex items-center justify-center">No Mind Map</div>;

  return (
    <div 
      className="relative w-full h-full bg-dot-pattern overflow-hidden bg-background"
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Controls Overlay */}
      <div className="absolute bottom-6 right-6 flex gap-2 glass-panel p-1.5 rounded-full z-50">
        <button 
          onClick={() => setCanvas(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 3) }))}
          className="p-2 hover:bg-muted rounded-full text-foreground transition-colors"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setCanvas({ x: containerRef.current?.getBoundingClientRect().width! / 4, y: containerRef.current?.getBoundingClientRect().height! / 2, scale: 0.9 })}
          className="p-2 hover:bg-muted rounded-full text-foreground transition-colors"
        >
          <Target className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setCanvas(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.2) }))}
          className="p-2 hover:bg-muted rounded-full text-foreground transition-colors"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-border my-auto mx-1" />
        <button 
          onClick={() => dispatch({ type: 'RECALCULATE_LAYOUT' })}
          className="p-2 hover:bg-muted rounded-full text-foreground transition-colors text-xs font-semibold px-4"
        >
          Auto Layout
        </button>
      </div>

      {/* Canvas Layer */}
      <div 
        className="absolute inset-0 origin-top-left touch-none"
        style={{ transform: `translate(${canvas.x}px, ${canvas.y}px) scale(${canvas.scale})` }}
      >
        {/* SVG Lines */}
        <svg className="absolute inset-0 overflow-visible pointer-events-none">
          {renderLines(root)}
        </svg>

        {/* HTML Nodes */}
        {renderNodes(root)}
      </div>
    </div>
  );
}
