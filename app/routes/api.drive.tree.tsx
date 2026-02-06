import type { Route } from "./+types/api.drive.tree";
import { requireAuth } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import { listFiles, listFolders } from "~/services/google-drive.server";

interface TreeNode {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  modifiedTime?: string;
  children?: TreeNode[];
}

const HIDDEN_ROOT_ITEMS = new Set(["settings.json", "history"]);

async function fetchTreeRecursive(
  accessToken: string,
  folderId: string,
  isRoot: boolean = false
): Promise<TreeNode[]> {
  const [folders, files] = await Promise.all([
    listFolders(accessToken, folderId),
    listFiles(accessToken, folderId),
  ]);

  const visibleFolders = isRoot
    ? folders.filter((f) => !HIDDEN_ROOT_ITEMS.has(f.name))
    : folders;

  const folderNodes = await Promise.all(
    visibleFolders.map(async (f) => {
      const children = await fetchTreeRecursive(accessToken, f.id);
      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        isFolder: true,
        children,
      } as TreeNode;
    })
  );

  const visibleFiles = isRoot
    ? files.filter((f) => !HIDDEN_ROOT_ITEMS.has(f.name))
    : files;

  const fileNodes = visibleFiles
    .filter((f) => f.mimeType !== "application/vnd.google-apps.folder")
    .map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      isFolder: false,
      modifiedTime: f.modifiedTime,
    }));

  return [...folderNodes, ...fileNodes];
}

export async function loader({ request }: Route.LoaderArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const url = new URL(request.url);
  const folderId = url.searchParams.get("folderId");

  if (!folderId) {
    return Response.json({ error: "Missing folderId" }, { status: 400 });
  }

  const isRoot = url.searchParams.get("isRoot") === "true";
  const items = await fetchTreeRecursive(validTokens.accessToken, folderId, isRoot);
  return Response.json({ items });
}
