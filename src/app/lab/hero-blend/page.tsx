import Link from "next/link";
import { Hero } from "@/components/Hero";

/* The live hero, with the player's blend between frames on (as the site had
   it) or off, to judge by eye whether a slow scroll needs it. Only the hero:
   no loader, so it opens at once. The switch reloads the page, so each mode
   starts fresh at the top. Embedded in the lab as an experiment (frame). */

export default async function HeroBlend({ searchParams }: { searchParams: Promise<{ blend?: string }> }) {
  const off = (await searchParams).blend === "off";
  return (
    <>
      <main>
        <Hero key={off ? "off" : "on"} blend={!off} />
        {/* room to scroll past the hero's end */}
        <div className="h-[100svh] bg-[var(--night)]" />
      </main>
      <nav className="lab-blend" aria-label="Blend between frames">
        <span>Blend between frames</span>
        <Link href="/lab/hero-blend" aria-current={off ? undefined : "true"} className={off ? "" : "is-on"}>
          On
        </Link>
        <Link href="/lab/hero-blend?blend=off" aria-current={off ? "true" : undefined} className={off ? "is-on" : ""}>
          Off
        </Link>
      </nav>
    </>
  );
}
