import { Navbar } from "./ui/Navbar";
import { HeroSection } from "./ui/HeroSection";
import { FeaturesSection } from "./ui/FeaturesSection";
import { GuideSection } from "./ui/GuideSection";
import { SecuritySection } from "./ui/SecuritySection";
import { Footer } from "./ui/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-teal-500/20">
      <Navbar />
      <HeroSection />
      
      <div id="features">
        <FeaturesSection />
      </div>
      
      <div id="workflow">
        <GuideSection />
      </div>

      <div id="security">
        <SecuritySection />
      </div>
      
      <Footer />
    </main>
  );
}
