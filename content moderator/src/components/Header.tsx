import { GlassButton } from "./ui/GlassButton";
import { Layers, ArrowLeft, Save, Sun, Moon, Search, Users, BookOpen, Wand2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassInput } from "./ui/GlassInput";
import { GlobalSearch } from "./GlobalSearch";

interface HeaderProps {
  subject?: string;
  topic?: string;
  onBack?: () => void;
  previewTitle?: string;
}

export const Header = ({ subject, topic, onBack, previewTitle }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="relative z-50 animate-fade-up">
      <div className="glass-panel-strong !overflow-visible px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <GlassButton variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </GlassButton>
            )}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <img src="/logo.jpg" alt="Teachers Content Generator" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {subject && topic ? (
                    <>
                      <span className="gradient-text">{subject}</span>
                      <span className="text-muted-foreground mx-2">/</span>
                      <span>{topic}</span>
                    </>
                  ) : (
                    <span className="gradient-text">Content Builder</span>
                  )}
                </h1>
                {!subject && (
                  <p className="text-xs text-muted-foreground">Create educational content with ease</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <GlobalSearch />
            
            {/* Content Explorer Link */}
            <GlassButton variant="ghost" size="sm" onClick={() => navigate("/content")} title="Content Explorer">
              <BookOpen className="w-5 h-5" />
            </GlassButton>

            {/* User Management Link */}
            <GlassButton variant="ghost" size="sm" onClick={() => navigate("/users")} title="User Management">
              <Users className="w-5 h-5" />
            </GlassButton>

            <GlassButton variant="ghost" size="sm" onClick={() => navigate("/settings/ai")} title="AI Connection">
              <Wand2 className="w-5 h-5" />
            </GlassButton>
            
            <GlassButton variant="ghost" size="sm" onClick={toggleTheme} title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </GlassButton>
            
            {subject && topic && (
              <GlassButton variant="primary" size="sm">
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Progress
                </span>
              </GlassButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
