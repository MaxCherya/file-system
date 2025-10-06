'use client';

import React, { useState } from "react";
import { SERVER_DEFAULT_MASK } from "@/constants/backend";
import PermissionSelector from "../formsUtils/PermissionSelector";
import SubmitButton from "../ui/btns/SubmitButton";
import TextInput from "../ui/inputs/TextInput";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFolder } from "@/endpoints/dirs";
import type { NodeType } from "@/types/common";

interface Props {
    parentFolderId?: number;
    onCreated?: () => void;
}

const FolderCreateForm: React.FC<Props> = ({ parentFolderId = undefined, onCreated }) => {
    const [name, setName] = useState("");
    const [permMask, setPermMask] = useState<number>(SERVER_DEFAULT_MASK);
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (vars: { name: string; parentId?: number; permissions?: number }) => {
            const { name, parentId, permissions } = vars;
            return createFolder(name, parentId, permissions);
        },
        onSuccess: (newNode: NodeType) => {
            qc.setQueryData<NodeType[]>(["directory", parentFolderId || 'root'], (old) => {
                if (!old) return [newNode];
                return [newNode, ...old];
            });

            toast.success("Folder created");
            setName("");
            setPermMask(SERVER_DEFAULT_MASK);
            onCreated?.();
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to create folder");
        },
    });

    const isPending = mutation.isPending;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = name.trim();
        if (!trimmed) {
            toast.error("Folder name is required");
            return;
        }

        const permissions = permMask !== SERVER_DEFAULT_MASK ? permMask : undefined;
        const parentId = parentFolderId || undefined;

        mutation.mutate({ name: trimmed, parentId, permissions });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-xl p-6 shadow-lg w-full">
            <TextInput
                label="Folder name"
                value={name}
                placeholder="e.g. Documents"
                onChange={setName}
                disabled={isPending}
            />

            <PermissionSelector
                value={permMask}
                onChange={setPermMask}
                disabled={isPending}
            />

            <SubmitButton isSubmitting={isPending} label="Create Folder" loadLabel="Creating..." />
        </form>
    );
};

export default FolderCreateForm;