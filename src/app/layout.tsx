import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venty",
  description:
    "Sewing patterns drafted to your exact measurements. Describe the garment, see it on a 3D model of your own body, print the pattern.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU">
      <body className="antialiased">{children}</body>
    </html>
  );
}
