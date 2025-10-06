'use client';

import { BASE_URL } from "@/constants/backend"
import { NodeType } from "@/types/common";


/*
    Fetches the content of a directory given
    its primary key (pk).
    Return a promise that resolves to an array of NodeType.
*/
export const getDirContent = async (pk?: number): Promise<NodeType[]> => {
    if (pk === undefined) {
        pk = 0;
    }
    const res = await fetch(`${BASE_URL}/api/dirs/?parent_id=${pk}`, {
        method: 'GET',
    })

    if (!res.ok) {
        throw new Error(`Failed to fetch directory content (status ${res.status})`);
    }

    const json = await res.json() as { ok: boolean; data: NodeType[] };
    return json.data;
}