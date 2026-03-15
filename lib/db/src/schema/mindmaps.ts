import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mindMapsTable = pgTable("mind_maps", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  root: jsonb("root").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMindMapSchema = createInsertSchema(mindMapsTable);
export type InsertMindMap = z.infer<typeof insertMindMapSchema>;
export type MindMapRow = typeof mindMapsTable.$inferSelect;
