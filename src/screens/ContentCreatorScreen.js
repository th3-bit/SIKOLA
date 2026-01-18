import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Dimensions, 
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Layout, 
  BookOpen, 
  HelpCircle,
  Video as VideoIcon,
  ChevronRight,
  Trash2,
  CheckCircle2,
  FileText,
  Tag
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const TabButton = ({ active, label, icon: Icon, onPress, theme }) => (
  <TouchableOpacity 
    style={[
      styles.tabButton, 
      active && { backgroundColor: theme.colors.secondary + '20', borderColor: theme.colors.secondary }
    ]} 
    onPress={onPress}
  >
    <Icon size={18} color={active ? theme.colors.secondary : theme.colors.textSecondary} />
    <Text style={[
      styles.tabLabel, 
      { color: active ? theme.colors.secondary : theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const GlassPicker = ({ label, items, value, onValueChange, theme, isDark, placeholder }) => {
  const [showPicker, setShowPicker] = useState(false);
  const selectedItem = items.find(i => i.id === value);

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity onPress={() => setShowPicker(!showPicker)}>
        <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.inputContainer, { borderColor: theme.colors.glassBorder }]}>
          <View style={styles.inputInner}>
             <Layout size={20} color={theme.colors.textSecondary} style={styles.fieldIcon} />
             <Text style={[styles.input, { color: selectedItem ? theme.colors.textPrimary : 'rgba(255,255,255,0.3)', paddingTop: 15 }]}>
               {selectedItem ? (selectedItem.name || selectedItem.title) : placeholder}
             </Text>
             <ChevronRight size={20} color={theme.colors.textSecondary} style={{ transform: [{ rotate: showPicker ? '90deg' : '0deg' }] }} />
          </View>
        </BlurView>
      </TouchableOpacity>
      
      {showPicker && (
        <View style={styles.pickerList}>
          {items.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.pickerItem} 
              onPress={() => {
                onValueChange(item.id);
                setShowPicker(false);
              }}
            >
              <Text style={{ color: theme.colors.textPrimary }}>{item.name || item.title}</Text>
              {value === item.id && <CheckCircle2 size={16} color={theme.colors.secondary} />}
            </TouchableOpacity>
          ))}
          {items.length === 0 && <Text style={styles.emptyText}>No items found</Text>}
        </View>
      )}
    </View>
  );
};

const GlassInput = ({ label, placeholder, value, onChangeText, theme, icon: Icon, isDark, multiline = false }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{label}</Text>
    <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.inputContainer, { borderColor: theme.colors.glassBorder }]}>
       <View style={styles.inputInner}>
          {Icon && <Icon size={20} color={theme.colors.textSecondary} style={styles.fieldIcon} />}
          <TextInput
            style={[
              styles.input, 
              { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily },
              multiline && { height: 100, textAlignVertical: 'top' }
            ]}
            placeholder={placeholder}
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
          />
       </View>
    </BlurView>
  </View>
);

export default function ContentCreatorScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('subject'); // subject, lesson, quiz
  const [loading, setLoading] = useState(false);
  
  // Data Lists for Pickers
  const [subjectsList, setSubjectsList] = useState([]);
  const [topicsList, setTopicsList] = useState([]);
  const [lessonsList, setLessonsList] = useState([]);

  // Selections
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  
  // Subject Form State
  const [subjectTitle, setSubjectTitle] = useState('');
  const [subjectCategory, setSubjectCategory] = useState('');
  const [subjectColor, setSubjectColor] = useState('#8B5CF6');

  // Topic Form State
  const [topicTitle, setTopicTitle] = useState('');
  
  // Lesson Form State
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonNotes, setLessonNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  // Examples State
  const [examples, setExamples] = useState([]);
  const [exTitle, setExTitle] = useState('');
  const [exProblem, setExProblem] = useState('');
  const [exSolution, setExSolution] = useState('');

  // Quiz Form State
  const [quizQuestion, setQuizQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  React.useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase.from('subjects').select('*').order('created_at', { ascending: true }); // Chronological Order
    if (data) setSubjectsList(data);
  };

  const fetchTopics = async (subjectId) => {
    const { data, error } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('created_at', { ascending: true }); // Chronological Order
    if (data) setTopicsList(data);
  };

  const fetchLessons = async (topicId) => {
    const { data, error } = await supabase.from('lessons').select('*').eq('topic_id', topicId).order('created_at', { ascending: true }); // Chronological Order
    if (data) setLessonsList(data);
  };

  const handleSave = async () => {
    if (activeTab === 'subject') {
      if (!subjectTitle || !subjectCategory) {
        Alert.alert('Missing Info', 'Please provide both title and category.');
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('subjects')
          .insert([
            { 
              name: subjectTitle, 
              category: subjectCategory, 
              color: subjectColor,
              icon: 'BookOpen' // Default icon for now
            }
          ]);

        if (error) throw error;

        Alert.alert('Success ✨', 'Subject "' + subjectTitle + '" has been created!');
        setSubjectTitle('');
        setSubjectCategory('');
        fetchSubjects();
      } catch (error) {
        console.error('Save Error:', error);
        Alert.alert('Error', 'Failed to save subject.');
      } finally {
        setLoading(false);
      }
    } else if (activeTab === 'topic') {
      if (!selectedSubject || !topicTitle) {
        Alert.alert('Missing Info', 'Select a subject and enter a topic title.');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.from('topics').insert([{ subject_id: selectedSubject, title: topicTitle }]);
        if (error) throw error;
        Alert.alert('Success ✨', 'Topic created!');
        setTopicTitle('');
        fetchTopics(selectedSubject);
      } catch (e) { Alert.alert('Error', e.message); }
      finally { setLoading(false); }
    } else if (activeTab === 'lesson') {
      if (!selectedTopic || !lessonTitle || !lessonContent) {
        Alert.alert('Missing Info', 'Topic, Title, and Content are required.');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.from('lessons').insert([{
          topic_id: selectedTopic,
          title: lessonTitle,
          video_url: videoUrl,
          pdf_url: pdfUrl,
          content: JSON.stringify([
            // Slide 1: Big Title
            { type: 'intro', title: lessonTitle, content: 'Welcome to this lesson! Tap next to begin.' },
            // Slide 2: Lesson Goal
            { type: 'content', title: 'What you will learn', content: lessonContent.substring(0, 200) + (lessonContent.length > 200 ? '...' : '') },
            // Slide 3: Core Content
            { type: 'content', title: 'Lesson Explanation', content: lessonContent },
            // Examples (Each on its own slide)
            ...examples.map(ex => ({
              type: 'content',
              isExample: true,
              title: ex.title,
              content: `${ex.problem}\n\nSolution:\n${ex.solution}\n\n💡 Access more examples via the bulb icon.`
            }))
          ])
        }]);
        if (error) throw error;
        Alert.alert('Success ✨', 'Lesson saved with refined 4-step flow!');
        setLessonTitle('');
        setLessonContent('');
        setLessonNotes('');
      } catch (e) { Alert.alert('Error', e.message); }
      finally { setLoading(false); }
    } else if (activeTab === 'quiz') {
      if (!selectedLesson || !quizQuestion || options.some(o => !o)) {
        Alert.alert('Missing Info', 'Please complete the question and all options.');
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.from('quizzes').insert([{
          lesson_id: selectedLesson,
          question: quizQuestion,
          options: options,
          correct_answer: correctAnswer
        }]);
        if (error) throw error;
        Alert.alert('Success ✨', 'Quiz question added!');
        setQuizQuestion('');
        setOptions(['','','','']);
      } catch (e) { Alert.alert('Error', e.message); }
      finally { setLoading(false); }
    }
  };

  const renderTopicForm = () => (
    <Animated.View style={styles.formContainer}>
      <GlassPicker 
        label="Select Subject" 
        items={subjectsList} 
        value={selectedSubject} 
        onValueChange={(val) => {
          setSelectedSubject(val);
          fetchTopics(val);
        }} 
        theme={theme} 
        isDark={isDark} 
        placeholder="Choose Father Subject"
      />
      <GlassInput 
        label="Course Title" 
        placeholder="e.g. Differentiation Rules" 
        value={topicTitle}
        onChangeText={setTopicTitle}
        theme={theme}
        isDark={isDark}
        icon={Tag}
      />
    </Animated.View>
  );

  const renderLessonForm = () => (
    <Animated.View style={styles.formContainer}>
      <GlassPicker 
        label="Select Subject" 
        items={subjectsList} 
        value={selectedSubject} 
        onValueChange={(val) => {
          setSelectedSubject(val);
          fetchTopics(val);
        }} 
        theme={theme} 
        isDark={isDark} 
        placeholder="Pick Subject"
      />
      <GlassPicker 
        label="Select Course" 
        items={topicsList} 
        value={selectedTopic} 
        onValueChange={(val) => {
          setSelectedTopic(val);
          fetchLessons(val);
        }} 
        theme={theme} 
        isDark={isDark} 
        placeholder="Pick Course"
      />
      <GlassInput 
        label="Lesson Title" 
        placeholder="e.g. Introduction to Calculus" 
        value={lessonTitle}
        onChangeText={setLessonTitle}
        theme={theme}
        isDark={isDark}
        icon={BookOpen}
      />
      
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Rich Media</Text>
        </View>
      </View>

      <GlassInput 
        label="Video Walkthrough URL" 
        placeholder="https://example.com/video.mp4" 
        value={videoUrl}
        onChangeText={setVideoUrl}
        theme={theme}
        isDark={isDark}
        icon={VideoIcon}
      />

      <GlassInput 
        label="Reference PDF URL" 
        placeholder="https://example.com/handout.pdf" 
        value={pdfUrl}
        onChangeText={setPdfUrl}
        theme={theme}
        isDark={isDark}
        icon={FileText}
      />

      <GlassInput 
        label="Lesson Body (Core Theory)" 
        placeholder="Write the core learning material here..." 
        value={lessonContent}
        onChangeText={setLessonContent}
        theme={theme}
        isDark={isDark}
        multiline={true}
      />

      <GlassInput 
        label="Study Notes (Deep Dive)" 
        placeholder="Add extra tips, notes, and key takeaways..." 
        value={lessonNotes}
        onChangeText={setLessonNotes}
        theme={theme}
        isDark={isDark}
        multiline={true}
      />
    </Animated.View>
  );

  const handleAddExample = () => {
    if (!exTitle || !exProblem || !exSolution) {
      Alert.alert('Missing Info', 'Please fill in title, problem and solution.');
      return;
    }
    setExamples([...examples, { title: exTitle, problem: exProblem, solution: exSolution }]);
    setExTitle('');
    setExProblem('');
    setExSolution('');
  };

  const renderExamplesForm = () => (
    <Animated.View style={styles.formContainer}>
      <GlassPicker 
        label="Select Lesson" 
        items={lessonsList} 
        value={selectedLesson} 
        onValueChange={setSelectedLesson} 
        theme={theme} 
        isDark={isDark} 
        placeholder="Assign to Lesson"
      />
      
      <View style={{ padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, gap: 15 }}>
        <Text style={[styles.inputLabel, { color: theme.colors.secondary }]}>Add New Example</Text>
        <GlassInput 
          label="Example Title" 
          placeholder="e.g. Solving for X" 
          value={exTitle}
          onChangeText={setExTitle}
          theme={theme}
          isDark={isDark}
          icon={Tag}
        />
        <GlassInput 
          label="Problem" 
          placeholder="The math problem or scenario..." 
          value={exProblem}
          onChangeText={setExProblem}
          theme={theme}
          isDark={isDark}
          multiline={true}
        />
        <GlassInput 
          label="Solution" 
          placeholder="Step-by-step solution..." 
          value={exSolution}
          onChangeText={setExSolution}
          theme={theme}
          isDark={isDark}
          multiline={true}
        />
        <TouchableOpacity 
          onPress={handleAddExample}
          style={{ backgroundColor: `${theme.colors.secondary}20`, padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.secondary }}
        >
          <Text style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>+ Add to Lesson</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Current Examples ({examples.length})</Text>
      {examples.map((ex, idx) => (
        <View key={idx} style={{ padding: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>{ex.title}</Text>
            <Text numberOfLines={1} style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{ex.problem.substring(0, 40)}...</Text>
          </View>
          <TouchableOpacity onPress={() => setExamples(examples.filter((_, i) => i !== idx))}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
    </Animated.View>
  );

  const renderQuizForm = () => (
    <Animated.View style={styles.formContainer}>
      <GlassPicker 
        label="Select Lesson" 
        items={lessonsList} 
        value={selectedLesson} 
        onValueChange={setSelectedLesson} 
        theme={theme} 
        isDark={isDark} 
        placeholder="Assign to Lesson"
      />
      <GlassInput 
        label="Question" 
        placeholder="e.g. What is the derivative of x^2?" 
        value={quizQuestion}
        onChangeText={setQuizQuestion}
        theme={theme}
        isDark={isDark}
        icon={HelpCircle}
      />
      <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginBottom: 10, marginTop: 10 }]}>Options & Correct Answer</Text>
      {options.map((opt, idx) => (
        <View key={idx} style={styles.optionRow}>
          <TouchableOpacity 
            style={[styles.radio, { borderColor: correctAnswer === idx ? theme.colors.secondary : theme.colors.glassBorder }]}
            onPress={() => setCorrectAnswer(idx)}
          >
            {correctAnswer === idx && <View style={[styles.radioInner, { backgroundColor: theme.colors.secondary }]} />}
          </TouchableOpacity>
          <BlurView intensity={10} tint={isDark ? "dark" : "light"} style={[styles.optionInput, { borderColor: theme.colors.glassBorder }]}>
            <TextInput 
              style={{ color: theme.colors.textPrimary, flex: 1, padding: 12 }}
              placeholder={`Option ${idx + 1}`}
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
              value={opt}
              onChangeText={(text) => {
                const newOpts = [...options];
                newOpts[idx] = text;
                setOptions(newOpts);
              }}
            />
          </BlurView>
        </View>
      ))}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
               <ArrowLeft color={theme.colors.textPrimary} size={24} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Content Creator</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={loading}
              style={[styles.saveBtn, { backgroundColor: theme.colors.secondary, opacity: loading ? 0.7 : 1 }]}
            >
               {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Save color="#FFF" size={20} />}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Tab Swiper */}
            <View style={styles.tabContainer}>
               <TabButton active={activeTab === 'subject'} label="Sub" icon={Layout} theme={theme} onPress={() => setActiveTab('subject')} />
               <TabButton active={activeTab === 'topic'} label="Course" icon={Tag} theme={theme} onPress={() => setActiveTab('topic')} />
               <TabButton active={activeTab === 'lesson'} label="Lesson" icon={BookOpen} theme={theme} onPress={() => setActiveTab('lesson')} />
               <TabButton active={activeTab === 'example'} label="Ex" icon={Lightbulb} theme={theme} onPress={() => setActiveTab('example')} />
               <TabButton active={activeTab === 'quiz'} label="Quiz" icon={HelpCircle} theme={theme} onPress={() => setActiveTab('quiz')} />
            </View>

            {/* Form Rendering */}
            {activeTab === 'subject' && (
              <Animated.View style={styles.formContainer}>
                <GlassInput 
                  label="Subject Name" 
                  placeholder="e.g. Advanced Mathematics" 
                  value={subjectTitle}
                  onChangeText={setSubjectTitle}
                  theme={theme}
                  isDark={isDark}
                  icon={Layout}
                />
                <GlassInput 
                  label="Category" 
                  placeholder="e.g. Science, Tech, Arts" 
                  value={subjectCategory}
                  onChangeText={setSubjectCategory}
                  theme={theme}
                  isDark={isDark}
                  icon={Tag}
                />
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Theme Color</Text>
                  <View style={styles.colorRow}>
                    {['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'].map(color => (
                      <TouchableOpacity 
                        key={color}
                        style={[styles.colorCircle, { backgroundColor: color, borderColor: subjectColor === color ? '#FFF' : 'transparent' }]}
                        onPress={() => setSubjectColor(color)}
                      >
                        {subjectColor === color && <CheckCircle2 size={16} color="#FFF" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
            {activeTab === 'topic' && renderTopicForm()}
            {activeTab === 'lesson' && renderLessonForm()}
            {activeTab === 'example' && renderExamplesForm()}
            {activeTab === 'quiz' && renderQuizForm()}

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 6,
    marginBottom: 30,
    gap: 5,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  inputContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionInput: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerList: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 10,
    gap: 10,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    padding: 10,
  }
});
