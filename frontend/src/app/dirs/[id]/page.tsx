'use client';

import DirectoryViewFrame from "@/components/frames/DirectoryViewFrame";
import CreateFolderFileModal from "@/components/modals/CreateFolderFileModal";
import ModalButton from "@/components/ui/btns/ModalButton";
import { toggleFunction } from "@/utils/lib_funcs";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import SubmitButton from "@/components/ui/btns/SubmitButton";
import { deleteFolder } from "@/endpoints/dirs";

export default function Home() {
    // STATES
    const [isCreateModeOpen, setIsCreateModeOpen] = useState(false);

    // PARAMS
    const { id } = useParams<{ id?: string }>();
    const parentId = id && !Number.isNaN(Number(id)) ? Number(id) : undefined;

    const qc = useQueryClient();
    const router = useRouter();

    const delMutation = useMutation({
        mutationFn: async (folderId: number) => deleteFolder(folderId),
        onSuccess: (trashedCount: number) => {
            qc.invalidateQueries({ queryKey: ["directory", parentId] });

            toast.success(`Moved ${trashedCount} item(s) to trash`);
            router.push("/");
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to delete folder");
        },
    });

    const handleDelete = async () => {
        if (!parentId) {
            toast.error("No folder selected");
            return;
        }
        const confirm = window.confirm("Delete this folder and all its contents?");
        if (!confirm) return;
        delMutation.mutate(parentId);
    };

    return (
        <div className="h-screen overflow-x-hidden space-y-4">
            {/* CREATE MODAL */}
            {isCreateModeOpen && (
                <CreateFolderFileModal
                    toggleModal={() => toggleFunction(setIsCreateModeOpen)}
                    parentId={parentId}
                />
            )}

            {/* ACTIONS BAR */}
            <div className="w-full flex flex-row justify-end gap-2 p-4">
                <ModalButton label="Add To Folder" onClick={() => toggleFunction(setIsCreateModeOpen)} />
                <SubmitButton label="Delete Folder" loadLabel="Deleting..." onClick={handleDelete} className="!bg-red-500 hover:!bg-red-600 disabled:opacity-60" isSubmitting={delMutation.isPending} />
            </div>

            {/* DIRECTORY VIEW FRAME */}
            <div className="w-full h-full">
                <DirectoryViewFrame folderId={parentId} />
            </div>
        </div>
    );
}