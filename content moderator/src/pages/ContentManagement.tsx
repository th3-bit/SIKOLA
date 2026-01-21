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
  Plus,
  Wand2,
  X,
  Save,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { GlassInput } from "@/components/ui/GlassInput";
import { ContentBuilder } from "@/components/ContentBuilder";

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
  duration?: number;
}

export const ContentManagement = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Creation State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showTopicBuilder, setShowTopicBuilder] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const { data: subjectData } = await supabase.from('subjects').select('*').order('created_at', { ascending: true });
    setSubjects(subjectData || []);
    setLoading(false);
  };

  const fetchTopics = async (subjId: string) => {
    const { data } = await supabase.from('topics').select('*').eq('subject_id', subjId).order('created_at', { ascending: true });
    setTopics(data || []);
    setLessons([]);
    setSelectedTopicId(null);
  };

  const fetchLessons = async (topId: string) => {
    const { data } = await supabase.from('lessons').select('*').eq('topic_id', topId).order('created_at', { ascending: true });
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
    if (error) toast.error("Failed to delete topic");
    else {
      setLessons(lessons.filter(l => l.id !== id));
      toast.success("Topic deleted");
    }
  };

  const handleEditLesson = async (lesson: Lesson) => {
    // Fetch complete lesson data including content, video_url, and duration
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lesson.id)
      .single();
    
    if (error) {
      toast.error("Failed to load lesson data");
      return;
    }
    
    setEditingLesson(data);
    setShowTopicBuilder(true);
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;
    const { data, error } = await supabase.from('subjects').insert([{ name: newSubjectName, icon: 'BookOpen' }]).select();
    if (error) toast.error("Error creating subject");
    else {
        setSubjects([...subjects, data[0]]);
        setNewSubjectName("");
        setShowSubjectModal(false);
        toast.success("Subject created");
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim() || !selectedSubjectId) return;
    const { data, error } = await supabase.from('topics').insert([{ title: newCourseTitle, subject_id: selectedSubjectId }]).select();
    if (error) toast.error("Error creating course");
    else {
        setTopics([...topics, data[0]]);
        setNewCourseTitle("");
        setShowCourseModal(false);
        toast.success("Course created");
    }
  };

  if (showTopicBuilder && selectedSubjectId && selectedTopicId) {
      const subject = subjects.find(s => s.id === selectedSubjectId) || { id: selectedSubjectId };
      const topic = topics.find(t => t.id === selectedTopicId) || { id: selectedTopicId };
      
      return (
        <div className="min-h-screen relative p-6">
            <FloatingOrbs />
            <div className="relative z-10 max-w-4xl mx-auto">
                <GlassButton onClick={() => setShowTopicBuilder(false)} variant="ghost" className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Explorer
                </GlassButton>
                <ContentBuilder 
                    subject={subject} 
                    topic={topic} // This is actually the Course
                    initialData={editingLesson || undefined}
                    onComplete={() => {
                        setShowTopicBuilder(false);
                        setEditingLesson(null);
                        fetchLessons(selectedTopicId); // Refresh Topics list
                    }} 
                />
            </div>
        </div>
      );
  }

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
              <div className="flex items-center gap-2">
                <GlassButton variant="ghost" size="sm" onClick={() => navigate("/settings/ai")} title="AI Connection">
                  <Wand2 className="w-5 h-5" />
                </GlassButton>
                <GlassButton onClick={() => navigate("/practice-modes")}>
                  <div className="flex items-center gap-2">
                     <div className="w-5 h-5 rounded-full bg-yellow-400/20 flex items-center justify-center">
                       <span className="text-yellow-400 text-xs font-bold">★</span>
                     </div>
                     Practice Modes
                  </div>
                </GlassButton>
              </div>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6 animate-fade-up">
          {/* Subjects Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold flex items-center gap-2"><BookMarked className="w-4 h-4 text-primary" /> Subjects</h3>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-muted-foreground">{subjects.length} total</span>
                 <button onClick={() => setShowSubjectModal(true)} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Add Subject"><Plus className="w-4 h-4 text-primary" /></button>
              </div>
            </div>
            
            {showSubjectModal && (
                <div className="glass-panel p-3 mb-4 animate-fade-down">
                    <GlassInput autoFocus placeholder="Subject Name..." value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} className="mb-2 text-sm" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowSubjectModal(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                        <button onClick={handleCreateSubject} className="text-xs font-bold text-primary hover:text-primary/80">Create</button>
                    </div>
                </div>
            )}

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
              <h3 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-accent" /> Courses</h3>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-muted-foreground">{topics.length} in subject</span>
                 {selectedSubjectId && <button onClick={() => setShowCourseModal(true)} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Add Course"><Plus className="w-4 h-4 text-accent" /></button>}
              </div>
            </div>

            {showCourseModal && (
                <div className="glass-panel p-3 mb-4 animate-fade-down">
                    <GlassInput autoFocus placeholder="Course Title..." value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} className="mb-2 text-sm" />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowCourseModal(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                        <button onClick={handleCreateCourse} className="text-xs font-bold text-accent hover:text-accent/80">Create</button>
                    </div>
                </div>
            )}

            <span className="text-xs text-muted-foreground hidden">Topics</span>
            {!selectedSubjectId ? (
              <div className="glass-panel p-8 text-center text-muted-foreground text-sm rounded-2xl italic">
                Select a subject to view topics
              </div>
            ) : topics.length === 0 ? (
              <div className="glass-panel p-8 text-center text-muted-foreground text-sm rounded-2xl italic">
                No courses in this subject
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
                        title="Delete course"
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
              <h3 className="font-bold flex items-center gap-2"><BookOpen className="w-4 h-4 text-secondary" /> Topics</h3>
              <div className="flex items-center gap-2">
                 {lessons.length > 0 && selectedTopicId && (
                     <div className="flex items-center gap-1.5 bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20">
                        <Clock className="w-3 h-3 text-secondary" />
                        <span className="text-xs font-mono text-secondary font-bold">
                          {Math.floor(lessons.reduce((acc, l) => acc + (l.duration || 10), 0) / 60)}h {lessons.reduce((acc, l) => acc + (l.duration || 10), 0) % 60}m
                        </span>
                     </div>
                 )}
                 <span className="text-xs text-muted-foreground">{lessons.length} in course</span>
                 {selectedTopicId && (
                     <button onClick={() => setShowTopicBuilder(true)} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Add Topic">
                         <Plus className="w-4 h-4 text-secondary" />
                     </button>
                 )}
              </div>
            </div>
            {!selectedTopicId ? (
              <div className="glass-panel p-8 text-center text-muted-foreground text-sm rounded-2xl italic">
                Select a course to view topics
              </div>
            ) : lessons.length === 0 ? (
              <div className="glass-panel p-8 text-center text-muted-foreground text-sm rounded-2xl italic">
                No topics here. Add one to start building content!
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {lessons.map((l) => (
                  <div 
                    key={l.id}
                    className="group glass-panel p-3 hover:bg-foreground/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-medium truncate">{l.title}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3 text-secondary/70" /> {l.duration || 10} mins
                          </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button 
                          onClick={() => handleEditLesson(l)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent transition-all"
                          title="Edit topic"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLesson(l.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                          title="Delete topic"
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
