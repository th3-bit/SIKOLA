const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
FOUNDATIONS OF SUPPLY AND PROCUREMENT MANAGEMENT
Nature and Scope of Supply and Procurement
Role of Procurement in Organizations
Evolution of Supply Management
Procurement Ethics and Professional Conduct
Procurement Regulatory Environment

PROCUREMENT PRINCIPLES AND PRACTICES
Procurement Planning
Needs Assessment
Procurement Methods
Supplier Selection
Procurement Documentation

PURCHASING MANAGEMENT
Purchasing Functions
Make-or-Buy Decisions
Vendor Rating and Evaluation
Negotiation Techniques
Contract Management

SUPPLY CHAIN MANAGEMENT – FUNDAMENTALS
Supply Chain Concepts
Supply Chain Structures
Supply Chain Integration
Value Chain Analysis

LOGISTICS MANAGEMENT
Transportation Management
Warehousing and Distribution
Inventory Control
Materials Handling
Logistics Network Design

INVENTORY AND STORES MANAGEMENT
Inventory Classification
Stock Control Techniques
Economic Order Quantity
Stores Layout and Operations
Inventory Record Systems

PROCUREMENT LAW AND REGULATION
Public Procurement Law
Contract Law for Procurement
International Trade Law Basics
Compliance and Legal Risk

PUBLIC PROCUREMENT MANAGEMENT
Public Procurement Systems
Tendering Procedures
Procurement Planning in Public Sector
Accountability and Transparency

PRIVATE SECTOR PROCUREMENT
Corporate Procurement Strategies
Strategic Sourcing
Supplier Relationship Management
Cost Reduction Techniques

CONTRACT AND NEGOTIATION MANAGEMENT
Contract Types
Contract Lifecycle Management
Procurement Negotiation Strategies
Dispute Resolution

PROCUREMENT RISK MANAGEMENT
Identification of Procurement Risks
Risk Assessment Techniques
Risk Mitigation Strategies
Supplier Risk Management

STRATEGIC PROCUREMENT MANAGEMENT
Procurement Strategy Development
Category Management
Global Sourcing
Procurement Performance Measurement

SUPPLY CHAIN PLANNING AND CONTROL
Demand Forecasting
Production Planning
Capacity Planning
Supply Chain Coordination

QUALITY MANAGEMENT IN SUPPLY CHAIN
Quality Standards
Supplier Quality Management
Total Quality Management
Continuous Improvement

SUSTAINABLE PROCUREMENT (MISSING – NOW ADDED)
Green Procurement
Ethical Sourcing
Socially Responsible Procurement
Circular Supply Chains

INTERNATIONAL PROCUREMENT AND TRADE
Global Sourcing
Incoterms
Import and Export Procedures
Customs and Trade Compliance

E-PROCUREMENT AND DIGITAL SUPPLY CHAINS (MISSING – NOW ADDED)
Electronic Procurement Systems
Procurement Software
Digital Supply Chain Technologies
Blockchain in Procurement

SUPPLY CHAIN ANALYTICS (MISSING – NOW ADDED)
Data Analysis in Supply Chains
Key Performance Indicators
Forecasting and Optimization Models

HUMANITARIAN AND NGO PROCUREMENT (MISSING – NOW ADDED)
Emergency Procurement
Donor-Funded Procurement
Logistics in Humanitarian Operations

PROCUREMENT FINANCE AND COST MANAGEMENT
Cost Analysis
Total Cost of Ownership
Budgeting for Procurement
Value for Money Analysis

WAREHOUSE AND DISTRIBUTION STRATEGY
Warehouse Design
Distribution Strategy
Last-Mile Logistics

TRANSPORT AND FLEET MANAGEMENT
Transport Planning
Fleet Operations
Maintenance Management
Transport Cost Control

SUPPLY CHAIN SECURITY AND FRAUD MANAGEMENT (MISSING – NOW ADDED)
Fraud Risks in Procurement
Anti-Corruption Measures
Supply Chain Security Systems

PROCUREMENT PERFORMANCE MANAGEMENT
Procurement KPIs
Benchmarking
Procurement Audits

PUBLIC-PRIVATE PARTNERSHIPS AND PROJECT PROCUREMENT
PPP Frameworks
Infrastructure Procurement
Risk Sharing Mechanisms

STRATEGIC SUPPLY CHAIN MANAGEMENT (MSc LEVEL)
Advanced Supply Chain Strategy
Network Optimization
Global Supply Chain Risk

OPERATIONS AND SUPPLY CHAIN INTEGRATION
Operations Strategy
Lean Supply Chains
Agile Supply Chains

PROCUREMENT PROFESSIONAL PRACTICE
Professional Certifications Overview
Ethics and Compliance
Case Studies in Procurement

SUPPLY AND PROCUREMENT RESEARCH METHODS
Research Design in Supply Chain
Quantitative Methods
Qualitative Methods

ADVANCED SUPPLY CHAIN THEORY (PhD LEVEL)
Supply Chain Economics
Coordination Theory
Network Theory

DOCTORAL SEMINARS IN SUPPLY AND PROCUREMENT
Contemporary Issues in Supply Management
Policy Analysis
Dissertation Development

SUPPLY AND PROCUREMENT RESEARCH AND PUBLICATION
Academic Writing
Journal Publication
Policy-Oriented Research
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Heuristic: Uppercase lines are topics
    const isHeader = line === line.toUpperCase() && line.length > 5 && !line.includes(':') && !line.includes('/');
    
    if (isHeader) {
      if (currentTopic) {
        topics.push(currentTopic);
      }
      let title = line.replace(/\(MISSING – NOW ADDED\)/g, '').trim();
      title = title.replace(/\(MSc LEVEL\)/g, '').trim();
      title = title.replace(/\(PhD LEVEL\)/g, '').trim();
      title = title.replace(/– FUNDAMENTALS/g, '- Fundamentals').trim();

      currentTopic = {
        title: toTitleCase(title),
        lessons: []
      };
    } else {
      if (currentTopic) {
        currentTopic.lessons.push(line);
      } else if (topics.length === 0) {
        currentTopic = {
            title: toTitleCase(line),
            lessons: []
        };
      }
    }
  });
  if (currentTopic) topics.push(currentTopic);
  return topics;
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

async function seed() {
  console.log('Starting seeding Supply Chain...');
  
  const subjectName = 'Supply Chain and Procurement Management';
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
        description: 'Management of the flow of goods and services, including all processes that transform raw materials into final products.',
        icon: 'Truck', 
        color: '#8B5CF6', // Violet
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
          content: `Introduction to ${lessonTitle}. This lesson covers the fundamental concepts of ${lessonTitle} as part of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `Which of these is a core concept in ${lessonTitle}?`,
          options: ['Logistics', 'Procurement', 'Sustainability', 'Operations'],
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
  
  console.log('Supply Chain Seeding complete!');
}

seed();
