import { LandingNavbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";

export function LandingPage() {
  return (
    <>
      <LandingNavbar forceBlur />
      <HeroSection />
      <AboutSection />
    </>
  );
}
