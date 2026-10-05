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
    slug: "loader-orbit",
    no: 19,
    title: "Reel loader · Orbit",
    note: "Frames ride a tilted 3D ring round a viewfinder, slow down, land on the hero's first frame and grow into it. Vote tab on from the start.",
    tag: "Loader · Reel",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-drift",
    no: 18,
    title: "Reel loader · Drift",
    note: "A lightboard of scattered frames pans with parallax; the hero frame drifts into the viewfinder, the rest part, and it fills the screen.",
    tag: "Loader · Reel",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-tunnel",
    no: 17,
    title: "Reel loader · Tunnel",
    note: "Frames fly toward you past the viewfinder while the hero frame travels down the middle, locks in the brackets and fills the screen.",
    tag: "Loader · Reel",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-seam-light",
    no: 16,
    title: "Light loader · Seam",
    note: "On Crown, left to right: the stitch sews a pattern sheet as cut lines, folds, notches and grainlines draw in around it, then it splits top and bottom.",
    tag: "Loader · Light",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-form",
    no: 15,
    title: "Light loader · Form",
    note: "On Crown: a dress form in a matrix of dots lights from the hem up, measurement tags pop out, then the dots float away.",
    tag: "Loader · Light",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-sizes",
    no: 14,
    title: "Light loader · Sizes",
    note: "On Crown: an odometer rolls through standard sizes, strikes each one, lands on \"Yours.\" and the sky closes in on it.",
    tag: "Loader · Light",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-thread",
    no: 13,
    title: "Light loader · Thread",
    note: "On Crown: the Venty mark and wordmark are traced in one thread, fill in, then the sky lifts like a blind.",
    tag: "Loader · Light",
    date: "05 Oct",
    kind: "native",
  },
  {
    slug: "loader-swatches",
    no: 12,
    title: "Light loader · Swatches",
    note: "On Crown: a swatch book in the palette stacks card by card, fans open, and the cards fly out.",
    tag: "Loader · Light",
    date: "05 Oct",
    kind: "native",
  },
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
