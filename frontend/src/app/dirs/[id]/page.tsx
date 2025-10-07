'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import DirectoryViewFrame from "@/components/frames/DirectoryViewFrame";
import CreateFolderFileModal from "@/components/modals/CreateFolderFileModal";
import ModalButton from "@/components/ui/btns/ModalButton";
import SubmitButton from "@/components/ui/btns/SubmitButton";
import FolderEditForm from "@/components/forms/FolderEditForm";

import { deleteFolder, getFolder } from "@/endpoints/dirs";
import { toggleFunction } from "@/utils/lib_funcs";
import Loader from "@/components/ui/loaders/Loader";
import Modal from "@/components/modals/Modal";

export default function Home() {
    // STATE
    const [isCreateModeOpen, setIsCreateModeOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // PARAMS
    const { id } = useParams<{ id?: string }>();
    const folderId = id && !Number.isNaN(Number(id)) ? Number(id) : undefined;

    const qc = useQueryClient();
    const router = useRouter();

    // FETCH FOLDER DETAILS (for editing)
    const { data: folderData, isFetching: loadingFolder } = useQuery({
        queryKey: ["directory-details", folderId],
        queryFn: () => getFolder(folderId!),
        enabled: !!folderId,
    });

    // DELETE MUTATION
    const delMutation = useMutation({
        mutationFn: async (id: number) => deleteFolder(id),
        onSuccess: (trashedCount: number) => {
            qc.invalidateQueries({ queryKey: ["directory", folderId] });
            toast.success(`Moved ${trashedCount} item(s) to trash`);
            router.push("/");
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to delete folder");
        },
    });

    // HANDLERS
    const handleDelete = () => {
        if (!folderId) {
            toast.error("No folder selected");
            return;
        }
        const confirm = window.confirm("Delete this folder and all its contents?");
        if (!confirm) return;
        delMutation.mutate(folderId);
    };

    const handleEditToggle = () => setIsEditOpen((p) => !p);

    return (
        <div className="h-screen overflow-x-hidden space-y-4 overflow-hidden">
            {/* CREATE MODAL */}
            {isCreateModeOpen && (
                <CreateFolderFileModal
                    toggleModal={() => toggleFunction(setIsCreateModeOpen)}
                    parentId={folderId}
                />
            )}

            {/* EDIT MODAL */}
            {isEditOpen && (
                <Modal isOpen={isEditOpen} onClose={handleEditToggle} title="Edit Folder">
                    {loadingFolder ? (
                        <Loader />
                    ) : folderData ? (
                        <FolderEditForm
                            folder={folderData}
                            onUpdated={() => {
                                qc.invalidateQueries({ queryKey: ["directory", folderId] });
                                toast.success("Folder updated successfully");
                                handleEditToggle();
                            }}
                        />
                    ) : (
                        <p className="text-gray-600">Failed to load folder details</p>
                    )}
                </Modal>
            )}

            {/* ACTIONS BAR */}
            <div className="w-full flex flex-row justify-end gap-2 p-4">
                <ModalButton
                    label="Add To Folder"
                    onClick={() => toggleFunction(setIsCreateModeOpen)}
                />
                <ModalButton label="Edit Folder" onClick={handleEditToggle} />
                <SubmitButton
                    label="Delete Folder"
                    loadLabel="Deleting..."
                    onClick={handleDelete}
                    className="!bg-red-500 hover:!bg-red-600 disabled:opacity-60"
                    isSubmitting={delMutation.isPending}
                />
            </div>

            {/* DIRECTORY VIEW FRAME */}
            <div className="w-full h-full">
                <DirectoryViewFrame folderId={folderId} />
            </div>
        </div>
    );
}