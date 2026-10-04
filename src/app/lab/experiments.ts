/* Everything the lab knows about. Newest first: the grid and the
   previous/next arrows both follow this order. To add an experiment, add
   an entry here. "native" entries render a component from
   _components/registry.tsx; "frame" entries embed an existing route. */

export type Experiment = {
  slug: string;
  no: number;
  title: string;
  note: string;
  tag: string;
  date: string;
  kind: "native" | "frame";
  src?: string;
};

export const EXPERIMENTS: Experiment[] = [
  {
    slug: "pairs",
    no: 6,
    title: "Colour pairs",
    note: "Pick a background and a text colour from the palette and read the WCAG contrast live.",
    tag: "Colour",
    date: "04 Oct",
    kind: "native",
  },
  {
    slug: "tiles",
    no: 5,
    title: "Glow tiles",
    note: "Backlit glass tiles in the Venty palette. The light follows your finger. Tune it from the panel.",
    tag: "Playground",
    date: "04 Oct",
    kind: "native",
  },
  {
    slug: "home",
    no: 4,
    title: "Current build",
    note: "The landing page as it stands on main.",
    tag: "Page",
    date: "Live",
    kind: "frame",
    src: "/",
  },
  {
    slug: "loader",
    no: 3,
    title: "Zipper loader",
    note: "The unzip loader on a loop.",
    tag: "Motion",
    date: "03 Oct",
    kind: "frame",
    src: "/loader",
  },
  {
    slug: "gradients",
    no: 2,
    title: "Skies",
    note: "Crown, Haze and Edge, the three locked gradient skies.",
    tag: "Gradient",
    date: "03 Oct",
    kind: "frame",
    src: "/gradients",
  },
  {
    slug: "styleguide",
    no: 1,
    title: "Palette",
    note: "The eight Venty colours.",
    tag: "Colour",
    date: "26 Sep",
    kind: "frame",
    src: "/styleguide",
  },
];

export const findExperiment = (slug: string) => EXPERIMENTS.findIndex((e) => e.slug === slug);
