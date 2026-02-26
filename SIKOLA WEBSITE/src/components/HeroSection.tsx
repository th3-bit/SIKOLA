 import { ArrowRight, Sparkles } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { motion } from "framer-motion";
 
 export function HeroSection() {
   return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden pt-16 sm:pt-20">
       {/* Decorative elements */}
       <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-0 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-0 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-accent/10 rounded-full blur-3xl" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/30 rounded-full blur-3xl" />
       </div>
 
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] py-8 sm:py-12">
           {/* Left Content */}
           <motion.div
             initial={{ opacity: 0, x: -50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="text-center lg:text-left"
           >
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass-subtle mb-4 sm:mb-6"
             >
              <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-accent" />
              <span className="text-xs sm:text-sm font-medium text-foreground/80">Premium Learning Platform</span>
             </motion.div>
 
             <motion.h1
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6"
             >
               Education{" "}
               <span className="text-gradient">Redefined</span>{" "}
               for the Next Generation.
             </motion.h1>
 
             <motion.p
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4, duration: 0.6 }}
              className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0"
             >
               Master mathematics, science, and more with our premium interactive learning platform designed for Rwanda and beyond.
             </motion.p>
 
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5, duration: 0.6 }}
               className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
             >
               <Button
                 size="lg"
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 transition-all gap-2 text-base sm:text-lg px-6 sm:px-8 glow-primary"
               >
                 Get Started
                 <ArrowRight className="w-5 h-5" />
               </Button>
               <Button
                 size="lg"
                 variant="outline"
                className="glass border-primary/30 hover:bg-primary/10 transition-all text-base sm:text-lg px-6 sm:px-8"
               >
                 Explore Features
               </Button>
             </motion.div>
           </motion.div>
 
           {/* Right Content - App Preview */}
           <motion.div
             initial={{ opacity: 0, x: 50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="relative flex justify-center lg:justify-end order-first lg:order-last"
           >
             <div className="relative">
               {/* Phone mockup */}
               <motion.div
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 className="relative z-10"
               >
                <div className="w-48 sm:w-64 md:w-72 lg:w-80 aspect-[9/19] bg-foreground rounded-[2rem] sm:rounded-[3rem] p-1.5 sm:p-2 shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-b from-primary/20 to-secondary rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden relative">
                     {/* Screen content */}
                    <div className="absolute inset-2 sm:inset-4 flex flex-col">
                      <div className="text-center mb-2 sm:mb-4 pt-4 sm:pt-8">
                        <span className="text-sm sm:text-xl font-bold text-foreground">SIKOLA+</span>
                       </div>
                      <div className="flex-1 flex flex-col gap-2 sm:gap-3 px-1 sm:px-2">
                        <div className="glass-subtle rounded-lg sm:rounded-xl p-2 sm:p-3">
                          <div className="w-5 sm:w-8 h-5 sm:h-8 rounded-full bg-primary/30 mb-1.5 sm:mb-2" />
                          <div className="h-1.5 sm:h-2 w-3/4 bg-foreground/20 rounded" />
                          <div className="h-1.5 sm:h-2 w-1/2 bg-foreground/10 rounded mt-1" />
                         </div>
                        <div className="glass-subtle rounded-lg sm:rounded-xl p-2 sm:p-3">
                          <div className="w-5 sm:w-8 h-5 sm:h-8 rounded-full bg-accent/30 mb-1.5 sm:mb-2" />
                          <div className="h-1.5 sm:h-2 w-2/3 bg-foreground/20 rounded" />
                          <div className="h-1.5 sm:h-2 w-1/3 bg-foreground/10 rounded mt-1" />
                         </div>
                        <div className="glass-subtle rounded-lg sm:rounded-xl p-2 sm:p-3">
                          <div className="w-5 sm:w-8 h-5 sm:h-8 rounded-full bg-secondary-foreground/20 mb-1.5 sm:mb-2" />
                          <div className="h-1.5 sm:h-2 w-4/5 bg-foreground/20 rounded" />
                          <div className="h-1.5 sm:h-2 w-2/5 bg-foreground/10 rounded mt-1" />
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </motion.div>
 
               {/* Floating cards */}
               <motion.div
                 animate={{ y: [0, -15, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -left-4 sm:-left-12 top-1/4 glass-card p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-lg hidden sm:block"
               >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                     <span className="text-primary-foreground font-bold">📚</span>
                   </div>
                   <div>
                    <p className="font-semibold text-xs sm:text-sm">100+ Lessons</p>
                     <p className="text-xs text-muted-foreground">Interactive content</p>
                   </div>
                 </div>
               </motion.div>
 
               <motion.div
                 animate={{ y: [0, -12, 0] }}
                 transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-4 sm:-right-8 bottom-1/3 glass-card p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-lg hidden sm:block"
               >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-accent flex items-center justify-center">
                     <span className="text-accent-foreground font-bold">🏆</span>
                   </div>
                   <div>
                    <p className="font-semibold text-xs sm:text-sm">Earn XP</p>
                     <p className="text-xs text-muted-foreground">Track progress</p>
                   </div>
                 </div>
               </motion.div>
             </div>
           </motion.div>
         </div>
       </div>
     </section>
   );
 }