import { SectionNav } from "@/components/SectionNav";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Manifesto } from "@/components/Manifesto";
import { Steps } from "@/components/Steps";
import { Measure } from "@/components/Measure";
import { Sizes } from "@/components/Sizes";
import { Features } from "@/components/Features";
import { Workbench } from "@/components/Workbench";
import { Cta } from "@/components/Cta";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SectionNav />
      <main>
        <Hero />
        <Marquee />
        <Manifesto />
        <Steps />
        <Measure />
        <Sizes />
        <Features />
        <Workbench />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
