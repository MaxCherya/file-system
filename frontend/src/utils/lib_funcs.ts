'use client';

export const toggleFunction = (setVal: React.Dispatch<React.SetStateAction<boolean>>) => {
    setVal(prev => !prev);
};


export const getParentId = (n: any): number | null =>
    (n.parent_id ?? n.parent ?? null) as number | null;

export const TRASH_KEY = ["trash", { sort: "trashed_at", order: "desc" }];