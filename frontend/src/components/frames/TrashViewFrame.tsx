'use client';

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTrashList, restoreTrashItem, purgeTrashItem } from "@/endpoints/trash";
import Loader from "../ui/loaders/Loader";
import ListComponent from "../ui/list/ListComponent";
import EmptyDirectory from "../responses/EmptyDirectory";
import ErrorResponse from "../responses/ErrorResponse";
import { FILE_HOVER, FILE_ICON, FOLDER_HOVER, FOLDER_ICON } from "@/constants/svgUrls";
import { toast } from "react-toastify";
import type { NodeType, TreeNode } from "@/types/common";
import { getParentId, TRASH_KEY } from "@/utils/lib_funcs";
import TrashTreeNode from "../ui/recursion/TrashTreeNode";



const TrashViewFrame: React.FC = () => {
    const qc = useQueryClient();
    const [actingId, setActingId] = useState<number | null>(null);


    // LOAD TRASH LIST
    const { data, isPending, isFetching, isSuccess, isError, error } = useQuery({
        queryKey: TRASH_KEY,
        queryFn: () => getTrashList("trashed_at", "desc"),
    });


    // TREE BUILDING
    const tree = useMemo(() => {
        if (!data || data.length === 0) return [] as TreeNode[];

        const idSet = new Set<number>(data.map((n) => n.id));
        const map = new Map<number, TreeNode>();
        data.forEach((n) => map.set(n.id, { ...n, children: [] }));

        const roots: TreeNode[] = [];
        for (const node of map.values()) {
            const pid = (node as any).parent_id ?? (node as any).parent ?? null;
            if (pid !== null && idSet.has(Number(pid))) {
                const parent = map.get(Number(pid));
                if (parent) parent.children.push(node);
            } else {
                if (pid !== null) node.__orphan = true;
                roots.push(node);
            }
        }
        return roots;
    }, [data]);


    // RESTORE MUTATION
    const restoreMut = useMutation({
        mutationFn: async (id: number) => restoreTrashItem(id),
        onSuccess: (restored: NodeType) => {
            qc.setQueryData<NodeType[]>(TRASH_KEY, (old) => {
                if (!Array.isArray(old)) return old;
                const rootId = restored.id;
                const toRemove = new Set<number>([rootId]);
                let added = true;
                while (added) {
                    added = false;
                    for (const item of old) {
                        const pid = getParentId(item);
                        if (!toRemove.has(item.id) && pid !== null && toRemove.has(pid)) {
                            toRemove.add(item.id);
                            added = true;
                        }
                    }
                }
                return old.filter((n) => !toRemove.has(n.id));
            });

            toast.success(`Restored “${restored.name}”`);
            setActingId(null);

            const destParentId = ((restored as any).parent_id ?? (restored as any).parent ?? 0) as number | null;
            qc.invalidateQueries({ queryKey: ["directory", destParentId ?? 0] });
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to restore item");
            setActingId(null);
        },
    });


    // PURGE MUTATION
    const purgeMut = useMutation({
        mutationFn: async (id: number) => purgeTrashItem(id),
        onSuccess: (_purgedCount: number, id: number) => {
            qc.setQueryData<NodeType[]>(TRASH_KEY, (old) => {
                if (!Array.isArray(old)) return old;
                const toRemove = new Set<number>([id]);
                let added = true;
                while (added) {
                    added = false;
                    for (const item of old) {
                        const pid = getParentId(item);
                        if (!toRemove.has(item.id) && pid !== null && toRemove.has(pid)) {
                            toRemove.add(item.id);
                            added = true;
                        }
                    }
                }
                return old.filter((n) => !toRemove.has(n.id));
            });

            toast.success("Purged item(s)");
            setActingId(null);
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to purge item");
            setActingId(null);
        },
    });


    const handleRestore = (id: number) => {
        setActingId(id);
        restoreMut.mutate(id);
    };


    const handlePurge = (id: number, name: string) => {
        const ok = window.confirm(`Permanently delete “${name}”? This cannot be undone.`);
        if (!ok) return;
        setActingId(id);
        purgeMut.mutate(id);
    };


    const isBusy = (id: number) => actingId === id && (restoreMut.isPending || purgeMut.isPending);


    const renderTree = () => (
        <div className="w-full max-w-3xl flex flex-col gap-1">
            {tree.map((n) => (
                <TrashTreeNode
                    key={n.id}
                    node={n}
                    depth={0}
                    onRestore={handleRestore}
                    onPurge={handlePurge}
                    isBusy={isBusy}
                    actingId={actingId}
                    restorePending={restoreMut.isPending}
                    purgePending={purgeMut.isPending}
                />
            ))}
        </div>
    );


    return (
        <div className="flex flex-col items-center align-middle p-4 gap-2 h-screen w-screen">
            {(isPending || isFetching) && <Loader />}

            {/* TREE */}
            {!isFetching && isSuccess && data && data.length > 0 && renderTree()}

            {/* EMPTY */}
            {!isFetching && isSuccess && data && data.length === 0 && <EmptyDirectory />}

            {/* ERROR */}
            {isError && <ErrorResponse error={error} />}
        </div>
    );
};

export default TrashViewFrame;