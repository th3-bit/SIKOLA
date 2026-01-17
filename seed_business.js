const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
FOUNDATIONS OF BUSINESS MANAGEMENT
Nature and Scope of Business Management
Objectives and Functions of Management
Evolution of Management Thought
Role of Management in Organizations
Business Ethics and Corporate Responsibility
Business Environment Analysis

PRINCIPLES OF MANAGEMENT
Planning: Concepts and Process
Organizing: Authority, Responsibility, Accountability
Staffing and Human Resource Planning
Directing and Supervision
Coordination
Controlling and Performance Measurement

ORGANIZATIONAL BEHAVIOR
Nature and Scope of Organizational Behavior
Individual Behavior in Organizations
Personality and Attitudes
Perception and Learning
Motivation Theories
Leadership Styles
Group Dynamics
Organizational Culture

HUMAN RESOURCE MANAGEMENT
HRM Concepts and Objectives
Job Analysis and Design
Recruitment and Selection
Training and Development
Performance Appraisal
Compensation and Benefits
Employee Relations
Industrial Relations

BUSINESS COMMUNICATION
Principles of Business Communication
Written Communication
Oral Communication
Non-Verbal Communication
Business Reports and Proposals
Presentation Skills
Digital and Professional Communication

MARKETING MANAGEMENT
Meaning and Scope of Marketing
Marketing Environment
Consumer Behavior
Market Segmentation, Targeting, and Positioning
Product Management
Pricing Strategies
Promotion and Advertising
Distribution and Logistics

FINANCIAL MANAGEMENT
Objectives of Financial Management
Time Value of Money
Capital Budgeting
Cost of Capital
Capital Structure
Working Capital Management
Dividend Policy
Financial Planning and Control

ACCOUNTING FOR MANAGERS
Financial Accounting Basics
Income Statement
Balance Sheet
Cash Flow Statement
Cost Accounting Concepts
Budgeting and Cost Control
Management Accounting Techniques

OPERATIONS MANAGEMENT
Nature and Scope of Operations Management
Production Planning and Control
Facility Location and Layout
Inventory Management
Quality Management
Supply Chain Management
Lean Operations

STRATEGIC MANAGEMENT
Strategic Planning Process
Vision, Mission, and Objectives
Internal and External Analysis
Competitive Strategies
Corporate-Level Strategies
Strategy Implementation
Strategy Evaluation and Control

ENTREPRENEURSHIP AND SMALL BUSINESS MANAGEMENT
Concept of Entrepreneurship
Entrepreneurial Mindset
Business Idea Generation
Business Plan Preparation
Startup Financing
Growth Strategies
Family Business Management

BUSINESS LAW
Nature and Scope of Business Law
Law of Contracts
Sale of Goods Act
Company Law
Consumer Protection Laws
Intellectual Property Rights

INTERNATIONAL BUSINESS
Global Business Environment
International Trade Theories
Foreign Market Entry Strategies
International Marketing
International Finance
Cross-Cultural Management

MANAGEMENT INFORMATION SYSTEMS
Information Systems in Business
Decision Support Systems
Enterprise Resource Planning
Data Management
Business Analytics

PROJECT MANAGEMENT
Project Life Cycle
Project Planning and Scheduling
Cost and Risk Management
Project Monitoring and Control
Project Leadership

BUSINESS RESEARCH METHODS
Business Research Process
Research Design
Data Collection Techniques
Sampling Methods
Data Analysis and Interpretation
Research Ethics

SUPPLY CHAIN AND LOGISTICS MANAGEMENT
Supply Chain Concepts
Procurement Management
Warehousing
Transportation Management
Inventory Optimization
Global Logistics

QUALITY AND PERFORMANCE MANAGEMENT
Total Quality Management
Six Sigma
Continuous Improvement
Performance Measurement Systems
Benchmarking

RISK MANAGEMENT
Types of Business Risks
Risk Identification
Risk Assessment
Risk Mitigation Strategies
Enterprise Risk Management

CORPORATE GOVERNANCE
Principles of Corporate Governance
Board of Directors
Stakeholder Management
Transparency and Accountability

BUSINESS ANALYTICS
Data-Driven Decision Making
Descriptive Analytics
Predictive Analytics
Prescriptive Analytics

E-COMMERCE AND DIGITAL BUSINESS
Digital Business Models
E-Commerce Platforms
Digital Payments
Online Customer Experience
Cybersecurity Basics

INNOVATION AND TECHNOLOGY MANAGEMENT
Managing Innovation
Technology Strategy
Research and Development Management
Technology Adoption

LEADERSHIP AND CHANGE MANAGEMENT
Leadership Theories
Power and Influence
Organizational Change
Resistance to Change
Change Management Models

CORPORATE FINANCE (ADVANCED)
Mergers and Acquisitions
Corporate Valuation
Financial Restructuring
Risk and Return Analysis

INTERNATIONAL MANAGEMENT (ADVANCED)
Global Strategy
Multinational Enterprises
International HRM
Cross-Border Operations

BUSINESS NEGOTIATION AND CONFLICT MANAGEMENT
Negotiation Strategies
Bargaining Techniques
Conflict Resolution
Mediation and Arbitration

SUSTAINABLE AND GREEN MANAGEMENT
Sustainability Concepts
Corporate Social Responsibility
Environmental Management Systems
ESG Strategy

MANAGEMENT CONSULTING
Consulting Process
Problem Diagnosis
Solution Design
Client Management

PUBLIC SECTOR AND NON-PROFIT MANAGEMENT
Public Administration
Non-Profit Organizations
Policy Implementation
Performance Management in Public Sector

ADVANCED STRATEGIC MANAGEMENT (MBA / MSc)
Competitive Advantage Analysis
Corporate Strategy
Strategic Alliances
Global Strategy Execution

ORGANIZATIONAL DEVELOPMENT
Organizational Diagnosis
Intervention Techniques
Talent Management
Culture Transformation

BEHAVIORAL MANAGEMENT (MISSING – NOW ADDED)
Behavioral Decision Making
Managerial Biases
Behavioral Strategy

FAMILY BUSINESS MANAGEMENT (MISSING – NOW ADDED)
Governance of Family Firms
Succession Planning
Conflict in Family Businesses

BUSINESS ETHICS AND COMPLIANCE (EXPANDED)
Ethical Decision Making
Compliance Management
Corporate Codes of Conduct

RESEARCH AND DOCTORAL STUDIES IN MANAGEMENT
Management Theory Development
Quantitative Research in Management
Qualitative Research Methods
Case Study Research
Dissertation Writing
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Heuristic for title vs lesson
    const isHeader = line === line.toUpperCase() && line.length > 5 && !line.includes(':') && !line.includes('/') && !line.includes('–');
    
    if (isHeader) {
      if (currentTopic) {
        topics.push(currentTopic);
      }
      let title = line.replace(/\(MISSING – NOW ADDED\)/g, '').trim();
      title = title.replace(/\(EXPANDED\)/g, '').trim();
      title = title.replace(/\(MBA \/ MSC\)/g, '').trim();
      
      currentTopic = {
        title: toTitleCase(title),
        lessons: []
      };
    } else {
      if (currentTopic) {
        currentTopic.lessons.push(line);
      } else if (topics.length === 0) {
        // Fallback for first header if it didn't match heuristic perfectly
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
  console.log('Starting seeding Business Management...');
  
  // 1. Get or Create Subject
  const subjectName = 'Business Management';
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
        description: 'Comprehensive study of organizing, planning, and leading organizations.',
        icon: 'Briefcase', // Lucide icon name
        color: '#3B82F6', // Blue
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

  // 2. Parse Data
  const topics = parseData(RAW_DATA);
  console.log(`Parsed ${topics.length} topics.`);

  // 3. Insert Topics and Lessons
  for (const topic of topics) {
    console.log(`Processing Topic: ${topic.title}`);
    
    // Check if topic exists
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

    // Insert Lessons
    const lessonsToInsert = topic.lessons.map((lessonTitle, index) => ({
      topic_id: topicId,
      title: lessonTitle,
      content: JSON.stringify([
        {
          type: 'text',
          title: lessonTitle,
          content: `Introduction to ${lessonTitle}. This lesson covers the fundamental concepts of ${lessonTitle} within the context of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `What is a core principle of ${lessonTitle}?`,
          options: ['Planning', 'Optimization', 'Sustainability', 'Strategy'],
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
  
  console.log('Seeding complete!');
}

seed();
