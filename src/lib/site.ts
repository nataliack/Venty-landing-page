/* Where the primary buttons go. Swap for the app URL when it is live. */
export const APP_URL = "#";
export const CTA_LABEL = "Create your pattern";

/* QUT Design Festival, exhibition day: Wednesday 11 November 2026, 6pm in
   Brisbane. Queensland has no daylight saving, so it is always UTC+10; the
   countdown in the announcement bar runs to this instant on any clock. */
export const FESTIVAL_AT = "2026-11-11T18:00:00+10:00";

/* Natalia Chamon's site, from "Made by" in the announcement bar */
export const MAKER_URL = "https://nataliachamon.com/";

/* Vote for Venty: the People's Choice voting pages. Empty until the pages
   exist; the links show and animate but go nowhere yet. */
export const VOTE_LINKS: { label: string; href: string }[] = [
  { label: "IxD", href: "" },
  { label: "VisCom", href: "" },
];
