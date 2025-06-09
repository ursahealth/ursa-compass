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

export default function ChatContent({ text }: { text?: string }) {
  if (!text) {
    return null;
  }

  const parsedItems = parseCodeBlocks(text);
  return (
    <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-800">
      {parsedItems.map((textItem, i) => {
        if (textItem.type === "code") {
          return (
            <div
              className="w-full max-w-full overflow-hidden"
              key={i}
              style={{ maxWidth: `calc(100vw - 500px)` }}
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
        return (
          <p className="my-2" key={i}>
            {textItem.text}
          </p>
        );
      })}
    </div>
  );
}
