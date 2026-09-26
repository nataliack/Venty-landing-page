const colours = [
  { name: "ink", hex: "#121524" },
  { name: "navy", hex: "#384C65" },
  { name: "steel", hex: "#485F88" },
  { name: "periwinkle", hex: "#9DACCD" },
  { name: "mist", hex: "#C0C8DB" },
  { name: "cornflower", hex: "#687EF5" },
  { name: "cloud", hex: "#EFF4FF" },
];

export default function Styleguide() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-medium">Colours</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {colours.map((c) => (
          <div key={c.name}>
            <div className="h-24 rounded-lg" style={{ background: c.hex }} />
            <p className="mt-2 font-mono text-sm">{c.name}</p>
            <p className="font-mono text-xs opacity-60">{c.hex}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
