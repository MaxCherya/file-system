'use client';

import React, { useEffect } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    widthClass?: string;
    disableBackdropClose?: boolean;
}

const Modal: React.FC<Props> = ({
    isOpen,
    onClose,
    title,
    children,
    widthClass = "max-w-2xl",
    disableBackdropClose = false,
}) => {
    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 top-0 w-screen h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => !disableBackdropClose && onClose()}
            aria-modal
            role="dialog"
        >
            <div
                className={`relative bg-white rounded-2xl shadow-xl w-[95%] ${widthClass} max-h-[90vh] overflow-y-auto p-6`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-semibold">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-800 transition"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-4">{children}</div>
            </div>
        </div>
    );
};

export default Modal;