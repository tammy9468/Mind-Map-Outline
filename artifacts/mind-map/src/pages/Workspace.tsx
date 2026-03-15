import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { OutlineView } from "@/components/outline/OutlineView";
import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";
import { AiInputPanel } from "@/components/ai/AiInputPanel";
import { useMindMap } from "@/hooks/use-mindmap-context";
import { useCreateMindMap, useListMindMaps } from "@workspace/api-client-react";
import { ListTree, Network } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "outline" | "mindmap";

export default function Workspace() {
  const [view, setView] = useState<ViewMode>("outline");
  const { state, dispatch, createEmptyRoot } = useMindMap();
  const { data: mindmaps, isLoading } = useListMindMaps();
  const { mutateAsync: createMap } = useCreateMindMap();

  useEffect(() => {
    if (state.mapId) return;

    const initMap = async () => {
      if (mindmaps && mindmaps.length > 0) {
        const res = await fetch(`/api/mindmaps/${mindmaps[0].id}`);
        const data = await res.json();
        dispatch({ type: 'SET_MAP', payload: data });
      } else if (!isLoading && mindmaps?.length === 0) {
        try {
          const newRoot = createEmptyRoot();
          const created = await createMap({ data: { title: "My First Idea", root: newRoot } });
          dispatch({ type: 'SET_MAP', payload: created });
        } catch (e) {
          console.error("Failed to init map", e);
        }
      }
    };
    initMap();
  }, [mindmaps, isLoading, state.mapId]);

  const isMindMap = view === "mindmap";

  return (
    <div className={cn("flex flex-col w-full bg-background", isMindMap ? "h-screen overflow-hidden" : "min-h-screen")}>
      <Header />

      {/* View Toggle Bar — sticky in outline mode, absolute in mindmap mode */}
      <div className={cn(
        "left-1/2 -translate-x-1/2 z-30 glass-panel rounded-full p-1 flex gap-1 shadow-lg",
        isMindMap ? "absolute top-20" : "sticky top-16 mx-auto w-fit mt-3"
      )}>
        <button
          onClick={() => setView("outline")}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
            view === "outline" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <ListTree className="w-4 h-4" /> Outline
        </button>
        <button
          onClick={() => setView("mindmap")}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
            view === "mindmap" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Network className="w-4 h-4" /> Mind Map
        </button>
      </div>

      {/* Main Content Area */}
      <main className={cn("relative", isMindMap ? "flex-1" : "")}>
        {isLoading && !state.present ? (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {view === "outline" ? <OutlineView /> : <MindMapCanvas />}
            <AiInputPanel />
          </>
        )}
      </main>
    </div>
  );
}
