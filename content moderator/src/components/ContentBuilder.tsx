import { useState } from "react";
import { GlassCard } from "./ui/GlassCard";
import { GlassInput } from "./ui/GlassInput";
import { GlassTextarea } from "./ui/GlassTextarea";
import { GlassButton } from "./ui/GlassButton";
import { GlassTabs } from "./ui/GlassTabs";
import { ContentItem } from "./ContentItem";
import { BookOpen, Lightbulb, HelpCircle, Plus, Sparkles, Check, X, ArrowRight, Save, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface QuestionData {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
}

interface ExampleData {
  title: string;
  problem: string;
  solution: string;
  keyTakeaway: string;
}

interface ContentEntry {
  id: string;
  title: string;
  content: string;
  type: "lesson" | "example" | "question";
  questionData?: QuestionData;
  exampleData?: ExampleData;
  videoLink?: string;
}

interface ContentBuilderProps {
  subject: { id: string; name?: string };
  topic: { id: string; title?: string };
  searchQuery?: string;
}

export const ContentBuilder = ({ subject, topic, searchQuery = "" }: ContentBuilderProps) => {
  const [activeTab, setActiveTab] = useState("lessons");
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Wizard flow state: "lesson" | "example" | "question" | "complete"
  const [wizardStep, setWizardStep] = useState<"lesson" | "example" | "question" | "complete">("lesson");
  const [currentLessonTitle, setCurrentLessonTitle] = useState("");
  
  // Input states
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newVideoLink, setNewVideoLink] = useState("");
  
  // Example-specific state
  const [exampleProblem, setExampleProblem] = useState("");
  const [exampleSolution, setExampleSolution] = useState("");
  const [exampleTakeaway, setExampleTakeaway] = useState("");

  // Question-specific state
  const [questionText, setQuestionText] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);

  // Edit mode state
  const [editingEntry, setEditingEntry] = useState<ContentEntry | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editVideoLink, setEditVideoLink] = useState("");
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editAnswers, setEditAnswers] = useState(["", "", "", ""]);
  const [editCorrectAnswerIndex, setEditCorrectAnswerIndex] = useState<number | null>(null);

  const tabs = [
    { id: "lessons", label: "Lessons", icon: <BookOpen className="w-4 h-4" /> },
    { id: "examples", label: "Examples", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "questions", label: "Questions", icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const getTypeFromTab = (): "lesson" | "example" | "question" => {
    switch (activeTab) {
      case "lessons": return "lesson";
      case "examples": return "example";
      case "questions": return "question";
      default: return "lesson";
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleAddEntry = () => {
    if (wizardStep === "question") {
      if (!questionText.trim()) { toast.error("Please enter a question"); return; }
      if (answers.some(a => !a.trim())) { toast.error("Please fill in all 4 answers"); return; }
      if (correctAnswerIndex === null) { toast.error("Please select the correct answer"); return; }

      const newEntry: ContentEntry = {
        id: Date.now().toString(),
        title: questionText,
        content: answers.join(" | "),
        type: "question",
        questionData: {
          question: questionText,
          answers: answers,
          correctAnswerIndex: correctAnswerIndex,
        },
      };

      setEntries([...entries, newEntry]);
      setQuestionText("");
      setAnswers(["", "", "", ""]);
      setCorrectAnswerIndex(null);
      toast.success("Question added successfully!");
    } else if (wizardStep === "lesson") {
      if (!newTitle.trim() || !newContent.trim()) { toast.error("Please fill in both title and content"); return; }

      const newEntry: ContentEntry = {
        id: Date.now().toString(),
        title: newTitle,
        content: newContent,
        type: "lesson",
        videoLink: newVideoLink.trim() || undefined,
      };

      setEntries([...entries, newEntry]);
      setCurrentLessonTitle(newTitle);
      setNewTitle("");
      setNewContent("");
      setNewVideoLink("");
      setWizardStep("example");
      setActiveTab("examples");
      toast.success("Lesson info added! Now add some examples.");
    } else if (wizardStep === "example") {
      if (!newTitle.trim() || !exampleProblem.trim() || !exampleSolution.trim()) {
        toast.error("Please fill in title, problem and solution");
        return;
      }

      const newEntry: ContentEntry = {
        id: Date.now().toString(),
        title: newTitle,
        content: exampleProblem,
        type: "example",
        exampleData: {
          title: newTitle,
          problem: exampleProblem,
          solution: exampleSolution,
          keyTakeaway: exampleTakeaway,
        }
      };

      setEntries([...entries, newEntry]);
      setNewTitle("");
      setExampleProblem("");
      setExampleSolution("");
      setExampleTakeaway("");
      toast.success("Example added!");
    }
  };

  const handleProceedToQuestions = () => {
    setWizardStep("question");
    setActiveTab("questions");
    toast.success("Now add questions for your lesson.");
  };

  const handleSaveLesson = async () => {
    setLoading(true);
    try {
      // 1. Find the lesson entry
      const lessonEntry = entries.find(e => e.type === "lesson");
      if (!lessonEntry) {
        toast.error("No lesson info found");
        return;
      }

      // 2. Insert Lesson into DB
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .insert([{
          topic_id: topic.id,
          title: lessonEntry.title,
          content: lessonEntry.content,
          video_url: lessonEntry.videoLink,
        }])
        .select()
        .single();

      if (lessonError) throw lessonError;

      // 3. Insert Examples
      const exampleEntries = entries.filter(e => e.type === "example");
      if (exampleEntries.length > 0) {
        const { error: exampleError } = await supabase
          .from('lesson_examples')
          .insert(exampleEntries.map(e => ({
            lesson_id: lessonData.id,
            title: e.exampleData?.title,
            problem: e.exampleData?.problem,
            solution: e.exampleData?.solution,
            key_takeaway: e.exampleData?.keyTakeaway,
          })));
        if (exampleError) throw exampleError;
      }

      // 4. Insert Questions
      const questionEntries = entries.filter(e => e.type === "question");
      if (questionEntries.length > 0) {
        const { error: quizError } = await supabase
          .from('quizzes')
          .insert(questionEntries.map(e => ({
            lesson_id: lessonData.id,
            question: e.questionData?.question,
            options: e.questionData?.answers,
            correct_answer: e.questionData?.correctAnswerIndex,
          })));
        if (quizError) throw quizError;
      }

      setWizardStep("complete");
      toast.success("Lesson saved successfully to database!");
    } catch (error: any) {
      toast.error(`Error saving lesson: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewLesson = () => {
    setEntries([]);
    setWizardStep("lesson");
    setActiveTab("lessons");
    setCurrentLessonTitle("");
    setNewTitle("");
    setNewContent("");
    setNewVideoLink("");
    setExampleProblem("");
    setExampleSolution("");
    setExampleTakeaway("");
    setQuestionText("");
    setAnswers(["", "", "", ""]);
    setCorrectAnswerIndex(null);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
    toast.success("Entry removed from list");
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesType = entry.type === getTypeFromTab();
    if (!searchQuery.trim()) return matchesType;
    
    const query = searchQuery.toLowerCase();
    return matchesType && (
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query)
    );
  });

  const placeholders = {
    lessons: {
      title: "e.g., Introduction to Variables",
      content: "Explain the concept, key points, and learning objectives...",
    },
    examples: {
      title: "e.g., Variable Declaration",
      problem: "Describe a scenario or problem to solve...",
      solution: "Provide the solution steps or code...",
    },
  };

  return (
    <div className="space-y-8 animate-fade-up-delay-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Content Builder
          </h2>
          <p className="text-muted-foreground mt-1">
            Build content for <span className="font-medium text-foreground">{topic.title}</span>
          </p>
        </div>
        <GlassTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Wizard Progress Indicator */}
      {wizardStep !== "complete" && (
        <div className="glass-panel p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-primary">
              {wizardStep === "lesson" && "Step 1: Lesson Overview"}
              {wizardStep === "example" && "Step 2: Add Examples"}
              {wizardStep === "question" && "Step 3: Add Quiz Questions"}
            </span>
            {currentLessonTitle && (
              <span className="text-sm text-muted-foreground">
                Current Lesson: <span className="text-foreground font-medium">{currentLessonTitle}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 flex-1 rounded-full ${wizardStep === "lesson" || wizardStep === "example" || wizardStep === "question" ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded-full ${wizardStep === "example" || wizardStep === "question" ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded-full ${wizardStep === "question" ? "bg-primary" : "bg-muted"}`} />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard className="h-fit" hover={false}>
          <div className="space-y-5">
            {wizardStep === "complete" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Lesson Successfully Added!</h3>
                <p className="text-muted-foreground mb-6">You can now start building another lesson for this topic.</p>
                <GlassButton variant="primary" onClick={handleStartNewLesson} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Start New Lesson
                </GlassButton>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Plus className="w-5 h-5 text-primary" />
                  {wizardStep === "lesson" ? "Lesson Core Info" : wizardStep === "example" ? "Example Breakdown" : "Quiz Question"}
                </div>
                
                {wizardStep === "lesson" && (
                  <>
                    <GlassInput label="Title" placeholder={placeholders.lessons.title} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <GlassTextarea label="Core Content" placeholder={placeholders.lessons.content} value={newContent} onChange={e => setNewContent(e.target.value)} />
                    <div className="relative">
                      <GlassInput label="Video URL (Optional)" placeholder="https://youtube.com/..." value={newVideoLink} onChange={e => setNewVideoLink(e.target.value)} />
                      <Video className="absolute right-3 top-9 w-5 h-5 text-muted-foreground pointer-events-none" />
                    </div>
                  </>
                )}

                {wizardStep === "example" && (
                  <>
                    <GlassInput label="Example Title" placeholder={placeholders.examples.title} value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    <GlassTextarea label="Problem Description" placeholder={placeholders.examples.problem} value={exampleProblem} onChange={e => setExampleProblem(e.target.value)} />
                    <GlassTextarea label="Solution/Steps" placeholder={placeholders.examples.solution} value={exampleSolution} onChange={e => setExampleSolution(e.target.value)} />
                    <GlassInput label="Key Takeaway" placeholder="One clear piece of advice..." value={exampleTakeaway} onChange={e => setExampleTakeaway(e.target.value)} />
                  </>
                )}

                {wizardStep === "question" && (
                  <div className="space-y-4">
                    <GlassTextarea label="Question" placeholder="Enter your question here..." value={questionText} onChange={e => setQuestionText(e.target.value)} />
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Answer Options (Click to mark correct)</label>
                      {answers.map((answer, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCorrectAnswerIndex(index)}
                            className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${correctAnswerIndex === index ? "bg-green-500 text-white" : "glass-panel text-muted-foreground"}`}
                          >
                            {correctAnswerIndex === index ? <Check className="w-5 h-5" /> : String.fromCharCode(65 + index)}
                          </button>
                          <GlassInput placeholder={`Option ${String.fromCharCode(65 + index)}...`} value={answer} onChange={e => handleAnswerChange(index, e.target.value)} className="flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <GlassButton variant="primary" onClick={handleAddEntry} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> 
                    {wizardStep === "lesson" ? "Set Lesson Header" : wizardStep === "example" ? "Add Example" : "Add Question"}
                  </GlassButton>
                  
                  {wizardStep === "example" && entries.some(e => e.type === "example") && (
                    <GlassButton variant="accent" onClick={handleProceedToQuestions} className="w-full">
                      Proceed to Questions <ArrowRight className="w-4 h-4 ml-2" />
                    </GlassButton>
                  )}
                  
                  {wizardStep === "question" && entries.some(e => e.type === "question") && (
                    <GlassButton variant="accent" onClick={handleSaveLesson} className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Finalize & Save Lesson
                    </GlassButton>
                  )}
                </div>
              </>
            )}
          </div>
        </GlassCard>

        {/* List of elements added so far */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{tabs.find(t => t.id === activeTab)?.label} ({filteredEntries.length})</h3>
          {filteredEntries.length === 0 ? (
            <div className="glass-panel p-12 text-center text-muted-foreground rounded-2xl">
              <p>No {activeTab} added in this step yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry, index) => (
                <ContentItem
                  key={entry.id}
                  title={entry.title}
                  content={entry.content}
                  index={index}
                  type={entry.type}
                  onDelete={() => handleDeleteEntry(entry.id)}
                  onEdit={() => {}}
                  questionData={entry.questionData}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};