import { useState } from "react";
import { GlassCard } from "./ui/GlassCard";
import { GlassInput } from "./ui/GlassInput";
import { GlassTextarea } from "./ui/GlassTextarea";
import { GlassButton } from "./ui/GlassButton";
import { BookOpen, Lightbulb, HelpCircle, Plus, Sparkles, Check, ArrowRight, Save, Video, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { generateLessonContent, getOpenAIConfig } from "@/lib/openai";

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
  type: "intro" | "content" | "video" | "example" | "quiz";
  title?: string;
  content?: string;
  videoUrl?: string;
  questionData?: QuestionData;
  exampleData?: ExampleData;
}

interface ContentBuilderProps {
  subject: { id: string; name?: string };
  topic: { id: string; title?: string };
  searchQuery?: string;
  initialData?: any;
  onComplete?: () => void;
}

export const ContentBuilder = ({ subject, topic, searchQuery = "", initialData, onComplete }: ContentBuilderProps) => {
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Wizard flow state
  // 1. info: Title, Intro ("What you will learn"), Core Content
  // 2. video: YouTube Link
  // 3. examples: Add examples
  // 4. questions: Add questions
  const [wizardStep, setWizardStep] = useState<"info" | "video" | "examples" | "questions" | "complete">("info");

  // Step 1: Info
  const [title, setTitle] = useState(initialData?.title || "");
  // Try to parse initial content if exists
  const parsedContent = initialData?.content ? (typeof initialData.content === 'string' ? JSON.parse(initialData.content) : initialData.content) : [];
  
  // Extract initial values from parsed content
  const initIntro = parsedContent.find((s: any) => s.type === 'intro');
  const initCore = parsedContent.find((s: any) => s.type === 'content' && s.title === 'Core Concept');
  const initVideo = parsedContent.find((s: any) => s.type === 'video');
  const initExamples = parsedContent.filter((s: any) => s.type === 'content' && s.title !== 'Core Concept' && !s.title.startsWith('Coming Soon')); // Rough heuristic
  const initQuestions = parsedContent.filter((s: any) => s.type === 'quiz');

  const [intro, setIntro] = useState(initIntro?.content || "");
  const [coreContent, setCoreContent] = useState(initCore?.content || "");

  // Step 2: Video
  const [videoLink, setVideoLink] = useState(initialData?.video_url || initVideo?.videoUrl || "");

  // Step 3: Examples
  const [examples, setExamples] = useState<ContentEntry[]>(() => {
    if (!initExamples) return [];
    return initExamples.map((ex: any, idx: number) => ({
      id: `ex-${idx}`,
      type: "example",
      title: ex.title,
      exampleData: {
        title: ex.title,
        problem: ex.content.split('\n\nSolution:\n')[0] || "",
        solution: ex.content.split('\n\nSolution:\n')[1]?.split('\n\nKey Takeaway: ')[0] || "",
        keyTakeaway: ex.content.split('\n\nKey Takeaway: ')[1] || ""
      }
    }));
  });
  
  const [exTitle, setExTitle] = useState("");
  const [exProblem, setExProblem] = useState("");
  const [exSolution, setExSolution] = useState("");
  const [exTakeaway, setExTakeaway] = useState("");

  // Step 4: Questions
  const [questions, setQuestions] = useState<ContentEntry[]>(() => {
    if (!initQuestions) return [];
    return initQuestions.map((q: any, idx: number) => ({
      id: `q-${idx}`,
      type: "quiz",
      questionData: {
        question: q.question,
        answers: q.options || [],
        correctAnswerIndex: q.correctAnswer
      }
    }));
  });
  
  const [qText, setQText] = useState("");
  const [qAnswers, setQAnswers] = useState(["", "", "", ""]);
  const [qCorrectIndex, setQCorrectIndex] = useState<number | null>(null);

  const handleAiGenerate = async () => {
    const config = getOpenAIConfig();
    if (!config || !config.apiKey) {
      toast.error("AI not configured. Please set your API key in AI Settings (Wand icon in header).");
      return;
    }

    setAiGenerating(true);
    try {
      const data = await generateLessonContent(topic.title || "Subject Lesson", config);
      
      if (data.title) setTitle(data.title);
      if (data.intro) setIntro(data.intro);
      if (data.coreContent) setCoreContent(data.coreContent);
      
      if (data.examples && Array.isArray(data.examples)) {
        const mappedExamples = data.examples.map((ex: any, idx: number) => ({
          id: `ai-ex-${Date.now()}-${idx}`,
          type: "example",
          title: ex.title,
          content: ex.problem,
          exampleData: ex
        }));
        setExamples(mappedExamples);
      }

      if (data.questions && Array.isArray(data.questions)) {
        const mappedQuestions = data.questions.map((q: any, idx: number) => ({
          id: `ai-q-${Date.now()}-${idx}`,
          type: "quiz",
          title: "Quick Quiz",
          content: "Test your knowledge",
          questionData: q
        }));
        setQuestions(mappedQuestions);
      }

      toast.success("AI Content Generated Successfully!");
    } catch (error: any) {
      toast.error(`AI Error: ${error.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // ... (keep handleNextStep, handleAddExample, handleAddQuestion same) ...
  const handleNextStep = () => {
    if (wizardStep === "info") {
      if (!title.trim() || !intro.trim() || !coreContent.trim()) {
        toast.error("Please fill in all fields");
        return;
      }
      setWizardStep("video");
    } else if (wizardStep === "video") {
      setWizardStep("examples");
    } else if (wizardStep === "examples") {
      setWizardStep("questions");
    }
  };

  const handleAddExample = () => {
    if (!exTitle.trim() || !exProblem.trim() || !exSolution.trim()) {
      toast.error("Please fill in title, problem and solution");
      return;
    }
    const newExample: ContentEntry = {
      id: Date.now().toString(),
      type: "example",
      title: exTitle,
      content: exProblem, 
      exampleData: {
        title: exTitle,
        problem: exProblem,
        solution: exSolution,
        keyTakeaway: exTakeaway
      }
    };
    setExamples([...examples, newExample]);
    setExTitle("");
    setExProblem("");
    setExSolution("");
    setExTakeaway("");
    toast.success("Example added!");
  };

  const handleAddQuestion = () => {
    if (!qText.trim()) { toast.error("Enter question text"); return; }
    if (qAnswers.some(a => !a.trim())) { toast.error("Fill all 4 answers"); return; }
    if (qCorrectIndex === null) { toast.error("Select correct answer"); return; }

    const newQuestion: ContentEntry = {
      id: Date.now().toString(),
      type: "quiz",
      title: "Quick Quiz",
      content: "Test your knowledge",
      questionData: {
        question: qText,
        answers: qAnswers,
        correctAnswerIndex: qCorrectIndex
      }
    };
    setQuestions([...questions, newQuestion]);
    setQText("");
    setQAnswers(["", "", "", ""]);
    setQCorrectIndex(null);
    toast.success("Question added!");
  };

  const handleSaveLesson = async () => {
    setLoading(true);
    try {
      // Construct the slide deck array for the mobile app
      const slides = [];

      // 1. Overview Section (3 Slides)
      // Slide 1: Big Title
      slides.push({
        type: "intro",
        title: title,
        content: "Tap next to start this lesson!"
      });

      // Slide 2: What you will learn
      slides.push({
        type: "content",
        title: "Lesson Goal",
        content: intro
      });

      // Slide 3: Core Concept
      slides.push({
        type: "content",
        title: "Explanation",
        content: coreContent
      });

      // 2. Video Slide (if exists)
      if (videoLink.trim()) {
        slides.push({
          type: "video",
          title: "Video Tutorial",
          videoUrl: videoLink,
          content: "Watch this walkthrough for a deeper understanding."
        });
      }

      // 3. Examples Section
      examples.forEach(ex => {
        slides.push({
          type: "content", 
          isExample: true,
          title: ex.title,
          content: `${ex.exampleData?.problem}\n\nSolution:\n${ex.exampleData?.solution}\n\nKey Takeaway: ${ex.exampleData?.keyTakeaway}\n\n💡 Access more examples via the bulb icon.`
        });
      });

      // 4. Questions (Quiz at the end)
      questions.forEach(q => {
        slides.push({
          type: "quiz",
          question: q.questionData?.question,
          options: q.questionData?.answers,
          correctAnswer: q.questionData?.correctAnswerIndex
        });
      });

      const lessonData = {
        topic_id: topic.id,
        title: title,
        content: JSON.stringify(slides),
        video_url: videoLink
      };

      let error;
      if (initialData?.id) {
         // Update
         const result = await supabase
           .from('lessons')
           .update(lessonData)
           .eq('id', initialData.id);
         error = result.error;
      } else {
         // Insert
         const result = await supabase
           .from('lessons')
           .insert([lessonData]);
         error = result.error;
      }

      if (error) throw error;

      setWizardStep("complete");
      toast.success(initialData?.id ? "Lesson updated successfully!" : "Lesson saved successfully!");
    } catch (error: any) {
      toast.error(`Error saving: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    if (onComplete) {
       onComplete();
       return;
    }
    setTitle("");
    setIntro("");
    setCoreContent("");
    setVideoLink("");
    setExamples([]);
    setQuestions([]);
    setWizardStep("info");
  };

  return (
    <div className="space-y-8 animate-fade-up-delay-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {initialData ? 'Edit Content' : 'Content Builder'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {initialData ? 'Editing content for ' : 'Build content for '} 
            <span className="font-medium text-foreground">{topic.title}</span>
          </p>
        </div>
        <GlassButton 
          variant="accent" 
          onClick={handleAiGenerate} 
          disabled={aiGenerating}
          className="group relative overflow-hidden"
        >
          {aiGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
          )}
          {aiGenerating ? 'Generating...' : 'Generate with AI Magic'}
          {aiGenerating && (
            <div className="absolute inset-0 bg-primary/20 animate-pulse" />
          )}
        </GlassButton>
      </div>

      {/* Progress Steps */}
      {wizardStep !== "complete" && (
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between text-sm">
           <div className={`px-3 py-1 rounded-lg ${wizardStep === 'info' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>1. Lesson Info</div>
           <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
           <div className={`px-3 py-1 rounded-lg ${wizardStep === 'video' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>2. Video</div>
           <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
           <div className={`px-3 py-1 rounded-lg ${wizardStep === 'examples' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>3. Examples</div>
           <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
           <div className={`px-3 py-1 rounded-lg ${wizardStep === 'questions' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>4. Questions</div>
        </div>
      )}

      <GlassCard className="max-w-3xl mx-auto" hover={false}>
        <div className="space-y-6">
          
          {wizardStep === "info" && (
            <>
              <h3 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary"/> Step 1: Lesson Overview</h3>
              <GlassInput label="Lesson Title" placeholder="e.g. Introduction to Algebra" value={title} onChange={e => setTitle(e.target.value)} />
              <GlassTextarea label="What you will learn (Goal/Intro)" placeholder="Briefly explain the goal of this lesson..." value={intro} onChange={e => setIntro(e.target.value)} />
              <GlassTextarea label="Core Content (Explanation)" placeholder="Detailed explanation of the concept..." className="min-h-[150px]" value={coreContent} onChange={e => setCoreContent(e.target.value)} />
              <GlassButton variant="primary" onClick={handleNextStep} className="w-full">Next Step <ArrowRight className="w-4 h-4 ml-2"/></GlassButton>
            </>
          )}

          {wizardStep === "video" && (
            <>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Video className="w-5 h-5 text-primary"/> Step 2: Media</h3>
              <GlassInput label="YouTube Video Link" placeholder="https://youtube.com/watch?v=..." value={videoLink} onChange={e => setVideoLink(e.target.value)} />
              <div className="flex gap-3">
                 <GlassButton variant="ghost" onClick={() => setWizardStep("info")} className="flex-1">Back</GlassButton>
                 <GlassButton variant="primary" onClick={handleNextStep} className="flex-1">Next Step <ArrowRight className="w-4 h-4 ml-2"/></GlassButton>
              </div>
            </>
          )}

          {wizardStep === "examples" && (
            <>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Lightbulb className="w-5 h-5 text-primary"/> Step 3: Examples ({examples.length} added)</h3>
              <div className="p-4 bg-muted/10 rounded-xl space-y-3 mb-4">
                 <GlassInput label="Example Title" placeholder="e.g. Solving for X" value={exTitle} onChange={e => setExTitle(e.target.value)} />
                 <GlassTextarea label="Problem" placeholder="The problem statement..." value={exProblem} onChange={e => setExProblem(e.target.value)} />
                 <GlassTextarea label="Solution" placeholder="Step-by-step solution..." value={exSolution} onChange={e => setExSolution(e.target.value)} />
                 <GlassInput label="Key Takeaway" placeholder="What should the student remember?" value={exTakeaway} onChange={e => setExTakeaway(e.target.value)} />
                 <GlassButton variant="accent" onClick={handleAddExample} className="w-full"><Plus className="w-4 h-4 mr-2"/> Add Example</GlassButton>
              </div>
              <div className="flex gap-3">
                 <GlassButton variant="ghost" onClick={() => setWizardStep("video")} className="flex-1">Back</GlassButton>
                 <GlassButton variant="primary" onClick={handleNextStep} className="flex-1">Next Step <ArrowRight className="w-4 h-4 ml-2"/></GlassButton>
              </div>
            </>
          )}

          {wizardStep === "questions" && (
            <>
              <h3 className="text-lg font-semibold flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary"/> Step 4: Quiz Questions ({questions.length} added)</h3>
              <div className="p-4 bg-muted/10 rounded-xl space-y-3 mb-4">
                 <GlassTextarea label="Question" placeholder="Enter the question..." value={qText} onChange={e => setQText(e.target.value)} />
                  <div className="flex flex-col gap-3">
                    {qAnswers.map((ans, idx) => (
                      <div key={idx} className="flex items-center gap-3 group">
                         <button 
                           onClick={() => setQCorrectIndex(idx)} 
                           className={`w-10 h-10 rounded-xl border-2 flex-shrink-0 flex items-center justify-center font-bold transition-all ${
                             qCorrectIndex === idx 
                               ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105' 
                               : 'border-border hover:border-primary/50 text-muted-foreground'
                           }`}
                         >
                           {String.fromCharCode(65+idx)}
                         </button>
                         <div className="flex-1 relative">
                           <input 
                             className="w-full bg-background/50 backdrop-blur-sm border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                             placeholder={`Option ${String.fromCharCode(65+idx)}`} 
                             value={ans} 
                             onChange={e => {
                               const newAns = [...qAnswers]; 
                               newAns[idx] = e.target.value; 
                               setQAnswers(newAns);
                             }} 
                           />
                           {qCorrectIndex === idx && (
                             <div className="absolute right-3 top-1/2 -translate-y-1/2">
                               <Check className="w-4 h-4 text-primary" />
                             </div>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                 <GlassButton variant="accent" onClick={handleAddQuestion} className="w-full"><Plus className="w-4 h-4 mr-2"/> Add Question</GlassButton>
              </div>
              
              <div className="flex gap-3 pt-4">
                 <GlassButton variant="ghost" onClick={() => setWizardStep("examples")} className="flex-1">Back</GlassButton>
                 <GlassButton variant="accent" onClick={handleSaveLesson} disabled={loading} className="flex-[2]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                    {initialData ? 'Update Lesson' : 'Complete & Save Lesson'}
                 </GlassButton>
              </div>
            </>
          )}

          {wizardStep === "complete" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{initialData ? 'Lesson Updated Successfully!' : 'Lesson Saved Successfully!'}</h3>
                <p className="text-muted-foreground mb-6">Your content is now live on the mobile app.</p>
                <GlassButton variant="primary" onClick={handleStartNew} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> {initialData ? 'Return to Dashboard' : 'Build Another Lesson'}
                </GlassButton>
              </div>
          )}

        </div>
      </GlassCard>
    </div>
  );
};