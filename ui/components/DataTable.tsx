import { Session } from "../util/types";

export const DataTable = ({ data, sql }: { data: Array<any>; sql: string | undefined }) => {
  if (!data) {
    return null;
  }
  const bufferWidth = 800; // Adjust this value as needed
  if (data.length === 0) {
    return (
      <div
        style={{ maxWidth: `calc(100vw - ${bufferWidth}px)` }}
        className="w-full max-w-full overflow-x-auto rounded-lg bg-gray-100 px-4 py-2 pb-8 text-sm text-gray-800"
      >
        <div className="w-full max-w-full" style={{ maxWidth: `calc(100vw - ${bufferWidth}px)` }}>
          <div className="flex w-full flex-col">
            <pre className="w-full">
              <code className="language-sql block rounded-md border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800 shadow-inner">
                {sql}
              </code>
            </pre>
          </div>
        </div>
        <div className="w-full max-w-full bg-gray-100 px-4 py-2 text-sm text-gray-800">
          No rows of data
        </div>
      </div>
    );
  }
  const tableKeys = Object.keys(data[0]);
  return (
    <div
      style={{ maxWidth: `calc(100vw - ${bufferWidth}px)` }}
      className="w-full max-w-full overflow-x-auto rounded-lg bg-gray-100 px-4 py-2 pb-8 text-sm text-gray-800"
    >
      <div className="w-full max-w-full" style={{ maxWidth: `calc(100vw - ${bufferWidth}px)` }}>
        <div className="flex w-full flex-col">
          <pre className="w-full">
            <code className="language-sql block rounded-md border border-gray-300 bg-gray-100 p-4 text-sm text-gray-800 shadow-inner">
              {sql}
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
          {data.map((row, i) => (
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
};
