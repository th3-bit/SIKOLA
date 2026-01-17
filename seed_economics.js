const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
FOUNDATIONS OF ECONOMICS
Nature and Scope of Economics
Importance of Economics in Society
Economic Problems and Scarcity
Needs, Wants, and Choice
Opportunity Cost
Economic Systems
Circular Flow of Income
Basic Economic Terminology

INTRODUCTION TO MICROECONOMICS
Meaning and Scope of Microeconomics
Economic Agents and Decision Making
Demand: Concept and Law
Supply: Concept and Law
Market Equilibrium
Shifts in Demand and Supply
Applications of Demand and Supply

ELASTICITY
Concept of Elasticity
Price Elasticity of Demand
Income Elasticity of Demand
Cross Elasticity of Demand
Price Elasticity of Supply
Applications of Elasticity

THEORY OF CONSUMER BEHAVIOR
Utility: Meaning and Types
Cardinal Utility Analysis
Law of Diminishing Marginal Utility
Ordinal Utility Analysis
Indifference Curves
Budget Constraints
Consumer Equilibrium

THEORY OF PRODUCTION
Production Function
Short-Run and Long-Run Production
Law of Variable Proportions
Returns to Scale
Isoquants and Isocosts
Producer Equilibrium

COST AND REVENUE ANALYSIS
Cost Concepts
Short-Run Cost Curves
Long-Run Cost Curves
Revenue Concepts
Profit Maximization

MARKET STRUCTURES
Perfect Competition
Monopoly
Monopolistic Competition
Oligopoly
Price Discrimination
Comparative Analysis of Market Structures

FACTOR PRICING
Meaning of Factor Pricing
Wages and Labor Market
Rent
Interest
Profit
Marginal Productivity Theory

WELFARE ECONOMICS
Concept of Economic Welfare
Pareto Efficiency
Social Welfare Functions
Market Failure
Externalities
Public Goods

INTRODUCTION TO MACROECONOMICS
Meaning and Scope of Macroeconomics
National Income Concepts
Methods of Measuring National Income
Circular Flow with Government and Foreign Sector

AGGREGATE DEMAND AND AGGREGATE SUPPLY
Aggregate Demand
Aggregate Supply
Macroeconomic Equilibrium
Inflationary and Deflationary Gaps

MONEY AND BANKING
Meaning and Functions of Money
Demand for Money
Supply of Money
Commercial Banks
Central Banking
Monetary Policy

INFLATION AND UNEMPLOYMENT
Meaning and Types of Inflation
Causes of Inflation
Effects of Inflation
Meaning and Types of Unemployment
Phillips Curve

ECONOMIC GROWTH AND DEVELOPMENT
Meaning of Economic Growth
Economic Development
Indicators of Development
Growth Theories
Poverty and Inequality

PUBLIC FINANCE
Meaning and Scope of Public Finance
Public Revenue
Taxation Principles
Public Expenditure
Public Debt
Fiscal Policy

INTERNATIONAL ECONOMICS – BASICS
Meaning of International Trade
Absolute and Comparative Advantage
Terms of Trade
Balance of Trade and Balance of Payments

DEVELOPMENT ECONOMICS
Development Theories
Population and Development
Human Capital
Role of Agriculture and Industry
Sustainable Development

ECONOMIC SYSTEMS AND COMPARATIVE ECONOMICS
Capitalism
Socialism
Mixed Economy
Comparative Economic Systems

INTRODUCTION TO MATHEMATICAL ECONOMICS
Role of Mathematics in Economics
Functions and Graphs in Economics
Optimization Problems
Comparative Statics

INTRODUCTION TO STATISTICS FOR ECONOMICS
Data Collection
Measures of Central Tendency
Measures of Dispersion
Index Numbers
Time Series (Introductory)

INTERMEDIATE MICROECONOMICS
Advanced Consumer Theory
Advanced Producer Theory
General Equilibrium Analysis
Welfare Analysis

INTERMEDIATE MACROECONOMICS
Keynesian Theory
IS–LM Model
AD–AS Model (Advanced)
Business Cycles

ECONOMETRICS – FOUNDATIONS
Meaning and Scope of Econometrics
Simple Regression Analysis
Multiple Regression Analysis
Assumptions of Classical Linear Regression Model
Hypothesis Testing

INTERNATIONAL ECONOMICS – ADVANCED
Heckscher–Ohlin Theory
Trade Policy Instruments
Exchange Rate Systems
International Capital Flows

MONETARY ECONOMICS
Demand and Supply of Money (Advanced)
Interest Rate Theories
Monetary Transmission Mechanism
Central Bank Independence

PUBLIC ECONOMICS
Market Failure and Government Intervention
Public Goods
Externalities
Cost–Benefit Analysis

INDUSTRIAL ECONOMICS
Theory of the Firm
Market Structure and Conduct
Pricing Strategies
Regulation and Competition Policy

LABOR ECONOMICS
Labor Supply and Demand
Wage Determination
Human Capital Theory
Unemployment Models

AGRICULTURAL ECONOMICS
Agricultural Production
Farm Management
Agricultural Pricing
Food Security

ENVIRONMENTAL ECONOMICS
Economics of Natural Resources
Pollution and Externalities
Sustainable Resource Use
Climate Change Economics

FINANCIAL ECONOMICS
Financial Markets
Financial Instruments
Risk and Return
Portfolio Theory

BEHAVIORAL ECONOMICS
Psychological Foundations of Economics
Bounded Rationality
Prospect Theory
Behavioral Biases

GAME THEORY FOR ECONOMICS
Strategic Interaction
Nash Equilibrium
Cooperative and Non-Cooperative Games
Applications in Economics

ADVANCED MATHEMATICAL ECONOMICS
Optimization Techniques
Dynamic Optimization
Calculus of Variations
Optimal Control Theory

ADVANCED ECONOMETRICS
Time Series Econometrics
Panel Data Models
Autocorrelation and Heteroskedasticity
Instrumental Variables

DEVELOPMENT POLICY AND PLANNING
Development Planning Models
Poverty Reduction Strategies
Education and Health Economics

INTERNATIONAL FINANCE
Foreign Exchange Markets
Exchange Rate Determination
International Financial Institutions

POLITICAL ECONOMY
State and Market
Institutions and Economic Performance
Power and Distribution

ECONOMIC HISTORY
Evolution of Economic Thought
Industrial Revolution
Global Economic History

RESEARCH METHODS IN ECONOMICS
Economic Research Design
Data Sources in Economics
Empirical Research Methods

ADVANCED ECONOMIC THEORY (MSc / PhD LEVEL)
Microeconomic Theory (Advanced)
Macroeconomic Theory (Advanced)
General Equilibrium Theory

DEVELOPMENT OF ECONOMIC THOUGHT
Classical Economics
Marxian Economics
Neoclassical Economics
Keynesian Economics
Modern Schools of Thought

COMPUTATIONAL ECONOMICS (MISSING – NOW ADDED)
Economic Simulation Models
Agent-Based Modeling
Computational Game Theory

HEALTH ECONOMICS (MISSING – NOW ADDED)
Demand for Health Care
Health Financing Systems
Cost-Effectiveness Analysis

URBAN AND REGIONAL ECONOMICS (MISSING – NOW ADDED)
Urbanization and Growth
Regional Development
Housing Economics

ECONOMICS OF EDUCATION (MISSING – NOW ADDED)
Returns to Education
Education Policy
Human Capital Formation

ECONOMIC MODELLING AND FORECASTING
Economic Indicators
Forecasting Techniques
Policy Simulation

RESEARCH ECONOMICS (PhD PREPARATION)
Reading Economic Journals
Writing Economic Papers
Thesis Development
Research Ethics
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // If line is ALL CAPS (allow some symbols like - / ), it's a topic header
    // But verify it's not just a short acronym like 'IS-LM Model' which is mixed or 'AD-AS'
    // The explicit headers in the user provided text are distinct.
    // Heuristic: If it has more than 5 chars and is mostly uppercase.
    // Or closer look: The headers provided are quite distinct.
    
    // Check if line is a Header from the known list logic
    // Most headers are Uppercase.
    // "COMPUTATIONAL ECONOMICS (MISSING – NOW ADDED)" -> clean
    
    const isHeader = line === line.toUpperCase() && line.length > 3 && !line.includes('IS–LM') && !line.includes('AD–AS');
    
    if (isHeader) {
      if (currentTopic) {
        topics.push(currentTopic);
      }
      let title = line.replace(/\(MISSING – NOW ADDED\)/g, '').trim();
      title = title.replace(/\(MSc \/ PhD LEVEL\)/g, '').trim();
      title = title.replace(/\(PhD PREPARATION\)/g, '').trim();
      
      // Title Case the topic for better display? Or keep caps?
      // Let's Title Case it for the app display.
      title = toTitleCase(title);
      
      currentTopic = {
        title: title,
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

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

async function seed() {
  console.log('Starting seeding...');
  
  // 1. Get or Create Subject
  const { data: subjectData, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .ilike('name', 'Economics')
    .single();
    
  let subjectId;
  
  if (subjectError && subjectError.code !== 'PGRST116') {
    console.error('Error fetching subject:', subjectError);
    return;
  }

  if (subjectData) {
    console.log('Found existing Economics subject:', subjectData.id);
    subjectId = subjectData.id;
  } else {
    console.log('Creating Economics subject...');
    const { data: newSubject, error: createError } = await supabase
      .from('subjects')
      .insert([{
        name: 'Economics',
        description: 'Comprehensive study of production, distribution, and consumption of goods and services.',
        icon: 'TrendingUp', // Lucide icon name
        color: '#10B981', // Emerald green
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
          content: `Introduction to ${lessonTitle}. This lesson covers the fundamental concepts of ${lessonTitle}.`
        },
        {
          type: 'quiz',
          question: `What is a key concept of ${lessonTitle}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
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
