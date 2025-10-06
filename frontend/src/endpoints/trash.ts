'use client';

import { BASE_URL } from "@/constants/backend";
import type { NodeType } from "@/types/common";

/** ---------------------------------------
    Get Trash Items
 * --------------------------------------*/
export async function getTrashList(
    sort: "trashed_at" | "name" | "type" | "size" = "trashed_at",
    order: "asc" | "desc" = "desc"
): Promise<NodeType[]> {
    const qs = new URLSearchParams({ sort, order });
    const res = await fetch(`${BASE_URL}/api/trash/?${qs.toString()}`, { method: "GET" });

    if (!res.ok) {
        let msg = `Failed to fetch trash (${res.status})`;
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

/** ---------------------------------------
    Restore Item
 * --------------------------------------*/
export async function restoreTrashItem(
    pk: number,
    destParentId?: number | null
): Promise<NodeType> {
    if (!pk || pk <= 0) throw new Error("Invalid item id");

    const body: Record<string, any> = {};
    if (destParentId !== undefined) body.parent_id = destParentId;

    const res = await fetch(`${BASE_URL}/api/trash/${pk}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        let msg = `Failed to restore item (${res.status})`;
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

/** ---------------------------------------
    Purge Item
 * --------------------------------------*/
export async function purgeTrashItem(pk: number): Promise<number> {
    if (!pk || pk <= 0) throw new Error("Invalid item id");

    const res = await fetch(`${BASE_URL}/api/trash/${pk}/`, { method: "DELETE" });

    if (!res.ok) {
        let msg = `Failed to purge item (${res.status})`;
        try {
            const j = await res.json();
            if (j?.message) msg = j.message;
        } catch {
            const t = await res.text();
            if (t) msg = t;
        }
        throw new Error(msg);
    }

    try {
        const json = (await res.json()) as { ok: boolean; purged_count?: number };
        return json.purged_count ?? 1;
    } catch {
        return 1;
    }
}