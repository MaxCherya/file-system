'use client';

import DirectoryViewFrame from "@/components/frames/DirectoryViewFrame";
import CreateFolderFileModal from "@/components/modals/CreateFolderFileModal";
import ModalButton from "@/components/ui/btns/ModalButton";
import { toggleFunction } from "@/utils/lib_funcs";
import { useState } from "react";

export default function Home() {

  // STATES
  const [isCreateModeOpen, setIsCreateModeOpen] = useState(false);

  return (
    <div className="h-screen overflow-x-hidden space-y-4">

      {/* CREATE MODAL */}
      {isCreateModeOpen && (
        <CreateFolderFileModal toggleModal={() => toggleFunction(setIsCreateModeOpen)} />
      )}

      {/* ACTIONS BAR */}
      <div className="w-full flex flex-row justify-end gap-2 p-4">
        <ModalButton label="Add To Folder" onClick={() => toggleFunction(setIsCreateModeOpen)} />
      </div>

      {/* DIRECTORY VIEW FRAME */}
      <div className="w-full h-full">
        <DirectoryViewFrame />
      </div>

    </div>
  );
}