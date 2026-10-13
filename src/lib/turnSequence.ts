/* The turn in See it on your body (Features): Jose's model turning a full
   360°, as an image sequence played by a slider (the engine is
   src/lib/sequence.ts, shared with the hero and the table).

   Frames come from tools/turn/build.cjs (masters: media/features/turn/), which
   joins Jose's two clips (front to back, back to front) into one even,
   colour-matched turn: 720 x 720 squares on her, in public/features/turn.
   Frame 0 is the front; manifest.back is the frame showing her back. Nothing
   of it loads with the page: it loads when the card comes near. */

import manifest from "../../public/features/turn/manifest.json";
import { createSequence } from "./sequence";

export const turn = createSequence(manifest, "/features/turn", { opening: 8 });
export const TURN = manifest;

/** The frame position (fractional) for an angle: 0° the front, 180° the
    back, 360° the front again. Each half of the turn spans its own frames
    (the clips' halves are not quite the same length), so 180° is exactly the
    back. Larger angles turn her the way the slider moves. */
export function turnPosition(deg: number) {
  const N = manifest.frames;
  const d = (((360 - deg) % 360) + 360) % 360;
  const p = d <= 180 ? (d / 180) * manifest.back : manifest.back + ((d - 180) / 180) * (N - manifest.back);
  return Math.min(N - 1, p);
}
