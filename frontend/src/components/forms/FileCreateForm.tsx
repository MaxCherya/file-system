'use client';

import React, { useState } from "react";
import { SERVER_DEFAULT_MASK } from "@/constants/backend";
import PermissionSelector from "../formsUtils/PermissionSelector";
import SubmitButton from "../ui/btns/SubmitButton";
import TextInput from "../ui/inputs/TextInput";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NodeType } from "@/types/common";
import { createFile } from "@/endpoints/files";

interface Props {
    parentFolderId?: number;
    onCreated?: () => void;
}

const FileCreateForm: React.FC<Props> = ({ parentFolderId = undefined, onCreated }) => {
    const [name, setName] = useState("");
    const [content, setContent] = useState("");
    const [permMask, setPermMask] = useState<number>(SERVER_DEFAULT_MASK);
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (vars: { name: string; content: string; parentId?: number; permissions?: number }) => {
            const { name, content, parentId, permissions } = vars;
            return createFile(name, content, parentId, permissions);
        },
        onSuccess: (newNode: NodeType) => {
            qc.setQueryData<NodeType[]>(["directory", parentFolderId || 'root'], (old) => {
                if (!old) return [newNode];
                return [newNode, ...old];
            });

            toast.success("File created");
            setName("");
            setContent("");
            setPermMask(SERVER_DEFAULT_MASK);
            onCreated?.();
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to create file");
        },
    });

    const isPending = mutation.isPending;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const trimmed = name.trim();
        if (!trimmed) {
            toast.error("File name is required");
            return;
        }

        const permissions = permMask !== SERVER_DEFAULT_MASK ? permMask : undefined;
        const parentId = parentFolderId || undefined;

        mutation.mutate({ name: trimmed, content, parentId, permissions });
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-xl p-6 shadow-lg w-full overflow-scroll overflow-x-hidden max-h-80">
            <TextInput
                label="File name"
                value={name}
                placeholder="e.g. notes.txt"
                onChange={setName}
                disabled={isPending}
            />

            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Content (optional)</label>
                <textarea
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isPending}
                    className="border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write file content..."
                />
            </div>

            <PermissionSelector value={permMask} onChange={setPermMask} disabled={isPending} />

            <SubmitButton isSubmitting={isPending} label="Create File" loadLabel="Creating..." />
        </form>
    );
};

export default FileCreateForm;