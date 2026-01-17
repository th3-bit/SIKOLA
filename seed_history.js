const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
1. Foundations of History
Introduction to History
Meaning and Scope of History
Importance of Studying History
Sources of History
Archaeological Sources
Literary Sources
Oral Traditions
Historical Evidence and Interpretation
Historical Chronology
Historical Periodization

2. Prehistoric History
Definition of Prehistory
Paleolithic Age
Mesolithic Age
Neolithic Age
Stone Tools and Early Technology
Early Human Evolution
Cave Art and Culture
Transition to Agriculture

3. Ancient Civilizations
Mesopotamian Civilization
Egyptian Civilization
Indus Valley Civilization
Chinese Civilization
Ancient Greek Civilization
Ancient Roman Civilization
Contributions of Ancient Civilizations

4. Classical Civilizations
Classical Greece
Greek Philosophy and Democracy
Hellenistic World
Roman Republic
Roman Empire
Roman Law and Administration
Decline of the Roman Empire

5. Medieval History
Early Middle Ages
Feudal System
Rise of Kingdoms in Europe
Medieval Church
Islamic Golden Age
Crusades
Medieval Trade and Cities
Black Death and Social Change

6. African History (Ancient to Medieval)
Early African Societies
Kingdom of Egypt
Nubian Civilization
Kingdom of Axum
Ghana Empire
Mali Empire
Songhai Empire
Great Zimbabwe
Swahili City-States
African Trade Networks

7. Asian History
Ancient India
Maurya and Gupta Empires
History of China (Dynasties)
Japanese Feudal System
Southeast Asian Kingdoms
Spread of Buddhism and Hinduism
Mongol Empire

8. European History
Renaissance
Reformation
Scientific Revolution
Age of Exploration
Absolute Monarchies
Enlightenment
French Revolution

9. Early Modern World History
Age of Discovery
Colonial Expansion
Transatlantic Slave Trade
Mercantilism
Early Capitalism
Cultural Exchanges
Global Trade Networks

10. History of the Americas
Pre-Columbian Civilizations
Spanish and Portuguese Colonization
British Colonization
American Revolution
Latin American Independence Movements

11. Industrial Revolution
Origins of the Industrial Revolution
Technological Innovations
Industrialization of Europe
Industrialization of America
Social and Economic Effects
Rise of Capitalism
Labor Movements

12. Modern World History
Nationalism
Imperialism
Scramble for Africa
World War I
Interwar Period
World War II
Cold War
Decolonization

13. African History (Modern)
Colonial Rule in Africa
Resistance Movements
Nationalist Movements
Independence of African States
Post-Independence Challenges
Pan-Africanism
African Union

14. History of Rwanda
Pre-Colonial Rwanda
Colonial Rwanda
Social and Political Changes
Independence of Rwanda
Post-Independence Rwanda
Genocide Against the Tutsi (Historical Study)
Reconstruction and Reconciliation

15. Political History
Evolution of Political Systems
History of Democracy
Monarchies and Republics
Revolutions and Reforms
History of Political Ideologies

16. Economic History
History of Agriculture
Trade and Commerce in History
History of Money
Industrial Capitalism
Globalization in History
Economic Crises in History

17. Social and Cultural History
Social Classes Through History
Family and Gender Roles
Religion and Society
Education in History
Art and Culture Through Time

18. History of Science and Technology
Ancient Science and Technology
Medieval Innovations
Scientific Revolution
Industrial Technology
Modern Science and Technology
Digital Age History

19. Military History
Ancient Warfare
Medieval Warfare
Gunpowder Empires
Modern Warfare
World Wars
Cold War Conflicts
Peacekeeping Operations

20. Diplomatic and International History
Origins of Diplomacy
Treaties and Alliances
International Organizations
League of Nations
United Nations
Global Conflicts and Cooperation

21. Intellectual History
History of Ideas
Philosophical Thought
Political Thought
Economic Thought
Social Theories

22. Cultural Heritage and Public History
Museums and Archives
Cultural Heritage Preservation
Oral History Methods
Memory and Identity
History Education

23. Historical Research and Methods
Historical Research Methods
Source Criticism
Historiography
Writing History
Citation and Referencing
Use of Archives and Libraries

24. Comparative and Thematic History
Comparative Civilizations
Comparative Revolutions
History of Empires
History of Colonialism
History of Globalization

25. Contemporary History
Post-Cold War World
Globalization and Technology
Contemporary Conflicts
Global Political Economy
International Relations Today
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Check if line starts with a number followed by a dot (e.g., "1. ")
    const isTopic = /^\d+\.\s/.test(line);
    
    if (isTopic) {
      if (currentTopic) {
        topics.push(currentTopic);
      }
      currentTopic = {
        title: line.replace(/^\d+\.\s/, '').trim(),
        lessons: []
      };
    } else {
      if (currentTopic) {
        currentTopic.lessons.push(line);
      }
    }
  });
  if (currentTopic) topics.push(currentTopic);
  return topics;
}

async function seed() {
  console.log('Starting seeding History...');
  
  const subjectName = 'History';
  const { data: subjectData, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .ilike('name', subjectName)
    .single();
    
  let subjectId;
  
  if (subjectError && subjectError.code !== 'PGRST116') {
    console.error('Error fetching subject:', subjectError);
    return;
  }

  if (subjectData) {
    console.log(`Found existing ${subjectName} subject:`, subjectData.id);
    subjectId = subjectData.id;
  } else {
    console.log(`Creating ${subjectName} subject...`);
    const { data: newSubject, error: createError } = await supabase
      .from('subjects')
      .insert([{
        name: subjectName,
        description: 'The study of past events, particularly in human affairs.',
        icon: 'BookOpen', 
        color: '#8B4513', // SaddleBrown
        level: 'Intermediate',
        price: 0
      }])
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating subject:', createError);
      return;
    }
    subjectId = newSubject.id;
  }

  const topics = parseData(RAW_DATA);
  console.log(`Parsed ${topics.length} topics.`);

  for (const topic of topics) {
    console.log(`Processing Topic: ${topic.title}`);
    
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('title', topic.title)
      .single();

    let topicId;
    if (existingTopic) {
       topicId = existingTopic.id;
    } else {
       const { data: newTopic, error: topicError } = await supabase
        .from('topics')
        .insert([{
          subject_id: subjectId,
          title: topic.title
        }])
        .select()
        .single();
        
       if (topicError) {
         console.error(`Failed to insert topic ${topic.title}:`, topicError);
         continue;
       }
       topicId = newTopic.id;
    }

    const lessonsToInsert = topic.lessons.map((lessonTitle, index) => ({
      topic_id: topicId,
      title: lessonTitle,
      content: JSON.stringify([
        {
          type: 'text',
          title: lessonTitle,
          content: `Introduction to ${lessonTitle}. This lesson covers the historical significance and events related to ${lessonTitle} as part of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `What is a key aspect of ${lessonTitle}?`,
          options: ['Primary Sources', 'Chronology', 'Historical Context', 'Evidence'],
          correctAnswer: 0
        }
      ]),
      duration: 15
    }));

    if (lessonsToInsert.length > 0) {
      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);
        
      if (lessonsError) {
        console.error(`Error inserting lessons for ${topic.title}:`, lessonsError);
      } else {
        console.log(`  Inserted ${lessonsToInsert.length} lessons.`);
      }
    }
  }
  
  console.log('History Seeding complete!');
}

seed();
