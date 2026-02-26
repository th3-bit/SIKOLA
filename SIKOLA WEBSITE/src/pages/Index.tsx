 import { Navbar } from "@/components/Navbar";
 import { HeroSection } from "@/components/HeroSection";
 import { StorySection } from "@/components/StorySection";
 import { HowItWorksSection } from "@/components/HowItWorksSection";
 import { PricingSection } from "@/components/PricingSection";
 import { FAQSection } from "@/components/FAQSection";
 import { Footer } from "@/components/Footer";
 
 const Index = () => {
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       <HeroSection />
       <StorySection />
       <HowItWorksSection />
       <PricingSection />
       <FAQSection />
       <Footer />
     </div>
   );
 };
 
 export default Index;
