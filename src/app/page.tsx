import { SectionNav } from "@/components/SectionNav";
import { VoteTab } from "@/components/VoteTab";
import { SiteLogo } from "@/components/SiteLogo";
import { ThemeZones } from "@/components/ThemeZones";
import { MeasureLoader } from "@/components/MeasureLoader";
import { Hero } from "@/components/Hero";
import { MadeToMeasure } from "@/components/MadeToMeasure";
import { HowItWorks } from "@/components/how/HowItWorks";
import { Features } from "@/components/features/Features";
import { Make } from "@/components/make/Make";
import { MadeWith } from "@/components/made/MadeWith";
import { Faq } from "@/components/faq/Faq";
import { Maker } from "@/components/maker/Maker";
import { Closing } from "@/components/closing/Closing";
import { Footer } from "@/components/footer/Footer";

export default function Home() {
  return (
    <>
      <MeasureLoader />
      <SiteLogo />
      <SectionNav />
      <VoteTab />
      <ThemeZones />
      <main>
        <Hero />
        <MadeToMeasure />
        <HowItWorks />
        <Features />
        <Make />
        <MadeWith />
        <Faq />
        <Maker />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
