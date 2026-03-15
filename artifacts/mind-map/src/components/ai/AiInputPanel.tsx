import React, { useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";
import { useAiStream } from "@/hooks/use-ai-stream";
import { useMindMap } from "@/hooks/use-mindmap-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function AiInputPanel() {
  const [input, setInput] = useState("");
  const { isStreaming, partialText, generateMindMap, abort } = useAiStream();
  const { dispatch, root } = useMindMap();

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    // If we have an existing tree and want to refine it
    const body = {
      input,
      existingRoot: root || undefined
    };

    const newRoot = await generateMindMap(body);
    if (newRoot) {
      dispatch({ type: 'SET_ROOT', payload: newRoot });
      setInput("");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 absolute bottom-6 left-0 right-0 z-40">
      <AnimatePresence>
        {isStreaming && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-4 glass-panel p-4 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-2 text-primary font-medium">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-gradient">AI is thinking...</span>
              <button onClick={abort} className="ml-auto text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-muted">Cancel</button>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
              {partialText || "Structuring thoughts..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(
        "bg-background/90 backdrop-blur-xl border-2 rounded-2xl shadow-xl transition-colors duration-300 flex items-end p-2",
        isStreaming ? "border-primary/50 shadow-primary/10" : "border-border/50 hover:border-border focus-within:border-primary/50"
      )}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={root ? "Instruct AI to refine or expand the current map..." : "Enter a topic or paste messy notes to generate a structured mind map..."}
          className="flex-1 bg-transparent border-none outline-none resize-none min-h-[44px] max-h-[200px] py-3 px-4 text-foreground placeholder:text-muted-foreground"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          disabled={isStreaming}
        />
        <button
          onClick={handleGenerate}
          disabled={!input.trim() || isStreaming}
          className="shrink-0 m-1 p-3 bg-primary text-primary-foreground rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
        >
          {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
        </button>
      </div>
    </div>
  );
}
