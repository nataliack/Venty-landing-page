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
    slug: "loader-draft",
    no: 11,
    title: "Loader · Draft",
    note: "A bodice is drafted on pattern paper as the page loads, measurements decode in, then the sheet lifts away.",
    tag: "Loader",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-fit",
    no: 10,
    title: "Loader · Fit",
    note: "Three measurement rings tighten until they fit the Venty mark, then open from the centre.",
    tag: "Loader",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-seam",
    no: 9,
    title: "Loader · Seam",
    note: "A running stitch sews down the cloth, the thread pulls tight and the two halves part. The zipper idea, no image sequence.",
    tag: "Loader",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-tape",
    no: 8,
    title: "Loader · Tape",
    note: "A measuring tape reads the progress in centimetres, whips back, and the night splits along its line.",
    tag: "Loader",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "glow-cards",
    no: 7,
    title: "Glow cards",
    note: "The lab's cards as backlit glass, lit by a light that follows you. The first lab index, kept as a study.",
    tag: "Interaction",
    date: "04 Oct",
    kind: "native",
  },
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
