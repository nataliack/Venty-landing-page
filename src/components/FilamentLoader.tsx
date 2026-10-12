"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Sky } from "./Sky";
import { HERO, preloadHero } from "@/lib/heroSequence";
import { EASE } from "@/lib/motion";

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
   alone glides from the centre to the top left, landing exactly on the
   site's own logo, which takes over from it.

   The hero's opening waits for this screen to leave (afterLoader). */

const WORDS = ["Loading", "Measuring", "Drafting", "Fitting", "Ready"];
const HOLD_MS = 500; // the beat on Ready before it clears
const CLEAR_S = 0.4; // words, number, filament and wordmark leave
const TILES_S = 0.6; // the squares clear from the top row to the bottom
const JITTER_S = 0.16; // each square's own scatter within its row
const FLIGHT_S = 1.15; // the mark's glide to the corner
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
const MARK =
  "M619.823 25.0127C624.577 22.0044 627.073 22.0765 631.88 19.6243C647.161 11.828 660.294 -2.48179 678.52 0.37042C688.732 1.96732 707.767 22.6944 707.734 31.9944C707.656 56.3843 699.814 80.5262 700.432 105.57C700.625 116.376 701.769 127.145 703.859 137.743C704.396 140.597 705.181 144.359 705.96 148.346C708.435 160.988 710.174 173.925 715.433 185.674C720.751 197.546 727.823 210.519 733.023 217.21C744.992 232.608 762.065 251.277 775.785 265.097C804.527 293.524 846.79 315.004 882.892 332.163C927.142 353.195 945.208 359.199 969.402 403.521C996.034 452.304 1026.77 502.741 1029.45 556.347C1029.45 592.738 1022.71 618.329 1014.97 636.523C1003.7 663.005 1012.46 670.926 1032.99 650.823C1096.64 588.519 1101.72 491.68 1165.56 435.805C1168.55 433.189 1180.64 418.569 1183.72 415.992C1192.2 408.897 1201.81 401.266 1210.48 393.855L1213.78 390.22C1214.78 389.199 1215.75 388.311 1216.7 387.523C1225.49 380.205 1236.09 375.256 1246.53 370.604C1252.66 367.868 1258.8 366.177 1267.73 362.952C1269.54 362.295 1278.84 357.566 1281.65 356.256C1285.83 353.553 1307.41 348.613 1313.43 346.323C1322.66 342.811 1332.96 338.859 1342.33 336.022C1364.58 331.014 1374.76 327.461 1395.95 320.111C1431.44 309.343 1466.78 293.785 1500.05 277.338C1510.09 272.378 1521.17 267.248 1530.96 261.528C1532.98 260.352 1535.39 260.057 1537.6 260.786C1542.99 262.559 1544.82 269.261 1540.9 273.372C1511.48 304.201 1474.71 328.121 1447.29 360.378C1434.03 375.972 1425.14 394.177 1412.88 410.686C1409.03 415.875 1405.03 422.644 1400.5 427.241C1384.52 448.61 1372.66 478.947 1356.13 500.797C1329.64 535.804 1295.92 574.711 1261.46 601.726C1249.03 611.463 1228.62 621.659 1214.59 631.055C1195.72 641.756 1174.75 649.736 1155.84 659.891C1131.42 673.008 1107.13 687.358 1082.63 700.445C1076.15 703.902 1069.56 709.701 1064.03 712.92C1059.31 716.49 1052.09 719.885 1046.68 722.635C1038.66 725.787 1030.2 729.273 1021.87 731.378C1009.13 736.244 984.716 750.052 971.988 754.5C931.876 768.504 905.866 782.319 862.296 783.597C857.066 783.749 848.725 787.214 842.666 787.789C838.959 788.592 835.329 789.513 831.541 789.633C822.21 790.542 812.921 793.324 803.313 794.875C788.846 797.211 772.298 797.273 757.326 796.695C733.082 794.781 699.35 783.506 678.004 771.275C665.474 764.098 640.253 736.156 627.884 725.933C615.41 715.617 603.952 692.506 593.373 680.281C574.073 657.98 559.299 633.823 541.636 610.7C537.293 604.945 516.759 594.318 509.836 589.774C500.941 583.934 500.941 584.166 482.481 574.893C469.426 568.334 449.426 558.291 445.556 556.347C428.812 547.939 424.44 546.687 406.83 537.839C402.94 535.884 398.778 534.523 394.497 533.746C382.472 531.556 369.71 528.877 358.713 530.78C339.165 535.3 303.068 537.605 275.847 546.505C259.011 552.014 241.427 558.317 224.222 562.524C220.665 563.392 216.905 564.104 213.207 564.855C210.757 565.35 208.296 563.99 207.361 561.659C206.371 559.196 207.491 556.394 209.823 555.139C219.931 549.701 226.469 542.615 236.423 535.3C248.168 526.672 260.484 520.416 273.72 514.435C281.15 511.14 290.04 511.691 297.643 509.49C317.568 503.72 337.078 495.643 356.749 489.302C372.208 484.321 390.16 485.28 404.773 476.323C409.051 473.702 411.43 474.251 414.932 470.284C415.165 470.02 415.236 469.654 415.13 469.32C415.058 469.085 414.909 468.886 414.696 468.768C414.296 468.549 413.928 468.417 413.441 468.279C400.123 464.476 358.698 435.233 348.072 425.567C310.236 391.143 287.16 350.671 274.414 301.205C272.515 293.84 270.022 285.779 268.796 277.974C268.157 273.916 267.585 269.84 266.926 265.785C265.408 256.443 265.239 246.569 265.892 236.825C266.815 223.054 278.051 213.985 290.732 208.669C292.404 207.969 294.52 206.875 295.944 205.752C301.466 201.399 307.221 194.908 313.117 192.195C319.479 189.266 324.639 190.105 331.448 186.054C354.676 172.239 359.915 160.625 384.399 156.948C387.624 156.464 390.078 154.194 391.041 151.063C391.388 149.928 392.1 148.704 393.081 148.042C396.434 145.782 398.772 147.451 402.283 149.774C402.963 150.224 403.202 151.118 402.829 151.845C402.49 152.507 402.645 153.356 403.337 153.624C404.236 153.973 405.196 153.97 406.34 154.088C406.381 154.092 406.419 154.114 406.439 154.148C406.48 154.205 406.471 154.283 406.419 154.331L404.948 155.699C404.875 155.766 404.84 155.864 404.851 155.963C404.881 156.159 405.085 156.276 405.266 156.2L409.836 154.304C410.076 154.205 410.324 154.129 410.575 154.074C412.807 153.584 415.002 152.87 416.809 151.625C419.354 149.873 418.446 146.293 419.654 143.441C420.182 142.198 421.233 141.205 422.275 140.352C440.615 125.355 452.426 124.802 470.451 111.3C473.804 109.453 476.632 107.049 479.627 104.663C491.309 96.6939 507.227 88.6288 517.88 80.3913C533.152 68.5828 527.303 67.3905 547.984 63.406C554.708 62.1108 573.165 51.9715 580.534 49.1128C585.986 46.9967 596.653 36.91 602.691 34.3228C608.438 31.0985 614.733 28.6757 619.823 25.0127Z";
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
      // logo's colour), then glides to exactly over the site's logo
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
        flight = gsap.to(m, {
          x: b.left - box.left - (a.left - box.left) * s,
          y: b.top - box.top - (a.top - box.top) * s,
          scale: s,
          duration: FLIGHT_S * pace,
          ease: EASE.inOut,
          delay: (TINT_S - 0.05) * pace, // once it has turned
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
            <svg ref={mark} viewBox={LOCKUP} className="fl-logo__mark" aria-hidden="true" fill="currentColor">
              <path d={MARK} />
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
