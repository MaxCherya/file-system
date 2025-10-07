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



/*
    Update a directory's name and/or parent.
    - Pass `name` to rename.
    - Pass `parentId` to move (use `null` to move to root).
    Only provided fields are sent.
 */
export async function updateDirectory(
    pk: number,
    opts: { name?: string | null; parentId?: number | null }
): Promise<NodeType> {
    if (!pk || pk <= 0) throw new Error("Invalid directory id");

    const body: Record<string, unknown> = {};
    if (opts.name !== undefined) body.name = opts.name;
    if (opts.parentId !== undefined) body.parent_id = opts.parentId;

    const res = await fetch(`${BASE_URL}/api/dirs/${pk}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        let msg = `Failed to update directory (${res.status})`;
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



/*
    Fetch all non-trashed directories (for move or select destination)
*/
export async function getAllDirectories(): Promise<NodeType[]> {
    const res = await fetch(`${BASE_URL}/api/all-directories/`, {
        method: "GET",
    });

    if (!res.ok) {
        let msg = `Failed to load directories (${res.status})`;
        try {
            const j = await res.json();
            if (j?.message) msg = j.message;
        } catch {
            const t = await res.text();
            if (t) msg = t;
        }
        throw new Error(msg);
    }

    const json = (await res.json()) as { ok: boolean; data: NodeType[] };
    return json.data;
}



/*
    Fetch details for a specific directory by ID.
*/
export const getFolder = async (id: number): Promise<NodeType> => {
    if (!id) {
        throw new Error("Folder ID is required");
    }

    const res = await fetch(`${BASE_URL}/api/dirs-detail/${id}/`, {
        method: "GET",
    });

    if (!res.ok) {
        let message = `Failed to fetch folder (${res.status})`;
        try {
            const errJson = await res.json();
            if (errJson?.message) message = errJson.message;
        } catch {
            const text = await res.text();
            if (text) message = text;
        }
        throw new Error(message);
    }

    const json = await res.json() as { ok: boolean; data: NodeType };
    return json.data;
};