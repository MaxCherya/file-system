'use client';

export const BASE_URL = 'https://file-system-e1286dbfc6c0.herokuapp.com';


export type SortKey = "name" | "size" | "mtime" | "type";
export type SortOrder = "asc" | "desc";


export const PERM = {
    READ: 1 << 0,  // 1
    WRITE: 1 << 1,  // 2
    DELETE: 1 << 2,  // 4
    ADMIN: 1 << 3,  // 8
} as const;

export type PermissionKey = keyof typeof PERM;

export const SERVER_DEFAULT_MASK = PERM.READ | PERM.WRITE | PERM.DELETE;