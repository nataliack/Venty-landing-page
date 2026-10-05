import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Wings } from "@/components/Wings";
import { ScrollBar } from "@/components/ScrollBar";
import { SITE_URL } from "@/lib/site";

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
  metadataBase: new URL(SITE_URL),
  title: "Venty",
  description:
    "See a dress you love. Wear it, made for you. Venty drafts a printable sewing pattern to your exact measurements and shows it on a 3D model of your own body.",
};

// Chrome on Android colours its toolbar from this; ThemeZones switches it
// with the page. Safari 26 ignores it (see .safari-bar in globals.css), and
// Chrome on iOS lets no page colour its bars.
export const viewport: Viewport = {
  themeColor: "#687ef5",
};

/* Marks iPhone Safari on <html> before the page paints. Every iOS browser
   runs on WebKit, so CSS cannot tell Safari from Chrome; the user agent can.
   Only iPhone Safari gets the toolbar strip: its toolbar floats over the
   page and hides it. Elsewhere (Chrome, Firefox, in-app browsers, iPad
   Safari with no bottom toolbar) it would only show as a line. */
const IPHONE_SAFARI = `(function(){var u=navigator.userAgent;var ios=/iP(hone|od)/.test(u);if(ios&&/Safari/.test(u)&&!/CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV/.test(u))document.documentElement.classList.add("iphone-safari")})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${familjen.variable} ${bigilla.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: IPHONE_SAFARI }} />
      </head>
      <body className="grain">
        {/* the page scrolls in here, never the window: see SmoothScroll */}
        <div id="scroller" className="scroller">
          <div className="dotgrid" aria-hidden="true" />
          <Wings />
          <SmoothScroll>{children}</SmoothScroll>
        </div>
        <ScrollBar />
        {/* Safari 26 tints its toolbar from this; the status bar from <body> */}
        <div className="safari-bar" aria-hidden="true" />
      </body>
    </html>
  );
}
