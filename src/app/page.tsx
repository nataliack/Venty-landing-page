import { SectionNav } from "@/components/SectionNav";
import { ThemeZones } from "@/components/ThemeZones";
import { Loader } from "@/components/Loader";
import { Hero } from "@/components/Hero";
import { PhotoToPattern } from "@/components/PhotoToPattern";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { WhatYouCanMake } from "@/components/WhatYouCanMake";
import { MadeWith } from "@/components/MadeWith";
import { Faq } from "@/components/Faq";
import { Maker } from "@/components/Maker";
import { Workbench } from "@/components/Workbench";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Loader />
      <SectionNav />
      <ThemeZones />
      <main>
        <Hero />
        <PhotoToPattern />
        <HowItWorks />
        <Features />
        <WhatYouCanMake />
        <MadeWith />
        <Faq />
        <Maker />
        <Workbench />
      </main>
      <Footer />
    </>
  );
}
