import _ from "lodash";

function parseCodeBlocks(inputString: string): Array<{ type: "code" | "text"; text: string }> {
  // Split the input string by a regex that matches ``` optionally followed by a language specifier
  const parts = inputString.split(/(?:^|\n)```[a-zA-Z]*\n?/);

  const output: Array<{ type: "text" | "code"; text: string }> = [];

  parts.forEach((part, index) => {
    // Determine if the current part is code or text based on its position
    const isCode = index % 2 !== 0; // Even parts are text, odd parts are code

    // If part is text, further split by newlines to separate distinct paragraphs or lines
    if (!isCode) {
      part.split("\n").forEach((textSegment) => {
        if (textSegment.trim()) {
          output.push({ type: "text", text: textSegment.trim() });
        }
      });
    } else {
      // For code parts, trim and push directly
      output.push({ type: "code", text: part.trim() });
    }
  });

  return output;
}

export default function ChatContent({
  type,
  text,
  query,
  isLogBar,
  showLogBar,
}: {
  text?: string;
  type?: string;
  query?: { sql: string; result: Array<{ [key: string]: any }> };
  isLogBar?: boolean;
  showLogBar?: boolean;
}) {
  const bufferWidth = showLogBar ? 820 : 500;
  if (type === "query") {
    if (!query || _.isEmpty(query.result)) {
      return (
        <div className="w-full max-w-full bg-gray-100 px-4 py-2 text-sm text-gray-800">
          No rows of data
        </div>
      );
    }
    const tableKeys = Object.keys(query.result[0]);
    return (
      <div
        style={{ maxWidth: `calc(100vw - ${bufferWidth}px)` }}
        className="w-full max-w-full overflow-x-auto rounded-lg bg-gray-100 px-4 py-2 pb-8 text-sm text-gray-800"
      >
        <div className="w-full max-w-full" style={{ maxWidth: `calc(100vw - ${bufferWidth}px)` }}>
          <div className="flex w-full flex-col">
            <pre className="w-full">
              <code className="language-sql block rounded-md border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800 shadow-inner">
                {query.sql}
              </code>
            </pre>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {tableKeys.map((value, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {query.result.map((row, i) => (
              <tr key={i}>
                {tableKeys.map((key, j) => (
                  <td key={j} className="whitespace-nowrap px-6 py-2">
                    {row[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!text) {
    return null;
  }

  const parsedItems = parseCodeBlocks(text);
  return (
    <div className={`${isLogBar ? "" : "rounded-lg"} bg-gray-100 px-4 py-2 text-sm text-gray-800`}>
      {parsedItems.map((textItem, i) => {
        if (textItem.type === "code") {
          return (
            <div
              className="w-full max-w-full overflow-hidden"
              key={i}
              style={{ maxWidth: `calc(100vw - ${bufferWidth}px)` }}
            >
              <div className="flex w-full flex-col">
                <pre className="w-full overflow-x-auto">
                  <code className="language-sql block rounded-md border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800 shadow-inner">
                    {textItem.text}
                  </code>
                </pre>
              </div>
            </div>
          );
        }
        return <p className="my-2" key={i}>{textItem.text}</p>;
      })}
    </div>
  );
}
