export type SearchScope = "name" | "content" | "both";
export type SearchNodeType = "FILE" | "DIRECTORY" | undefined;
export type SearchOrderKey = "name" | "mtime" | "size" | "type";
export type SearchDirection = "asc" | "desc";

export interface SearchParams {
    q: string;                       // required
    in?: SearchScope;                // default: "both"
    include_trash?: boolean;         // default: false
    type?: SearchNodeType;           // optional filter: FILE | DIRECTORY
    parent_id?: number | null;       // optional; null => root
    limit?: number;                  // default: 100 (server caps to 500)
    order?: SearchOrderKey;          // default: "name"
    direction?: SearchDirection;     // default: "asc"
}