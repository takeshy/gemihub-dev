"use client";

import { useEffect, useRef, useState } from "react";
import { useIsDark } from "~/hooks/useIsDark";

export function MermaidCodeBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const isDark = useIsDark();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current || !code) return;

      const id = `mermaid-md-${Date.now()}`;
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
          securityLevel: "strict",
          suppressErrorRendering: true,
        });

        const { svg } = await mermaid.render(id, code);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        // Clean up orphaned Mermaid error element created by failed render
        document.getElementById(id)?.remove();
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, isDark]);

  if (error) {
    return (
      <pre className="rounded bg-gray-100 p-4 text-sm text-red-600 dark:bg-gray-800 dark:text-red-400">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center overflow-auto rounded bg-white p-4 dark:bg-gray-900 [&>svg]:max-w-full"
    />
  );
}
