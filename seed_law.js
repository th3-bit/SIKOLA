const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
1. Foundations of Law
Introduction to Law
Purpose and Functions of Law
Law and Society
Classification of Law (Public vs Private)
Sources of Law
Rule of Law
Justice, Equity, and Fairness
Legal Systems of the World
Law and Morality
Legal Terminology and Concepts

2. Legal Systems and Traditions
Common Law System
Civil Law System
Customary Law
Religious Legal Systems
Mixed Legal Systems
Comparative Legal Systems
International Legal Systems

3. Constitutional Law
Meaning and Scope of Constitutional Law
Types of Constitutions
Constitutional Supremacy
Separation of Powers
Rule of Law and Constitutionalism
Fundamental Rights and Freedoms
Duties of Citizens
Structure of Government
Constitutional Amendments
Judicial Review
Constitutional Interpretation

4. Administrative Law
Nature and Scope of Administrative Law
Administrative Authorities
Delegated Legislation
Control of Administrative Action
Principles of Natural Justice
Administrative Tribunals
Judicial Control of Administration
Ombudsman and Public Accountability

5. Criminal Law
Nature and Purpose of Criminal Law
Elements of a Crime
Types of Crimes
Criminal Liability
Intention, Negligence, and Strict Liability
General Defenses
Punishments and Sentencing
Juvenile Justice
Cyber Crimes
White-Collar Crimes

6. Law of Torts
Nature and Scope of Tort Law
General Principles of Liability
Negligence
Nuisance
Defamation
Trespass
Strict and Absolute Liability
Vicarious Liability
Remedies in Tort Law

7. Contract Law
Meaning and Nature of Contracts
Essential Elements of a Valid Contract
Types of Contracts
Offer and Acceptance
Consideration
Capacity of Parties
Free Consent
Legality of Object
Performance of Contracts
Breach of Contract
Remedies for Breach
Quasi-Contracts

8. Commercial and Business Law
Introduction to Commercial Law
Sale of Goods Law
Agency Law
Partnership Law
Company Law (Foundations)
Negotiable Instruments
Consumer Protection Law
E-Commerce and Digital Contracts
Competition Law (Introductory)

9. Company Law
Formation of Companies
Types of Companies
Memorandum and Articles of Association
Share Capital and Shares
Directors and Management
Corporate Governance
Meetings and Resolutions
Corporate Finance (Legal Aspects)
Winding Up of Companies
Corporate Compliance

10. Labour and Employment Law
Nature of Labour Law
Employment Contracts
Rights and Duties of Employers and Employees
Wages and Working Conditions
Trade Unions
Collective Bargaining
Industrial Disputes
Workplace Safety and Health
Termination and Retrenchment
Social Security Laws

11. Property Law
Meaning and Types of Property
Ownership and Possession
Transfer of Property
Leases and Licenses
Mortgages and Charges
Easements
Gifts and Trusts
Land Law Fundamentals
Intellectual Property (Introduction)

12. Family Law
Marriage and Divorce
Matrimonial Rights and Duties
Maintenance and Alimony
Child Custody and Adoption
Inheritance and Succession
Guardianship
Family Dispute Resolution

13. Law of Evidence
Nature and Scope of Evidence Law
Types of Evidence
Oral and Documentary Evidence
Burden of Proof
Presumptions
Witnesses and Examination
Confessions and Admissions
Expert Evidence
Electronic Evidence

14. Civil Procedure Law
Jurisdiction of Courts
Institution of Suits
Pleadings
Summons and Service
Trial Procedures
Judgments and Decrees
Execution of Decrees
Appeals and Revisions
Alternative Dispute Resolution

15. Criminal Procedure Law
Investigation of Crimes
Arrest and Bail
Charge and Trial
Rights of Accused
Examination of Witnesses
Judgment and Sentencing
Appeals in Criminal Cases
Victim Compensation
Juvenile Procedures

16. International Law
Nature and Sources of International Law
Subjects of International Law
State Responsibility
Treaties and Conventions
International Organizations
International Humanitarian Law
International Criminal Law
Law of the Sea
International Trade Law

17. Human Rights Law
Concept of Human Rights
International Human Rights Instruments
Civil and Political Rights
Economic, Social, and Cultural Rights
Rights of Women and Children
Refugee and Asylum Law
Human Rights Enforcement Mechanisms

18. Environmental Law
Principles of Environmental Law
Sustainable Development
Environmental Protection Laws
Climate Change Law
Biodiversity and Wildlife Protection
Environmental Impact Assessment
Pollution Control Laws

19. Intellectual Property Law
Copyright Law
Trademark Law
Patent Law
Industrial Designs
Trade Secrets
Technology and IP Law
Enforcement of IP Rights

20. Taxation Law
Principles of Taxation
Direct Taxes
Indirect Taxes
Corporate Taxation
International Taxation
Tax Compliance and Administration
Tax Dispute Resolution

21. Cyber and Technology Law
Cyber Law Fundamentals
Data Protection and Privacy Law
Digital Evidence
Cybersecurity Law
Online Intellectual Property Issues
Artificial Intelligence and Law

22. Alternative Dispute Resolution
Negotiation
Mediation
Arbitration
Conciliation
Online Dispute Resolution
Enforcement of Arbitral Awards

23. Legal Ethics and Professional Responsibility
Legal Profession and Practice
Duties of Lawyers
Professional Misconduct
Client Confidentiality
Advocacy Skills
Legal Ethics in Practice

24. Legal Research and Writing
Legal Research Methods
Case Law Analysis
Statutory Interpretation
Legal Drafting
Opinion Writing
Citation and Referencing
Use of Legal Databases

25. Advanced and Emerging Law Topics
Law and Economics
Law and Development
Comparative Constitutional Law
Medical and Health Law
Energy Law
Space Law (Introductory)
Maritime Law
Sports Law
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
  console.log('Starting seeding Law...');
  
  const subjectName = 'Law';
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
        description: 'System of rules created and enforced through social or governmental institutions to regulate behavior.',
        icon: 'Scale', 
        color: '#EF4444', // Red
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
          content: `Introduction to ${lessonTitle}. This lesson covers the fundamental legal framework and principles of ${lessonTitle} as part of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `What is a fundamental aspect of ${lessonTitle}?`,
          options: ['Rule of Law', 'Due Process', 'Legal Precedent', 'Statutory Interpretation'],
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
  
  console.log('Law Seeding complete!');
}

seed();
