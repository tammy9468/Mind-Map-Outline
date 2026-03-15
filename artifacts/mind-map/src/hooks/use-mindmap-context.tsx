import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { MindMapNode, MindMap } from "@workspace/api-client-react";
import { updateNodeInTree, deleteNodeFromTree, calculateTreeLayout } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { useUpdateMindMap } from "@workspace/api-client-react";
import { useToast } from "./use-toast";

interface MindMapState {
  past: MindMapNode[];
  present: MindMapNode | null;
  future: MindMapNode[];
  mapId: string | null;
  title: string;
}

type Action = 
  | { type: 'SET_MAP'; payload: MindMap }
  | { type: 'SET_ROOT'; payload: MindMapNode }
  | { type: 'UPDATE_NODE'; payload: { id: string; updater: (n: MindMapNode) => MindMapNode } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'ADD_CHILD'; payload: { parentId: string; child: MindMapNode } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RECALCULATE_LAYOUT' };

const initialState: MindMapState = {
  past: [],
  present: null,
  future: [],
  mapId: null,
  title: "Untitled Mind Map",
};

function mindMapReducer(state: MindMapState, action: Action): MindMapState {
  switch (action.type) {
    case 'SET_MAP':
      return {
        past: [],
        present: calculateTreeLayout(action.payload.root),
        future: [],
        mapId: action.payload.id,
        title: action.payload.title,
      };
      
    case 'SET_ROOT':
      if (!state.present) return state;
      return {
        ...state,
        past: [...state.past, state.present],
        present: calculateTreeLayout(action.payload),
        future: [],
      };

    case 'UPDATE_NODE':
      if (!state.present) return state;
      const updatedTree = updateNodeInTree(state.present, action.payload.id, action.payload.updater);
      return {
        ...state,
        past: [...state.past, state.present],
        present: updatedTree,
        future: [],
      };

    case 'DELETE_NODE':
      if (!state.present || state.present.id === action.payload) return state; // Can't delete root here
      const treeAfterDelete = deleteNodeFromTree(state.present, action.payload);
      if (!treeAfterDelete) return state;
      return {
        ...state,
        past: [...state.past, state.present],
        present: calculateTreeLayout(treeAfterDelete),
        future: [],
      };

    case 'ADD_CHILD':
      if (!state.present) return state;
      const treeWithChild = updateNodeInTree(state.present, action.payload.parentId, (node) => ({
        ...node,
        collapsed: false,
        children: [...(node.children || []), action.payload.child],
      }));
      return {
        ...state,
        past: [...state.past, state.present],
        present: calculateTreeLayout(treeWithChild),
        future: [],
      };

    case 'UNDO':
      if (state.past.length === 0 || !state.present) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        ...state,
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };

    case 'REDO':
      if (state.future.length === 0 || !state.present) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        ...state,
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };

    case 'RECALCULATE_LAYOUT':
      if (!state.present) return state;
      return {
        ...state,
        present: calculateTreeLayout(state.present),
      };

    default:
      return state;
  }
}

const MindMapContext = createContext<{
  state: MindMapState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function MindMapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(mindMapReducer, initialState);
  const { mutate: updateMap } = useUpdateMindMap();
  const { toast } = useToast();

  // Auto-save effect
  useEffect(() => {
    if (!state.mapId || !state.present) return;

    const timeoutId = setTimeout(() => {
      updateMap(
        { id: state.mapId!, data: { title: state.title, root: state.present! } },
        {
          onError: () => toast({ title: "Failed to auto-save", variant: "destructive" }),
        }
      );
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [state.present, state.title, state.mapId, updateMap, toast]);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
        } else {
          dispatch({ type: 'UNDO' });
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <MindMapContext.Provider value={{ state, dispatch }}>
      {children}
    </MindMapContext.Provider>
  );
}

export function useMindMap() {
  const context = useContext(MindMapContext);
  if (!context) {
    throw new Error("useMindMap must be used within a MindMapProvider");
  }

  const { state, dispatch } = context;

  const createEmptyRoot = (): MindMapNode => ({
    id: uuidv4(),
    title: "Central Idea",
    description: "Start brainstorming here...",
    children: [],
  });

  return {
    state,
    dispatch,
    root: state.present,
    updateNode: (id: string, updater: (n: MindMapNode) => MindMapNode) => 
      dispatch({ type: 'UPDATE_NODE', payload: { id, updater } }),
    deleteNode: (id: string) => dispatch({ type: 'DELETE_NODE', payload: id }),
    addChild: (parentId: string, title: string = "New Node") => {
      const child: MindMapNode = { id: uuidv4(), title, children: [] };
      dispatch({ type: 'ADD_CHILD', payload: { parentId, child } });
      return child;
    },
    createEmptyRoot
  };
}
