'use client';

import DirectoryViewFrame from "@/components/frames/DirectoryViewFrame";
import FileViewFrame from "@/components/frames/FileViewFrame";
import CreateFolderFileModal from "@/components/modals/CreateFolderFileModal";
import ModalButton from "@/components/ui/btns/ModalButton";
import { toggleFunction } from "@/utils/lib_funcs";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function Home() {

    // PARAMS
    const { id } = useParams<{ id?: string }>();
    const parentId = id && !Number.isNaN(Number(id)) ? Number(id) : 0;

    return (
        <div className="h-screen overflow-x-hidden space-y-4">

            {/* DIRECTORY VIEW FRAME */}
            <div className="w-full h-full">
                <FileViewFrame fileId={parentId} />
            </div>

        </div>
    );
}