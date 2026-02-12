export function DiffView({ diff }: { diff: string }) {
  if (!diff) {
    return (
      <div className="px-3 py-2 text-xs text-gray-400">No diff available</div>
    );
  }

  const lines = diff.split("\n");

  return (
    <pre className="text-xs font-mono leading-relaxed p-2">
      {lines.map((line, i) => {
        let className = "text-gray-600 dark:text-gray-400";
        if (line.startsWith("+") && !line.startsWith("+++")) {
          className =
            "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300";
        } else if (line.startsWith("-") && !line.startsWith("---")) {
          className =
            "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300";
        } else if (line.startsWith("@@")) {
          className = "text-blue-600 dark:text-blue-400";
        }

        // Separate prefix from content so copy excludes prefix characters
        const { prefix, rest } = getLinePrefix(line);

        return (
          <div key={i} className={className}>
            {prefix ? <span className="select-none">{prefix}</span> : null}{rest}
          </div>
        );
      })}
    </pre>
  );
}

function getLinePrefix(line: string): { prefix: string; rest: string } {
  if (line.startsWith("+++") || line.startsWith("---")) {
    return { prefix: line, rest: "" };
  }
  if (line.startsWith("@@")) {
    return { prefix: line, rest: "" };
  }
  if (line.startsWith("+") || line.startsWith("-")) {
    return { prefix: line[0], rest: line.slice(1) };
  }
  return { prefix: "", rest: line };
}
