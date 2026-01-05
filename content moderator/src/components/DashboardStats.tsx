import { useState, useEffect } from "react";
import { GlassCard } from "./ui/GlassCard";
import { BookOpen, BookMarked, HelpCircle, Users, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface StatItemProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatItem = ({ label, value, icon, color }: StatItemProps) => (
  <GlassCard className="flex items-center gap-4 p-4 min-w-[140px]" hover={true}>
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className="text-xl font-extrabold text-foreground">{value}</p>
    </div>
  </GlassCard>
);

export const DashboardStats = () => {
  const [stats, setStats] = useState({
    subjects: 0,
    lessons: 0,
    quizzes: 0,
    students: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: subjectCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true });
      const { count: lessonCount } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
      const { count: quizCount } = await supabase.from('quizzes').select('*', { count: 'exact', head: true });
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      setStats({
        subjects: subjectCount || 0,
        lessons: lessonCount || 0,
        quizzes: quizCount || 0,
        students: studentCount || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto mb-8 animate-fade-up">
      <StatItem 
        label="Subjects" 
        value={stats.subjects} 
        icon={<BookMarked className="w-5 h-5 text-white" />} 
        color="from-blue-500 to-indigo-500" 
      />
      <StatItem 
        label="Lessons" 
        value={stats.lessons} 
        icon={<BookOpen className="w-5 h-5 text-white" />} 
        color="from-purple-500 to-pink-500" 
      />
      <StatItem 
        label="Quizzes" 
        value={stats.quizzes} 
        icon={<HelpCircle className="w-5 h-5 text-white" />} 
        color="from-orange-500 to-red-500" 
      />
      <StatItem 
        label="Students" 
        value={stats.students} 
        icon={<Users className="w-5 h-5 text-white" />} 
        color="from-emerald-500 to-teal-500" 
      />
    </div>
  );
};
