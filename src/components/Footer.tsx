import { LogoMark } from "./Logo";

const cols = [
  { h: "Product", items: ["How it works", "Measure", "Inside", "Pricing"] },
  { h: "Studio", items: ["About", "Journal", "Contact"] },
  { h: "Legal", items: ["Privacy", "Terms", "Accessibility"] },
];

export function Footer() {
  return (
    <footer className="relative px-5 pb-8 pt-10 md:px-10">
      <div className="ticks w-full text-fg" />
      <div className="mt-12 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <LogoMark className="h-10 w-auto text-fg" />
          <p className="body-lg mt-6 max-w-xs text-muted">
            Sewing patterns drafted to your body, not an average one.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.h} className="md:col-span-2">
            <p className="eyebrow text-faint">{c.h}</p>
            <ul className="mt-5 space-y-3">
              {c.items.map((i) => (
                <li key={i}>
                  <a href="#" className="text-muted transition-colors hover:text-cornflower">
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="md:col-span-1" />
      </div>
      <div className="mt-20 flex flex-col gap-4 border-t border-line pt-6 text-sm text-faint md:flex-row md:items-center md:justify-between">
        <p>Brisbane, Australia. A QUT capstone project.</p>
        <p>© {new Date().getFullYear()} Venty</p>
      </div>
    </footer>
  );
}
