const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
. Introduction to Entrepreneurship
Meaning and Nature of Entrepreneurship
Entrepreneur vs Intrapreneur
Characteristics of Successful Entrepreneurs
Role of Entrepreneurship in Economic Development
Types of Entrepreneurs
Entrepreneurial Mindset
Ethics and Social Responsibility in Entrepreneurship

2. Foundations of Business Studies
Meaning and Scope of Business
Objectives of Business
Business Environment
Internal and External Business Environment
Stakeholders in Business
Forms of Business Ownership
Public vs Private Enterprises

3. Opportunity Identification and Idea Generation
Identifying Business Opportunities
Creativity and Innovation
Problem-Based Entrepreneurship
Market Gaps and Customer Needs
Design Thinking
Feasibility Analysis
Opportunity Screening

4. Business Planning
Purpose of a Business Plan
Executive Summary
Business Description
Market Analysis
Product and Service Description
Marketing Strategy
Operations Plan
Financial Plan
Risk Analysis
Business Plan Presentation

5. Market Research and Customer Analysis
Meaning and Importance of Market Research
Primary and Secondary Research
Market Segmentation
Target Market Selection
Consumer Behavior
Competitive Analysis
Value Proposition

6. Innovation and Product Development
Innovation Types
Product Life Cycle
Minimum Viable Product (MVP)
Product Design and Development
Prototyping and Testing
Quality Management
Continuous Improvement

7. Marketing Management for Entrepreneurs
Introduction to Marketing
Marketing Mix (4Ps and 7Ps)
Branding and Brand Management
Pricing Strategies
Promotion and Advertising
Digital Marketing
Sales and Distribution Channels
Customer Relationship Management

8. Operations and Production Management
Operations Management Overview
Production Planning and Control
Supply Chain Basics
Inventory Management
Quality Control
Process Optimization
Lean Operations

9. Financial Management for Entrepreneurs
Basic Accounting Concepts
Financial Statements
Costing and Budgeting
Cash Flow Management
Break-Even Analysis
Sources of Finance
Financial Forecasting
Financial Risk Management

10. Legal Aspects of Business
Business Laws Overview
Business Registration Procedures
Contracts and Agreements
Intellectual Property Rights
Consumer Protection Laws
Employment Laws
Business Taxation Basics
Compliance and Regulation

11. Human Resource Management
Role of HR in Business
Recruitment and Selection
Training and Development
Performance Management
Motivation and Leadership
Compensation and Benefits
Workplace Ethics and Culture

12. Small and Medium Enterprises (SMEs)
Definition and Importance of SMEs
SME Challenges
SME Growth Strategies
Government Support for SMEs
Informal Sector Businesses
Family Businesses
Cooperative Enterprises

13. Social Entrepreneurship
Meaning of Social Entrepreneurship
Social Enterprise Models
Measuring Social Impact
Sustainable Development Goals
Community-Based Enterprises
Ethical Business Practices

14. Innovation, Technology, and Digital Business
Technology in Entrepreneurship
E-Business Models
E-Commerce Platforms
Digital Payments
Business Automation
Artificial Intelligence in Business
Cybersecurity Basics

15. Strategic Management
Meaning of Strategy
Vision and Mission
SWOT Analysis
PESTLE Analysis
Competitive Strategies
Business Growth Strategies
Corporate Strategy

16. Risk Management and Business Failure
Types of Business Risks
Risk Identification and Assessment
Risk Mitigation Strategies
Crisis Management
Business Failure Causes
Business Turnaround Strategies
Business Exit Strategies

17. Ethics, Corporate Governance, and Sustainability
Business Ethics
Corporate Governance Principles
Corporate Social Responsibility
Environmental Sustainability
Ethical Decision-Making
Sustainable Business Models

18. Entrepreneurship Finance and Investment
Bootstrapping
Angel Investors
Venture Capital
Crowdfunding
Financial Valuation
Investor Pitching
Negotiation with Investors

19. Business Growth and Scaling
Growth Planning
Market Expansion
Franchising
Internationalization
Strategic Alliances
Mergers and Acquisitions
Scaling Challenges

20. International Business
Meaning of International Business
Global Trade Environment
Export and Import Procedures
Trade Barriers
Foreign Exchange Basics
Global Market Entry Strategies
Cultural Considerations in Business

21. Entrepreneurial Leadership and Management
Leadership Styles
Decision-Making
Team Management
Conflict Resolution
Communication Skills
Time Management
Entrepreneurial Culture

22. Business Analytics and Decision Making
Introduction to Business Analytics
Data Collection and Analysis
Key Performance Indicators
Financial and Market Analytics
Data-Driven Decision Making
Business Intelligence Tools

23. Project Management for Entrepreneurs
Project Planning
Scheduling and Budgeting
Risk Management in Projects
Monitoring and Evaluation
Agile and Traditional Project Management
Project Documentation

24. Contemporary Issues in Entrepreneurship
Green Entrepreneurship
Youth Entrepreneurship
Women Entrepreneurship
Informal Economy
Startups and Innovation Ecosystems
Government Policy and Entrepreneurship

25. Practical Entrepreneurship and Case Studies
Business Case Studies
Startup Simulations
Business Pitch Practice
Internship and Field Projects
Business Competitions
Real-World Problem Solving
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Check if line starts with a number followed by a dot (e.g., "1. ")
    // Or starts with a dot followed by space (the first item in this dataset)
    const isTopic = /^\d+\.\s/.test(line) || line.startsWith('. ');
    
    if (isTopic) {
      if (currentTopic) {
        topics.push(currentTopic);
      }
      currentTopic = {
        title: line.replace(/^\d+\.\s|^\.\s/, '').trim(),
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
  console.log('Starting seeding Entrepreneurship...');
  
  const subjectName = 'Entrepreneurship / Business Studies';
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
        description: 'The process of designing, launching and running a new business.',
        icon: 'Briefcase', 
        color: '#EF4444', 
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
          content: `Introduction to ${lessonTitle}. This lesson covers the key concepts of ${lessonTitle} as part of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `What is a primary goal of ${lessonTitle}?`,
          options: ['Business Growth', 'Risk Mitigation', 'Market Presence', 'Innovation'],
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
  
  console.log('Entrepreneurship Seeding complete!');
}

seed();
