import { NodeType } from "@/types/common";

const ContentFile: React.FC<{ data: NodeType }> = ({ data }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-start">
            <div className="w-full flex flex-col gap-4">
                {/* File title header */}
                <div className="flex items-center justify-between border-b pb-3">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        {data.name}
                    </h1>
                    <span className="text-sm text-gray-500">
                        Last modified:{" "}
                        {data.modified_at}
                    </span>
                </div>

                {/* Content box */}
                <div className="relative bg-gray-50 border border-gray-200 rounded-xl shadow-inner overflow-y-auto p-5 min-h-[400px] max-h-[70vh] w-full">
                    <pre className="whitespace-pre-wrap break-words text-sm font-mono text-gray-800 leading-relaxed">
                        {data.content || "— No content —"}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default ContentFile;