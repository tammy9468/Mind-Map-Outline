import React, { useState } from "react";
import { Link } from "wouter";
import { BrainCircuit, Plus, Trash2, Edit2, ArrowLeft, Moon, Sun } from "lucide-react";
import { useListMindMaps, useCreateMindMap, useDeleteMindMap } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

export default function Documents() {
  const { data: mindmaps, isLoading, refetch } = useListMindMaps();
  const { mutateAsync: createMap } = useCreateMindMap();
  const { mutateAsync: deleteMap } = useDeleteMindMap();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const handleCreateNew = async () => {
    try {
      const newRoot = {
        id: uuidv4(),
        title: "Central Idea",
        description: "Start brainstorming here...",
        children: [],
      };
      const created = await createMap({ data: { title: "New Mind Map", root: newRoot } });
      toast({ title: "Mind map created successfully" });
      await refetch();
    } catch (e) {
      toast({ title: "Failed to create mind map", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mind map?")) return;
    try {
      await deleteMap({ id });
      toast({ title: "Mind map deleted successfully" });
      await refetch();
    } catch (e) {
      toast({ title: "Failed to delete mind map", variant: "destructive" });
    }
  };

  const handleRename = async (id: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }
    // Note: Rename is handled by updating the title through the workspace
    // This is just for UI feedback
    setEditingId(null);
    toast({ title: "Please use the workspace to rename the mind map" });
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary">
            <BrainCircuit className="w-6 h-6" />
            <span className="font-display font-bold text-lg hidden sm:block">NeuroMap AI</span>
          </div>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <span className="font-semibold text-foreground">My Documents</span>
        </div>

        <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
          <Sun className="w-5 h-5 dark:hidden" />
          <Moon className="w-5 h-5 hidden dark:block" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Create New Button */}
          <div className="mb-8">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 transition-all hover:shadow-md active:scale-95 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create New Mind Map
            </button>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : mindmaps && mindmaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mindmaps.map((mindmap) => (
                <Link key={mindmap.id} href={`/?id=${mindmap.id}`}>
                  <div className="group cursor-pointer">
                    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all hover:border-primary/50 h-full flex flex-col">
                      {/* Document Title */}
                      <div className="flex-1 mb-4">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {mindmap.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated: {new Date(mindmap.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(mindmap.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium border border-border rounded hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BrainCircuit className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No mind maps yet. Create your first one!</p>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Mind Map
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
