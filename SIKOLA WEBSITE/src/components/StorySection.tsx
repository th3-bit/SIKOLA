 import { motion } from "framer-motion";
 import { BookOpen, Target, Users, TrendingUp, CheckCircle } from "lucide-react";
 
 const features = [
   "Explore new topics",
   "Study step-by-step learning materials",
   "Practice with exercises and quizzes",
   "Track their academic progress",
   "Improve their understanding through regular revision",
 ];
 
 export function StorySection() {
   return (
    <section id="story" className="py-12 sm:py-20 lg:py-32 relative overflow-hidden">
       {/* Background decorations */}
       <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 sm:w-72 h-36 sm:h-72 bg-accent/5 rounded-full blur-3xl" />
       </div>
 
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
         <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
         >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
             The Journey of <span className="text-gradient">Sikola+</span>
           </h2>
         </motion.div>
 
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start lg:items-center">
           {/* Left - Story Cards */}
           <motion.div
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4 sm:space-y-6"
           >
            <div className="glass-card !p-4 sm:!p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 sm:w-6 h-5 sm:h-6 text-primary-foreground" />
                 </div>
                 <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Our Mission</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                     The Sikola+ App was created with one simple mission: to make learning easier, faster, and more accessible for students with busy lives.
                   </p>
                 </div>
               </div>
             </div>
 
            <div className="glass-card !p-4 sm:!p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-accent-foreground" />
                 </div>
                 <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">The Challenge</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                     Most students struggle to balance their academic work with jobs, family duties, personal development, and fitness activities. This lack of revision negatively affects their academic performance.
                   </p>
                 </div>
               </div>
             </div>
 
            <div className="glass-card !p-4 sm:!p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
                 </div>
                 <div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">The Solution</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                     Sikola+ allows users to study lessons and test their understanding in just 10 to 20 minutes per session, making it easier for students to stay consistent with their learning.
                   </p>
                 </div>
               </div>
             </div>
           </motion.div>
 
           {/* Right - Features List */}
           <motion.div
             initial={{ opacity: 0, x: 30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-card !p-4 sm:!p-6"
           >
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center">
                <Users className="w-5 sm:w-6 h-5 sm:h-6 text-secondary-foreground" />
               </div>
              <h3 className="font-semibold text-lg sm:text-xl">What Students Can Do</h3>
             </div>
 
            <ul className="space-y-3 sm:space-y-4">
               {features.map((feature, index) => (
                 <motion.li
                   key={feature}
                   initial={{ opacity: 0, x: 20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                   className="flex items-center gap-3"
                 >
                  <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-foreground/80">{feature}</span>
                 </motion.li>
               ))}
             </ul>
 
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50">
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                 "Sikola+ is not just a learning platform; it is a tool designed to support students in achieving academic success while maintaining balance in their daily lives."
               </p>
             </div>
           </motion.div>
         </div>
       </div>
     </section>
   );
 }