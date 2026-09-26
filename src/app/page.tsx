import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Manifesto } from "@/components/Manifesto";
import { Steps } from "@/components/Steps";
import { Measure } from "@/components/Measure";
import { Sizes } from "@/components/Sizes";
import { Features } from "@/components/Features";
import { Cta } from "@/components/Cta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Manifesto />
        <Steps />
        <Measure />
        <Sizes />
        <Features />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
