import { useState, useCallback } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadProgress {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);

  const upload = useCallback(
    async (files: File[], folderId: string, namePrefix?: string): Promise<boolean> => {
      if (files.length === 0) return false;

      setUploading(true);

      // Initialize progress with client-side size checks
      const initial: UploadProgress[] = files.map((f) => {
        if (f.size > MAX_FILE_SIZE) {
          return {
            name: f.name,
            status: "error" as const,
            error: `Too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`,
          };
        }
        return { name: f.name, status: "uploading" as const };
      });
      setProgress(initial);

      const validFiles = files.filter((f) => f.size <= MAX_FILE_SIZE);
      if (validFiles.length === 0) {
        setUploading(false);
        return false;
      }

      const formData = new FormData();
      formData.set("folderId", folderId);
      if (namePrefix) {
        formData.set("namePrefix", namePrefix);
      }
      for (const f of validFiles) {
        formData.append("files", f);
      }

      try {
        const res = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setProgress((prev) =>
            prev.map((p) =>
              p.status === "uploading"
                ? { ...p, status: "error", error: data.error || "Upload failed" }
                : p
            )
          );
          setUploading(false);
          return false;
        }

        const data = await res.json();
        const resultMap = new Map<string, { file?: unknown; error?: string }>();
        for (const r of data.results) {
          resultMap.set(r.name, r);
        }

        setProgress((prev) =>
          prev.map((p) => {
            if (p.status !== "uploading") return p;
            const result = resultMap.get(p.name);
            if (result?.error) {
              return { ...p, status: "error", error: result.error };
            }
            return { ...p, status: "done" };
          })
        );

        setUploading(false);
        return true;
      } catch {
        setProgress((prev) =>
          prev.map((p) =>
            p.status === "uploading"
              ? { ...p, status: "error", error: "Network error" }
              : p
          )
        );
        setUploading(false);
        return false;
      }
    },
    []
  );

  const clearProgress = useCallback(() => {
    setProgress([]);
  }, []);

  return { uploading, progress, upload, clearProgress };
}
