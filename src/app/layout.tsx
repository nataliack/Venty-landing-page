import type { Metadata, Viewport } from "next";
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

// Chrome (Android) colours its toolbar from this. Safari 26 ignores it and
// samples the .safari-bar elements below instead.
export const viewport: Viewport = {
  themeColor: "#0b0c15",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${familjen.variable} ${bigilla.variable}`}>
      <body className="grain">
        {/* the page scrolls in here, never the window: see SmoothScroll */}
        <div id="scroller" className="scroller">
          <div className="dotgrid" aria-hidden="true" />
          <Wings />
          <SmoothScroll>{children}</SmoothScroll>
        </div>
        {/* Safari 26 tints its status bar and toolbar from these */}
        <div className="safari-bar safari-bar--top" aria-hidden="true" />
        <div className="safari-bar safari-bar--bottom" aria-hidden="true" />
      </body>
    </html>
  );
}
