 import { motion } from "framer-motion";
 import { Phone, Mail, Instagram, Twitter, Facebook, Linkedin } from "lucide-react";
 
 const socialLinks = [
   { icon: Instagram, href: "#", label: "Instagram" },
   { icon: Twitter, href: "#", label: "Twitter" },
   { icon: Facebook, href: "#", label: "Facebook" },
   { icon: Linkedin, href: "#", label: "LinkedIn" },
 ];
 
 export function Footer() {
   return (
    <footer className="py-8 sm:py-12 lg:py-16 relative overflow-hidden">
       {/* Background decorations */}
       <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 to-transparent" />
 
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
         <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12"
         >
           {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="text-xl sm:text-2xl font-bold text-gradient mb-3 sm:mb-4">SIKOLA+</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
               Elevating education through technology and premium content.
             </p>
           </div>
 
           {/* Contact */}
           <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Contact Us</h4>
            <div className="space-y-2 sm:space-y-3">
               <a
                 href="tel:+250728439394"
                className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors"
               >
                 <Phone className="w-4 h-4" />
                 +250 728 439 394
               </a>
               <a
                 href="mailto:ishimwemigu72@gmail.com"
                className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors break-all"
               >
                <Mail className="w-4 h-4 flex-shrink-0" />
                 ishimwemigu72@gmail.com
               </a>
             </div>
             <a
               href="#"
              className="inline-block mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
             >
               Privacy Policy
             </a>
           </div>
 
           {/* Social */}
           <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Follow Us</h4>
            <div className="flex gap-2 sm:gap-3">
               {socialLinks.map((social) => (
                 <a
                   key={social.label}
                   href={social.href}
                   aria-label={social.label}
                  className="w-9 sm:w-10 h-9 sm:h-10 rounded-full glass flex items-center justify-center hover:bg-primary/10 transition-colors"
                 >
                  <social.icon className="w-4 sm:w-5 h-4 sm:h-5 text-foreground/70" />
                 </a>
               ))}
             </div>
           </div>
         </motion.div>
 
         <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border text-center"
         >
          <p className="text-xs sm:text-sm text-muted-foreground">
             © 2025 Sikola+. All rights reserved.
           </p>
         </motion.div>
       </div>
     </footer>
   );
 }