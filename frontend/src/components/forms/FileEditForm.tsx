'use client';

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import TextInput from "../ui/inputs/TextInput";
import SubmitButton from "../ui/btns/SubmitButton";
import PermissionSelector from "../formsUtils/PermissionSelector";
import { SERVER_DEFAULT_MASK } from "@/constants/backend";
import { getAllDirectories } from "@/endpoints/dirs";
import { updateFile } from "@/endpoints/files";
import type { NodeType } from "@/types/common";

interface Props {
    file: NodeType;
    onUpdated?: (updated: NodeType) => void;
}

const FileEditForm: React.FC<Props> = ({ file, onUpdated }) => {
    const qc = useQueryClient();

    const [name, setName] = useState(file.name);
    const [content, setContent] = useState(file.content || "");
    const [parentId, setParentId] = useState<number | null>(file.parent || null);
    const [permMask, setPermMask] = useState<number>(file.permissions ?? SERVER_DEFAULT_MASK);

    const { data: dirs, isFetching: loadingDirs } = useQuery({
        queryKey: ["all-dirs"],
        queryFn: getAllDirectories,
    });

    const mutation = useMutation({
        mutationFn: async (vars: { name: string; parentId: number | null; content: string }) =>
            updateFile(file.id, { name: vars.name, parentId: vars.parentId, content: vars.content }),
        onSuccess: (updated: NodeType) => {
            // update cache if file is currently visible in parent listing
            const targetParent = updated.parent ?? "root";
            qc.invalidateQueries({ queryKey: ["directory", targetParent] });

            toast.success("File updated successfully");
            onUpdated?.(updated);
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to update file");
        },
    });

    const isPending = mutation.isPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = name.trim();
        if (!trimmed) {
            toast.error("File name is required");
            return;
        }

        mutation.mutate({ name: trimmed, parentId, content });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 bg-white rounded-xl p-6 shadow-lg w-full max-w-2xl"
        >
            <h2 className="text-lg font-semibold">Edit File</h2>

            {/* NAME */}
            <TextInput
                label="File name"
                value={name}
                onChange={setName}
                disabled={isPending}
            />

            {/* CONTENT */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Content</label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="w-full border rounded-lg p-2 text-sm resize-y"
                    disabled={isPending}
                />
            </div>

            {/* PARENT SELECT */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Parent Folder</label>
                <select
                    value={parentId ?? ""}
                    onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                    disabled={isPending || loadingDirs}
                    className="border rounded-lg p-2 text-sm"
                >
                    <option value="">(Root)</option>
                    {dirs?.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* PERMISSIONS */}
            <PermissionSelector
                value={permMask}
                onChange={setPermMask}
                disabled
            />

            {/* ACTION BUTTON */}
            <SubmitButton
                isSubmitting={isPending}
                label="Save Changes"
                loadLabel="Saving..."
                className="mt-2"
            />
        </form>
    );
};

export default FileEditForm;