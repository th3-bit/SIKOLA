 import { useState } from "react";
 import { Menu, X, Download } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { motion, AnimatePresence } from "framer-motion";
 
 const navLinks = [
   { name: "Our Story", href: "#story" },
   { name: "How it Works", href: "#how-it-works" },
   { name: "Pricing", href: "#pricing" },
 ];
 
 export function Navbar() {
   const [isOpen, setIsOpen] = useState(false);
 
  const handleMobileNavClick = (href: string) => {
    setIsOpen(false);
    // Small delay to allow menu to close, then scroll
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

   return (
     <motion.nav
       initial={{ y: -100 }}
       animate={{ y: 0 }}
       transition={{ duration: 0.6, ease: "easeOut" }}
       className="fixed top-0 left-0 right-0 z-50 glass"
     >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
           {/* Logo */}
           <a href="#" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gradient">SIKOLA+</span>
           </a>
 
           {/* Desktop Navigation */}
           <div className="hidden md:flex items-center gap-8">
             {navLinks.map((link) => (
               <a
                 key={link.name}
                 href={link.href}
                 className="text-foreground/80 hover:text-primary transition-colors font-medium"
               >
                 {link.name}
               </a>
             ))}
             <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity gap-2">
               <Download className="w-4 h-4" />
               Download App
             </Button>
           </div>
 
           {/* Mobile Menu Button */}
           <button
            className="md:hidden p-2 -mr-2 rounded-lg hover:bg-secondary/50 transition-colors"
             onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
           >
             {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
           </button>
         </div>
       </div>
 
       {/* Mobile Menu */}
       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0, height: 0 }}
             animate={{ opacity: 1, height: "auto" }}
             exit={{ opacity: 0, height: 0 }}
             className="md:hidden glass border-t border-border"
           >
             <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
               {navLinks.map((link) => (
                  <button
                   key={link.name}
                    onClick={() => handleMobileNavClick(link.href)}
                   className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                 >
                   {link.name}
                  </button>
               ))}
               <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity gap-2 w-full">
                 <Download className="w-4 h-4" />
                 Download App
               </Button>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </motion.nav>
   );
 }