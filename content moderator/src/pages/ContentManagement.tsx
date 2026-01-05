import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { 
  ArrowLeft, 
  BookMarked, 
  Layers, 
  BookOpen, 
  Trash2, 
  Edit2, 
  Loader2, 
  ChevronRight,
  Search,
  Plus
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  title: string;
  subject_id: string;
}

interface Lesson {
  id: string;
  title: string;
  topic_id: string;
}

export const ContentManagement = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: subjectData } = await supabase.from('subjects').select('*').order('name');
    setSubjects(subjectData || []);
    setLoading(false);
  };

  const fetchTopics = async (subjId: string) => {
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjId).order('title');
    setTopics(data || []);
    setLessons([]);
    setSelectedTopicId(null);
  };

  const fetchLessons = async (topId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('topic_id', topId).order('title');
    setLessons(data || []);
  };

  const handleDeleteSubject = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) toast.error("Cannot delete subject with existing topics");
    else {
      setSubjects(subjects.filter(s => s.id !== id));
      if (selectedSubjectId === id) {
        setSelectedSubjectId(null);
        setTopics([]);
      }
      toast.success("Subject deleted");
    }
  };

  const handleDeleteTopic = async (id: string) => {
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (error) toast.error("Cannot delete topic with existing lessons");
    else {
      setTopics(topics.filter(t => t.id !== id));
      if (selectedTopicId === id) {
        setSelectedTopicId(null);
        setLessons([]);
      }
      toast.success("Topic deleted");
    }
  };

  const handleDeleteLesson = async (id: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) toast.error("Failed to delete lesson");
    else {
      setLessons(lessons.filter(l => l.id !== id));
      toast.success("Lesson deleted");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingOrbs />
      
      <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6">
        <header className="animate-fade-up">
          <div className="glass-panel-strong px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GlassButton variant="ghost" size="sm" onClick={() => navigate("/")}>
                  <ArrowLeft className="w-4 h-4" />
                </GlassButton>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <img src="/logo.jpg" alt="Teachers Content Generator" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground">
                      <span className="gradient-text">Content Explorer</span>
                    </h1>
                    <p className="text-xs text-muted-foreground">Browse and manage your educational hierarchy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6 animate-fade-up">
          {/* Subjects Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold flex items-center gap-2"><BookMarked className="w-4 h-4 text-primary" /> Subjects</h3>
              <span className="text-xs text-muted-foreground">{subjects.length} total</span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {subjects.map((s) => (
                <div 
                  key={s.id}
                  onClick={() => { setSelectedSubjectId(s.id); fetchTopics(s.id); }}
                  className={`group glass-panel p-3 cursor-pointer transition-all ${selectedSubjectId === s.id ? "bg-primary/20 border-primary/50" : "hover:bg-foreground/5"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{s.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSubject(s.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                      title="Delete subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topics Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-accent" /> Topics</h3>
              <span className="text-xs text-muted-foreground">{topics.length} in subject</span>
            </div>
            {!selectedSubjectId ? (
              <div className="glass-panel p-8 text-center text-muted-foreground text-sm rounded-2xl italic">
                Select a subject to view topics
              </div>
            ) : topics.length === 0 ? (
              <div className="glass-panel p-8 text-center text-muted-foreground text-sm rounded-2xl italic">
                No topics in this subject
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {topics.map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => { setSelectedTopicId(t.id); fetchLessons(t.id); }}
                    className={`group glass-panel p-3 cursor-pointer transition-all ${selectedTopicId === t.id ? "bg-accent/20 border-accent/50" : "hover:bg-foreground/5"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{t.title}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteTopic(t.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                        title="Delete topic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lessons Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold flex items-center gap-2"><BookOpen className="w-4 h-4 text-secondary" /> Lessons</h3>
              <span className="text-xs text-muted-foreground">{lessons.length} in topic</span>
            </div>
            {!selectedTopicId ? (
              <div className="glass-panel p-8 text-center text-muted-foreground text-sm rounded-2xl italic">
                Select a topic to view lessons
              </div>
            ) : lessons.length === 0 ? (
              <div className="glass-panel p-8 text-center text-muted-foreground text-sm rounded-2xl italic">
                No lessons in this topic
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {lessons.map((l) => (
                  <div 
                    key={l.id}
                    className="group glass-panel p-3 hover:bg-foreground/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{l.title}</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleDeleteLesson(l.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                          title="Delete lesson"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;
