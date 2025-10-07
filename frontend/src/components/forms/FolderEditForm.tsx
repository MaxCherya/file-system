'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { SERVER_DEFAULT_MASK } from "@/constants/backend";
import { getAllDirectories } from "@/endpoints/dirs";
import { updateDirectory } from "@/endpoints/dirs";
import PermissionSelector from "../formsUtils/PermissionSelector";
import SubmitButton from "../ui/btns/SubmitButton";
import TextInput from "../ui/inputs/TextInput";
import type { NodeType } from "@/types/common";

interface Props {
    folder: NodeType;
    onUpdated?: (updated: NodeType) => void;
}

const FolderEditForm: React.FC<Props> = ({ folder, onUpdated }) => {
    const qc = useQueryClient();

    const [name, setName] = useState(folder.name);
    const [parentId, setParentId] = useState<number | null>(folder.parent || null);
    const [permMask, setPermMask] = useState<number>(folder.permissions ?? SERVER_DEFAULT_MASK);

    const { data: dirs, isFetching: loadingDirs } = useQuery({
        queryKey: ["all-dirs"],
        queryFn: getAllDirectories,
    });

    const mutation = useMutation({
        mutationFn: async (vars: { name: string; parentId: number | null }) =>
            updateDirectory(folder.id, { name: vars.name, parentId: vars.parentId }),
        onSuccess: (updated: NodeType) => {
            qc.invalidateQueries({ queryKey: ["directory"] });
            onUpdated?.(updated);
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to update folder");
        },
    });

    const isPending = mutation.isPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmed = name.trim();
        if (!trimmed) {
            toast.error("Folder name is required");
            return;
        }

        mutation.mutate({ name: trimmed, parentId });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 bg-white rounded-xl p-6 shadow-lg w-full max-w-2xl"
        >
            <h2 className="text-lg font-semibold">Edit Folder</h2>

            {/* NAME */}
            <TextInput
                label="Folder name"
                value={name}
                onChange={setName}
                disabled={isPending}
            />

            {/* PARENT FOLDER SELECT */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Parent Folder</label>
                <select
                    value={parentId ?? ""}
                    onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                    disabled={isPending || loadingDirs}
                    className="border rounded-lg p-2 text-sm"
                >
                    <option value="">(Root)</option>
                    {dirs
                        ?.filter((d) => d.id !== folder.id)
                        .map((d) => (
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

            <SubmitButton
                isSubmitting={isPending}
                label="Save Changes"
                loadLabel="Saving..."
                className="mt-2"
            />
        </form>
    );
};

export default FolderEditForm;