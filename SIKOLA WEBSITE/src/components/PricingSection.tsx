 import { motion } from "framer-motion";
 import { Check, Sparkles } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 const plans = [
   {
     name: "Free Trial",
     price: "0",
     currency: "RWF",
     duration: "Valid for 3d",
     features: ["Single Subject Access", "Interactive Quizzes", "Progress Tracking", "Mobile Money Ready"],
     popular: false,
   },
   {
     name: "Per Course",
     price: "300",
     currency: "RWF",
     duration: "Valid for 1d",
     features: ["Single Subject Access", "Interactive Quizzes", "Progress Tracking", "Mobile Money Ready"],
     popular: false,
   },
   {
     name: "Daily Plan",
     price: "700",
     currency: "RWF",
     duration: "Valid for 1d",
     features: ["All Subjects Access", "Interactive Quizzes", "Progress Tracking", "Mobile Money Ready"],
     popular: false,
   },
   {
     name: "Weekly Plan",
     price: "4,500",
     currency: "RWF",
     duration: "Valid for 7d",
     features: ["All Subjects Access", "Interactive Quizzes", "Progress Tracking", "Mobile Money Ready"],
     popular: true,
     badge: "Best Value",
   },
   {
     name: "Monthly Plan",
     price: "15,000",
     currency: "RWF",
     duration: "Valid for 30d",
     features: ["All Subjects Access", "Interactive Quizzes", "Progress Tracking", "Mobile Money Ready"],
     popular: false,
   },
 ];
 
 export function PricingSection() {
   return (
    <section id="pricing" className="py-12 sm:py-20 lg:py-32 relative overflow-hidden">
       {/* Background decorations */}
       <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
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
             Choose Your <span className="text-gradient">Path</span>
           </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
             Flexible pricing plans designed for every learner
           </p>
         </motion.div>
 
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
           {plans.map((plan, index) => (
             <motion.div
               key={plan.name}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.popular ? "lg:-mt-4 lg:mb-4" : ""}`}
             >
               {plan.badge && (
                <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-accent text-accent-foreground text-xs sm:text-sm font-medium whitespace-nowrap">
                     <Sparkles className="w-3 h-3" />
                     {plan.badge}
                   </span>
                 </div>
               )}
 
               <div
                className={`glass-card h-full flex flex-col !p-4 sm:!p-6 ${
                   plan.popular ? "ring-2 ring-accent glow-accent" : ""
                 }`}
               >
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{plan.name}</h3>
                   <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl sm:text-3xl font-bold">{plan.price}</span>
                     <span className="text-muted-foreground">{plan.currency}</span>
                   </div>
                   <p className="text-sm text-muted-foreground mt-1">{plan.duration}</p>
                 </div>
 
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-grow">
                   {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm">
                       <Check className="w-4 h-4 text-primary flex-shrink-0" />
                       <span className="text-foreground/80">{feature}</span>
                     </li>
                   ))}
                 </ul>
 
                 <Button
                  size="sm"
                   className={`w-full ${
                     plan.popular
                       ? "bg-gradient-accent text-accent-foreground hover:opacity-90"
                       : "bg-gradient-primary text-primary-foreground hover:opacity-90"
                  } sm:text-base`}
                 >
                   Choose Plan
                 </Button>
               </div>
             </motion.div>
           ))}
         </div>
       </div>
     </section>
   );
 }