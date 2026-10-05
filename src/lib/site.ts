/* Where the primary buttons go: the app (the venty-app project on Vercel) */
export const APP_URL = "https://app.venty.au";

/* The landing page's own address (www redirects here) */
export const SITE_URL = "https://venty.au";
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

/* The footer's media band: a video (or an image) behind the wordmark. Empty
   until it is made; the light sky (Crown) stands in. e.g. "/footer/loop.mp4" */
export const FOOTER_MEDIA = "";

/* The footer's About and Legal links. Empty until the pages exist; they
   show, but go nowhere yet. */
export const CONTACT_URL = "";
export const LEGAL_LINKS: { label: string; href: string }[] = [
  { label: "Privacy", href: "" },
  { label: "Terms", href: "" },
  { label: "Accessibility", href: "" },
];
