import { useState, useMemo, useEffect } from "react";
import { GlassCard } from "./ui/GlassCard";
import { GlassButton } from "./ui/GlassButton";
import { BookMarked, Layers, ArrowRight, Sparkles, ChevronDown, Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  title: string;
  subject_id: string;
}

interface SubjectTopicFormProps {
  onSubmit: (subjectData: { id: string; name: string }, topicData: { id: string; title: string }) => void;
}

export const SubjectTopicForm = ({ onSubmit }: SubjectTopicFormProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [topicSearch, setTopicSearch] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('subjects').select('id, name').order('created_at', { ascending: true });
    if (error) {
      toast.error("Failed to fetch subjects");
    } else {
      setSubjects(data || []);
    }
    setLoading(false);
  };

  const fetchTopics = async (subjectId: string) => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, subject_id')
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: true });
    
    if (error) {
      toast.error("Failed to fetch topics");
    } else {
      setTopics(data || []);
    }
  };

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch) return subjects;
    return subjects.filter((s) =>
      s.name.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjectSearch, subjects]);

  const filteredTopics = useMemo(() => {
    if (!topicSearch) return topics;
    return topics.filter((t) =>
      t.title.toLowerCase().includes(topicSearch.toLowerCase())
    );
  }, [topicSearch, topics]);

  const isCustomSubject = subjectSearch.trim() && !subjects.some(
    (s) => s.name.toLowerCase() === subjectSearch.toLowerCase()
  );

  const isCustomTopic = topicSearch.trim() && !topics.some(
    (t) => t.title.toLowerCase() === topicSearch.toLowerCase()
  );

  const handleSubjectSelect = (subj: Subject) => {
    setSelectedSubject(subj);
    setSubjectOpen(false);
    setSubjectSearch("");
    setSelectedTopic(null);
    setTopics([]);
    fetchTopics(subj.id);
  };

  const handleAddCustomSubject = async () => {
    if (!subjectSearch.trim()) return;
    
    const { data, error } = await supabase
      .from('subjects')
      .insert([{ name: subjectSearch.trim() }])
      .select()
      .single();
    
    if (error) {
      toast.error("Failed to create subject");
    } else {
      setSubjects([...subjects, data]);
      handleSubjectSelect(data);
      toast.success(`Subject "${data.name}" created`);
    }
  };

  const handleTopicSelect = (t: Topic) => {
    setSelectedTopic(t);
    setTopicOpen(false);
    setTopicSearch("");
  };

  const handleAddCustomTopic = async () => {
    if (!topicSearch.trim() || !selectedSubject) return;
    
    const { data, error } = await supabase
      .from('topics')
      .insert([{ title: topicSearch.trim(), subject_id: selectedSubject.id }])
      .select()
      .single();
    
    if (error) {
      toast.error("Failed to create topic");
    } else {
      setTopics([...topics, data]);
      handleTopicSelect(data);
      toast.success(`Topic "${data.title}" created`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedTopic) {
      toast.error("Please select both subject and topic");
      return;
    }
    onSubmit(selectedSubject, selectedTopic);
  };

  return (
    <div className="animate-fade-up">
      <GlassCard className="max-w-2xl mx-auto" hover={false}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            {loading ? <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" /> : <Sparkles className="w-8 h-8 text-primary-foreground" />}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Start Your Content
          </h2>
          <p className="text-muted-foreground">
            Select or enter a subject and topic to begin building your educational content
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Subject Combobox */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-muted-foreground" />
                Subject
              </label>
              <Popover open={subjectOpen} onOpenChange={(open) => {
                setSubjectOpen(open);
                if (!open) setSubjectSearch("");
              }}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={subjectOpen}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl px-4 py-3",
                      "bg-background/50 backdrop-blur-sm border border-border/50",
                      "hover:bg-background/70 hover:border-border transition-all duration-300",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50",
                      "text-left",
                      !selectedSubject && "text-muted-foreground"
                    )}
                  >
                    {selectedSubject ? selectedSubject.name : "Select or type a subject..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search or type new subject..." 
                      value={subjectSearch}
                      onValueChange={setSubjectSearch}
                    />
                    <CommandList>
                      {isCustomSubject && (
                        <CommandGroup>
                          <CommandItem
                            onSelect={handleAddCustomSubject}
                            className="text-primary"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add "{subjectSearch}" as new subject
                          </CommandItem>
                        </CommandGroup>
                      )}
                      {filteredSubjects.length > 0 && (
                        <CommandGroup heading="Available Subjects">
                          {filteredSubjects.map((subj) => (
                            <CommandItem
                              key={subj.id}
                              value={subj.name}
                              onSelect={() => handleSubjectSelect(subj)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSubject?.id === subj.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {subj.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {!isCustomSubject && filteredSubjects.length === 0 && (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No subjects found. Type to add a custom one.
                        </div>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Topic Combobox */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                Topic
              </label>
              <Popover open={topicOpen} onOpenChange={(open) => {
                setTopicOpen(open);
                if (!open) setTopicSearch("");
              }} disabled={!selectedSubject}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded={topicOpen}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl px-4 py-3",
                      "bg-background/50 backdrop-blur-sm border border-border/50",
                      "hover:bg-background/70 hover:border-border transition-all duration-300",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50",
                      "text-left",
                      (!selectedTopic || !selectedSubject) && "text-muted-foreground",
                      !selectedSubject && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {selectedTopic ? selectedTopic.title : "Select or type a topic..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search or type new topic..." 
                      value={topicSearch}
                      onValueChange={setTopicSearch}
                    />
                    <CommandList>
                      {isCustomTopic && selectedSubject && (
                        <CommandGroup>
                          <CommandItem
                            onSelect={handleAddCustomTopic}
                            className="text-primary"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add "{topicSearch}" as new topic
                          </CommandItem>
                        </CommandGroup>
                      )}
                      {filteredTopics.length > 0 && (
                        <CommandGroup heading={selectedSubject ? `Topics for ${selectedSubject.name}` : "Available Topics"}>
                          {filteredTopics.map((t) => (
                            <CommandItem
                              key={t.id}
                              value={t.title}
                              onSelect={() => handleTopicSelect(t)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedTopic?.id === t.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {t.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {!isCustomTopic && filteredTopics.length === 0 && (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          {selectedSubject ? "No topics found. Type to add a custom one." : "Please select a subject first."}
                        </div>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <GlassButton variant="primary" type="submit" className="w-full" size="lg" disabled={!selectedSubject || !selectedTopic}>
            <span className="flex items-center justify-center gap-2">
              Continue to Builder
              <ArrowRight className="w-5 h-5" />
            </span>
          </GlassButton>
        </form>

        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            {selectedSubject ? `Working within ${selectedSubject.name}` : "Select from suggestions or type your own custom subject and topic"}
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

