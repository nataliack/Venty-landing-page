import type { Metadata } from "next";
import { Film } from "./Film";
import "./video.css";

/* venty.au/video: the film and nothing else, so it can be shown inside
   another site's player (the QUT Design Festival project page opens this
   address in its video pop-up). The address never changes: to put a new cut
   up, replace the file in public/video and bump FILM's version (Film.tsx). */

export const metadata: Metadata = {
  title: "Venty film",
  description: "The film about Venty, a sewing pattern drafted to your exact measurements.",
};

export default function VideoPage() {
  return <Film />;
}
