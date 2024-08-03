import Link from "next/link";
import UrsaLabsLogo from "@/app/ui/ursa-labs-logo";

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 flex h-20 items-center justify-center rounded-md bg-blue-storm p-4 md:h-60"
        href="/"
      >
        <div className="w-32 text-white md:w-40">
          <UrsaLabsLogo />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
      </div>
    </div>
  );
}
