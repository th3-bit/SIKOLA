const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
FOUNDATIONS OF ACCOUNTING
Nature and Scope of Accounting
Objectives and Importance of Accounting
Accounting Concepts and Conventions
Users of Accounting Information
Accounting Cycle Overview
Generally Accepted Accounting Principles

FINANCIAL ACCOUNTING – BASICS
Business Transactions and Source Documents
Double Entry System
Accounting Equation
Journal Entries
Ledger Accounts
Trial Balance
Errors and Rectification

FINANCIAL STATEMENTS – FUNDAMENTALS
Final Accounts of Sole Traders
Trading Account
Profit and Loss Account
Balance Sheet
Adjustments in Final Accounts

CASH AND BANK ACCOUNTING
Cash Book
Bank Reconciliation Statement
Petty Cash System
Internal Control over Cash

DEPRECIATION AND ASSET ACCOUNTING
Meaning and Causes of Depreciation
Methods of Depreciation
Accounting for Fixed Assets
Disposal of Assets
Intangible Assets

INVENTORY ACCOUNTING
Meaning and Importance of Inventory
Inventory Valuation Methods
Inventory Control Techniques
Accounting for Inventory

ACCOUNTING FOR BILLS AND RECEIVABLES
Bills of Exchange
Promissory Notes
Accounting Treatment of Bills
Dishonour and Renewal of Bills

ACCOUNTING FOR PARTNERSHIP FIRMS
Partnership Deed
Profit Sharing Ratio
Capital Accounts
Admission of a Partner
Retirement and Death of a Partner
Dissolution of Partnership

COMPANY ACCOUNTS
Issue of Shares
Issue of Debentures
Company Final Accounts
Redemption of Shares and Debentures

FINANCIAL ACCOUNTING – ADVANCED
Accounting Standards
Ind AS and IFRS (Overview)
Valuation of Shares
Internal Reconstruction
Amalgamation and Absorption

COST ACCOUNTING – FOUNDATIONS
Nature and Scope of Cost Accounting
Cost Concepts and Classifications
Cost Sheet Preparation
Material Cost
Labor Cost
Overhead Allocation and Apportionment

METHODS OF COSTING
Job Costing
Batch Costing
Contract Costing
Process Costing
Operating Costing

MARGINAL COSTING
Cost-Volume-Profit Analysis
Break-Even Analysis
Contribution and Profit Planning
Decision Making under Marginal Costing

STANDARD COSTING AND BUDGETARY CONTROL
Standard Costing
Variance Analysis
Budget Concepts
Types of Budgets
Budgetary Control

MANAGEMENT ACCOUNTING
Nature and Scope of Management Accounting
Financial Statement Analysis
Ratio Analysis
Funds Flow Statement
Cash Flow Statement
Decision-Making Tools

ACCOUNTING FOR DECISION MAKING
Relevant Costing
Make or Buy Decisions
Pricing Decisions
Capital Budgeting Decisions

TAXATION – BASICS
Meaning and Scope of Taxation
Types of Taxes
Income Tax Fundamentals
Corporate Tax Basics
Tax Planning Concepts

AUDITING – FOUNDATIONS
Nature and Objectives of Auditing
Types of Audit
Audit Planning
Internal Control and Internal Check
Audit Evidence

AUDITING – ADVANCED
Company Audit
Audit of Banks
Audit of Insurance Companies
Audit Reports
Professional Ethics

PUBLIC SECTOR ACCOUNTING
Government Accounting
Public Budgeting
Accounting for Public Enterprises

ACCOUNTING INFORMATION SYSTEMS
Manual and Computerized Accounting
Accounting Software Concepts
Internal Controls in AIS
Data Security and Integrity

FORENSIC ACCOUNTING (MISSING – NOW ADDED)
Meaning and Scope of Forensic Accounting
Fraud Detection Techniques
Litigation Support
Corporate Fraud Investigation

ENVIRONMENTAL AND SOCIAL ACCOUNTING (MISSING – NOW ADDED)
Environmental Accounting
Social Responsibility Accounting
Sustainability Reporting

INTERNATIONAL ACCOUNTING
International Financial Reporting Standards
Global Accounting Practices
Comparative Accounting Systems

FINANCIAL STATEMENT ANALYSIS (ADVANCED)
Trend Analysis
Comparative Statements
Ratio Interpretation
Cash Flow Analysis

STRATEGIC MANAGEMENT ACCOUNTING
Strategic Cost Management
Value Chain Analysis
Target Costing
Life-Cycle Costing

FINANCIAL MANAGEMENT FOR ACCOUNTANTS
Time Value of Money
Capital Budgeting Techniques
Cost of Capital
Capital Structure Decisions

ADVANCED TAXATION
Corporate Tax Planning
International Taxation
Transfer Pricing
Tax Compliance and Administration

PROFESSIONAL ACCOUNTING STANDARDS
Ethics for Professional Accountants
Code of Conduct
Regulatory Framework

ACCOUNTING RESEARCH METHODS
Accounting Research Design
Quantitative Research in Accounting
Qualitative Research Methods
Case Study Research

ADVANCED FINANCIAL REPORTING (MSc / PhD)
Consolidated Financial Statements
Group Accounts
Complex Financial Instruments
Fair Value Accounting

PUBLIC FINANCIAL MANAGEMENT
Government Budgeting Systems
Public Expenditure Management
Fiscal Accountability

ACCOUNTING ANALYTICS (MISSING – NOW ADDED)
Data Analytics for Accountants
Financial Modeling
Use of Spreadsheets in Accounting

ACCOUNTING THEORY
Evolution of Accounting Theory
Positive and Normative Accounting
Conceptual Framework of Accounting

RESEARCH AND DOCTORAL STUDIES IN ACCOUNTING
Contemporary Accounting Issues
Empirical Accounting Research
Dissertation Writing in Accounting
Publication and Peer Review
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
      title = title.replace(/\(MBA \/ MSC\)/g, '').trim();
      title = title.replace(/\(MSC \/ PHD\)/g, '').trim();
      title = title.replace(/– BASICS/g, '- Basics').trim();
      title = title.replace(/– FOUNDATIONS/g, '- Foundations').trim();
      title = title.replace(/– FUNDAMENTALS/g, '- Fundamentals').trim();
      title = title.replace(/– ADVANCED/g, '- Advanced').trim();

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
  console.log('Starting seeding Accounting...');
  
  const subjectName = 'Accounting';
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
        description: 'The process of recording, summarizing, and analyzing financial transactions.',
        icon: 'Calculator', // Lucide icon
        color: '#F59E0B', // Amber
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
          options: ['Ledger Posting', 'Asset Valuation', 'Internal Audit', 'Balance Sheet'],
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
  
  console.log('Accounting Seeding complete!');
}

seed();
