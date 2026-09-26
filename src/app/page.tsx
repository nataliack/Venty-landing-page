import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-subtle">Venty</p>
      <h1 className="max-w-2xl text-4xl font-medium leading-tight md:text-6xl">
        Sewing patterns drafted to your body, not an average one.
      </h1>
      <p className="max-w-xl text-muted">
        Describe the garment you can see in your head. Venty drafts a printable
        pattern to your exact measurements and shows it on a 3D model of you.
      </p>
      <Link
        href="/styleguide"
        className="mt-6 rounded-full bg-accent px-6 py-3 text-lg font-medium text-accent-foreground transition hover:brightness-110"
      >
        View styleguide
      </Link>
    </main>
  );
}
