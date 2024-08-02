import Image from "next/image";

export default function UrsaLabsLogo() {
  return (
    <div className="items-center leading-none text-white">
      <Image
        src="/ursa-labs.webp"
        width={300}
        height={300}
        className="mb-2 hidden rounded md:block"
        alt="Ursa Labs"
      />
      <p className="text-center text-[30px]">Ursa Labs</p>
    </div>
  );
}
