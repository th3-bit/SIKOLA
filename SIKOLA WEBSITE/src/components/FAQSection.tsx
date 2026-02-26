 import { motion } from "framer-motion";
 import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
 } from "@/components/ui/accordion";
 
 const faqs = [
   {
     question: "Who is Sikola+ for?",
     answer:
       "Sikola+ is designed for busy university and high school students in Rwanda who need to balance study with jobs, family, and personal growth.",
   },
   {
     question: "How much time do I need?",
     answer:
       "Just 10 to 20 minutes a day! Our platform is optimized for bite-sized learning that fits into your commute or work breaks.",
   },
   {
     question: "Can I study offline?",
     answer:
       "The app is designed for accessibility anywhere. We optimize data usage so you can learn without high costs.",
   },
   {
     question: "What subjects are available?",
     answer:
       "We offer a wide variety of subjects including Mathematics, Science, Entrepreneurship, Civics, and more, all tailored to regional curriculums.",
   },
 ];
 
 export function FAQSection() {
   return (
    <section className="py-12 sm:py-20 lg:py-32 bg-secondary/30 relative overflow-hidden">
       {/* Background decorations */}
       <div className="absolute inset-0">
         <div className="absolute top-1/2 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
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
             Frequently Asked <span className="text-gradient">Questions</span>
           </h2>
         </motion.div>
 
         <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="max-w-3xl mx-auto"
         >
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
             {faqs.map((faq, index) => (
               <AccordionItem
                 key={index}
                 value={`item-${index}`}
                className="glass-card border-0 !p-0 px-4 sm:px-6 overflow-hidden"
               >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-3 sm:py-4 text-sm sm:text-base">
                   {faq.question}
                 </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-3 sm:pb-4 text-sm sm:text-base">
                   {faq.answer}
                 </AccordionContent>
               </AccordionItem>
             ))}
           </Accordion>
         </motion.div>
       </div>
     </section>
   );
 }