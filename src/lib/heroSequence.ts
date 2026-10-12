/* The hero video, as a scroll-scrubbed image sequence (the engine is
   src/lib/sequence.ts).

   Frames come from tools/hero/encode.mjs (master: media/hero/hero-master.mp4)
   and live in public/hero/sequence/frames/0001.webp …, full 16:9 frames at
   the source's own pixels. The loading screen waits for the ready set (the
   opening frames, and every 16th frame through the whole film); the rest keep
   coming in behind it, the frames nearest the playhead first. The loader and
   the hero share the one download. */

import manifest from "../../public/hero/sequence/manifest.json";
import { createSequence, type CameraKeys } from "./sequence";

const hero = createSequence(manifest, "/hero/sequence", { opening: 48 });

export type { CameraKeys };
export const HERO = manifest;
/** The web frame showing a given master frame (0-based, as numbered in After Effects) */
export const heroFrame = hero.frameOf;
/** Fractional web position of a master frame, for smooth scrubbing */
export const heroPosition = hero.positionOf;
/** The first frame, for the poster under the canvas */
export const heroPoster = hero.poster;
export const cameraTrack = hero.cameraTrack;
/** Where the hero's playhead is: the background download follows it */
export const heroPlayhead = hero.setPlayhead;
/** Downloads every hero frame (safe to call many times); resolves on the ready set */
export const preloadHero = hero.preload;
export const createHeroPlayer = hero.createPlayer;
