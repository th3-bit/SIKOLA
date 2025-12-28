import { GlassButton } from "./ui/GlassButton";
import { Layers, ArrowLeft, Save, Sun, Moon, Search, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassInput } from "./ui/GlassInput";

interface HeaderProps {
  subject?: string;
  topic?: string;
  onBack?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header = ({ subject, topic, onBack, searchQuery = "", onSearchChange }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    onSearchChange?.("");
  };

  return (
    <header className="animate-fade-up">
      <div className="glass-panel-strong px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <GlassButton variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </GlassButton>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Layers className="w-5 h-5 text-primary-foreground" />
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
            {showSearch ? (
              <div className="flex items-center gap-2">
                <GlassInput
                  type="text"
                  placeholder="Search lessons, examples, questions..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-64 h-9"
                  autoFocus
                />
                <GlassButton variant="ghost" size="sm" type="button" onClick={handleCloseSearch}>
                  ✕
                </GlassButton>
              </div>
            ) : (
              <GlassButton variant="ghost" size="sm" onClick={() => setShowSearch(true)}>
                <Search className="w-5 h-5" />
              </GlassButton>
            )}

            {/* User Management Link */}
            <GlassButton variant="ghost" size="sm" onClick={() => navigate("/users")}>
              <Users className="w-5 h-5" />
            </GlassButton>
            
            <GlassButton variant="ghost" size="sm" onClick={toggleTheme}>
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
