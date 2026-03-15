import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { MindMapNode } from "@workspace/api-client-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tree traversal and manipulation helpers
export function findNode(root: MindMapNode, id: string): MindMapNode | null {
  if (root.id === id) return root;
  if (!root.children) return null;
  
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function updateNodeInTree(
  root: MindMapNode, 
  id: string, 
  updater: (node: MindMapNode) => MindMapNode
): MindMapNode {
  if (root.id === id) {
    return updater({ ...root });
  }

  if (!root.children) return root;

  return {
    ...root,
    children: root.children.map(child => updateNodeInTree(child, id, updater))
  };
}

export function deleteNodeFromTree(root: MindMapNode, id: string): MindMapNode | null {
  if (root.id === id) return null; // Cannot delete root through this, but handled at higher level
  
  if (!root.children) return root;

  const newChildren = root.children
    .filter(child => child.id !== id)
    .map(child => deleteNodeFromTree(child, id))
    .filter((child): child is MindMapNode => child !== null);

  return {
    ...root,
    children: newChildren
  };
}

export function generateColorsForDepth(depth: number): string {
  const colors = [
    'hsl(var(--level-0))',
    'hsl(var(--level-1))',
    'hsl(var(--level-2))',
    'hsl(var(--level-3))',
    'hsl(var(--level-4))',
  ];
  return colors[depth % colors.length];
}

// Mind Map Auto Layout Algorithm (Simple horizontal tree)
export function calculateTreeLayout(root: MindMapNode, startX = 0, startY = 0): MindMapNode {
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 60;
  const HORIZONTAL_SPACING = 150;
  const VERTICAL_SPACING = 30;

  // First pass: calculate heights of all subtrees to center parents vertically
  const subtreeHeights = new Map<string, number>();
  
  function calculateHeight(node: MindMapNode): number {
    if (!node.children || node.children.length === 0 || node.collapsed) {
      subtreeHeights.set(node.id, NODE_HEIGHT);
      return NODE_HEIGHT;
    }
    
    let totalHeight = 0;
    for (let i = 0; i < node.children.length; i++) {
      totalHeight += calculateHeight(node.children[i]);
      if (i < node.children.length - 1) {
        totalHeight += VERTICAL_SPACING;
      }
    }
    subtreeHeights.set(node.id, totalHeight);
    return totalHeight;
  }

  calculateHeight(root);

  // Second pass: position nodes
  function positionNode(node: MindMapNode, x: number, yCenter: number): MindMapNode {
    const newNode = { ...node, x, y: yCenter - NODE_HEIGHT / 2 };
    
    if (!newNode.children || newNode.children.length === 0 || newNode.collapsed) {
      return newNode;
    }

    const newChildren = [];
    let currentY = yCenter - (subtreeHeights.get(node.id) || 0) / 2;
    
    for (const child of newNode.children) {
      const childHeight = subtreeHeights.get(child.id) || NODE_HEIGHT;
      const childCenterY = currentY + childHeight / 2;
      
      newChildren.push(positionNode(
        child, 
        x + NODE_WIDTH + HORIZONTAL_SPACING, 
        childCenterY
      ));
      
      currentY += childHeight + VERTICAL_SPACING;
    }
    
    newNode.children = newChildren;
    return newNode;
  }

  return positionNode(root, startX, startY);
}
