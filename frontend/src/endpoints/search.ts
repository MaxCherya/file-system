'use client';

import { BASE_URL } from "@/constants/backend";
import type { NodeType } from "@/types/common";
import { SearchParams } from "@/types/search";

/*
    Search files/folders.
    Mirrors backend params and returns NodeType[].
 */
export async function searchNodes(params: SearchParams): Promise<NodeType[]> {
    if (!params.q || !params.q.trim()) return [];

    const p = new URLSearchParams();
    p.set("q", params.q.trim());
    if (params.in) p.set("in", params.in);
    if (params.include_trash) p.set("include_trash", "1");
    if (params.type) p.set("type", params.type);

    if (params.parent_id === null) {
        p.set("parent_id", "");
    } else if (typeof params.parent_id === "number") {
        p.set("parent_id", String(params.parent_id));
    }

    if (typeof params.limit === "number") p.set("limit", String(params.limit));
    if (params.order) p.set("order", params.order);
    if (params.direction) p.set("direction", params.direction);

    const url = `${BASE_URL}/api/search/?${p.toString()}`;

    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
        let msg = `Search failed (${res.status})`;
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