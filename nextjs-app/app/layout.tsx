import "@/app/ui/global.css";
import { openSans } from "@/app/ui/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Ursa Compass</title>
      </head>
      <body className={`${openSans.className} antialiased`}>{children}</body>
    </html>
  );
}
