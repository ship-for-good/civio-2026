import { CodeOfConduct } from "@/components/code-of-conduct";
import { MotionProvider } from "@/components/motion-provider";
import { PartnershipsSection } from "@/components/partnerships-section";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { InfoBar } from "@/components/info-bar";
import { Navbar } from "@/components/navbar";
import { Schedule } from "@/components/schedule";

export default function Home() {
  return (
    <MotionProvider>
      <Navbar />
      <main id="main">
        <Hero />
        <InfoBar />
        <Schedule />
        <HowItWorks />
        <PartnershipsSection />
        <FAQ />
        <CodeOfConduct />
      </main>
      <Footer />
    </MotionProvider>
  );
}
