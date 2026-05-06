import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureSection from "@/components/landing/FeatureSection";
import PricingSection from "@/components/landing/PricingSection";
import StepSection from "@/components/landing/StepSection";
import FormSection from "@/components/landing/FormSection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F5]">
        <Navbar />
        <HeroSection />
        <FeatureSection />
        <PricingSection />
        <StepSection />
        <FormSection />
        <Footer />
    </div>
  );
}