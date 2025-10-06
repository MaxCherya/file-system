'use client';

import FileViewFrame from "@/components/frames/FileViewFrame";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFile } from "@/endpoints/files";
import { toast } from "react-toastify";
import ModalButton from "@/components/ui/btns/ModalButton";
import SubmitButton from "@/components/ui/btns/SubmitButton";

export default function Home() {
    // PARAMS
    const { id } = useParams<{ id?: string }>();
    const fileId = id && !Number.isNaN(Number(id)) ? Number(id) : 0;

    const qc = useQueryClient();
    const router = useRouter();

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

    const handleEdit = () => {
        toast.info("Edit feature coming soon ✍️");
    };

    return (
        <div className="h-screen overflow-x-hidden space-y-4">
            {/* ACTIONS BAR */}
            <div className="w-full flex flex-row justify-end gap-2 p-4">
                <ModalButton label="Edit File" onClick={handleEdit} />
                <SubmitButton label="Delete File" loadLabel="Deleting..." onClick={handleDelete} isSubmitting={delMutation.isPending} className="!bg-red-500 hover:!bg-red-600 disabled:opacity-60" />
            </div>

            {/* FILE VIEW */}
            <div className="w-full h-full">
                <FileViewFrame fileId={fileId} />
            </div>
        </div>
    );
}