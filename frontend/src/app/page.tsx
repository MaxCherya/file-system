'use client';

import ListComponent from "@/components/ui/list/ListComponent";
import Loader from "@/components/ui/loaders/Loader";
import { FILE_HOVER, FILE_ICON, FOLDER_HOVER, FOLDER_ICON } from "@/constants/svgUrls";
import { getDirContent } from "@/endpoints/dirs";
import { useQuery } from "@tanstack/react-query";

export default function Home() {

  // TANSTACK QUERY INIT
  const query = useQuery({
    queryKey: ["directory", 0],
    queryFn: () => getDirContent(0),
  });
  const { isPending, isFetching, isSuccess, isError, error, data, status, fetchStatus } = query;

  return (
    <div className="flex flex-col items-center justify-center align-middle p-4 gap-2 h-screen w-screen">

      {/* LOADING STATE */}
      {(isPending || isFetching) && <Loader />}

      {/* DISPLAYING OF CONTENT */}
      {!isFetching && isSuccess && data && data.length > 0 && (
        data.map((node) => (
          <ListComponent title={node.name}
            icon={node.nodeType === 'DIRECTORY' ? FOLDER_ICON : FILE_ICON}
            hoverIcon={node.nodeType === 'DIRECTORY' ? FOLDER_HOVER : FILE_HOVER}
          />
        ))
      )}

      {/* NO DATA CASE */}
      {!isFetching && isSuccess && data && data.length === 0 && (
        <div className="text-gray-500">This directory is empty.</div>
      )}

    </div>
  );
}