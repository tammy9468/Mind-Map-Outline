import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { BrainCircuit, Download, Moon, Sun, ArrowLeft, Save, FileText } from "lucide-react";
import { useMindMap } from "@/hooks/use-mindmap-context";
import { useToast } from "@/hooks/use-toast";
import { useUpdateMindMap } from "@workspace/api-client-react";
import html2canvas from "html2canvas";

interface HeaderProps {
  isDetail?: boolean;
}

export function Header({ isDetail = false }: HeaderProps) {
  const { state, dispatch } = useMindMap();
  const { toast } = useToast();
  const { mutate: updateMap } = useUpdateMindMap();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleManualSave = () => {
    if (!state.mapId || !state.present) return;
    
    setSaveStatus('saving');
    updateMap(
      { id: state.mapId, data: { title: state.title, root: state.present } },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          toast({ title: "Mind map saved successfully" });
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => {
          setSaveStatus('idle');
          toast({ title: "Failed to save mind map", variant: "destructive" });
        },
      }
    );
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleExportJson = () => {
    if (!state.present) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.present, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${state.title}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast({ title: "Exported JSON successfully" });
  };

  const handleExportPng = async () => {
    // Basic implementation for canvas export
    const canvasEl = document.querySelector('.bg-dot-pattern') as HTMLElement;
    if (!canvasEl) {
      toast({ title: "Please switch to Mind Map view to export PNG", variant: "destructive" });
      return;
    }
    try {
      toast({ title: "Generating image..." });
      const canvas = await html2canvas(canvasEl, { backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${state.title}.png`;
      link.href = imgData;
      link.click();
    } catch (e) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4">
        {isDetail ? (
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
        ) : (
          <Link href="/documents" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <BrainCircuit className="w-6 h-6" />
            <span className="font-display font-bold text-lg hidden sm:block">NeuroMap AI</span>
          </Link>
        )}
        
        <div className="h-6 w-px bg-border hidden sm:block" />
        
        <input 
          value={state.title}
          onChange={(e) => dispatch({ type: 'SET_MAP', payload: { id: state.mapId!, title: e.target.value, root: state.present!, createdAt: '', updatedAt: '' } })}
          className="bg-transparent border-none outline-none font-semibold text-foreground w-40 sm:w-64 focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 transition-all"
          placeholder="Mind Map Title"
        />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
          <Sun className="w-5 h-5 dark:hidden" />
          <Moon className="w-5 h-5 hidden dark:block" />
        </button>

        {!isDetail && (
          <div className="flex gap-2">
            <button 
              onClick={handleManualSave}
              disabled={saveStatus === 'saving'}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                saveStatus === 'saved' 
                  ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30'
                  : saveStatus === 'saving'
                  ? 'bg-primary/50 text-primary-foreground border border-primary/50 opacity-75'
                  : 'border border-border hover:bg-muted'
              }`}
              title="Save mind map to cloud"
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
            <button onClick={handleExportJson} className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors">
              <Download className="w-4 h-4" /> JSON
            </button>
            <button onClick={handleExportPng} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 transition-all hover:shadow-md active:scale-95">
              <Download className="w-4 h-4" /> Export Image
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
