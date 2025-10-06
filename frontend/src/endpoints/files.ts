'use client';

import { BASE_URL } from "@/constants/backend";
import type { NodeType } from "@/types/common";


/*
  Creates a new file.
  Accepts name (required), content (optional), parent_id (optional), and permissions bitmask (optional).
  Returns the created NodeType.
*/
export const createFile = async (
    name: string,
    content: string = "",
    parentId?: number | null,
    permissions?: number
): Promise<NodeType> => {
    const trimmed = name?.trim();
    if (!trimmed) {
        throw new Error("File name is required");
    }

    const payload: Record<string, any> = {
        name: trimmed,
        parent_id: parentId || null,
        permissions: permissions || null,
        content: content ?? "",
    };

    const res = await fetch(`${BASE_URL}/api/files/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let msg = `Failed to create file (${res.status})`;
        try {
            const j = await res.json();
            if (j?.message) msg = j.message;
        } catch {
            const text = await res.text();
            if (text) msg = text;
        }
        throw new Error(msg);
    }

    const json = (await res.json()) as { ok: boolean; data: NodeType };
    return json.data;
};