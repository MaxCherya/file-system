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



/*
    Fetches detailed information about a specific file by its primary key (pk).
    Returns a promise that resolves to a NodeType object.
*/
export const getFileDetails = async (pk: number): Promise<NodeType> => {
    if (!pk || pk <= 0) {
        throw new Error("Invalid file ID");
    }

    const res = await fetch(`${BASE_URL}/api/files/${pk}/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        let msg = `Failed to fetch file details (${res.status})`;
        try {
            const json = await res.json();
            if (json?.message) msg = json.message;
        } catch {
            const text = await res.text();
            if (text) msg = text;
        }
        throw new Error(msg);
    }

    const json = await res.json() as { ok: boolean; data: NodeType };
    return json.data;
};



/*
    Soft-deletes a single file by id.
    Returns true on success.
 */
export async function deleteFile(pk: number): Promise<boolean> {
    if (!pk || pk <= 0) throw new Error("Invalid file id");

    const res = await fetch(`${BASE_URL}/api/files/${pk}/`, {
        method: "DELETE",
    });

    if (!res.ok) {
        let msg = `Failed to delete file (${res.status})`;
        try {
            const j = await res.json();
            if (j?.message) msg = j.message;
        } catch {
            const text = await res.text();
            if (text) msg = text;
        }
        throw new Error(msg);
    }

    return true;
}



/*
    Update a file's name, parent, and/or content.
    - Pass `name` to rename.
    - Pass `parentId` to move (use `null` to move to root).
    - Pass `content` to overwrite content (size is recalculated server-side per your code).
    Only provided fields are sent.
 */
export async function updateFile(
    pk: number,
    opts: { name?: string | null; parentId?: number | null; content?: string | null }
): Promise<NodeType> {
    if (!pk || pk <= 0) throw new Error("Invalid file id");

    const body: Record<string, unknown> = {};
    if (opts.name !== undefined) body.name = opts.name;
    if (opts.parentId !== undefined) body.parent_id = opts.parentId;
    if (opts.content !== undefined) body.content = opts.content ?? "";

    const res = await fetch(`${BASE_URL}/api/files/${pk}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        let msg = `Failed to update file (${res.status})`;
        try {
            const j = await res.json();
            if (j?.message) msg = j.message;
        } catch {
            const t = await res.text();
            if (t) msg = t;
        }
        throw new Error(msg);
    }

    const json = (await res.json()) as { ok: boolean; data: NodeType };
    return json.data;
}