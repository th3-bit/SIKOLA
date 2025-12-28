import { useState } from "react";
import { Header } from "@/components/Header";
import { SubjectTopicForm } from "@/components/SubjectTopicForm";
import { ContentBuilder } from "@/components/ContentBuilder";
import { FloatingOrbs } from "@/components/FloatingOrbs";

interface SelectionData {
  id: string;
  name?: string;
  title?: string;
}

const Index = () => {
  const [subject, setSubject] = useState<SelectionData | null>(null);
  const [topic, setTopic] = useState<SelectionData | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleStart = (newSubject: SelectionData, newTopic: SelectionData) => {
    setSubject(newSubject);
    setTopic(newTopic);
    setIsStarted(true);
  };

  const handleBack = () => {
    setIsStarted(false);
    setSubject(null);
    setTopic(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen mesh-background relative overflow-hidden">
      <FloatingOrbs />
      
      <div className="relative z-10">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
          <Header
            subject={isStarted ? subject?.name : undefined}
            topic={isStarted ? topic?.title : undefined}
            onBack={isStarted ? handleBack : undefined}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <main className="py-8">
            {!isStarted ? (
              <div className="flex flex-col items-center">
                <div className="text-center mb-12 animate-fade-up">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                    <span className="gradient-text">Build Beautiful</span>
                    <br />
                    <span className="text-foreground">Learning Content</span>
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Create engaging lessons, examples, and questions with our
                    intuitive content builder. Perfect for educators and learners.
                  </p>
                </div>
                <SubjectTopicForm onSubmit={handleStart} />
              </div>
            ) : (
              <ContentBuilder 
                subject={subject!} 
                topic={topic!} 
                searchQuery={searchQuery} 
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;

