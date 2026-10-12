"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Sky } from "./Sky";
import { HERO, preloadHero } from "@/lib/heroSequence";
import { EASE } from "@/lib/motion";
import { MARK, MARK_CENTRE, flightRoute } from "@/lib/markFlight";

/* The loading screen: Edge, the locked dark sky (a cornflower glow roaming the
   lower two thirds), with the cornflower filament, its growing tip the one that
   glows. One line across the middle of the screen:

     left    a word for what it is doing (Loading, Measuring, Drafting,
             Fitting, then Ready), rising from its mask as it changes
     centre  the Venty logo (the vertical lockup), and under it the
             filament, dead centre
     right   the percentage, in the same type as the word

   Progress is real: the hero's opening frames and the fonts.

   The way out is simple, in the spirit of a page change: the words, the
   number, the filament and the wordmark clear; the night settles to one flat
   colour; then the screen breaks into squares that clear row by row from the
   top (each with a little jitter), uncovering the hero. Meanwhile the mark
   alone flies to the top left (markFlight): it turns head first to
   face the way, flies head first along a low arc beating its wings, touches
   down exactly on the site's own logo, wings still, and turns back to face
   right, as the logo, which takes over from it.

   The hero's opening waits for this screen to leave (afterLoader). */

const WORDS = ["Loading", "Measuring", "Drafting", "Fitting", "Ready"];
const HOLD_MS = 500; // the beat on Ready before it clears
const CLEAR_S = 0.4; // words, number, filament and wordmark leave
const TILES_S = 0.6; // the squares clear from the top row to the bottom
const JITTER_S = 0.16; // each square's own scatter within its row
const FLIGHT_S = 1.15; // the mark's flight to the corner
const BACK_S = 0.6; // having touched down, it turns back to face right (head first), as the logo
const TINT_S = 0.4; // the mark turns from cloud to cornflower before it leaves

const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Real progress: the hero's opening frames, then the fonts. 0..1 */
function useLoad(on: boolean) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!on) return;
    let hero = 0;
    let heroTotal = HERO.frames;
    let fonts = 0;
    let off = false;
    const update = () => !off && setP(Math.min(1, (hero + fonts) / (heroTotal + 1)));
    preloadHero((done, total) => {
      hero = done;
      heroTotal = total;
      update();
    }).then(() => {
      hero = heroTotal;
      update();
    });
    document.fonts.ready.then(() => {
      fonts = 1;
      update();
    });
    return () => {
      off = true;
    };
  }, [on]);
  return p;
}

/** The lab's stand-in: an even load over `seconds` (0: off). 0..1 */
function useSim(seconds: number) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!seconds) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / (seconds * 1000));
      setP(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seconds]);
  return p;
}

/** The number chases the real progress at a capped speed, so a fast load still
    reads and a stall never jumps. 0..1 */
function useShown(progress: number, minSeconds: number) {
  const [shown, setShown] = useState(0);
  const target = useRef(progress);
  useEffect(() => {
    target.current = progress;
  }, [progress]);
  useEffect(() => {
    if (still()) {
      const id = setInterval(() => setShown(target.current), 100);
      return () => clearInterval(id);
    }
    let raf = 0;
    let last = performance.now();
    let v = 0;
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const cap = dt / minSeconds;
      v = Math.min(target.current, v + Math.min(cap, (target.current - v) * 0.12 + cap * 0.15));
      setShown(v);
      if (v < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [minSeconds]);
  return shown;
}

/* The rolling word: every word in one grid cell; the current one is in, the
   last one leaves upward, the rest wait below */
function Roll({ i }: { i: number }) {
  const [prev, setPrev] = useState(-1);
  const [cur, setCur] = useState(i);
  if (i !== cur) {
    setPrev(cur);
    setCur(i);
  }
  return (
    <p className="fl-roll">
      <span className="sr-only">{WORDS[i]}</span>
      {WORDS.map((t, k) => (
        <span key={t} aria-hidden="true" data-state={k === i ? "in" : k === prev ? "out" : "wait"}>
          {t}
        </span>
      ))}
    </p>
  );
}

/* The Venty logo, the vertical lockup, in one coordinate space: the wordmark
   and the mark are separate svgs laid exactly over each other, so the mark
   can leave on its own */
const LOCKUP = "0 0 2132 1786";
const WORD = [
  "M1318.17 1060.59V1487.75C1318.17 1494.85 1312.42 1500.6 1305.32 1500.6H1294.22C1293.24 1500.6 1292.46 1501.38 1292.46 1502.36C1292.46 1503.35 1293.24 1504.13 1294.22 1504.13H1415.82C1416.8 1504.13 1417.58 1503.35 1417.58 1502.36C1417.58 1501.38 1416.8 1500.6 1415.82 1500.6H1404.7C1397.59 1500.6 1391.85 1494.85 1391.85 1487.75V1118.24C1391.85 1091.35 1384.83 1064.46 1371.97 1039.91C1360.28 1016.51 1342.75 995.486 1321.69 979.109C1291.28 956.898 1255.03 945.2 1217.63 944.016H1215.29C1186.29 944.016 1157.3 951.497 1131.91 965.274C1123.97 969.578 1113.6 964.177 1113.57 955.165C1113.57 949.042 1108.6 944.045 1102.48 944.045H1015.95C1014.97 944.045 1014.19 944.825 1014.19 945.807C1014.19 946.789 1014.97 947.569 1015.95 947.569H1027.07C1034.17 947.569 1039.92 953.316 1039.92 960.422V1487.78C1039.92 1494.88 1034.17 1500.63 1027.07 1500.63H1015.98C1015 1500.63 1014.22 1501.41 1014.22 1502.39C1014.22 1503.37 1015 1504.15 1015.98 1504.15H1137.57C1138.55 1504.15 1139.33 1503.37 1139.33 1502.39C1139.33 1501.41 1138.55 1500.63 1137.57 1500.63H1126.48C1119.37 1500.63 1113.63 1494.88 1113.63 1487.78V1060.94C1113.63 1023.85 1137.83 990.894 1173.41 980.467C1187.97 976.192 1203.04 973.217 1215.95 973.217C1256.22 973.217 1280.74 986.735 1295.61 1002.3C1310.49 1017.87 1318.25 1039.04 1318.25 1060.62L1318.17 1060.59Z",
  "M544.972 840.786C543.643 840.237 454.716 803.815 447.12 800.696C439.466 797.548 378.872 772.852 373.327 770.426C372.923 770.253 372.46 770.166 372.027 770.282C371.421 770.426 370.901 771.09 371.132 771.668C371.276 772.101 371.709 772.332 372.085 772.563C382.425 778.311 393.775 782.701 403.422 789.605C415.841 798.472 418.585 816.322 419.596 830.446C420.578 844.166 419.596 857.856 418.758 871.547C416.274 912.591 411.162 953.519 405.588 994.245C401.198 1026.33 396.317 1058.37 391.147 1090.34C384.995 1128.44 379.074 1168.3 348.2 1195.16C340.893 1201.51 332.199 1206.86 322.581 1207.95C310.942 1209.28 299.332 1204.17 290.234 1196.78C260.11 1172.28 255.258 1128.47 246.045 1092.82C237.409 1059.38 228.744 1025.9 220.109 992.454C201.711 921.285 183.313 850.116 164.915 778.947C161.074 764.129 157.348 749.254 153.42 734.466C142.792 694.607 106.776 666.821 65.5329 666.647H64.9842C64.4643 666.647 63.9155 666.647 63.3957 666.647H60.9118C59.8143 666.647 58.7457 666.647 57.6482 666.647H53.7203C52.2473 666.647 50.7454 666.647 49.2724 666.619H44.4492C42.7451 666.619 41.0411 666.59 39.3371 666.59H34.0806C32.3188 666.59 30.557 666.561 28.8241 666.561H23.6542C22.008 666.561 20.3617 666.532 18.7443 666.532H14.181C12.8235 666.532 11.4661 666.503 10.1086 666.503H6.64283C5.74749 666.503 4.82327 666.503 3.92793 666.503H2.07949C1.41521 666.503 0 666.416 0 667.052C0 667.687 2.05061 667.774 3.03259 667.889L4.44781 668.034L18.6288 669.622L24.1163 670.229L29.1996 670.807L33.3874 671.269L36.2178 671.587C36.5355 671.615 36.8821 671.702 37.1998 671.702C51.2653 671.702 64.2621 680.656 68.2767 693.971C73.7643 712.139 78.5875 730.538 83.613 748.821C105.188 827.355 125.636 906.207 146.691 984.886C165.955 1056.89 185.219 1128.9 204.484 1200.91C220.802 1261.91 237.12 1322.94 253.438 1383.94C259.619 1407.05 265.8 1430.13 271.98 1453.23C276.89 1471.6 279.865 1490.06 297.887 1500.46C324.748 1515.94 359.752 1499.1 363.882 1468.31L444.636 866.81C453.994 832.901 477.186 818.141 509.649 831.428L543.181 845.177C544.365 845.668 545.752 845.09 546.243 843.906C546.734 842.721 546.156 841.335 544.972 840.844V840.786Z",
  "M994.518 1170.58C1000.03 1167.31 996.857 1155.21 995.067 1149.96C943.628 1001.03 757.802 897.282 608.339 972.148C341.643 1099.5 427.596 1502.94 724.097 1506.52C804.417 1507.5 885.46 1469 937.158 1407.83C975.976 1361.87 993.391 1303.01 978.344 1243.94C972.337 1220.32 960.495 1184.18 969.65 1176.1C978.806 1168.01 989.03 1173.84 994.547 1170.58H994.518ZM728.083 1482.06C675.229 1481.57 623.01 1464.41 583.673 1427.53C552.539 1398.32 532.553 1354.16 521.664 1313.47C510.313 1270.95 508.523 1225.8 517.159 1182.62C519.267 1172.11 521.78 1155.67 535.758 1155.67H886.673C924.104 1155.67 993.449 1260.52 943.772 1363C919.974 1412.1 872.116 1446.65 820.967 1465.71C791.536 1476.69 759.708 1482.35 728.083 1482.06ZM723.057 978.301C835.639 978.301 890.716 1058.22 910.472 1095.97C915.064 1104.75 908.739 1115.27 898.803 1115.27H557.997C548.582 1115.27 542.17 1105.65 545.838 1096.98C561.723 1059.69 609.436 978.272 723.057 978.272V978.301Z",
  "M2076.69 928.101C2075.48 928.563 2030.05 945.662 2029.87 945.778C2029.76 945.865 2029.64 945.951 2029.64 946.096C2029.64 946.211 2029.73 946.298 2029.82 946.356C2030.25 946.558 2030.83 946.24 2031.2 946.096C2031.78 945.893 2032.36 945.72 2032.94 945.547C2034.09 945.2 2035.25 944.882 2036.43 944.622C2038.74 944.074 2041.08 943.669 2043.45 943.409C2047.49 942.947 2052.46 942.803 2055.93 945.287C2056.65 945.807 2057.25 946.413 2057.75 947.135C2058.27 947.915 2058.64 948.782 2058.84 949.706C2059.1 950.804 2059.16 951.959 2059.1 953.085C2059.05 954.212 2058.84 955.425 2058.55 956.551C2024.42 1091.64 1986.96 1237.36 1953.34 1369.35C1947.65 1386.43 1940.57 1398.21 1929.45 1398.21C1909.06 1398.21 1883.67 1319.91 1883.67 1319.91L1772.25 957.938C1770.14 951.092 1763.81 946.442 1756.65 946.442H1456.11C1455.79 946.442 1455.53 946.182 1455.53 945.865C1455.53 945.547 1455.79 945.287 1456.11 945.287C1485.34 945.027 1510.17 926.397 1520.11 899.853C1520.72 898.207 1520.92 896.445 1521.47 894.77C1521.47 894.712 1521.5 894.625 1521.53 894.567C1522.19 892.603 1522.59 890.524 1523.17 888.531C1524.5 883.996 1524.5 879.952 1524.5 875.129V691.256C1524.5 679.385 1512.2 671.471 1501.39 676.439L1426.59 710.753C1425.75 711.128 1425.32 712.11 1425.61 712.977C1425.95 714.016 1427.14 714.507 1428.12 714.045L1436.5 710.059C1443.14 706.882 1450.82 711.735 1450.82 719.1V933.589C1450.82 940.694 1445.07 946.442 1437.97 946.442H1426.88C1425.93 946.442 1425.12 947.222 1425.12 948.204C1425.12 949.186 1425.9 949.966 1426.88 949.966H1438C1445.1 949.966 1450.85 955.714 1450.85 962.819V1333.51C1450.85 1360.4 1457.87 1386.14 1470.72 1410.69C1482.42 1435.24 1499.95 1456.29 1521.01 1471.49C1551.42 1494.88 1587.66 1506.58 1625.07 1506.58H1627.41C1662.93 1506.58 1696.46 1496.67 1725.29 1476.86C1727.65 1475.62 1730.02 1474.35 1732.42 1472.99C1735.34 1471.17 1740.25 1465.91 1736.49 1459.38C1731.78 1451.24 1691.64 1494.71 1635.93 1494.71C1580.21 1494.71 1524.5 1456.67 1524.5 1384.63V982.258C1524.5 975.874 1527.42 969.809 1532.56 966.054C1535.68 963.772 1539.75 962.01 1544.86 962.01H1679.39C1691.61 962.01 1698.6 966.083 1701.14 975.615C1701.83 978.243 1702.76 980.842 1703.57 983.442C1705.7 990.345 1707.87 997.277 1710.04 1004.18C1713.3 1014.69 1716.59 1025.21 1719.89 1035.72C1724.07 1049.12 1728.26 1062.55 1732.45 1075.96C1737.33 1091.58 1742.21 1107.18 1747.06 1122.81C1752.41 1139.9 1757.75 1157.03 1763.09 1174.13C1768.7 1192.04 1774.27 1209.95 1779.87 1227.85C1785.51 1245.85 1791.14 1263.87 1796.74 1281.87C1802.17 1299.28 1807.6 1316.67 1813.06 1334.09C1818.08 1350.18 1823.11 1366.29 1828.13 1382.38C1832.52 1396.48 1836.94 1410.57 1841.33 1424.64C1844.89 1436.02 1848.44 1447.4 1851.99 1458.78C1854.47 1466.75 1856.99 1474.72 1859.47 1482.69C1861.75 1489.94 1862.91 1499.65 1869.03 1504.47C1871.28 1506.23 1874.06 1507.19 1876.86 1507.74C1883.96 1509.12 1891.27 1508.17 1898.49 1508.23C1901.47 1508.23 1904.59 1508.46 1907.16 1509.93C1910.39 1511.81 1912.3 1515.42 1912.96 1519.09C1913.65 1522.93 1913.65 1527.98 1912.76 1531.77C1904.01 1569.26 1897.31 1608.25 1883.3 1644.27C1870.24 1677.83 1845.84 1709.6 1809.85 1719.51C1778.37 1728.17 1744.58 1724.25 1713.39 1716.56C1699.18 1713.07 1679.88 1706.11 1674.45 1725.37L1667.18 1766.33C1665.65 1775 1671.65 1783.14 1680.38 1784.3C1689.59 1785.51 1698.92 1786 1707.78 1786C1752.2 1786 1796.65 1770.81 1834.06 1743.92C1874.98 1713.5 1904.21 1669.08 1914.72 1618.79L2076.89 980.554C2084.49 953.923 2105.26 926.975 2130.41 911.204C2130.87 910.916 2132.58 909.876 2131.8 908.605C2131.11 907.507 2129.29 908.374 2128.42 908.663L2076.55 928.101H2076.69Z",
];

/* The squares the screen breaks into: whole columns across, rows to cover
   the height. Each clears at its row's moment plus a little scatter of its
   own (seeded, so it is the same every visit). */
type Tiles = { cols: number; rows: number; size: number; delays: number[] };
function makeTiles(w: number, h: number, pace: number): Tiles {
  const cols = w < 768 ? 12 : 20;
  const size = w / cols;
  const rows = Math.ceil(h / size);
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const delays: number[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) delays.push(((rows > 1 ? r / (rows - 1) : 0) * (TILES_S - JITTER_S) + rand() * JITTER_S) * pace);
  return { cols, rows, size, delays };
}

export function FilamentLoader({
  sim = 0,
  contained = false,
  pace = 1,
  sky: skyVariant = "dark",
  target,
  onDone,
}: {
  /** the lab: a simulated load of this many seconds instead of the real one */
  sim?: number;
  /** the lab: fill the parent instead of the screen */
  contained?: boolean;
  /** the lab: slow motion (2: half speed) */
  pace?: number;
  /** the night behind: the zipper loader's ("loader") or the locked dark sky, Edge ("dark") */
  sky?: "loader" | "dark";
  /** where the mark lands (default: the site's logo, top left) */
  target?: () => Element | null;
  onDone?: () => void;
} = {}) {
  const real = useLoad(!sim);
  const fake = useSim(sim);
  const progress = sim ? fake : real;
  const shown = useShown(progress, sim ? 0.01 : 2.2);
  const [gone, setGone] = useState(false);
  const [tiles, setTiles] = useState<Tiles | null>(null);
  const [out, setOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGSVGElement>(null);

  const pct = Math.round(Math.min(1, shown) * 100);
  const loaded = shown >= 1;
  const word = loaded ? WORDS.length - 1 : Math.min(WORDS.length - 2, Math.floor(shown * (WORDS.length - 1)));
  const landing = () => (target ? target() : document.querySelector("[data-logo] svg"));

  // the squares, sized to this screen (or the lab's box)
  useLayoutEffect(() => {
    const r = root.current?.getBoundingClientRect();
    if (r) setTiles(makeTiles(r.width, r.height, pace));
  }, [pace]);

  // the site's logo waits under the screen, hidden, until the mark lands on it
  useEffect(() => {
    if (contained) return;
    const logo = document.querySelector<HTMLElement>("[data-logo]");
    if (logo) logo.style.visibility = "hidden";
    return () => {
      if (logo) logo.style.visibility = "";
    };
  }, [contained]);

  // the filament's head breathes, and a sweep of light runs along the lit part
  useEffect(() => {
    if (still() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.to("[data-head]", { opacity: 0.55, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.fromTo("[data-pulse]", { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 1.6, ease: "power2.in", repeat: -1, repeatDelay: 0.5 });
    }, root);
    return () => ctx.revert();
  }, []);

  // loaded: a beat on Ready, then out
  useEffect(() => {
    if (!loaded) return;
    let dead = false;
    const timers: number[] = [];
    const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));
    const land = () => {
      if (dead) return;
      const logo = contained ? null : document.querySelector<HTMLElement>("[data-logo]");
      if (logo) logo.style.visibility = "";
      setGone(true);
      onDone?.();
    };
    const leave = async () => {
      await wait(HOLD_MS * pace);
      if (dead) return;
      if (still()) {
        await gsap.to(root.current, { opacity: 0, duration: 0.5, ease: EASE.soft }).then();
        land();
        return;
      }
      const q = gsap.utils.selector(root);
      // phones lay the line out as a column (word on top, number at the foot), so those leave up and down
      const column = window.matchMedia("(max-width: 767px)").matches;

      // the mark: cloud while it loads; on Ready it turns cornflower (the site
      // logo's colour), then flies to exactly over the site's logo
      const m = mark.current!;
      const corn = getComputedStyle(document.documentElement).getPropertyValue("--color-cornflower").trim() || "#687ef5";
      tweens.push(gsap.to(m, { color: corn, duration: TINT_S * pace, ease: EASE.soft }));
      const path = m.querySelector("path")!;
      const to = landing()?.querySelector("path") ?? landing();
      let flight: gsap.core.Tween | null = null;
      if (to) {
        const a = path.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        const box = m.getBoundingClientRect();
        const s = b.width / a.width;
        gsap.set(m, { transformOrigin: "0 0" });
        // the mark's middle inside its svg, in px (the path's box, in the
        // logo's units, against the same box on screen)
        const unit = path.getBBox();
        const u = a.width / unit.width;
        const centre: [number, number] = [a.left - box.left + (MARK_CENTRE[0] - unit.x) * u, a.top - box.top + (MARK_CENTRE[1] - unit.y) * u];
        const route = flightRoute(
          { x: 0, y: 0, scale: 1 },
          { x: b.left - box.left - (a.left - box.left) * s, y: b.top - box.top - (a.top - box.top) * s, scale: s },
          centre,
          { flight: FLIGHT_S, back: BACK_S },
        );
        // drawn in pieces (body, wing, head) while it moves, then the mark again
        const [body, far, near] = ["body", "far", "near"].map((k) => m.querySelector<SVGPathElement>(`[data-piece="${k}"]`)!);
        const pieces = (on: boolean) => {
          path.style.display = on ? "none" : "";
          for (const p of [body, far, near]) p.style.display = on ? "" : "none";
        };
        const clock = { t: 0 };
        flight = gsap.to(clock, {
          t: route.total,
          duration: route.total * pace,
          ease: "none",
          delay: (TINT_S - 0.05) * pace, // once it has turned
          onUpdate() {
            const at = route.at(clock.t);
            gsap.set(m, { x: at.x, y: at.y, scale: at.scale });
            body.setAttribute("d", at.pose.body);
            far.setAttribute("d", at.pose.far);
            near.setAttribute("d", at.pose.near);
            pieces(!at.done);
          },
          onComplete: () => pieces(false),
        });
        tweens.push(flight);
      }

      // the rest clears, and the night settles to one flat colour
      tweens.push(
        gsap
          .timeline()
          .to(q("[data-clear]"), { opacity: 0, duration: CLEAR_S, ease: EASE.in }, 0)
          .to(q("[data-clear='left']"), { [column ? "y" : "x"]: -14, duration: CLEAR_S, ease: EASE.in }, 0)
          .to(q("[data-clear='right']"), { [column ? "y" : "x"]: 14, duration: CLEAR_S, ease: EASE.in }, 0)
          .to(q("[data-clear='bar']"), { scaleX: 0, duration: CLEAR_S, ease: EASE.in }, 0)
          .to(sky.current, { opacity: 0, duration: CLEAR_S + 0.1, ease: EASE.soft }, 0)
          .timeScale(1 / pace),
      );
      await wait((CLEAR_S + 0.05) * 1000 * pace);
      if (dead) return;

      // the squares clear from the top, row by row, uncovering the hero
      setOut(true);
      await Promise.all([wait((TILES_S + 0.08) * 1000 * pace), flight ? flight.then() : Promise.resolve()]);
      land();
    };
    leave();
    return () => {
      dead = true;
      timers.forEach(clearTimeout);
      tweens.forEach((t) => t.kill());
    };
    // runs once, when the load completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (gone) return null;

  return (
    // .loader is what the page's openings wait for (afterLoader); the lab's copy has no part in that
    <div ref={root} className={`fl inset-0 overflow-hidden ${contained ? "absolute z-[40]" : "loader fixed z-[100]"}`}>
      <div role="progressbar" aria-label="Loading Venty" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="sr-only">
        {pct}%
      </div>

      {/* the flat night, in squares, under the moving one */}
      {tiles && (
        <div className={`fl-tiles ${out ? "is-out" : ""}`} style={{ gridTemplateColumns: `repeat(${tiles.cols}, 1fr)`, gridTemplateRows: `repeat(${tiles.rows}, ${tiles.size}px)` }} aria-hidden="true">
          {tiles.delays.map((d, i) => (
            <span key={i} style={{ transitionDelay: `${d.toFixed(3)}s` }} />
          ))}
        </div>
      )}
      <div ref={sky} className="fl-sky" aria-hidden="true">
        <Sky variant={skyVariant} />
      </div>

      <div className="fl-hud">
        <div data-clear="left" className="fl-side fl-left">
          <Roll i={word} />
        </div>

        <div className="fl-centre">
          <div className="fl-logo" role="img" aria-label="Venty">
            <svg data-clear="" viewBox={LOCKUP} className="fl-logo__word" aria-hidden="true" fill="currentColor">
              {WORD.map((d) => (
                <path key={d.slice(0, 12)} d={d} />
              ))}
            </svg>
            <svg ref={mark} viewBox={LOCKUP} className="fl-logo__mark" aria-hidden="true" fill="currentColor" overflow="visible">
              <path d={MARK} />
              {/* the mark cut into its body and wings, shown only while it flies */}
              <path data-piece="body" style={{ display: "none" }} />
              <path data-piece="far" style={{ display: "none" }} />
              <path data-piece="near" style={{ display: "none" }} />
            </svg>
          </div>
          <div data-clear="bar" className="fl-bar" aria-hidden="true">
            <div className="fl-fill" style={{ width: `${Math.min(1, shown) * 100}%` }}>
              {/* the sweep of light runs inside the lit part only: clipped, so it never shows past the line's start */}
              <span className="fl-sweep">
                <span data-pulse className="fl-pulse" />
              </span>
              <span data-head className="fl-head" />
            </div>
          </div>
        </div>

        <p data-clear="right" className="fl-side fl-right fl-roll" aria-hidden="true">
          {pct}%
        </p>
      </div>
    </div>
  );
}
