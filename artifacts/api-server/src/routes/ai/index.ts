import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { AiGenerateMindMapBody, AiExpandNodeBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

interface MindMapNode {
  id: string;
  title: string;
  description?: string;
  content?: string;
  color?: string;
  collapsed?: boolean;
  children: MindMapNode[];
}

function assignIds(node: MindMapNode): MindMapNode {
  return {
    ...node,
    id: node.id || randomUUID(),
    children: (node.children || []).map(assignIds),
  };
}

const COLORS = [
  "#6366f1",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
];

function assignColors(node: MindMapNode, depth: number = 0): MindMapNode {
  return {
    ...node,
    color: COLORS[depth % COLORS.length],
    children: (node.children || []).map((child) =>
      assignColors(child, depth + 1)
    ),
  };
}

router.post("/generate", async (req, res) => {
  try {
    const body = AiGenerateMindMapBody.parse(req.body);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemPrompt = `You are an expert mind map and outline generator. 
When given a topic or idea, create a well-structured hierarchical mind map in JSON format.
The root node should be the main topic, with 3-7 main branches, each with 2-5 sub-items.

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "id": "root",
  "title": "Main Topic",
  "description": "Brief description",
  "children": [
    {
      "id": "1",
      "title": "Branch 1",
      "description": "Description",
      "children": [
        {
          "id": "1-1",
          "title": "Sub-item",
          "description": "Description",
          "children": []
        }
      ]
    }
  ]
}

Make it comprehensive but concise. Titles should be short (2-5 words). Descriptions should be 1 sentence.
Do NOT include any text outside the JSON object.`;

    let userPrompt = `Create a detailed mind map for: "${body.input}"`;
    if (body.existingRoot) {
      userPrompt += `\n\nExisting structure to refine:\n${JSON.stringify(body.existingRoot, null, 2)}`;
    }
    if (body.instruction) {
      userPrompt += `\n\nAdditional instruction: ${body.instruction}`;
    }

    let fullText = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullText += content;
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }

    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let root = JSON.parse(jsonMatch[0]) as MindMapNode;
        root = assignIds(root);
        root = assignColors(root);
        res.write(`data: ${JSON.stringify({ done: true, root })}\n\n`);
      } else {
        res.write(
          `data: ${JSON.stringify({ error: "Failed to parse AI response as JSON" })}\n\n`
        );
      }
    } catch {
      res.write(
        `data: ${JSON.stringify({ error: "Failed to parse mind map structure" })}\n\n`
      );
    }

    res.end();
  } catch (err) {
    console.error("AI generate error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: String(err) });
    } else {
      res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
      res.end();
    }
  }
});

router.post("/expand-node", async (req, res) => {
  try {
    const body = AiExpandNodeBody.parse(req.body);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemPrompt = `You are an expert content expander and detail generator.
When given a mind map node, provide detailed, well-structured content to expand it.
Return rich markdown content that can be used as a detailed explanation.`;

    let userPrompt = `Expand the following node with detailed content:
Node: "${body.nodeTitle}"
${body.nodeDescription ? `Description: "${body.nodeDescription}"` : ""}
${body.parentContext ? `Context: This is a sub-topic of "${body.parentContext}"` : ""}
${body.instruction ? `Instruction: ${body.instruction}` : ""}

Please provide:
1. A comprehensive explanation (2-3 paragraphs)
2. Key points (as bullet list)
3. Examples or applications
4. Related considerations`;

    let fullContent = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`);
    res.end();
  } catch (err) {
    console.error("AI expand error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: String(err) });
    } else {
      res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
      res.end();
    }
  }
});

export default router;
