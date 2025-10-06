'use client';

export type NodeType = {
    id: number;
    name: string;
    nodeType: 'FILE' | 'DIRECTORY';
    parent: number | null;
    size?: number;
    permissions: number; // bitmask
    createdAt: string;
    modifiedAt: string;
    isTrashed: boolean;
    trashedAt: string | null;
    content?: string | null;
};