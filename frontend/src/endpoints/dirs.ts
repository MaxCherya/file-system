'use client';

import { BASE_URL } from "@/constants/backend"
import { NodeType } from "@/types/common";


/*
    Fetches the content of a directory given
    its primary key (pk).
    Return a promise that resolves to an array of NodeType.
*/
export const getDirContent = async (pk?: number): Promise<NodeType[]> => {

    const res = await fetch(`${BASE_URL}/api/dirs/?parent_id=${pk}`, {
        method: 'GET',
    })

    if (!res.ok) {
        let msg = `Failed to fetch directory content (${res.status})`;
        try {
            const errJson = await res.json();
            if (errJson?.message) msg = errJson.message;
        } catch {
            const text = await res.text();
            if (text) msg = text;
        }
        throw new Error(msg);
    }

    const json = await res.json() as { ok: boolean; data: NodeType[] };
    return json.data;
}



/*
    Creates a new directory (folder).
    Accepts name, optional parent_id, and optional permissions bitmask.
    Returns a promise that resolves to the created NodeType.
*/
export const createFolder = async (
    name: string,
    parentId?: number | null,
    permissions?: number
): Promise<NodeType> => {
    if (!name || !name) {
        throw new Error("Folder name is required");
    }

    const payload: Record<string, any> = {
        name: name,
        node_type: "DIRECTORY",
        parent_id: parentId || null,
        permissions: permissions || undefined,
    };

    const res = await fetch(`${BASE_URL}/api/dirs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        let msg = `Failed to create folder (${res.status})`;
        try {
            const errJson = await res.json();
            if (errJson?.message) msg = errJson.message;
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
    Soft-deletes a folder and all its descendants.
    Returns the number of trashed nodes (folder + children).
 */
export async function deleteFolder(pk: number): Promise<number> {
    if (!pk || pk <= 0) throw new Error("Invalid folder id");

    const res = await fetch(`${BASE_URL}/api/dirs/${pk}/`, {
        method: "DELETE",
    });

    if (!res.ok) {
        let msg = `Failed to delete folder (${res.status})`;
        try {
            const j = await res.json();
            if (j?.message) {
                if (Array.isArray(j.items) && j.items.length) {
                    msg = `${j.message}: ${j.items.join(", ")}`;
                } else {
                    msg = j.message;
                }
            }
        } catch {
            const text = await res.text();
            if (text) msg = text;
        }
        throw new Error(msg);
    }

    const json = (await res.json()) as { ok: boolean; trashed_count: number };
    return json.trashed_count;
}