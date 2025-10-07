'use client';

import React from "react";
import { TreeNode } from "@/types/common";
import ListComponent from "@/components/ui/list/ListComponent";
import { FILE_HOVER, FILE_ICON, FOLDER_HOVER, FOLDER_ICON } from "@/constants/svgUrls";
import SubmitButton from "@/components/ui/btns/SubmitButton";

type Props = {
  node: TreeNode;
  depth?: number;
  onRestore: (id: number) => void;
  onPurge: (id: number, name: string) => void;
  isBusy: (id: number) => boolean;
  actingId?: number | null;
  restorePending?: boolean;
  purgePending?: boolean;
};

const TrashTreeNode: React.FC<Props> = ({
  node,
  depth = 0,
  onRestore,
  onPurge,
  isBusy,
  actingId = null,
  restorePending = false,
  purgePending = false,
}) => {
  const isDir = node.node_type === "DIRECTORY";
  const restoring = actingId === node.id && restorePending;
  const purging = actingId === node.id && purgePending;
  const busy = isBusy(node.id);

  return (
    <div key={node.id}>
      <div className="group relative">
        <div style={{ paddingLeft: depth * 16 }} className="flex-1">
          <div className="flex items-center gap-2">
            <ListComponent
              title={node.name}
              icon={isDir ? FOLDER_ICON : FILE_ICON}
              hoverIcon={isDir ? FOLDER_HOVER : FILE_HOVER}
              onClick={() => { }}
            />
            {node.__orphan && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                parent not in trash
              </span>
            )}
          </div>

          {/* MOBILE */}
          <div className="mt-2 flex gap-2 md:hidden">
            <SubmitButton
              onClick={() => onRestore(node.id)}
              isSubmitting={restoring}
              label="Restore"
              loadLabel="Restoring…"
              className={`!bg-emerald-600 hover:!bg-emerald-700 !text-white !py-1.5 !px-3 !text-xs ${busy ? "pointer-events-none opacity-60" : ""}`}
            />
            <SubmitButton
              onClick={() => onPurge(node.id, node.name)}
              isSubmitting={purging}
              label="Purge"
              loadLabel="Purging…"
              className={`!bg-red-600 hover:!bg-red-700 !text-white !py-1.5 !px-3 !text-xs ${busy ? "pointer-events-none opacity-60" : ""}`}
            />
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 gap-2 opacity-0 group-hover:opacity-100 transition">
          <SubmitButton
            onClick={() => onRestore(node.id)}
            isSubmitting={restoring}
            label="Restore"
            loadLabel="Restoring…"
            className={`!bg-emerald-600 hover:!bg-emerald-700 !text-white !py-1 !px-3 !text-xs ${busy ? "pointer-events-none opacity-60" : ""}`}
          />
          <SubmitButton
            onClick={() => onPurge(node.id, node.name)}
            isSubmitting={purging}
            label="Purge"
            loadLabel="Purging…"
            className={`!bg-red-600 hover:!bg-red-700 !text-white !py-1 !px-3 !text-xs ${busy ? "pointer-events-none opacity-60" : ""}`}
          />
        </div>
      </div>

      {/* CHILDREN */}
      {node.children?.length
        ? node.children.map((child) => (
          <TrashTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            onRestore={onRestore}
            onPurge={onPurge}
            isBusy={isBusy}
            actingId={actingId}
            restorePending={restorePending}
            purgePending={purgePending}
          />
        ))
        : null}
    </div>
  );
};

export default TrashTreeNode;