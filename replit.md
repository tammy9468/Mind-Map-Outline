# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is an **AI-powered Mind Map & Outline Dual-View Tool** called **NeuroMap AI**.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)

## Application Features

- **AI Generation**: Input ideas → AI generates structured mind map (SSE streaming)
- **Dual View**: Outline view ↔ Mind Map view with bidirectional sync
- **Outline Editing**: Add/delete/collapse nodes, inline title editing, undo/redo (Ctrl+Z/Y)
- **Mind Map Canvas**: SVG-based, draggable nodes, zoom/pan, auto-layout
- **Detail Pages**: Click any node → `/node/:id` page with rich text editor
- **AI Node Expansion**: "Expand Details", "Generate Summary", "Extract Points" in detail page
- **Export**: JSON download, PNG export of mind map canvas
- **Auto-save**: Backend auto-save with 2s debounce
- **Theme**: Light/Dark mode toggle

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mind-map/           # React + Vite frontend (NeuroMap AI)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `mind_maps` table: `id (text PK)`, `title`, `root (jsonb)`, `created_at`, `updated_at`

## API Endpoints

- `GET /api/mindmaps` - List all mind maps
- `POST /api/mindmaps` - Create a new mind map
- `GET /api/mindmaps/:id` - Get a mind map
- `PUT /api/mindmaps/:id` - Update a mind map
- `DELETE /api/mindmaps/:id` - Delete a mind map
- `PUT /api/mindmaps/:id/nodes/:nodeId` - Update a specific node
- `POST /api/ai/generate` - AI generate mind map (SSE streaming)
- `POST /api/ai/expand-node` - AI expand node content (SSE streaming)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`

## Frontend Key Files

- `artifacts/mind-map/src/App.tsx` - App root with routing
- `artifacts/mind-map/src/pages/Workspace.tsx` - Main workspace (outline + mind map)
- `artifacts/mind-map/src/pages/NodeDetail.tsx` - Node detail page
- `artifacts/mind-map/src/hooks/use-mindmap-context.tsx` - Global state with useReducer
- `artifacts/mind-map/src/hooks/use-ai-stream.ts` - SSE streaming AI hooks
- `artifacts/mind-map/src/components/mindmap/MindMapCanvas.tsx` - SVG mind map
- `artifacts/mind-map/src/components/outline/OutlineNode.tsx` - Outline tree node
- `artifacts/mind-map/src/lib/utils.ts` - Tree utilities + auto-layout algorithm
