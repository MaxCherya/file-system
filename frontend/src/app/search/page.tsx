'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { searchNodes } from '@/endpoints/search';

import Loader from '@/components/ui/loaders/Loader';
import ListComponent from '@/components/ui/list/ListComponent';
import ErrorResponse from '@/components/responses/ErrorResponse';
import { FILE_HOVER, FILE_ICON, FOLDER_HOVER, FOLDER_ICON } from '@/constants/svgUrls';
import { SearchDirection, SearchNodeType, SearchOrderKey, SearchScope } from '@/types/search';

export default function SearchPage() {
    const [q, setQ] = useState('');
    const [scope, setScope] = useState<SearchScope>('both');
    const [typeFilter, setTypeFilter] = useState<SearchNodeType>(undefined);
    const [includeTrash, setIncludeTrash] = useState(false);
    const [order, setOrder] = useState<SearchOrderKey>('name');
    const [direction, setDirection] = useState<SearchDirection>('asc');

    const [committed, setCommitted] = useState({
        q: '',
        in: 'both' as SearchScope,
        include_trash: false,
        type: undefined as SearchNodeType,
        order: 'name' as SearchOrderKey,
        direction: 'asc' as SearchDirection,
    });

    const router = useRouter();

    const enabled = committed.q.trim().length > 0;

    const query = useQuery({
        queryKey: ['search', committed],
        queryFn: () =>
            searchNodes({
                q: committed.q,
                in: committed.in,
                include_trash: committed.include_trash,
                type: committed.type,
                order: committed.order,
                direction: committed.direction,
            }),
        enabled,
    });

    const { fetchStatus, isPending, isFetching, isError, error, data } = query;

    const showLoading = enabled && fetchStatus === 'fetching';

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setCommitted({
            q: q.trim(),
            in: scope,
            include_trash: includeTrash,
            type: typeFilter,
            order,
            direction,
        });
    }

    function clearAll() {
        setQ('');
        setScope('both');
        setTypeFilter(undefined);
        setIncludeTrash(false);
        setOrder('name');
        setDirection('asc');
        setCommitted({ q: '', in: 'both', include_trash: false, type: undefined, order: 'name', direction: 'asc' });
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center p-4 gap-4">
            {/* SEARCH CONTROLS */}
            <form onSubmit={onSubmit} className="w-full max-w-4xl bg-white rounded-xl shadow p-4 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[240px]">
                    <label className="text-sm text-gray-600">Query</label>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search files & folders…"
                        className="w-full border rounded-lg p-2"
                    />
                </div>

                <div className="min-w-[160px]">
                    <label className="text-sm text-gray-600">Scope</label>
                    <select value={scope} onChange={(e) => setScope(e.target.value as SearchScope)} className="w-full border rounded-lg p-2">
                        <option value="both">Name + Content</option>
                        <option value="name">Name only</option>
                        <option value="content">Content only</option>
                    </select>
                </div>

                <div className="min-w-[140px]">
                    <label className="text-sm text-gray-600">Type</label>
                    <select
                        value={typeFilter ?? ''}
                        onChange={(e) => setTypeFilter(e.target.value ? (e.target.value as SearchNodeType) : undefined)}
                        className="w-full border rounded-lg p-2"
                    >
                        <option value="">Any</option>
                        <option value="DIRECTORY">Folder</option>
                        <option value="FILE">File</option>
                    </select>
                </div>

                <div className="min-w-[140px]">
                    <label className="text-sm text-gray-600">Order</label>
                    <select value={order} onChange={(e) => setOrder(e.target.value as SearchOrderKey)} className="w-full border rounded-lg p-2">
                        <option value="name">Name</option>
                        <option value="mtime">Modified</option>
                        <option value="size">Size</option>
                        <option value="type">Type</option>
                    </select>
                </div>

                <div className="min-w-[120px]">
                    <label className="text-sm text-gray-600">Direction</label>
                    <select value={direction} onChange={(e) => setDirection(e.target.value as SearchDirection)} className="w-full border rounded-lg p-2">
                        <option value="asc">Asc</option>
                        <option value="desc">Desc</option>
                    </select>
                </div>

                <label className="flex items-center gap-2 px-2">
                    <input type="checkbox" checked={includeTrash} onChange={(e) => setIncludeTrash(e.target.checked)} />
                    <span className="text-sm text-gray-700">Include trash</span>
                </label>

                <div className="ml-auto flex gap-2">
                    <button type="button" onClick={clearAll} className="border px-3 py-2 rounded-lg hover:bg-gray-50">
                        Clear
                    </button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Search
                    </button>
                </div>
            </form>

            {/* RESULTS */}
            <div className="w-full max-w-4xl">
                {showLoading && <Loader />}

                {isError && <ErrorResponse error={error} />}

                {enabled && data && data.length === 0 && (
                    <div className="text-center text-gray-600 py-10">
                        No results for “{committed.q}”.
                    </div>
                )}

                {!enabled && (
                    <div className="text-center text-gray-600 py-10">
                        Type something and hit Search.
                    </div>
                )}

                {enabled && data && data.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {data.map((node) => {
                            const isDir = node.node_type === 'DIRECTORY';
                            return (
                                <div key={node.id} className="relative">
                                    <ListComponent
                                        title={node.name}
                                        icon={isDir ? FOLDER_ICON : FILE_ICON}
                                        hoverIcon={isDir ? FOLDER_HOVER : FILE_HOVER}
                                        onClick={() => router.push(isDir ? `/dirs/${node.id}` : `/files/${node.id}`)}
                                    />
                                    {/* TINY META ROW */}
                                    <div className="px-2 text-xs text-gray-500 mb-1">
                                        <span className="mr-3">Type: {node.node_type}</span>
                                        {'size' in node && node.size !== undefined ? <span className="mr-3">Size: {node.size}</span> : null}
                                        {'modified_at' in node && node.modified_at ? <span>Modified: {new Date(node.modified_at).toLocaleString()}</span> : null}
                                        {node.is_trashed ? (
                                            <span className="ml-3 inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                                In Trash
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}