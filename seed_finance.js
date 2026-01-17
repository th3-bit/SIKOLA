const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
FOUNDATIONS OF FINANCE
Nature and Scope of Finance
Role of Finance in Business and Economy
Financial System and Financial Markets
Financial Instruments Overview
Risk and Return Basics

FINANCIAL MATHEMATICS FOR FINANCE
Time Value of Money
Simple and Compound Interest
Annuities and Perpetuities
Discounting and Present Value
Loan Amortization

FINANCIAL STATEMENTS AND ANALYSIS
Income Statement Analysis
Balance Sheet Analysis
Cash Flow Statement Analysis
Ratio Analysis
Trend and Comparative Analysis

CORPORATE FINANCE – FUNDAMENTALS
Financial Objectives of the Firm
Capital Budgeting Techniques
Cost of Capital
Capital Structure Theories
Dividend Policy

WORKING CAPITAL MANAGEMENT
Components of Working Capital
Cash Management
Inventory Management
Receivables Management
Short-Term Financing

FINANCIAL MARKETS AND INSTITUTIONS
Money Market
Capital Market
Primary and Secondary Markets
Commercial Banks
Non-Banking Financial Institutions
Central Banking System

INVESTMENT ANALYSIS
Investment Objectives
Risk and Return Measurement
Portfolio Theory
Capital Asset Pricing Model
Efficient Market Hypothesis

SECURITIES ANALYSIS
Equity Analysis
Bond Valuation
Derivative Securities (Introductory)
Fundamental Analysis
Technical Analysis

BEHAVIORAL FINANCE (MISSING – NOW ADDED)
Psychology of Financial Decision Making
Investor Biases
Market Anomalies
Behavioral Asset Pricing

DERIVATIVES AND RISK MANAGEMENT
Futures Contracts
Forward Contracts
Options
Swaps
Hedging Strategies

FINANCIAL RISK MANAGEMENT
Types of Financial Risk
Risk Measurement Techniques
Value at Risk
Credit Risk Management
Market Risk Management

BANKING AND FINANCIAL SERVICES
Commercial Banking Operations
Retail and Corporate Banking
Credit Analysis
Loan Management
Digital Banking

INSURANCE AND RISK FINANCE
Principles of Insurance
Types of Insurance
Risk Pooling and Transfer
Insurance Regulation

INTERNATIONAL FINANCE
Foreign Exchange Markets
Exchange Rate Determination
International Capital Flows
Balance of Payments
International Financial Institutions

PUBLIC FINANCE
Government Revenue and Expenditure
Fiscal Policy
Public Debt
Budgeting and Public Financial Management

FINANCIAL PLANNING AND WEALTH MANAGEMENT
Personal Financial Planning
Investment Planning
Retirement Planning
Tax Planning
Estate Planning

FINANCIAL MODELING AND VALUATION
Financial Modeling Techniques
Business Valuation
Discounted Cash Flow Models
Relative Valuation
Scenario and Sensitivity Analysis

CORPORATE RESTRUCTURING AND M&A
Mergers and Acquisitions
Corporate Restructuring
Leveraged Buyouts
Financial Distress and Bankruptcy

FINTECH AND DIGITAL FINANCE (MISSING – NOW ADDED)
Financial Technology Overview
Digital Payments
Blockchain and Cryptocurrencies
Mobile Banking
Regulatory Technology

PROJECT FINANCE
Project Appraisal
Risk Allocation
Financing Structures
Public-Private Partnerships

REAL ESTATE FINANCE
Real Estate Markets
Property Valuation
Mortgage Financing
Real Estate Investment Trusts

ISLAMIC FINANCE (MISSING – NOW ADDED)
Principles of Islamic Finance
Islamic Financial Instruments
Shariah Compliance

SUSTAINABLE AND GREEN FINANCE (MISSING – NOW ADDED)
Sustainable Finance Concepts
ESG Investing
Climate Finance
Impact Investing

ADVANCED CORPORATE FINANCE (MSc LEVEL)
Advanced Capital Structure
Corporate Valuation
Financial Strategy
Risk Management at Firm Level

ADVANCED INVESTMENT MANAGEMENT
Portfolio Management (Advanced)
Asset Allocation
Alternative Investments
Hedge Funds and Private Equity

FINANCIAL ECONOMETRICS
Time Series Analysis
Volatility Models
Forecasting Financial Data

QUANTITATIVE FINANCE (MISSING – NOW ADDED)
Stochastic Processes in Finance
Option Pricing Models
Financial Engineering

REGULATORY AND COMPLIANCE FINANCE
Financial Regulations
Corporate Governance in Finance
Compliance and Risk Reporting

FINANCIAL CRISIS AND STABILITY
Causes of Financial Crises
Systemic Risk
Financial Stability Policies

RESEARCH METHODS IN FINANCE
Financial Research Design
Empirical Finance
Data Sources and Analysis

ADVANCED FINANCE THEORY (PhD LEVEL)
Asset Pricing Theory
Market Microstructure
Advanced Corporate Finance Theory

BEHAVIORAL AND EXPERIMENTAL FINANCE (PhD LEVEL)
Experimental Methods in Finance
Behavioral Asset Pricing

FINANCE RESEARCH AND DOCTORAL STUDIES
Reading Finance Journals
Writing Finance Research Papers
Dissertation Development
Publication Process
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
  console.log('Starting seeding Finance...');
  
  const subjectName = 'Finance';
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
        description: 'Study of money management and the process of acquiring needed funds.',
        icon: 'TrendingUp', 
        color: '#6366F1', // Indigo
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
          options: ['Risk Management', 'Capital Budgeting', 'Financial Analysis', 'Investment Strategy'],
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
  
  console.log('Finance Seeding complete!');
}

seed();
