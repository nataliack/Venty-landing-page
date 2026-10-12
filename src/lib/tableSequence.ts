/* The table film (the closing scene), as a scroll-scrubbed image sequence (the
   engine is src/lib/sequence.ts).

   Frames come from tools/sequence/encode.mjs --name table (master:
   media/table/table-master.mp4) and live in public/table/sequence/frames,
   full 1920 x 1080 frames at the source's own pixels. Nothing of it loads with
   the page: the download starts once the loader has gone and the page is idle,
   or at once if the table comes near first (Closing.tsx). */

import manifest from "../../public/table/sequence/manifest.json";
import { createSequence } from "./sequence";

export const table = createSequence(manifest, "/table/sequence", { opening: 24 });
export const TABLE = manifest;
