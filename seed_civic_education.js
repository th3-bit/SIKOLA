const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
1. Introduction to Civic Education
Meaning and Purpose of Civic Education
Importance of Civic Education
Citizenship and Society
Rights, Duties, and Responsibilities of Citizens
Civic Values and Ethics
Active Citizenship

2. Citizenship
Meaning of Citizenship
Types of Citizenship
Acquisition and Loss of Citizenship
Dual Citizenship
Rights of Citizens
Duties and Obligations of Citizens
Responsible Citizenship

3. Constitution and Constitutionalism
Meaning of a Constitution
Types of Constitutions
Importance of a Constitution
Constitutional Principles
Constitutionalism
Rule of Law
Separation of Powers

4. Government and State
Meaning of Government
Organs of Government
Legislature
Executive
Judiciary
Functions of the State
Levels of Government
Public Administration

5. Democracy and Governance
Meaning of Democracy
Types of Democracy
Principles of Democracy
Good Governance
Accountability and Transparency
Participation in Governance
Democratic Institutions

6. Elections and Electoral Systems
Importance of Elections
Electoral Processes
Electoral Laws
Voter Registration
Political Campaigns
Voting Systems
Role of Electoral Commissions

7. Political Parties and Pressure Groups
Meaning of Political Parties
Functions of Political Parties
Party Systems
Pressure Groups
Civil Society Organizations
Role of Media in Politics

8. Human Rights
Meaning and Nature of Human Rights
Categories of Human Rights
Fundamental Human Rights
Human Rights Instruments
Human Rights Protection
Human Rights Violations
Role of Citizens in Promoting Human Rights

9. Justice, Law, and Order
Meaning of Justice
Types of Justice
Law and Legal Systems
Law Enforcement Agencies
Courts and Judiciary
Rule of Law in Society
Access to Justice

10. National Unity and Patriotism
Meaning of National Unity
Patriotism and National Identity
National Symbols
Social Cohesion
Peaceful Coexistence
Conflict Resolution
National Reconciliation

11. Civic Values and Ethics
Moral Values
Integrity and Honesty
Responsibility and Accountability
Respect and Tolerance
Gender Equality
Social Justice

12. Rights and Responsibilities of Special Groups
Children’s Rights
Women’s Rights
Rights of Persons with Disabilities
Youth Rights and Responsibilities
Minority Rights
Elderly Rights

13. Citizenship Education and Community Participation
Community Development
Volunteering
Civic Engagement
Local Governance
Community-Based Organizations
Public Service

14. Economic Citizenship
Meaning of Economic Citizenship
Taxation and Public Finance
Public Resources Management
Anti-Corruption
Entrepreneurship and Citizenship
Work Ethics

15. Peace Education and Conflict Management
Meaning of Peace
Causes of Conflict
Conflict Resolution Methods
Mediation and Negotiation
Peacebuilding
Non-Violence
Tolerance and Dialogue

16. Environmental Citizenship
Environmental Rights and Responsibilities
Sustainable Development
Environmental Conservation
Climate Change Awareness
Environmental Laws and Policies
Community Environmental Action

17. National and Regional Institutions
National Institutions
Independent Commissions
Ombudsman
Security Organs
Regional Organizations
African Union
East African Community

18. International Citizenship and Global Affairs
Global Citizenship
International Organizations
United Nations System
International Law Basics
Global Peace and Security
International Cooperation

19. Media Literacy and Civic Awareness
Role of Media in Society
Freedom of Expression
Responsible Media Use
Digital Citizenship
Combating Misinformation
Cyber Ethics

20. Leadership and Civic Responsibility
Leadership Styles
Ethical Leadership
Public Leadership
Youth Leadership
Decision-Making
Service Leadership

21. Civic Education in Rwanda
Rwandan Citizenship
Constitution of Rwanda
Governance System in Rwanda
National Values
Unity and Reconciliation Programs
Itorero and Civic Training

22. Contemporary Civic Issues
Corruption and Governance
Human Rights Challenges
Youth Participation
Gender Issues
Environmental Challenges
Technology and Citizenship

23. Civic Skills Development
Critical Thinking
Public Speaking
Debate and Dialogue
Advocacy Skills
Negotiation Skills
Community Problem Solving

24. Civic Education Assessment and Practice
Civic Projects
Case Studies
Role Plays and Simulations
Community Service Learning
Civic Competitions
Reflection and Evaluation
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
  console.log('Starting seeding Civic Education...');
  
  const subjectName = 'Civic Education';
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
        description: 'The study of the rights and duties of citizenship.',
        icon: 'Scale', 
        color: '#A855F7', 
        level: 'Beginner',
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
          content: `Introduction to ${lessonTitle}. This lesson covers the civic importance and key principles of ${lessonTitle} as part of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `What is a core value related to ${lessonTitle}?`,
          options: ['Responsibility', 'Integrity', 'Participation', 'Equality'],
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
  
  console.log('Civic Education Seeding complete!');
}

seed();
