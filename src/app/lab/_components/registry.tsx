import type { ComponentType } from "react";
import { Tiles } from "./exp/Tiles";
import { Pairs } from "./exp/Pairs";
import { GlowCards } from "./exp/GlowCards";
import { Harness } from "./loaders/Harness";
import { Draft } from "./loaders/Draft";
import { Tape } from "./loaders/Tape";
import { Fit } from "./loaders/Fit";
import { Seam } from "./loaders/Seam";
import { Thread } from "./loaders/Thread";
import { Sizes } from "./loaders/Sizes";
import { Swatches } from "./loaders/Swatches";
import { Form } from "./loaders/Form";
import { SeamLight } from "./loaders/SeamLight";
import { Orbit, Drift, Tunnel } from "./loaders/Reel";
import { Layout } from "./loaders/Layout";
import { Strip } from "./loaders/Strip";
import { MadeToMeasure } from "./sections/MadeToMeasure";
import { HowItWorksLight } from "./sections/HowItWorks";
import { HowItWorksDesk } from "./sections/HowItWorksDesk";
import { HcIndex, HcStack, HcSplit, HcStairs, HcSentence } from "./sections/hc/Concepts";
import { HcPull, HcRuler, HcTaped } from "./sections/hc/Concepts2";
import { HcCarousel, HcTabs, HcBento, HcZigzag, HcTags } from "./sections/hc/Concepts3";
import { DitherRise } from "./exp/DitherRise";
import { FilamentLab } from "./loaders/Filament";
import { MarkFlight } from "./exp/MarkFlight";

/* Loader concepts run inside the harness: stand-in page, simulated
   network, Replay. */
function LoaderDraft() {
  return <Harness Concept={Draft} />;
}
function LoaderFit() {
  return <Harness Concept={Fit} />;
}
function LoaderSeam() {
  return <Harness Concept={Seam} />;
}
function LoaderTape() {
  return <Harness Concept={Tape} />;
}

function LoaderThread() {
  return <Harness Concept={Thread} page="light" />;
}
function LoaderSizes() {
  return <Harness Concept={Sizes} page="light" />;
}
function LoaderSwatches() {
  return <Harness Concept={Swatches} page="light" />;
}
/* Reel concepts: the hero's first frame behind, the real Vote tab on top */
function LoaderStrip() {
  return <Harness Concept={Strip} page="hero" vote />;
}
function LoaderLayout() {
  return <Harness Concept={Layout} page="hero" vote />;
}
function LoaderOrbit() {
  return <Harness Concept={Orbit} page="hero" vote />;
}
function LoaderDrift() {
  return <Harness Concept={Drift} page="hero" vote />;
}
function LoaderTunnel() {
  return <Harness Concept={Tunnel} page="hero" vote />;
}
function LoaderSeamLight() {
  return <Harness Concept={SeamLight} page="light" />;
}
function LoaderForm() {
  return <Harness Concept={Form} page="light" />;
}

/* Native lab experiments by slug. Pair each with an entry in experiments.ts. */
export const NATIVE: Record<string, ComponentType> = {
  "mark-flight": MarkFlight,
  "loader-filament": FilamentLab,
  "dither-rise": DitherRise,
  tiles: Tiles,
  pairs: Pairs,
  "glow-cards": GlowCards,
  "loader-draft": LoaderDraft,
  "loader-fit": LoaderFit,
  "loader-seam": LoaderSeam,
  "loader-tape": LoaderTape,
  "loader-thread": LoaderThread,
  "loader-sizes": LoaderSizes,
  "loader-swatches": LoaderSwatches,
  "loader-form": LoaderForm,
  "loader-seam-light": LoaderSeamLight,
  "loader-strip": LoaderStrip,
  "section-made-to-measure": MadeToMeasure,
  "section-how-it-works": HowItWorksLight,
  "section-how-it-works-desk": HowItWorksDesk,
  "section-hiw-index": HcIndex,
  "section-hiw-stack": HcStack,
  "section-hiw-split": HcSplit,
  "section-hiw-stairs": HcStairs,
  "section-hiw-sentence": HcSentence,
  "section-hiw-pull": HcPull,
  "section-hiw-ruler": HcRuler,
  "section-hiw-taped": HcTaped,
  "section-hiw-carousel": HcCarousel,
  "section-hiw-tabs": HcTabs,
  "section-hiw-bento": HcBento,
  "section-hiw-zigzag": HcZigzag,
  "section-hiw-tags": HcTags,
  "loader-layout": LoaderLayout,
  "loader-orbit": LoaderOrbit,
  "loader-drift": LoaderDrift,
  "loader-tunnel": LoaderTunnel,
};
