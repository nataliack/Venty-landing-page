import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Wings } from "@/components/Wings";

const familjen = localFont({
  src: [
    { path: "../../public/fonts/FamiljenGrotesk-Variable.ttf", style: "normal" },
    { path: "../../public/fonts/FamiljenGrotesk-Italic-Variable.ttf", style: "italic" },
  ],
  variable: "--font-familjen",
  display: "swap",
});

const bigilla = localFont({
  src: [
    { path: "../../public/fonts/Bigilla.otf", weight: "400" },
    { path: "../../public/fonts/Bigilla-Bold.otf", weight: "700" },
  ],
  variable: "--font-bigilla",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Venty",
  description:
    "See a dress you love. Wear it, made for you. Venty drafts a printable sewing pattern to your exact measurements and shows it on a 3D model of your own body.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${familjen.variable} ${bigilla.variable}`}>
      <body className="grain">
        <div className="dotgrid" aria-hidden="true" />
        <Wings />
        <SmoothScroll>
          <div className="relative z-[1]">{children}</div>
        </SmoothScroll>
      </body>
    </html>
  );
}
