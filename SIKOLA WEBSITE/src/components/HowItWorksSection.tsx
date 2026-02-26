 import { motion } from "framer-motion";
 import { User, Search, BookOpen, Lightbulb, ClipboardCheck, Trophy } from "lucide-react";
 
 const steps = [
   {
     icon: User,
     title: "Create Your Profile",
     description: "Sign up in seconds and customize your learning preferences to get started.",
    gradient: "from-cyan-500 to-blue-500",
    glow: "group-hover:shadow-cyan-500/25",
   },
   {
     icon: Search,
     title: "Browse Topics",
     description: "Choose from a wide range of subjects, from Mathematics to Entrepreneurship.",
    gradient: "from-violet-500 to-purple-500",
    glow: "group-hover:shadow-violet-500/25",
   },
   {
     icon: BookOpen,
     title: "Interactive Lessons",
     description: "Engage with video content, interactive slides, and real-time study notes.",
    gradient: "from-amber-500 to-orange-500",
    glow: "group-hover:shadow-amber-500/25",
   },
   {
     icon: Lightbulb,
     title: "Real-Life Examples",
     description: "See concepts in action with practical case studies and real-world applications.",
    gradient: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-500/25",
   },
   {
     icon: ClipboardCheck,
     title: "Tests & Quizzes",
     description: "Challenge yourself with interactive tests and quizzes to validate your knowledge.",
    gradient: "from-rose-500 to-pink-500",
    glow: "group-hover:shadow-rose-500/25",
   },
   {
     icon: Trophy,
     title: "Pass & Earn XP",
     description: "Complete quizzes with 70% or more to master topics and climb the leaderboard.",
    gradient: "from-yellow-500 to-amber-500",
    glow: "group-hover:shadow-yellow-500/25",
   },
 ];
 
 export function HowItWorksSection() {
   return (
    <section id="how-it-works" className="py-12 sm:py-20 lg:py-32 bg-secondary/30 relative overflow-hidden">
       {/* Background decorations */}
       <div className="absolute inset-0">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
       </div>
 
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
         <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
         >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
             How to Use <span className="text-gradient">Sikola+</span>
           </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
             Start your learning journey in just a few simple steps
           </p>
         </motion.div>
 
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
           {steps.map((step, index) => (
             <motion.div
               key={step.title}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
             >
              {/* Connecting line for desktop */}
              {index < steps.length - 1 && index !== 2 && (
                <div className="hidden lg:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-border to-transparent z-0" />
              )}
              
              <div className={`glass-card h-full relative overflow-hidden !p-5 sm:!p-6 transition-all duration-300 group-hover:translate-y-[-4px] ${step.glow} group-hover:shadow-xl`}>
                 {/* Step number */}
                <div className={`absolute top-4 right-4 w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg`}>
                  <span className="text-xs sm:text-sm font-bold text-white">{index + 1}</span>
                 </div>
 
                {/* Icon container with gradient background */}
                <div className={`w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-4 sm:mb-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                  <step.icon className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
                 </div>
 
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                
                {/* Decorative gradient line at bottom */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
               </div>
             </motion.div>
           ))}
         </div>
       </div>
     </section>
   );
 }