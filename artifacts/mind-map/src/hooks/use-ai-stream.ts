import { useState, useRef, useCallback } from "react";
import { AiGenerateBody, AiExpandNodeBody, MindMapNode } from "@workspace/api-client-react";
import { useToast } from "./use-toast";

interface AiStreamResult {
  isStreaming: boolean;
  partialText: string;
  error: string | null;
  generateMindMap: (body: AiGenerateBody) => Promise<MindMapNode | null>;
  expandNode: (body: AiExpandNodeBody) => Promise<string | null>;
  abort: () => void;
}

export function useAiStream(): AiStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const generateMindMap = async (body: AiGenerateBody): Promise<MindMapNode | null> => {
    abort();
    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setPartialText("");
    setError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to start AI generation");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedRoot: MindMapNode | null = null;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                setPartialText((prev) => prev + data.chunk);
              }
              if (data.done && data.root) {
                accumulatedRoot = data.root;
              }
            } catch (e) {
              console.error("Failed to parse SSE chunk", dataStr);
            }
          }
        }
      }

      return accumulatedRoot;
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("AI generation aborted");
      } else {
        setError(err.message);
        toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      }
      return null;
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const expandNode = async (body: AiExpandNodeBody): Promise<string | null> => {
    abort();
    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setPartialText("");
    setError(null);

    try {
      const res = await fetch("/api/ai/expand-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error("Failed to start AI expansion");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                setPartialText((prev) => prev + data.chunk);
                fullContent += data.chunk;
              }
            } catch (e) {
              console.error("Failed to parse SSE chunk", dataStr);
            }
          }
        }
      }

      return fullContent;
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("AI expansion aborted");
      } else {
        setError(err.message);
        toast({ title: "Expansion failed", description: err.message, variant: "destructive" });
      }
      return null;
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  return { isStreaming, partialText, error, generateMindMap, expandNode, abort };
}
