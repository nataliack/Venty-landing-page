"""
Copy the web render into the site. The page plays every second rendered frame
(bench_001, bench_003, ...) as public/workbench/f_001.webp, f_002.webp, ...

  python tools/workbench/publish.py
"""
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "render", "landscape", "web")
DST = os.path.abspath(os.path.join(HERE, "..", "..", "public", "workbench"))
os.makedirs(DST, exist_ok=True)

n = 0
for name in sorted(os.listdir(SRC)):
    m = re.fullmatch(r"bench_(\d{3})\.webp", name)
    if not m or int(m.group(1)) % 2 == 0:
        continue
    i = (int(m.group(1)) - 1) // 2 + 1
    shutil.copyfile(os.path.join(SRC, name), os.path.join(DST, f"f_{i:03d}.webp"))
    n += 1
print(f"published {n} frames to {DST}")
