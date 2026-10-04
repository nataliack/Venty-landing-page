import { LogoMark, Wordmark } from "./Logo";

const cols = [
  {
    h: "Venty",
    items: [
      ["Photo to pattern", "#photo"],
      ["How it works", "#how"],
      ["Features", "#features"],
      ["FAQ", "#faq"],
    ],
  },
  { h: "About", items: [["Meet the maker", "#maker"], ["Contact", "#"]] },
  { h: "Legal", items: [["Privacy", "#"], ["Terms", "#"], ["Accessibility", "#"]] },
];

export function Footer() {
  return (
    <footer className="relative bg-night px-5 pb-8 pt-16 text-cloud md:px-10">
      <div className="ticks w-full text-cloud" />
      <div className="mt-12 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <LogoMark className="h-10 w-auto text-cornflower" />
          <p className="body-lg mt-6 max-w-xs text-periwinkle">Sewing patterns drafted to your body.</p>
        </div>
        {cols.map((c) => (
          <nav key={c.h} aria-label={c.h} className="md:col-span-2">
            <p className="eyebrow text-steel">{c.h}</p>
            <ul className="mt-5 space-y-3">
              {c.items.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="text-periwinkle transition-colors hover:text-cornflower">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mt-[10vh]">
        <Wordmark className="w-full text-cloud" />
      </div>
      <div className="mt-8 flex flex-col gap-4 border-t border-cloud/10 pt-6 text-sm text-steel md:flex-row md:items-center md:justify-between">
        <p>Brisbane, Australia. A QUT capstone project.</p>
        <p>© {new Date().getFullYear()} Venty</p>
      </div>
    </footer>
  );
}
