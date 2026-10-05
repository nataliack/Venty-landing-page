import { SectionNav } from "@/components/SectionNav";
import { VoteTab } from "@/components/VoteTab";
import { SiteLogo } from "@/components/SiteLogo";
import { ThemeZones } from "@/components/ThemeZones";
import { Loader } from "@/components/Loader";
import { Hero } from "@/components/Hero";
import { MadeToMeasure } from "@/components/MadeToMeasure";
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
      <SiteLogo />
      <SectionNav />
      <VoteTab />
      <ThemeZones />
      <main>
        <Hero />
        <MadeToMeasure />
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
