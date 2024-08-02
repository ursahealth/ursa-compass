// Loading animation
const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

export function CardSkeleton() {
  return (
    <div
      className={`${shimmer} relative h-96 overflow-hidden rounded-xl bg-gray-100 p-2 shadow-sm`}
    >
      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="h-80 rounded-lg bg-gray-50 p-2 md:pt-0">
            <table className="hidden min-w-full text-gray-900 md:table">
              <tbody className="h-64 bg-white">
                <tr className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="w-50 py-3 pl-6 pr-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
