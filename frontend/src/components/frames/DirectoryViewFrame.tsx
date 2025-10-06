import { getDirContent } from "@/endpoints/dirs";
import { useQuery } from "@tanstack/react-query";
import Loader from "../ui/loaders/Loader";
import ListComponent from "../ui/list/ListComponent";
import { FILE_HOVER, FILE_ICON, FOLDER_HOVER, FOLDER_ICON } from "@/constants/svgUrls";
import EmptyDirectory from "../responses/EmptyDirectory";
import ErrorResponse from "../responses/ErrorResponse";


interface Props {
    folderId?: number;
}


const DirectoryViewFrame: React.FC<Props> = ({ folderId }) => {

    // TANSTACK QUERY INIT
    const query = useQuery({
        queryKey: ["directory", folderId || 'root'],
        queryFn: () => getDirContent(folderId || undefined),
    });
    const { isPending, isFetching, isSuccess, isError, error, data, status, fetchStatus } = query;

    return (
        <div className="flex flex-col items-center align-middle p-4 gap-2 h-screen w-screen">

            {/* LOADING STATE */}
            {(isPending || isFetching) && <Loader />}

            {/* DISPLAYING OF CONTENT */}
            {!isFetching && isSuccess && data && data.length > 0 && (
                data.map((node) => (
                    <ListComponent title={node.name} key={node.id}
                        icon={node.node_type === 'DIRECTORY' ? FOLDER_ICON : FILE_ICON}
                        hoverIcon={node.node_type === 'DIRECTORY' ? FOLDER_HOVER : FILE_HOVER}
                    />
                ))
            )}

            {/* NO DATA CASE */}
            {!isFetching && isSuccess && data && data.length === 0 && (
                <EmptyDirectory />
            )}

            {/* ERROR STATE */}
            {isError && (
                <ErrorResponse error={error} />
            )}

        </div>
    )
}

export default DirectoryViewFrame;