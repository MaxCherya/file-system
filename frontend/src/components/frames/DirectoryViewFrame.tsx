'use client';

import { useEffect, useState } from "react";
import { getDirContent } from "@/endpoints/dirs";
import { useQuery } from "@tanstack/react-query";
import Loader from "../ui/loaders/Loader";
import ListComponent from "../ui/list/ListComponent";
import { FILE_HOVER, FILE_ICON, FOLDER_HOVER, FOLDER_ICON } from "@/constants/svgUrls";
import EmptyDirectory from "../responses/EmptyDirectory";
import ErrorResponse from "../responses/ErrorResponse";
import { useRouter } from 'next/navigation';

interface Props {
    folderId?: number;
}

type SortKey = "name" | "size" | "mtime" | "type";
type SortOrder = "asc" | "desc";

const DirectoryViewFrame: React.FC<Props> = ({ folderId }) => {
    const router = useRouter();

    // Sorting state
    const [sort, setSort] = useState<SortKey>("type");
    const [order, setOrder] = useState<SortOrder>("desc");

    // Query
    useEffect(() => { query.refetch(); }, [sort, order]);
    const query = useQuery({
        queryKey: ["directory", folderId ?? 'root'],
        queryFn: () => getDirContent(folderId, { sort, order }),
    });
    const { isPending, isFetching, isSuccess, isError, error, data } = query;

    return (
        <div className="flex flex-col items-center align-middle p-4 gap-3 h-screen w-screen">

            {/* Controls */}
            <div className="w-full flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by</label>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="border rounded-lg p-2 text-sm"
                >
                    <option value="name">Name</option>
                    <option value="size">Size</option>
                    <option value="mtime">Modified</option>
                    <option value="type">Type</option>
                </select>

                <button
                    onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
                    className="ml-2 px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
                    title="Toggle ascending/descending"
                >
                    {order === "asc" ? "↑ Asc" : "↓ Desc"}
                </button>
            </div>

            {/* Loading */}
            {(isPending || isFetching) && <Loader />}

            {/* Content */}
            {!isFetching && isSuccess && data && data.length > 0 && (
                <div className="w-full flex flex-col gap-2">
                    {data.map((node) => (
                        <ListComponent
                            key={node.id}
                            title={node.name}
                            icon={node.node_type === 'DIRECTORY' ? FOLDER_ICON : FILE_ICON}
                            hoverIcon={node.node_type === 'DIRECTORY' ? FOLDER_HOVER : FILE_HOVER}
                            onClick={() => {
                                if (node.node_type === "DIRECTORY") {
                                    router.push(`/dirs/${node.id}`);
                                } else {
                                    router.push(`/files/${node.id}`);
                                }
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Empty */}
            {!isFetching && isSuccess && data && data.length === 0 && <EmptyDirectory />}

            {/* Error */}
            {isError && <ErrorResponse error={error} />}
        </div>
    );
};

export default DirectoryViewFrame;