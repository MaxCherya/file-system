'use client';

import TrashViewFrame from "@/components/frames/TrashViewFrame"


export default function TrashPage() {
    return (
        <div className="h-screen overflow-x-hidden space-y-4">
            {/* TRASH VIEW */}
            <div className="w-full h-full">
                <TrashViewFrame />
            </div>
        </div>
    );
}
