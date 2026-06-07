import { Navbar } from "./ui/Navbar";
import { HeroSection } from "./ui/HeroSection";
import { FeaturesSection } from "./ui/FeaturesSection";
import { GuideSection } from "./ui/GuideSection";
import { Footer } from "./ui/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-teal-500/30">
      <Navbar />
      <HeroSection />
      
      <div id="features">
        <FeaturesSection />
      </div>
      
      <div id="guide">
        <GuideSection />
      </div>
      
      <Footer />
    </main>
  );
}