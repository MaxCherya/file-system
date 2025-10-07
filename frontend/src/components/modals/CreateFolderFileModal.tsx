'use client';

import { useState } from "react";
import SwitchButton from "../ui/btns/SwitchButton";
import { toggleFunction } from "@/utils/lib_funcs";
import FolderCreateForm from "../forms/FolderCreateForm";
import FileCreateForm from "../forms/FileCreateForm";

const CreateFolderFileModal: React.FC<{ toggleModal: () => void, parentId?: number }> = ({ toggleModal, parentId = undefined }) => {

    // STATES
    const [isFile, setIsFile] = useState(true);

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center align-middle bg-black/85 fixed z-[1000]">

            {/* CLOSE ICON */}
            <span className="fixed top-20 right-8 text-red-500 font-bold bg-white p-2 rounded-full cursor-pointer hover:bg-blue-600 hover:text-white"
                onClick={toggleModal}
            >X</span>

            {/* WHITE BOX MODAL WINDOW */}
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl p-6">

                {/* SWITCH BUTTONS */}
                <div className="w-full grid grid-cols-2 gap-2 mb-4">
                    <SwitchButton label="File" isActive={isFile} onClick={() => toggleFunction(setIsFile)} />
                    <SwitchButton label="Folder" isActive={!isFile} onClick={() => toggleFunction(setIsFile)} />
                </div>

                {isFile ? (
                    <FileCreateForm onCreated={toggleModal} parentFolderId={parentId} />

                ) :
                    <FolderCreateForm parentFolderId={parentId} onCreated={toggleModal} />
                }

            </div>

        </div>
    )
}

export default CreateFolderFileModal;