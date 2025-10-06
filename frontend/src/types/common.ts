'use client';

export type NodeType = {
    id: number;
    name: string;
    node_type: 'FILE' | 'DIRECTORY';
    parent: number | null;
    size?: number;
    permissions: number; // bitmask
    created_at: string;
    modified_at: string;
    is_trashed: boolean;
    trashed_at: string | null;
    content?: string | null;
};