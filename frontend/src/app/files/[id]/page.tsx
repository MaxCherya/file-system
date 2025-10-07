'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import FileViewFrame from "@/components/frames/FileViewFrame";
import ModalButton from "@/components/ui/btns/ModalButton";
import SubmitButton from "@/components/ui/btns/SubmitButton";

import FileEditForm from "@/components/forms/FileEditForm";
import { deleteFile, getFileDetails } from "@/endpoints/files";
import { useQuery } from "@tanstack/react-query";

import Loader from "@/components/ui/loaders/Loader";
import Modal from "@/components/modals/Modal";

export default function Home() {
    // PARAMS
    const { id } = useParams<{ id?: string }>();
    const fileId = id && !Number.isNaN(Number(id)) ? Number(id) : 0;

    const qc = useQueryClient();
    const router = useRouter();

    // MODAL STATE
    const [isEditOpen, setIsEditOpen] = useState(false);
    const toggleEdit = () => setIsEditOpen((p) => !p);

    // FETCH FILE DETAILS (for edit form)
    const { data: fileData, isFetching: loadingFile } = useQuery({
        queryKey: ["file", fileId],
        queryFn: () => getFileDetails(fileId),
        enabled: !!fileId,
    });

    // DELETE MUTATION
    const delMutation = useMutation({
        mutationFn: async (pk: number) => deleteFile(pk),
        onSuccess: () => {
            qc.removeQueries({ queryKey: ["file", fileId] });
            toast.success("File moved to trash");
            router.push("/");
        },
        onError: (err: any) => {
            toast.error(err?.message ?? "Failed to delete file");
        },
    });

    const handleDelete = () => {
        if (!fileId) {
            toast.error("No file selected");
            return;
        }
        const confirmDelete = window.confirm("Move this file to trash?");
        if (!confirmDelete) return;
        delMutation.mutate(fileId);
    };

    return (
        <div className="h-screen overflow-x-hidden space-y-4">
            {/* ACTIONS BAR */}
            <div className="w-full flex flex-row justify-end gap-2 p-4">
                <ModalButton label="Edit File" onClick={toggleEdit} />
                <SubmitButton
                    label="Delete File"
                    loadLabel="Deleting..."
                    onClick={handleDelete}
                    isSubmitting={delMutation.isPending}
                    className="!bg-red-500 hover:!bg-red-600 disabled:opacity-60"
                />
            </div>

            {/* FILE VIEW */}
            <div className="w-full h-full">
                <FileViewFrame fileId={fileId} />
            </div>

            {/* EDIT MODAL */}
            {isEditOpen && (
                <Modal isOpen={isEditOpen} onClose={toggleEdit}>
                    {loadingFile ? (
                        <Loader />
                    ) : fileData ? (
                        <FileEditForm
                            file={fileData}
                            onUpdated={() => {
                                toggleEdit();
                                qc.invalidateQueries({ queryKey: ["file", fileId] });
                            }}
                        />
                    ) : (
                        <p className="text-gray-600">Failed to load file details</p>
                    )}
                </Modal>
            )}
        </div>
    );
}