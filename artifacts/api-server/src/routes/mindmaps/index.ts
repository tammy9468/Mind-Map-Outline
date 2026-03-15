import { Router, type IRouter } from "express";
import { db, mindMapsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  CreateMindMapBody,
  UpdateMindMapBody,
  UpdateNodeBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  try {
    const maps = await db
      .select({
        id: mindMapsTable.id,
        title: mindMapsTable.title,
        createdAt: mindMapsTable.createdAt,
        updatedAt: mindMapsTable.updatedAt,
      })
      .from(mindMapsTable)
      .orderBy(mindMapsTable.updatedAt);
    res.json(maps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list mind maps" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateMindMapBody.parse(req.body);
    const id = randomUUID();
    const now = new Date();
    const [row] = await db
      .insert(mindMapsTable)
      .values({
        id,
        title: body.title,
        root: body.root as object,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: String(err) });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(mindMapsTable)
      .where(eq(mindMapsTable.id, req.params.id));
    if (!row) {
      return res.status(404).json({ error: "Mind map not found" });
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch mind map" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const body = UpdateMindMapBody.parse(req.body);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) updates.title = body.title;
    if (body.root !== undefined) updates.root = body.root as object;

    const [row] = await db
      .update(mindMapsTable)
      .set(updates)
      .where(eq(mindMapsTable.id, req.params.id))
      .returning();
    if (!row) {
      return res.status(404).json({ error: "Mind map not found" });
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: String(err) });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await db
      .delete(mindMapsTable)
      .where(eq(mindMapsTable.id, req.params.id))
      .returning();
    if (result.length === 0) {
      return res.status(404).json({ error: "Mind map not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete mind map" });
  }
});

router.put("/:id/nodes/:nodeId", async (req, res) => {
  try {
    const body = UpdateNodeBody.parse(req.body);
    const [row] = await db
      .select()
      .from(mindMapsTable)
      .where(eq(mindMapsTable.id, req.params.id));
    if (!row) {
      return res.status(404).json({ error: "Mind map not found" });
    }

    const root = row.root as MindMapNode;
    const updated = updateNodeInTree(root, req.params.nodeId, body);
    if (!updated) {
      return res.status(404).json({ error: "Node not found" });
    }

    await db
      .update(mindMapsTable)
      .set({ root: root as object, updatedAt: new Date() })
      .where(eq(mindMapsTable.id, req.params.id));

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: String(err) });
  }
});

interface MindMapNode {
  id: string;
  title: string;
  description?: string;
  content?: string;
  color?: string;
  collapsed?: boolean;
  children: MindMapNode[];
  x?: number;
  y?: number;
}

function updateNodeInTree(
  node: MindMapNode,
  nodeId: string,
  updates: Partial<MindMapNode>
): MindMapNode | null {
  if (node.id === nodeId) {
    Object.assign(node, updates);
    return node;
  }
  for (const child of node.children) {
    const found = updateNodeInTree(child, nodeId, updates);
    if (found) return found;
  }
  return null;
}

export default router;
