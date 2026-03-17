import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Header } from "@/components/layout/Header";
import { useMindMap } from "@/hooks/use-mindmap-context";
import { findNode } from "@/lib/utils";
import { Sparkles, Check, X, FileText } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAiStream } from "@/hooks/use-ai-stream";

export default function NodeDetail() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { root, updateNode } = useMindMap();
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  const node = root ? findNode(root, nodeId || "") : null;
  const { expandNode, isStreaming, partialText } = useAiStream();

  useEffect(() => {
    if (node) {
      setContent(node.content || "");
    }
  }, [node?.id]);

  if (!node) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isDetail />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Node not found or mind map not loaded.
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateNode(node.id, n => ({ ...n, content }));
    setIsEditing(false);
  };

  const handleAiAction = async (action: string) => {
    let instruction = "";
    if (action === 'expand') instruction = "Expand on this idea in detail, creating comprehensive paragraphs.";
    if (action === 'summarize') instruction = "Provide a concise 2-sentence summary of this node.";
    if (action === 'points') instruction = "Extract key bullet points from this topic.";

    setIsEditing(true);
    const newContent = await expandNode({
      nodeTitle: node.title,
      nodeDescription: node.description,
      instruction
    });

    if (newContent) {
      // For AI content, we might want to wrap it in a paragraph if it's not already HTML
      const formattedContent = newContent.startsWith('<') ? newContent : `<p>${newContent}</p>`;
      setContent(prev => prev + formattedContent);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isDetail />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 lg:p-12">
          {/* Node Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">{node.title}</h1>
            {node.description && (
              <p className="text-lg text-muted-foreground">{node.description}</p>
            )}
          </div>

          {/* AI Tools */}
          <div className="flex flex-wrap gap-3 mb-8 pb-8 border-b border-border">
            <button 
              onClick={() => handleAiAction('expand')}
              disabled={isStreaming}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-colors text-primary font-medium disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> Expand Details
            </button>
            <button 
              onClick={() => handleAiAction('summarize')}
              disabled={isStreaming}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl hover:bg-muted transition-colors text-foreground font-medium disabled:opacity-50"
            >
              Generate Summary
            </button>
            <button 
              onClick={() => handleAiAction('points')}
              disabled={isStreaming}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl hover:bg-muted transition-colors text-foreground font-medium disabled:opacity-50"
            >
              Extract Points
            </button>
          </div>

          {/* Editor Area */}
          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" /> Document Content
              </h3>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 text-sm font-medium transition-transform active:scale-95"
                >
                  Edit Document
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setContent(node.content || ""); setIsEditing(false); }}
                    className="px-4 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-muted text-sm font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 text-sm font-medium flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <RichTextEditor
                content={content + (isStreaming ? partialText : "")}
                onChange={setContent}
                editable={isEditing}
                className={cn(
                  "min-h-[400px]",
                  !isEditing && "border-border/50 shadow-none"
                )}
              />
              {isStreaming && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-primary bg-background/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-primary/20">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-sm font-medium animate-pulse">AI is writing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
