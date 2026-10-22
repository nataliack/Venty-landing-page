"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { MARK, MARK_BOUNDS } from "@/lib/markFlight";
import { TURN, turnPosition } from "@/lib/turnSequence";

/* Features: the bento's cards, each a small working piece of the app
   (ported from the lab, src/app/lab/_components/sections/fz). Content is
   a stand-in for the final copy and images; the UI reads as the app's.
   Classes: fvc- (the cards), ftp- (the phones). */

/* ---- icons (24 x 24, currentColor) ---- */
const I = {
  plus: "M12 5v14M5 12h14",
  print: "M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z",
};
function Icon({ d, size = 18, weight = 1.6 }: { d: string; size?: number; weight?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ---- her turn, as plain frames: fetched once, when the card comes near ---- */
const frameSrc = (i: number) => `/features/turn/frames/${String(i + 1).padStart(4, "0")}.webp`;
const FIRST_FRAME = frameSrc(0);
let warmed = false;
function warmTurn() {
  if (warmed) return;
  warmed = true;
  for (let i = 0; i < TURN.frames; i++) {
    const im = new Image();
    im.src = frameSrc(i);
  }
}
/** an <img> of the turn; set(deg) shows her at that angle. The frames load
    when `near` (the card) comes within a screen of view */
function useTurn(near: React.RefObject<HTMLElement | null>) {
  const img = useRef<HTMLImageElement>(null);
  const last = useRef(-1);
  useEffect(() => {
    const el = near.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        warmTurn();
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  const set = (deg: number) => {
    const f = Math.round(turnPosition(deg));
    if (f === last.current || !img.current) return;
    last.current = f;
    img.current.src = frameSrc(f);
  };
  return [img, set] as const;
}

const SEND = "M12 19V5M5.5 11.5L12 5l6.5 6.5";
// turning a piece: a sheet with an arrow round its corner, each way
const TURN_L = "M12 5h6a2 2 0 0 1 2 2v3M15 8l-3-3 3-3M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2";
const TURN_R = "M12 5H6a2 2 0 0 0-2 2v3M9 8l3-3-3-3M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2";
const SPARK = "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6";

/** the Venty bird, small, as an avatar */
function Bird({ size = 14 }: { size?: number }) {
  const b = MARK_BOUNDS;
  return (
    <svg width={size} height={size} viewBox={`${b.x} ${b.y - (b.width - b.height) / 2} ${b.width} ${b.width}`} fill="currentColor" aria-hidden="true">
      <path d={MARK} />
    </svg>
  );
}

/* ---- Mark up your references -------------------------------------------
   A prototype of Jose's idea: the reference fills the card, its notes
   pinned on it. Tap a pin (or its tab under the picture) and the picture
   pushes in to that detail, macro, and the note is typed out in a comment
   over the picture, as it was written. Tap another and it pulls back out
   first, then pushes in to the next; tap the same again, or the arrow, to
   pull out.

   A detail with a clip (public/lab/features/clips/<clip>-in.mp4) pushes in
   with it: the clip starts on this exact still and ends on the macro;
   <clip>-out.mp4 is the same reversed, for pulling out, and <clip>-end.webp
   its last frame, sharp, shown once it lands, with the detail's outline
   (Jose's, drawn on that last frame: see OUTLINES) traced round it. A
   detail without one yet
   pushes in on the still, scaled (a stand-in), with its selection drawn in
   code (in the photo's units, 1493 x 2000, the cream tweed suit). tab: the
   note's name on its tab; note: the comment, typed out once it lands. */
const DETAILS = [
  {
    n: 1,
    tab: "Collar",
    note: "Keep this round collar exactly as it is: the soft rounded points, sitting flat. Same tweed as the jacket.",
    pin: [0.69, 0.27],
    at: [0.55, 0.285],
    z: 2.8,
    clip: "collar",
    // the stand-in, only if the clip can't play
    sel: <ellipse pathLength={1} cx="830" cy="575" rx="165" ry="82" />,
  },
  {
    n: 2,
    tab: "Buttons",
    note: "Covered buttons in the same tweed, spaced just like these, all the way down the front.",
    pin: [0.63, 0.42],
    at: [0.555, 0.41],
    z: 2.5,
    sel: <rect pathLength={1} x="752" y="660" width="156" height="330" rx="62" />,
  },
  {
    n: 3,
    tab: "Pockets",
    note: "Both flap pockets as they are, the flaps sitting just above the hip.",
    pin: [0.35, 0.47],
    at: [0.555, 0.485],
    z: 2.3,
    sel: (
      <>
        <rect pathLength={1} x="588" y="886" width="186" height="144" rx="24" />
        <rect pathLength={1} x="898" y="886" width="186" height="144" rx="24" />
      </>
    ),
  },
  { n: 4, tab: "Hem", note: "Make the skirt 5 cm longer, so it sits just above the knee. Keep the same A-line.", pin: [0.26, 0.66], at: [0.48, 0.67], z: 1.7, sel: null },
];
const HEM = 4; // the detail drawn as a hem, not a selection
const OUT_MS = 560; // the pull-out on the still, before pushing in to another detail
const TYPE_AFTER_MS = 750; // on the still, the comment starts typing once the push-in has landed
const TYPE_MS = 24; // a character
const clipSrc = (clip: string, part: string) => `/lab/features/clips/${clip}-${part}`;

/* Each clip's outline, as Jose drew it: a wash (fill) and a dashed line
   (dash, the dashes as drawn), in its own units (w x h), and where it sits
   on the clip's last frame (box: left, top, width, height, as shares of
   the frame, 1244 x 1664). Fitted to the frame's edges: the collar's is
   at 0.692 scale, 203, 374 in. Once the clip lands the line is drawn round
   (the dashes revealed along the shape), then the wash fills it. */
const OUTLINES: Record<string, { w: number; h: number; box: [number, number, number, number]; fill: string; dash: string }> = {
  collar: {
    w: 1379,
    h: 885,
    box: [203 / 1244, 374 / 1664, (1379 * 0.692) / 1244, (885 * 0.692) / 1664],
    fill: "M199.513 20.0596C225.513 20.0596 278.68 9.72624 302.013 4.55957C293.513 50.5596 327.013 149.06 331.013 157.06C335.013 165.06 333.013 179.56 335.513 185.06C338.013 190.56 348.513 192.56 353.013 199.06C357.513 205.56 346.513 209.56 353.013 213.56C359.513 217.56 364.013 224.56 359.013 229.56C354.013 234.56 365.013 243.56 367.013 259.56C369.013 275.56 384.013 280.56 386.513 286.06C389.013 291.56 387.513 301.56 393.013 314.06C398.513 326.56 413.013 355.06 424.013 370.06C432.813 382.06 444.68 409.06 449.513 421.06C453.18 423.726 461.713 430.86 466.513 438.06C472.513 447.06 478.513 462.06 481.513 468.56C484.513 475.06 504.013 491.06 510.513 504.56C517.013 518.06 538.013 553.56 543.013 563.06C548.013 572.56 572.013 593.56 590.013 607.06C608.013 620.56 617.513 621.56 622.013 638.56C625.613 652.16 641.513 649.226 649.013 646.06C651.513 641.06 657.613 629.16 662.013 621.56C667.513 612.06 664.513 606.06 675.513 593.56C684.313 583.56 695.513 591.726 700.013 597.06L733.513 563.06C859.513 431.06 870.013 411.06 945.513 303.56C1021.01 196.06 1044.01 114.06 1044.51 108.56C1044.91 104.16 1047.68 99.7262 1049.01 98.0596C1162.01 83.0596 1231.51 39.5596 1238.51 36.5596C1244.18 39.5596 1256.41 46.3596 1260.01 49.5596C1349.01 108.06 1361.01 139.06 1372.01 210.06C1383.01 281.06 1363.51 387.56 1330.01 486.56C1296.51 585.56 1242.01 688.06 1231.51 704.56C1221.01 721.06 1217.01 732.56 1156.51 791.56C1096.01 850.56 1034.01 870.56 1002.01 878.06C970.013 885.56 931.513 877.06 919.013 878.06C906.513 879.06 876.013 864.56 866.013 863.56C856.013 862.56 840.513 846.56 806.013 836.56C771.513 826.56 738.513 780.06 723.513 767.06C708.513 754.06 695.013 737.06 691.513 733.56C688.013 730.06 683.513 726.56 682.013 716.06C680.513 705.56 674.013 708.06 670.513 703.06C667.013 698.06 670.013 684.06 656.513 664.56C643.013 645.06 626.013 658.06 617.513 660.06C609.013 662.06 600.513 671.06 594.013 688.56C588.813 702.56 577.18 705.393 572.013 705.06C566.68 713.06 555.113 729.96 551.513 733.56C547.013 738.06 531.513 746.56 521.013 751.56C510.513 756.56 483.013 774.06 467.013 786.56C451.013 799.06 389.513 830.06 367.513 836.56C345.513 843.06 308.013 851.47 225.513 827.06C83.1132 787.06 27.8465 576.393 18.0132 476.06C-31.4868 285.06 60.0132 135.56 78.5132 109.56C104.129 73.5596 164.846 38.3929 199.513 20.0596Z",
    dash: "M295.69 5.92903C297.978 5.4434 300.096 4.98405 302.013 4.55957C301.635 6.60346 301.341 8.751 301.123 10.9896M282.963 8.53991C278.933 9.34024 274.654 10.1659 270.225 10.9903M257.452 13.2835C253.209 14.0163 248.915 14.7271 244.647 15.3954M231.803 17.2783C227.359 17.8805 223.034 18.4096 218.92 18.8402M205.981 19.8826C203.681 19.9982 201.516 20.0596 199.513 20.0596C197.379 21.1881 195.147 22.3803 192.83 23.6326M179.572 30.9619C175.335 33.3585 170.939 35.8994 166.448 38.5681M153.502 46.4683C149.271 49.1227 145.01 51.8713 140.768 54.7013M128.292 63.3203C124.159 66.2817 120.094 69.3109 116.143 72.3955M104.429 82.0237C100.521 85.4192 96.7996 88.863 93.3232 92.3398M83.1149 103.548C81.4789 105.547 79.9415 107.552 78.5132 109.56C77.4651 111.033 76.1827 112.902 74.7049 115.153M67.5029 126.73C65.4013 130.276 63.135 134.242 60.7531 138.61M54.3854 150.754C52.4421 154.607 50.4559 158.685 48.4485 162.98M42.8336 175.465C41.0826 179.514 39.3309 183.719 37.5926 188.074M32.7184 200.803C31.1857 204.98 29.6747 209.275 28.1957 213.684M24.0335 226.694C22.7299 230.975 21.4622 235.35 20.2385 239.817M16.8166 253.04C15.7541 257.4 14.7374 261.838 13.7733 266.352M11.114 279.743C10.3021 284.165 9.54352 288.652 8.84407 293.204M6.96853 306.724C6.41553 311.192 5.92178 315.716 5.49232 320.294M4.41997 333.904C4.13306 338.403 3.91009 342.95 3.75556 347.544M3.50258 361.204C3.4873 365.719 3.53974 370.277 3.66393 374.874M4.24021 388.515C4.4988 393.011 4.82744 397.544 5.22972 402.11M6.63342 415.68C7.16597 420.161 7.77072 424.674 8.45091 429.215M10.6813 442.709C11.4842 447.148 12.3604 451.613 13.3127 456.104M16.3374 469.39C16.877 471.607 17.4355 473.831 18.0132 476.06C18.2382 478.356 18.4871 480.71 18.7603 483.119M20.5763 497.361C21.2203 501.928 21.9419 506.642 22.744 511.487M25.244 525.598C26.1117 530.198 27.0476 534.891 28.0537 539.663M31.1598 553.666C32.2283 558.256 33.3598 562.903 34.556 567.597M38.2366 581.432C39.5003 585.989 40.8244 590.579 42.2103 595.191M46.4823 608.863C47.9481 613.378 49.4736 617.906 51.0601 622.437M55.9536 635.901C57.6335 640.356 59.3737 644.805 61.1752 649.242M66.7392 662.443C68.6512 666.815 70.6251 671.165 72.662 675.486M78.9623 688.351C81.1302 692.612 83.3626 696.836 85.6607 701.013M92.78 713.442C95.233 717.555 97.7541 721.613 100.345 725.606M108.38 737.464C111.152 741.376 113.996 745.215 116.914 748.969M125.971 760.067C129.095 763.708 132.296 767.253 135.577 770.694M145.752 780.776C149.253 784.051 152.838 787.206 156.508 790.234M167.852 798.977C171.736 801.766 175.709 804.414 179.772 806.911M192.242 813.945C196.476 816.124 200.801 818.142 205.218 819.99M218.636 824.974C220.906 825.714 223.198 826.409 225.513 827.06C227.865 827.756 230.181 828.425 232.46 829.068M246.416 832.802C251.273 834.028 255.952 835.129 260.46 836.113M274.629 838.935C279.616 839.827 284.367 840.567 288.899 841.171M303.256 842.704C308.378 843.108 313.174 843.324 317.672 843.386M332.098 843.034C337.351 842.692 342.109 842.135 346.445 841.446M360.564 838.495C363.048 837.853 365.355 837.197 367.513 836.56C369.429 835.993 371.645 835.241 374.104 834.332M387.048 829.091C391.064 827.357 395.348 825.43 399.773 823.373M412.371 817.356C416.54 815.313 420.73 813.212 424.849 811.099M437.201 804.605C441.524 802.273 445.637 799.989 449.407 797.816M461.313 790.574C463.573 789.094 465.497 787.744 467.013 786.56C468.997 785.009 471.159 783.382 473.442 781.712M486.633 772.471C491.153 769.423 495.75 766.426 500.122 763.667M513.914 755.34C516.715 753.747 519.136 752.453 521.013 751.56C523.456 750.396 526.17 749.043 528.954 747.595M544.391 738.829C547.535 736.829 550.081 734.992 551.513 733.56C552.671 732.402 554.651 729.87 556.983 726.701M567.097 712.336C568.976 709.588 570.687 707.049 572.013 705.06C573.813 705.176 576.399 704.907 579.223 703.916M590.657 695.078C591.934 693.236 593.078 691.078 594.013 688.56C595.209 685.341 596.472 682.409 597.791 679.756M609.091 664.445C611.849 662.169 614.681 660.726 617.513 660.06C618.994 659.711 620.734 659.029 622.667 658.242M633.004 654.653C636.481 653.864 640.159 653.622 643.841 654.637M653.048 660.312C654.223 661.516 655.38 662.923 656.513 664.56C658.663 667.666 660.395 670.632 661.801 673.445M667.985 693.105C668.761 697.689 669.127 701.08 670.513 703.06C671.496 704.463 672.714 705.276 673.993 705.951M680.821 711.658C681.341 712.805 681.753 714.236 682.013 716.06C682.281 717.932 682.643 719.581 683.079 721.048M687.936 729.924C689.143 731.294 690.38 732.427 691.513 733.56C692.313 734.36 693.636 735.865 695.379 737.866M703.042 746.57C705.441 749.237 708.101 752.12 710.94 755.054M719.204 763.185C720.621 764.503 722.06 765.8 723.513 767.06C724.981 768.332 726.622 769.925 728.42 771.774M737.684 781.78C740.538 784.933 743.609 788.338 746.865 791.859M756.261 801.734C759.413 804.933 762.687 808.125 766.059 811.217M776.421 820.076C780.052 822.941 783.765 825.604 787.534 827.963M799.591 834.284C801.723 835.173 803.865 835.937 806.013 836.56C808.759 837.355 811.384 838.189 813.895 839.05M829.222 845.168C834.811 847.726 839.66 850.31 843.908 852.702M858.27 860.843C861.232 862.349 863.762 863.334 866.013 863.56C867.716 863.73 870.013 864.291 872.714 865.101M885.788 869.525C890.042 871.03 894.51 872.61 898.836 873.999M912.158 877.536C914.772 878.003 917.103 878.212 919.013 878.06C920.814 877.915 923.155 877.969 925.938 878.143M939.791 879.359C944.064 879.765 948.723 880.19 953.63 880.527M967.507 881.149C972.071 881.228 976.73 881.168 981.395 880.898M995.202 879.409C997.497 879.032 999.771 878.585 1002.01 878.06C1004.28 877.529 1006.69 876.935 1009.25 876.27M1023.61 872.148C1028.07 870.749 1032.79 869.156 1037.74 867.337M1051.64 861.855C1056.05 859.993 1060.6 857.956 1065.26 855.728M1078.6 848.974C1082.86 846.69 1087.2 844.247 1091.59 841.631M1104.26 833.704C1108.32 831.029 1112.43 828.204 1116.56 825.22M1128.48 816.213C1132.31 813.187 1136.15 810.021 1140 806.706M1151.11 796.722C1152.91 795.035 1154.71 793.315 1156.51 791.56C1158.28 789.837 1160 788.155 1161.67 786.512M1171.89 776.372C1175.53 772.735 1178.9 769.317 1182.03 766.1M1191.98 755.713C1195.61 751.849 1198.84 748.329 1201.72 745.1M1211.1 734.171C1214.69 729.793 1217.51 726.067 1219.87 722.737M1227.72 710.68C1228.96 708.649 1230.19 706.644 1231.51 704.56C1232.36 703.223 1233.5 701.321 1234.9 698.903M1241.39 687.24C1243.29 683.738 1245.39 679.817 1247.64 675.52M1253.76 663.702C1255.69 659.935 1257.7 655.968 1259.77 651.819M1265.68 639.871C1267.57 635.997 1269.51 632 1271.47 627.891M1277.16 615.869C1279.01 611.919 1280.88 607.886 1282.77 603.779M1288.25 591.665C1290.05 587.662 1291.84 583.6 1293.64 579.489M1298.92 567.268C1300.65 563.217 1302.37 559.126 1304.08 555.003M1309.12 542.678C1310.77 538.576 1312.41 534.451 1314.03 530.308M1318.79 517.881C1320.36 513.728 1321.9 509.564 1323.41 505.397M1327.86 492.85C1328.59 490.752 1329.3 488.655 1330.01 486.56C1330.77 484.336 1331.51 482.108 1332.25 479.877M1336.59 466.463C1338 461.98 1339.39 457.489 1340.74 452.991M1344.71 439.467C1346.01 434.939 1347.27 430.41 1348.5 425.883M1352.08 412.253C1353.25 407.682 1354.38 403.117 1355.47 398.564M1358.64 384.832C1359.67 380.219 1360.66 375.621 1361.6 371.043M1364.32 357.215C1365.19 352.56 1366.02 347.931 1366.79 343.331M1369 329.417C1369.69 324.718 1370.33 320.058 1370.91 315.439M1372.52 301.441C1373 296.705 1373.42 292.022 1373.77 287.397M1374.63 273.32C1374.85 268.549 1375 263.851 1375.06 259.233M1374.98 245.146C1374.86 240.35 1374.65 235.655 1374.33 231.071M1372.98 217.038C1372.69 214.676 1372.37 212.349 1372.01 210.06C1371.63 207.605 1371.25 205.199 1370.87 202.837M1368.33 188.442C1367.39 183.497 1366.38 178.753 1365.29 174.177M1361.43 160.087C1359.94 155.364 1358.3 150.807 1356.45 146.37M1350.11 133.224C1347.8 129.036 1345.24 124.923 1342.37 120.841M1333.41 109.34C1330.37 105.79 1327.06 102.234 1323.45 98.6422M1312.78 88.6867C1309.29 85.6106 1305.56 82.4916 1301.59 79.313M1290 70.3921C1286.25 67.6097 1282.32 64.7742 1278.19 61.8756M1266.13 53.6209C1264.14 52.2816 1262.1 50.9281 1260.01 49.5596C1258.94 48.6047 1257.1 47.3292 1254.89 45.9297M1244.04 39.5618C1241.93 38.3893 1240 37.3444 1238.51 36.5596C1237.56 36.9683 1235.45 38.129 1232.22 39.8669M1219.53 46.4982C1215.76 48.4 1211.46 50.5025 1206.64 52.7451M1193.58 58.6014C1189.44 60.3858 1185.03 62.2182 1180.36 64.0748M1166.99 69.1809C1162.67 70.7641 1158.16 72.3491 1153.48 73.9215M1139.84 78.3033C1135.4 79.6679 1130.81 81.0121 1126.1 82.3258M1112.28 85.9822C1107.74 87.1218 1103.08 88.228 1098.33 89.2931M1084.34 92.2369C1079.73 93.1466 1075.03 94.0145 1070.25 94.8346M1056.13 97.0699C1053.78 97.4121 1051.4 97.7422 1049.01 98.0596C1048.58 98.5989 1048 99.428 1047.4 100.452M1045.07 105.727C1044.8 106.654 1044.6 107.608 1044.51 108.56C1044.44 109.326 1043.94 111.577 1042.91 115.176M1038.76 128.266C1037.45 132.08 1035.9 136.397 1034.08 141.182M1029.03 153.96C1027.39 157.953 1025.61 162.173 1023.67 166.608M1018.03 179.115C1016.17 183.111 1014.21 187.246 1012.13 191.512M1005.97 203.831C1003.95 207.78 1001.83 211.826 999.624 215.961M993.027 228.041C990.851 231.943 988.593 235.916 986.251 239.955M979.267 251.773C976.945 255.629 974.549 259.538 972.077 263.497M964.712 275.087C962.268 278.866 959.757 282.687 957.176 286.546M949.459 297.896C948.16 299.776 946.845 301.664 945.513 303.56C944.139 305.516 942.786 307.444 941.454 309.344M933.447 320.777C930.698 324.707 928.037 328.514 925.452 332.212M917.416 343.704C914.669 347.627 912.004 351.43 909.404 355.128M901.332 366.565C898.581 370.446 895.887 374.224 893.229 377.923M885.013 389.257C882.236 393.05 879.473 396.784 876.696 400.488M868.24 411.62C865.421 415.28 862.561 418.941 859.634 422.633M850.878 433.517C847.99 437.056 845.021 440.647 841.948 444.314M832.93 454.944C829.975 458.389 826.919 461.913 823.746 465.535M814.509 475.986C811.505 479.357 808.399 482.816 805.179 486.377M795.762 496.726C792.702 500.069 789.544 503.501 786.281 507.031M776.758 517.287C773.665 520.605 770.483 524.006 767.206 527.497M757.631 537.665C754.515 540.965 751.318 544.342 748.036 547.801M738.416 557.918C736.802 559.613 735.167 561.327 733.513 563.06L729.326 567.31M720.951 575.81L712.576 584.31M704.201 592.81L700.013 597.06C698.728 595.537 696.897 593.782 694.731 592.286M681.277 589.473C679.306 590.167 677.357 591.464 675.513 593.56C673.51 595.836 671.971 597.896 670.761 599.802M665.077 614.352C664.384 616.629 663.516 618.964 662.013 621.56C660.959 623.381 659.806 625.45 658.629 627.611M652.154 639.879C650.872 642.369 649.775 644.535 649.013 646.06C646.942 646.934 644.23 647.791 641.313 648.287M626.034 645.378C624.234 643.809 622.817 641.596 622.013 638.56C621.473 636.52 620.862 634.711 620.172 633.083M613.626 623.67C611.056 621.264 607.986 619.184 604.341 616.817M594.701 610.444C593.207 609.404 591.645 608.283 590.013 607.06C587.945 605.508 585.798 603.858 583.609 602.138M571.099 591.9C566.88 588.306 562.769 584.654 559.032 581.143M547.747 569.587C545.598 567.083 543.963 564.864 543.013 563.06C542.12 561.362 540.715 558.833 538.973 555.748M530.686 541.203C527.983 536.469 525.137 531.475 522.42 526.649M514.333 511.993C512.8 509.126 511.492 506.593 510.513 504.56C509.722 502.917 508.739 501.238 507.617 499.543M500.521 490.379C497.956 487.41 495.253 484.513 492.707 481.809M484.859 473.271C483.274 471.407 482.089 469.808 481.513 468.56C480.611 466.605 479.437 463.881 478.074 460.783M470.804 445.399C469.402 442.74 467.957 440.226 466.513 438.06C465.439 436.448 464.178 434.841 462.826 433.286M454.224 424.828C452.345 423.213 450.682 421.91 449.513 421.06C448.759 419.188 447.835 416.952 446.777 414.465M440.997 401.409C439.04 397.16 436.936 392.763 434.795 388.544M427.933 376.016C426.583 373.784 425.267 371.77 424.013 370.06C422.556 368.072 421.037 365.848 419.486 363.456M411.211 349.733C408.559 345.069 405.96 340.267 403.552 335.655M396.369 321.327C395.047 318.564 393.91 316.099 393.013 314.06C391.977 311.704 391.189 309.438 390.576 307.273M388.098 293.071C387.743 290.274 387.355 287.912 386.513 286.06C385.658 284.178 383.34 282.355 380.579 280.13M369.415 267.626C368.257 265.287 367.396 262.625 367.013 259.56C366.661 256.743 366.03 254.143 365.256 251.743M358.834 237.063C357.516 233.889 357.132 231.441 359.013 229.56C360.354 228.219 361.012 226.734 361.131 225.202M356.927 216.576C355.771 215.461 354.441 214.438 353.013 213.56C351.293 212.501 350.798 211.442 350.918 210.337M354.098 202.897C354.227 201.715 353.972 200.444 353.013 199.06C351.948 197.521 350.547 196.235 348.996 195.095M339.347 189.144C337.626 187.946 336.236 186.649 335.513 185.06C334.762 183.407 334.417 180.943 334.194 178.086M333.026 163.873C332.612 161.364 331.992 159.017 331.013 157.06C330.559 156.152 329.726 154.08 328.617 151.052M324.372 138.705C323.149 134.968 321.824 130.782 320.448 126.246M316.784 113.723C315.643 109.673 314.495 105.453 313.367 101.115M310.223 88.4556C309.23 84.2581 308.276 80 307.379 75.7219M304.891 62.9109C304.121 58.5794 303.43 54.2688 302.841 50.0212M301.358 37.0569C300.966 32.573 300.722 28.2185 300.656 24.0495",
  },
};

/* One detail's clip: in and out, two <video>s stacked. Either way starts
   from wherever the other has got to, so a change of mind mid-way turns
   straight round. Fetched when the card comes near (in first, then out).
   run() resolves "ok" at the end it's heading for, "lost" if overtaken by
   another run, "error" if the clip can't play (the detail then falls back
   to the still). */
class ClipPlayer {
  in: HTMLVideoElement | null = null;
  out: HTMLVideoElement | null = null;
  box: HTMLDivElement | null = null;
  failed = false;
  private token = 0;
  private on: HTMLVideoElement | null = null; // the one showing
  warm() {
    const a = this.in;
    const b = this.out;
    if (!a || !b || a.preload === "auto") return;
    a.preload = "auto";
    a.load();
    a.addEventListener("canplaythrough", () => b.preload !== "auto" && ((b.preload = "auto"), b.load()), { once: true });
  }
  // how far in it is, in seconds of the way in
  private at() {
    if (this.on && this.on === this.in) return this.on.currentTime;
    if (this.on && this.on === this.out) return this.on.duration - this.on.currentTime;
    return 0;
  }
  private ready(v: HTMLVideoElement) {
    if (v.readyState >= 2) return Promise.resolve(true);
    if (v.preload !== "auto") {
      v.preload = "auto";
      v.load();
    }
    return new Promise<boolean>((res) => {
      v.addEventListener("loadeddata", () => res(true), { once: true });
      v.addEventListener("error", () => res(false), { once: true });
    });
  }
  hide() {
    this.on = null;
    if (this.box) delete this.box.dataset.show;
    this.in?.removeAttribute("data-show");
    this.out?.removeAttribute("data-show");
  }
  async run(dir: 1 | -1): Promise<"ok" | "lost" | "error"> {
    const token = ++this.token;
    const v = dir === 1 ? this.in : this.out;
    const other = dir === 1 ? this.out : this.in;
    if (!v || !other || !this.box) return "error";
    if (dir === -1 && !this.on) return "ok"; // already out
    const from = this.at();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (dir === -1) return this.hide(), "ok";
    }
    if (!(await this.ready(v))) return (this.failed = true), "error";
    if (token !== this.token) return "lost";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = reduce ? v.duration : dir === 1 ? from : v.duration - from;
    if (Math.abs(v.currentTime - t) > 0.01) {
      v.currentTime = t;
      await new Promise((res) => v.addEventListener("seeked", res, { once: true }));
      if (token !== this.token) return "lost";
    }
    v.dataset.show = "";
    other.pause();
    other.removeAttribute("data-show");
    this.on = v;
    this.box.dataset.show = "";
    if (v.duration - v.currentTime < 0.02) return "ok";
    const end = new Promise<void>((res) => {
      const done = () => {
        v.removeEventListener("ended", done);
        v.removeEventListener("pause", done);
        res();
      };
      v.addEventListener("ended", done);
      v.addEventListener("pause", done);
    });
    try {
      await v.play();
    } catch {
      return token === this.token ? ((this.failed = true), this.hide(), "error") : "lost";
    }
    await end;
    return token === this.token && v.ended ? "ok" : "lost";
  }
}

/** a clip's outline on its last frame: the dashed line revealed along the
    shape (a mask, the shape's own path drawn on), then the wash */
function Outline({ id, o, on }: { id: string; o: (typeof OUTLINES)[string]; on: boolean }) {
  const [l, t, w, h] = o.box;
  return (
    <svg
      className={`fvc-outline ${on ? "is-on" : ""}`}
      viewBox={`0 0 ${o.w} ${o.h}`}
      preserveAspectRatio="none"
      style={{ left: `${l * 100}%`, top: `${t * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
      aria-hidden="true"
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-20} y={-20} width={o.w + 40} height={o.h + 40}>
          <path className="fvc-outline__trim" d={o.fill} pathLength={1} />
        </mask>
      </defs>
      <path className="fvc-outline__fill" d={o.fill} />
      <path className="fvc-outline__line" d={o.dash} mask={`url(#${id})`} />
    </svg>
  );
}

export function MarkCard() {
  const [on, setOn] = useState<number | null>(null);
  const [aim, setAim] = useState<number | null>(null); // where the zoom is centred (kept while pulling out)
  const [landed, setLanded] = useState<number | null>(null); // a clip that has reached its macro
  const [typed, setTyped] = useState(0); // how much of the comment is typed
  const [players] = useState(() => new Map<number, ClipPlayer>());
  const frame = useRef<HTMLDivElement>(null);
  const typeT = useRef(0);
  const seq = useRef(0); // each pick; anything still waiting on an older one gives up
  const leaving = useRef<{ n: number; done: Promise<void> } | null>(null); // the detail pulling out
  const player = (n: number) => {
    let p = players.get(n);
    if (!p) players.set(n, (p = new ClipPlayer()));
    return p;
  };
  const byN = (n: number) => DETAILS.find((x) => x.n === n) ?? DETAILS[0];
  // the detail's clip, if it has one that plays
  const clipOf = (n: number | null) => (n !== null && byN(n).clip && !player(n).failed ? player(n) : null);
  useEffect(() => () => window.clearTimeout(typeT.current), []);
  // the clips load when the card comes within a screen of view
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        players.forEach((p) => p.warm());
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [players]);
  // type a detail's comment out, a character at a time (all at once, reduced motion)
  const type = (n: number, after: number) => {
    window.clearTimeout(typeT.current);
    const len = byN(n).note.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTyped(len);
    setTyped(0);
    const step = (i: number) => {
      setTyped(i);
      if (i < len) typeT.current = window.setTimeout(() => step(i + 1), TYPE_MS);
    };
    typeT.current = window.setTimeout(() => step(1), after);
  };
  const go = async (n: number) => {
    const my = seq.current;
    const p = clipOf(n);
    // wait for the one pulling out, unless it's this one: then turn round
    const l = leaving.current;
    if (l && !(p && l.n === n)) {
      await l.done;
      if (my !== seq.current) return;
    }
    setAim(n);
    setOn(n);
    setLanded(null);
    if (!p) return type(n, TYPE_AFTER_MS);
    const r = await p.run(1);
    if (my !== seq.current) return;
    if (r === "ok") {
      setLanded(n);
      type(n, 0);
    } else if (r === "error") type(n, TYPE_AFTER_MS); // on the still instead
  };
  // pull out of the detail in hand, if any
  const out = () => {
    const m = on;
    if (m === null) return;
    window.clearTimeout(typeT.current);
    setOn(null);
    setLanded(null);
    const p = clipOf(m);
    const done: Promise<void> = p
      ? p.run(-1).then((r) => {
          if (r === "ok") p.hide();
        })
      : new Promise((res) => window.setTimeout(res, OUT_MS));
    leaving.current = { n: m, done };
    done.then(() => {
      if (leaving.current?.done === done) leaving.current = null;
    });
  };
  const pick = (n: number | null) => {
    seq.current++;
    if (n === null || n === on) return out();
    out();
    void go(n);
  };
  const a = byN(on ?? aim ?? 1);
  const film = clipOf(on) !== null; // pushed in on a clip, not the still
  const still = on !== null && !film; // pushed in on the still
  const said = on !== null && (!film || landed === on); // the comment shows
  const done = typed >= a.note.length;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <div className="fvc-mark">
      <div ref={frame} className={`fvc-mark__frame ${on ? "is-in" : ""}`}>
        <div
          className="fvc-mark__fig"
          style={{ "--fvc-z": still ? a.z : 1, "--fvc-on": still ? 1 : 0, "--ax": a.at[0], "--ay": a.at[1], "--cy": 0.4, transformOrigin: `${a.at[0] * 100}% ${a.at[1] * 100}%` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lab/features/ref-tweed.webp" alt="The reference: a cream tweed suit, marked up" draggable={false} loading="lazy" decoding="async" />
          <svg viewBox="0 0 1493 2000" aria-hidden="true">
            {DETAILS.map((x) => x.sel && <g key={x.n} className={`fvc-sel ${still && on === x.n ? "is-on" : ""}`}>{x.sel}</g>)}
            <g className={`fvc-hem ${on === HEM ? "is-on" : ""}`}>
              <path className="fvc-hem__now" d="M520 1362 L1052 1338" />
              <path className="fvc-hem__new" d="M520 1442 L1052 1418" />
              <path className="fvc-hem__arrow" d="M972 1346 V1414 M952 1394 L972 1416 L992 1394" />
            </g>
          </svg>
          <span className={`fvc-chip ${on === HEM ? "is-on" : ""}`} style={{ left: "65%", top: "74.5%" }}>
            +5 cm
          </span>
          {DETAILS.map((x) => (
            <button
              key={x.n}
              type="button"
              className={`fvc-pin ${on === x.n && still ? "is-on" : ""} ${on && (film || on !== x.n) ? "is-away" : ""}`}
              style={{ left: `${x.pin[0] * 100}%`, top: `${x.pin[1] * 100}%` }}
              onClick={() => pick(x.n)}
              aria-label={`Note ${x.n}, ${x.tab}: ${x.note}`}
              aria-pressed={on === x.n}
            >
              {x.n}
            </button>
          ))}
        </div>
        {/* the clips, over the still, framed as it is; each shows only while it plays or has landed */}
        {DETAILS.map(
          (x) =>
            x.clip && (
              <div
                key={x.n}
                ref={(el) => {
                  player(x.n).box = el;
                }}
                className={`fvc-clip ${landed === x.n ? "is-landed" : ""}`}
                aria-hidden="true"
              >
                <video
                  ref={(el) => {
                    player(x.n).in = el;
                  }}
                  src={clipSrc(x.clip, "in.mp4")}
                  muted
                  playsInline
                  preload="none"
                  disablePictureInPicture
                />
                <video
                  ref={(el) => {
                    player(x.n).out = el;
                  }}
                  src={clipSrc(x.clip, "out.mp4")}
                  muted
                  playsInline
                  preload="none"
                  disablePictureInPicture
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="fvc-clip__end" src={clipSrc(x.clip, "end.webp")} alt="" loading="lazy" decoding="async" />
                {OUTLINES[x.clip] && <Outline id={`${uid}-o${x.n}`} o={OUTLINES[x.clip]} on={landed === x.n} />}
              </div>
            ),
        )}
        {/* back out to the whole photo */}
        <button type="button" className="fvc-mark__out" onClick={() => pick(null)} tabIndex={on ? 0 : -1} aria-label="Back to the whole photo" title="Back to the whole photo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
        </button>
        {/* the note, typed out over the picture once it has pushed in */}
        <div className={`fvc-comment ${said ? "is-on" : ""} ${film ? "is-now" : ""}`}>
          {/* the whole comment holds the room; the typed part sits over it */}
          <p className="fvc-comment__text" aria-hidden="true">
            <span className="fvc-comment__ghost">{a.note}</span>
            <span className="fvc-comment__typed">
              {a.note.slice(0, typed)}
              <span className={`fvc-comment__caret ${done ? "is-done" : ""}`} />
            </span>
          </p>
        </div>
      </div>
      {/* the notes, by name: each pushes in to its detail */}
      <div className="fvc-tabs" role="group" aria-label="Notes">
        {DETAILS.map((x) => (
          <button key={x.n} type="button" className={on === x.n ? "is-on" : ""} onClick={() => pick(x.n)} aria-pressed={on === x.n} aria-label={`${x.tab}: ${x.note}`}>
            <span className="fvc-tabs__n" aria-hidden="true">
              {x.n}
            </span>
            {x.tab}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Refine in plain words ------------------------------------------------
   A chat: the pattern it's about at the top, your message, Venty's answer
   with what it changed, and the composer. */
export function RefineCard() {
  return (
    <div className="fvc-chat">
      <header className="fvc-chat__head">
        <span className="fvc-chat__file">Slip dress</span>
        <span className="fvc-tag">v2 → v3</span>
      </header>
      <div className="fvc-chat__log">
        <p className="fvc-bubble is-me">5 cm longer, wider straps.</p>
        <div className="fvc-reply">
          <span className="fvc-avatar">
            <Bird size={12} />
          </span>
          <div className="fvc-reply__body">
            <p className="fvc-bubble">Done. Four pieces redrafted.</p>
            <p className="fvc-diff">
              <span>Hem +5 cm</span>
              <span>Straps 3 cm</span>
            </p>
          </div>
        </div>
      </div>
      <div className="fvc-compose">
        <span>Ask for a change…</span>
        <span className="fvc-compose__send" aria-hidden="true">
          <Icon d={SEND} size={14} weight={2} />
        </span>
      </div>
    </div>
  );
}

/* ---- See it on your body ---------------------------------------------------
   Her turn, feathered into the card; drag her, or the slider under her (a
   plain track, filled cornflower up to where she is). "Drag to turn" sits
   there until you do, and keeps out of the way while you are. */
export function TurnCard() {
  const box = useRef<HTMLDivElement>(null);
  const [img, set] = useTurn(box);
  const [deg, setDeg] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; d: number } | null>(null);
  const to = (d: number) => {
    const v = Math.round(((d % 360) + 360) % 360);
    setDeg(v);
    set(v);
  };
  const end = () => {
    drag.current = null;
    setDragging(false);
  };
  // the three views to jump to, and which one she is nearest
  const VIEWS: [string, number][] = [
    ["Front", 0],
    ["Side", 90],
    ["Back", 180],
  ];
  const near = (v: number) => Math.min(Math.abs(deg - v), 360 - Math.abs(deg - v)) < 12;
  return (
    <div ref={box} className={`fvc-turn ${dragging ? "is-dragging" : ""}`}>
      <div
        className="fvc-turn__stage"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, d: deg };
          setDragging(true);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
        }}
        onPointerMove={(e) => drag.current && to(drag.current.d + (e.clientX - drag.current.x) * 0.7)}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={FIRST_FRAME} alt="The model in the garment; drag or use the slider to turn her" draggable={false} loading="lazy" decoding="async" />
        <span className="fvc-turn__hint" aria-hidden="true">
          Drag to turn
        </span>
      </div>
      <div className="fvc-turn__panel">
        <p className="fvc-label">View</p>
        <div className="fvc-turn__views" role="group" aria-label="Views">
          {VIEWS.map(([k, v]) => (
            <button key={k} type="button" aria-pressed={near(v)} onClick={() => to(v)}>
              {k}
            </button>
          ))}
        </div>
        <p className="fvc-turn__deg" aria-hidden="true">
          {deg}
          <span>°</span>
        </p>
        <input
          type="range"
          className="fvc-slider"
          min={0}
          max={359}
          value={deg}
          onChange={(e) => to(+e.target.value)}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          style={{ "--v": `${(deg / 359) * 100}%` } as CSSProperties}
          aria-label="Turn her"
          aria-valuetext={`${deg} degrees`}
        />
      </div>
    </div>
  );
}

/* ---- Body library -------------------------------------------------------------
   The person you're drafting for on a dress form drawn from her own
   measurements (switch person and the form reshapes to them), her three
   measurements drawn across it and listed beside it, the date they were
   taken; the others saved, as avatars to switch to. A photo can take the
   form's place later. */
const BODIES = [
  { id: "natalia", name: "Natalia", when: "Measured 12 Oct", m: [92, 74, 98] },
  { id: "mei", name: "Mei", when: "Measured 3 Sep", m: [86, 68, 92] },
  { id: "amara", name: "Amara", when: "Measured 28 Aug", m: [101, 86, 106] },
];
/** a dress form, 100 x 160, from bust, waist and hip in cm. Half-widths
    grow from Natalia's (92, 74, 98) at a little more than true scale, so
    the difference between people reads at this size */
function formOf([bust, waist, hip]: number[]) {
  const c = 50;
  const B = 33 + (bust - 92) * 0.9;
  const W = 26.6 + (waist - 74) * 0.9;
  const H = 35.3 + (hip - 98) * 0.9;
  const S = B * 0.9;
  const p = (n: number) => n.toFixed(1);
  return {
    d: `M${p(c - 6)} 8 H${p(c + 6)} V15 Q${p(c + S * 0.55)} 17 ${p(c + S)} 30 Q${p(c + B + 2)} 42 ${p(c + B)} 52 Q${p(c + B - 1)} 72 ${p(c + W)} 88 Q${p(c + W)} 102 ${p(c + H)} 118 Q${p(c + H + 1)} 129 ${p(c + H - 5)} 135 H${p(c - H + 5)} Q${p(c - H - 1)} 129 ${p(c - H)} 118 Q${p(c - W)} 102 ${p(c - W)} 88 Q${p(c - B + 1)} 72 ${p(c - B)} 52 Q${p(c - B - 2)} 42 ${p(c - S)} 30 Q${p(c - S * 0.55)} 17 ${p(c - 6)} 15 Z`,
    lines: [
      { y: 52, r: B + 4 },
      { y: 88, r: W + 4 },
      { y: 118, r: H + 4 },
    ].map(({ y, r }) => `M${p(c - r)} ${y} H${p(c + r)} M${p(c - r)} ${y - 3} V${y + 3} M${p(c + r)} ${y - 3} V${y + 3}`),
  };
}
export function BodiesCard() {
  const [at, setAt] = useState(0);
  const b = BODIES[at];
  const form = formOf(b.m);
  // the path in CSS too, so the form reshapes smoothly where the browser can
  const d = (s: string) => ({ d: `path("${s}")` }) as CSSProperties;
  return (
    <div className="fvc-bodies">
      <svg viewBox="0 0 100 160" className="fvc-form" aria-hidden="true">
        <path d={form.d} style={d(form.d)} className="fvc-form__body" />
        <path d="M50 135 V152 M36 154 H64" className="fvc-form__stand" />
        {form.lines.map((l, i) => (
          <path key={i} d={l} style={d(l)} className="fvc-form__m" />
        ))}
      </svg>
      <div className="fvc-bodies__side">
        <p className="fvc-person">
          {b.name}
          <span>{b.when}</span>
        </p>
        <dl className="fvc-measures">
          {["Bust", "Waist", "Hip"].map((k, i) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>
                {b.m[i]}
                <small> cm</small>
              </dd>
            </div>
          ))}
        </dl>
        <div className="fvc-people" role="group" aria-label="Saved bodies">
          {BODIES.map((p, i) => (
            <button key={p.id} type="button" aria-pressed={i === at} onClick={() => setAt(i)} title={p.name}>
              {p.name[0]}
            </button>
          ))}
          <span className="fvc-people__add" aria-hidden="true">
            <Icon d={I.plus} size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Arrange and print ----------------------------------------------------------
   The pieces on the sheet, as printed tissue: drag them about, turn the one
   you've picked 15° either way, or let Venty pack them. On A4 the sheet is
   the grid of home pages it tiles across, and the count says how many
   pages the pieces touch (pack them and it drops); on A0 it is one sheet. */
type Piece = { id: string; label: string; d: string; w: number; h: number; x: number; y: number; r: number };
const SHEET = { w: 112, h: 82, cols: 4, rows: 3 };
const TILE = { w: SHEET.w / SHEET.cols, h: SHEET.h / SHEET.rows };
const START: Piece[] = [
  { id: "front", label: "FRONT", d: "M6 0 L15 0 L17 6 Q21 8 24 11 L22.5 30 L1.5 30 L0 11 Q3 8 6 6 Z", w: 24, h: 30, x: 4, y: 5, r: -15 },
  { id: "back", label: "BACK", d: "M3 0 Q11 2.6 19 0 L22 30 L0 30 Z", w: 22, h: 30, x: 62, y: 9, r: 10 },
  { id: "skirt", label: "SKIRT", d: "M6 0 L18 0 L24 40 L0 40 Z", w: 24, h: 40, x: 34, y: 37, r: 0 },
  { id: "sleeve", label: "SLEEVE", d: "M0 18 Q3.5 5 15 0 Q26.5 5 30 18 Z", w: 30, h: 18, x: 77, y: 56, r: -30 },
  { id: "facing", label: "FACING", d: "M0 3 Q9 -1 18 3 L18 7 Q9 3 0 7 Z", w: 18, h: 7, x: 88, y: 4, r: 0 },
];
// packed: on the six home pages top left (three across, two down), none touching
const PACKED: Record<string, Pick<Piece, "x" | "y" | "r">> = {
  front: { x: 1, y: 1, r: 0 },
  back: { x: 27, y: 1, r: 0 },
  skirt: { x: 51, y: 1, r: 0 },
  sleeve: { x: 1, y: 33, r: 0 },
  facing: { x: 33, y: 40, r: 0 },
};
/** a piece's box on the sheet at any angle (it turns about its middle) */
const box = (p: Piece) => {
  const a = (p.r * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const sn = Math.abs(Math.sin(a));
  const w = p.w * c + p.h * sn;
  const h = p.w * sn + p.h * c;
  return { x: p.x + p.w / 2 - w / 2, y: p.y + p.h / 2 - h / 2, w, h };
};
const clampTo = (p: Piece): Piece => {
  const b = box(p);
  const dx = Math.max(0, -b.x) - Math.max(0, b.x + b.w - SHEET.w);
  const dy = Math.max(0, -b.y) - Math.max(0, b.y + b.h - SHEET.h);
  return { ...p, x: p.x + dx, y: p.y + dy };
};
const pagesOf = (ps: Piece[]) => {
  let n = 0;
  for (let r = 0; r < SHEET.rows; r++)
    for (let c = 0; c < SHEET.cols; c++) {
      const tx = c * TILE.w;
      const ty = r * TILE.h;
      if (ps.some((p) => ((b) => b.x < tx + TILE.w && b.x + b.w > tx && b.y < ty + TILE.h && b.y + b.h > ty)(box(p)))) n++;
    }
  return n;
};
const norm = (r: number) => ((((r + 180) % 360) + 360) % 360) - 180;
export function PrintCard() {
  const [a0, setA0] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>(START);
  const [sel, setSel] = useState("skirt");
  const [dragging, setDragging] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const grab = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const at = (e: RPointerEvent) => {
    const m = svg.current!.getScreenCTM()!.inverse();
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    return { x: pt.x, y: pt.y };
  };
  const turn = (by: number) => setPieces((l) => l.map((p) => (p.id === sel ? clampTo({ ...p, r: norm(p.r + by) }) : p)));
  const picked = pieces.find((p) => p.id === sel)!;
  const pages = pagesOf(pieces);
  const stop = () => {
    grab.current = null;
    setDragging(false);
  };
  return (
    <div className="fvc-arrange">
      <div className="fvc-arrange__canvas">
        <svg
          ref={svg}
          viewBox={`-2 -2 ${SHEET.w + 4} ${SHEET.h + 4}`}
          className={dragging ? "is-dragging" : ""}
          onPointerMove={(e) => {
            const g = grab.current;
            if (!g) return;
            const { x, y } = at(e);
            setPieces((l) => l.map((p) => (p.id === g.id ? clampTo({ ...p, x: x - g.dx, y: y - g.dy }) : p)));
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
        >
          <rect x="0" y="0" width={SHEET.w} height={SHEET.h} rx="1.2" className="fvc-sheet" />
          {!a0 &&
            Array.from({ length: SHEET.rows * SHEET.cols }, (_, i) => {
              const x = (i % SHEET.cols) * TILE.w;
              const y = Math.floor(i / SHEET.cols) * TILE.h;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={TILE.w} height={TILE.h} className="fvc-page" />
                  <text x={x + 1.4} y={y + 3.6} className="fvc-page__no">
                    {i + 1}
                  </text>
                </g>
              );
            })}
          {pieces.map((p) => (
            <g
              key={p.id}
              className={`fvc-pc ${sel === p.id ? "is-sel" : ""}`}
              style={{ transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg)`, transformOrigin: `${p.w / 2}px ${p.h / 2}px` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                const { x, y } = at(e);
                grab.current = { id: p.id, dx: x - p.x, dy: y - p.y };
                setSel(p.id);
                setDragging(true);
                try {
                  svg.current!.setPointerCapture(e.pointerId);
                } catch {}
              }}
            >
              <path d={p.d} className="fvc-pc__paper" />
              <path d={p.d} className="fvc-pc__seam" transform={`translate(${p.w / 2} ${p.h / 2}) scale(0.86) translate(${-p.w / 2} ${-p.h / 2})`} />
              <path d={`M${p.w / 2} ${p.h * 0.25} V${p.h * 0.75} M${p.w / 2 - 1.2} ${p.h * 0.25 + 1.6} L${p.w / 2} ${p.h * 0.25} L${p.w / 2 + 1.2} ${p.h * 0.25 + 1.6}`} className="fvc-pc__grain" />
              <text x={p.w / 2 + 1.6} y={p.h / 2} className="fvc-pc__t">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="fvc-arrange__panel">
        <div className="fvc-seg" role="group" aria-label="Paper">
          <button type="button" aria-pressed={!a0} onClick={() => setA0(false)}>
            <b>A4</b> At home
          </button>
          <button type="button" aria-pressed={a0} onClick={() => setA0(true)}>
            <b>A0</b> Print shop
          </button>
        </div>
        <div className="fvc-count">
          <b>{a0 ? "1" : pages}</b>
          <span>{a0 ? "sheet" : `of ${SHEET.rows * SHEET.cols} pages`}</span>
        </div>
        <div className="fvc-picked">
          <span className="fvc-picked__name">
            {picked.label.toLowerCase()}
            <small>{Math.round(picked.r)}°</small>
          </span>
          <button type="button" className="fvc-iconbtn" onClick={() => turn(-15)} aria-label="Turn the piece 15 degrees left" title="Turn left">
            <Icon d={TURN_L} size={15} />
          </button>
          <button type="button" className="fvc-iconbtn" onClick={() => turn(15)} aria-label="Turn the piece 15 degrees right" title="Turn right">
            <Icon d={TURN_R} size={15} />
          </button>
        </div>
        <button type="button" className="fvc-ghost is-primary" onClick={() => setPieces((l) => l.map((p) => clampTo({ ...p, ...PACKED[p.id] })))}>
          <Icon d={SPARK} size={14} /> Pack the pieces
        </button>
      </div>
    </div>
  );
}


/* ---- Pattern library, on the phone ------------------------------------------- */
type Row = { id: number; name: string; who: string; status: "Printed" | "Fitting" | "Draft"; g: string; drafting?: boolean };

// the garments, flat (24 x 24 sketches)
const G: Record<string, string> = {
  dress: "M9 3h6l1 5-2 1 3 12H7l3-12-2-1z",
  skirt: "M7 4h10l3 16H4z",
  shirt: "M8 3l4 2 4-2 4 3-2 4-2-1v11H8V9L6 10 4 6z",
  trousers: "M7 3h10l1 18h-4l-2-11-2 11H6z",
  top: "M8 4l4 1 4-1 3 4-3 2v10H8V10L5 8z",
  jacket: "M8 3l4 3 4-3 4 4-2 3v11H6V10L4 7z",
};
const SEED: Row[] = [
  { id: 1, name: "Flutter midi dress", who: "Natalia", status: "Printed", g: "dress" },
  { id: 2, name: "Bias slip skirt", who: "Natalia", status: "Fitting", g: "skirt" },
  { id: 3, name: "Camp collar shirt", who: "Mei", status: "Draft", g: "shirt" },
  { id: 4, name: "Wide-leg trousers", who: "Amara", status: "Printed", g: "trousers" },
  { id: 5, name: "Wrap top", who: "Mei", status: "Fitting", g: "top" },
];
// what drafts in, in turn
const NEXT = [
  { name: "Cropped puffer", who: "Natalia", g: "jacket" },
  { name: "Halter gown", who: "Amara", g: "dress" },
  { name: "Pleated midi skirt", who: "Mei", g: "skirt" },
];

function PhoneBird({ size = 16 }: { size?: number }) {
  const b = MARK_BOUNDS;
  return (
    <svg width={size} height={size} viewBox={`${b.x} ${b.y - (b.width - b.height) / 2} ${b.width} ${b.width}`} fill="currentColor" aria-hidden="true">
      <path d={MARK} />
    </svg>
  );
}

/** the device: a titanium frame (its antenna bands, the buttons on its
    sides), the black border round the glass, the island, a sheen across
    the glass; the screen is its child */
function Device({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`ftp ${className}`} aria-hidden={className.includes("is-back") || undefined}>
      <span className="ftp__btn is-l1" />
      <span className="ftp__btn is-l2" />
      <span className="ftp__btn is-l3" />
      <span className="ftp__btn is-r1" />
      <span className="ftp__band is-tl" />
      <span className="ftp__band is-tr" />
      <span className="ftp__band is-bl" />
      <span className="ftp__band is-br" />
      <div className="ftp__glass">
        <div className="ftp__screen">
          <span className="ftp__island" />
          {children}
        </div>
        <span className="ftp__sheen" />
      </div>
    </div>
  );
}

/** a phone behind: the same screen in blocks */
function Ghost({ side }: { side: "l" | "r" }) {
  return (
    <Device className={`is-back is-${side}`}>
      <div className="ftp__ghost">
        <div className="ftp__ghost-head">
          <span className="is-dot" />
          <span className="is-bar" />
          <span className="is-dot" />
        </div>
        <span className="ftp__ghost-search" />
        <ul>
          {[52, 69, 56, 73, 60].map((w, i) => (
            <li key={i}>
              <span className="is-thumb" />
              <span className="is-lines">
                <span style={{ width: `${w}%` }} />
                <span style={{ width: `${w + 14}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Device>
  );
}

export function PhoneCard() {
  const root = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>(SEED);
  const [step, setStep] = useState(0);
  const next = useRef(0);
  const uid = useRef(100);

  // while on screen: a new pattern drafts in every few seconds
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let iv = 0;
    const timers: number[] = [];
    const tick = () => {
      const n = NEXT[next.current++ % NEXT.length];
      const id = uid.current++;
      // the ones before move along: the last new one goes to fitting, the one fitting gets printed
      const along = (r: Row, i: number): Row => (i === 0 ? { ...r, status: "Fitting" } : i === 1 && r.status === "Fitting" ? { ...r, status: "Printed" } : r);
      setRows((l) => [{ id, ...n, status: "Draft" as const, drafting: true }, ...l.map(along)].slice(0, 6));
      setStep((s) => s + 1);
      timers.push(window.setTimeout(() => setRows((l) => l.map((r) => (r.id === id ? { ...r, drafting: false } : r))), 2200));
    };
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(iv);
      if (e.isIntersecting) iv = window.setInterval(tick, 4200);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div ref={root} className="ftp-stage">
      <span className="ftp-dots" aria-hidden="true" />
      <span className="ftp-glow" aria-hidden="true" />
      <Ghost side="l" />
      <Ghost side="r" />
      <Device className="is-front">
        <div className="ftp__status">
          <span>9:41</span>
          <span className="ftp__status-icons" aria-hidden="true">
            <svg width="15" height="11" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M2 6.8a15 15 0 0 1 20 0M5 10.9a10 10 0 0 1 14 0M8.5 14.4a5 5 0 0 1 7 0M12 17.5h.01" />
            </svg>
            <span className="ftp__battery">
              <span />
            </span>
          </span>
        </div>
        <div className="ftp__head">
          <span className="ftp__logo">
            <PhoneBird size={15} />
          </span>
          <span className="ftp__title">Patterns</span>
          <span className="ftp__plus" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </div>
        <div className="ftp__search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          Search patterns
        </div>
        <div className="ftp__sub">
          <span>Recent</span>
          <span className="is-muted">Sort by · Latest</span>
        </div>
        <ul key={step} className={`ftp__list ${step ? "is-shifting" : ""}`}>
          {rows.map((r, i) => (
            <li key={r.id} className={`ftp__row ${r.drafting ? "is-drafting" : ""} ${i === 0 && step ? "is-new" : ""}`}>
              <span className="ftp__thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
                  <path d={G[r.g]} />
                </svg>
              </span>
              <span className="ftp__text">
                <span className="ftp__name">{r.name}</span>
                <span className="ftp__who">{r.drafting ? "Drafting for " + r.who + "…" : r.who}</span>
                {r.drafting && <span className="ftp__bar" />}
              </span>
              <span className="ftp__state">
                <span className={`ftp__dot is-${r.status.toLowerCase()}`} />
                {r.drafting ? "" : r.status}
              </span>
            </li>
          ))}
        </ul>
        <span className="ftp__home" aria-hidden="true" />
      </Device>
    </div>
  );
}
