import type { ComponentType } from "react";
import { Tiles } from "./exp/Tiles";
import { Pairs } from "./exp/Pairs";

/* Native lab experiments by slug. Pair each with an entry in experiments.ts. */
export const NATIVE: Record<string, ComponentType> = {
  tiles: Tiles,
  pairs: Pairs,
};
