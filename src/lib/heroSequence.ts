/* The hero video, as a scroll-scrubbed image sequence (the engine is
   src/lib/sequence.ts).

   Frames come from tools/hero/encode.mjs (master: media/hero/hero-master.mp4)
   and live in public/hero/sequence/frames/0001.webp …, full 16:9 frames at
   the source's own pixels. The loading screen waits for the ready set (the
   opening frames, and every 16th frame through the whole film); the rest keep
   coming in behind it, the frames nearest the playhead first. The loader and
   the hero share the one download.

   Phones get their own frames (public/hero/sequence-phone, from
   tools/hero/encode-phone.mjs): the same pixels, cut to the band a portrait
   screen can see of each frame along the camera's track, so they download
   and decode under half of every frame. A screen wider than they were cut
   for (a tablet, a phone on its side) gets the full frames, and so does
   every screen if the camera has changed since they were cut. */

import manifest from "../../public/hero/sequence/manifest.json";
import phoneManifest from "../../public/hero/sequence-phone/manifest.json";
import { createSequence, type CameraKeys } from "./sequence";
import { CAMERA } from "./heroCamera";

const full = createSequence(manifest, "/hero/sequence", { opening: 48 });
const phone = createSequence(phoneManifest, "/hero/sequence-phone", { opening: 48 });

// cut from this encode of the film, along this camera, or not used at all
const phoneOk =
  phoneManifest.crop.from === manifest.version &&
  phoneManifest.crop.camera.length === CAMERA.length &&
  phoneManifest.crop.camera.every((k, i) => k[0] === CAMERA[i][0] && k[1] === CAMERA[i][1]) &&
  phoneManifest.frames === manifest.frames &&
  phoneManifest.sourceFrames.every((f, i) => f === manifest.sourceFrames[i]);

/** Whether a screen (or canvas) of this size gets the phone frames */
export const heroPhoneFits = (width: number, height: number) => phoneOk && width / height <= phoneManifest.crop.aspect;

/** The set for this screen: the phone frames on a portrait screen they were
    cut for, the full frames otherwise. Asked when the loader starts and
    whenever the hero's canvas changes shape */
const setFor = (width: number, height: number) => (heroPhoneFits(width, height) ? phone : full);
const current = () => (typeof window === "undefined" ? full : setFor(window.innerWidth, window.innerHeight));

export type { CameraKeys };
export const HERO = manifest;
/** The web frame showing a given master frame (0-based, as numbered in After Effects) */
export const heroFrame = full.frameOf;
/** Fractional web position of a master frame, for smooth scrubbing */
export const heroPosition = full.positionOf;
/** The first frame, for the poster under the canvas (the full frame: it
    covers any screen) */
export const heroPoster = full.poster;
export const cameraTrack = full.cameraTrack;
/** Where the hero's playhead is: the background download follows it */
export const heroPlayhead = (frame: number, dir: number) => current().setPlayhead(frame, dir);
/** Downloads every hero frame for this screen (safe to call many times); resolves on the ready set */
export const preloadHero = (onProgress?: (done: number, total: number) => void) => current().preload(onProgress);
/** A player for this canvas, with the frames for its shape. blend: between
    two frames, lay the next over the earlier by the scroll's exact position
    (on, as the site has it; the lab's hero-blend page compares it off) */
export const createHeroPlayer = (canvas: HTMLCanvasElement, camera?: (frame: number) => number, { blend = true }: { blend?: boolean } = {}) =>
  setFor(canvas.clientWidth, canvas.clientHeight).createPlayer(canvas, camera, { blend });
