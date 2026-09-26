const palette = [
  { name: "ink", hex: "#121524", use: "Darkest. Hero backgrounds, headlines on light." },
  { name: "navy", hex: "#384C65", use: "Deep blue. Secondary text on light, panels on dark." },
  { name: "steel", hex: "#485F88", use: "Mid blue. Captions, icons, quiet UI." },
  { name: "periwinkle", hex: "#9DACCD", use: "Soft blue. Muted text on dark, dividers on light." },
  { name: "mist", hex: "#C0C8DB", use: "Pale blue-grey. Borders and subtle fills." },
  { name: "violet", hex: "#815AFF", use: "The accent. Buttons, links, highlights. Large text only." },
  { name: "cloud", hex: "#EFF4FF", use: "Lightest. Page background, text on dark." },
];

const roles = [
  { name: "background", cls: "bg-background", note: "Page or section background" },
  { name: "foreground", cls: "bg-foreground", note: "Primary text" },
  { name: "muted", cls: "bg-muted", note: "Secondary text" },
  { name: "subtle", cls: "bg-subtle", note: "Captions, labels, icons" },
  { name: "line", cls: "bg-line", note: "Borders and dividers" },
  { name: "surface", cls: "bg-surface", note: "Cards and panels" },
  { name: "surface-2", cls: "bg-surface-2", note: "Nested or hovered surfaces" },
  { name: "accent", cls: "bg-accent", note: "Buttons, links, highlights" },
];

function Roles() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {roles.map((r) => (
        <div key={r.name} className="rounded-xl border border-line bg-surface p-3">
          <div className={`h-16 rounded-lg border border-line ${r.cls}`} />
          <p className="mt-3 font-mono text-sm">{r.name}</p>
          <p className="text-xs text-muted">{r.note}</p>
        </div>
      ))}
      <div className="col-span-2 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4 md:col-span-4">
        <button className="rounded-full bg-accent px-5 py-2.5 text-lg font-medium text-accent-foreground">
          Primary button
        </button>
        <button className="rounded-full border border-line bg-surface px-5 py-2.5 text-lg font-medium text-foreground">
          Secondary button
        </button>
        <a className="text-lg text-accent underline underline-offset-4" href="#">
          Text link
        </a>
        <p className="text-muted">Muted body copy</p>
        <p className="text-sm text-subtle">Subtle caption</p>
      </div>
    </div>
  );
}

export default function Styleguide() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.3em] text-subtle">Venty</p>
      <h1 className="mt-2 text-4xl font-medium">Styleguide</h1>
      <p className="mt-2 max-w-xl text-muted">
        Colour tokens for the landing page. Raw palette first, then the
        semantic roles in light and dark.
      </p>

      <h2 className="mt-14 text-2xl font-medium">Palette</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {palette.map((c) => (
          <div key={c.name} className="rounded-xl border border-line bg-surface p-3">
            <div className="h-24 rounded-lg border border-line" style={{ background: c.hex }} />
            <p className="mt-3 font-mono text-sm">{c.name}</p>
            <p className="font-mono text-xs text-subtle">{c.hex}</p>
            <p className="mt-1 text-xs text-muted">{c.use}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 text-2xl font-medium">Roles, light</h2>
      <div className="mt-6 rounded-2xl border border-line bg-background p-6">
        <Roles />
      </div>

      <h2 className="mt-14 text-2xl font-medium">Roles, dark</h2>
      <div data-theme="dark" className="mt-6 rounded-2xl border border-line bg-background p-6 text-foreground">
        <Roles />
      </div>

      <h2 className="mt-14 text-2xl font-medium">Contrast notes</h2>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-muted">
        <li>Ink on cloud and cloud on ink: 16.5, pass everything.</li>
        <li>Navy on cloud: 8.0. Steel on cloud: 5.8. Both fine for body text.</li>
        <li>Periwinkle on ink: 8.0. Mist on ink: 10.8. Both fine for body text on dark.</li>
        <li>Violet on cloud: 3.9. Violet on ink: 4.2. Large text and UI only, never body copy.</li>
        <li>Periwinkle and mist on cloud fail for text. Use them for lines and fills only.</li>
      </ul>
    </main>
  );
}
