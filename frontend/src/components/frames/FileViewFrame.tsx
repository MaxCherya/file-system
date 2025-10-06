'use client';

import { getDirContent } from "@/endpoints/dirs";
import { useQuery } from "@tanstack/react-query";
import Loader from "../ui/loaders/Loader";
import ListComponent from "../ui/list/ListComponent";
import { FILE_HOVER, FILE_ICON, FOLDER_HOVER, FOLDER_ICON } from "@/constants/svgUrls";
import EmptyDirectory from "../responses/EmptyDirectory";
import ErrorResponse from "../responses/ErrorResponse";
import { useRouter } from 'next/navigation';
import { getFileDetails } from "@/endpoints/files";
import ContentFile from "../responses/ContentFile";


interface Props {
    fileId: number;
}


const FileViewFrame: React.FC<Props> = ({ fileId }) => {

    // TANSTACK QUERY INIT
    const query = useQuery({
        queryKey: ["file", fileId],
        queryFn: () => getFileDetails(fileId),
    });
    const { isPending, isFetching, isSuccess, isError, error, data, status, fetchStatus } = query;

    // ROUTER
    const router = useRouter();

    return (
        <div className="flex flex-col items-center align-middle p-4 gap-2 h-screen w-screen">

            {/* LOADING STATE */}
            {(isPending || isFetching) && <Loader />}

            {/* DISPLAYING FILE CONTENT */}
            {!isFetching && isSuccess && data && (
                <ContentFile data={data} />
            )}

            {/* ERROR STATE */}
            {isError && (
                <ErrorResponse error={error} />
            )}

        </div>
    )
}

export default FileViewFrame;