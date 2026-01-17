const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
Foundations of Chemistry
Introduction to Chemistry
Branches of Chemistry
Importance of Chemistry in Daily Life
Scientific Method in Chemistry
Laboratory Safety and Ethics
Measurement and Units in Chemistry
Significant Figures
Errors and Accuracy
Use of Laboratory Apparatus

2. Matter and Its Nature
Nature of Matter
States of Matter
Physical and Chemical Properties
Physical and Chemical Changes
Classification of Matter
Pure Substances and Mixtures
Separation Techniques
Diffusion and Brownian Motion

3. Atomic Structure
Early Atomic Theories
Dalton’s Atomic Theory
Discovery of Subatomic Particles
Structure of the Atom
Atomic Number and Mass Number
Isotopes and Isobars
Electronic Configuration
Atomic Models
Quantum Mechanical Model (Introductory)

4. Periodic Table and Periodicity
Development of the Periodic Table
Modern Periodic Law
Periodic Classification of Elements
Periodic Trends
Atomic Radius
Ionization Energy
Electron Affinity
Electronegativity
Metallic and Non-Metallic Properties

5. Chemical Bonding
Valence Electrons
Octet Rule
Ionic Bonding
Covalent Bonding
Coordinate Covalent Bond
Metallic Bonding
Lewis Structures
VSEPR Theory
Hybridization
Intermolecular Forces
Hydrogen Bonding

6. Stoichiometry
Laws of Chemical Combination
Mole Concept
Molar Mass
Avogadro’s Number
Chemical Equations
Balancing Chemical Equations
Limiting Reagents
Percentage Yield
Empirical and Molecular Formulae

7. States of Matter (Gases, Liquids, Solids)
Gaseous State
Gas Laws
Ideal Gas Equation
Kinetic Theory of Gases
Liquids and Intermolecular Forces
Surface Tension and Viscosity
Solid State
Crystal Lattices
Types of Solids

8. Thermochemistry and Thermodynamics
Energy Changes in Chemical Reactions
Exothermic and Endothermic Reactions
Enthalpy
Hess’s Law
First Law of Thermodynamics
Second Law of Thermodynamics
Entropy
Gibbs Free Energy
Spontaneity of Reactions

9. Chemical Kinetics
Rate of Chemical Reactions
Factors Affecting Reaction Rate
Rate Laws
Order and Molecularity
Activation Energy
Collision Theory
Catalysis

10. Chemical Equilibrium
Reversible and Irreversible Reactions
Law of Mass Action
Equilibrium Constant
Le Chatelier’s Principle
Homogeneous Equilibrium
Heterogeneous Equilibrium
Applications of Equilibrium

11. Acids, Bases, and Salts
Nature of Acids and Bases
Arrhenius Theory
Bronsted-Lowry Theory
Lewis Theory
Strength of Acids and Bases
pH and pOH
Buffer Solutions
Salt Hydrolysis
Common Acids and Bases

12. Redox Reactions and Electrochemistry
Oxidation and Reduction
Oxidation Number
Balancing Redox Reactions
Electrochemical Cells
Galvanic Cells
Electrolysis
Faraday’s Laws
Corrosion and Prevention

13. Hydrogen and Water Chemistry
Position of Hydrogen in Periodic Table
Isotopes of Hydrogen
Properties of Water
Hardness of Water
Treatment of Water
Hydrogen Peroxide
Industrial Applications of Hydrogen

14. s-Block and p-Block Elements
Alkali Metals
Alkaline Earth Metals
Properties of s-Block Elements
Boron Family
Carbon Family
Nitrogen Family
Oxygen Family
Halogens
Noble Gases
Trends and Applications

15. d-Block and f-Block Elements
Transition Elements
Properties of Transition Metals
Coordination Compounds
Lanthanides
Actinides
Applications of d- and f-Block Elements

16. Organic Chemistry – Foundations
Introduction to Organic Chemistry
Hybridization of Carbon
Classification of Organic Compounds
Homologous Series
Functional Groups
IUPAC Nomenclature
Types of Organic Reactions
Reaction Mechanisms (Introductory)

17. Hydrocarbons
Alkanes
Alkenes
Alkynes
Aromatic Hydrocarbons
Isomerism in Hydrocarbons
Properties and Uses of Hydrocarbons

18. Organic Compounds with Functional Groups
Alcohols
Phenols
Ethers
Aldehydes
Ketones
Carboxylic Acids
Esters
Amines
Amides
Haloalkanes and Haloarenes

19. Biomolecules and Polymers
Carbohydrates
Proteins
Amino Acids
Lipids
Nucleic Acids
Polymers
Natural and Synthetic Polymers
Plastics and Fibers
Biodegradable Polymers

20. Environmental Chemistry
Environmental Pollution
Air Pollution
Water Pollution
Soil Pollution
Green Chemistry
Ozone Depletion
Global Warming
Waste Management

21. Analytical Chemistry
Qualitative Analysis
Quantitative Analysis
Volumetric Analysis
Gravimetric Analysis
Chromatography
Spectroscopy (Introductory)
Chemical Sensors

22. Industrial Chemistry
Chemical Industries Overview
Manufacture of Acids
Fertilizer Industry
Cement Industry
Glass Industry
Petrochemical Industry
Pharmaceutical Chemistry (Introductory)

23. Nuclear and Radiochemistry
Radioactivity
Nuclear Reactions
Nuclear Fission and Fusion
Uses of Radioisotopes
Nuclear Energy
Safety in Nuclear Chemistry

24. Applied and Modern Chemistry
Medicinal Chemistry
Forensic Chemistry
Agricultural Chemistry
Food Chemistry
Nanochemistry
Materials Chemistry
Computational Chemistry (Introductory)

25. Practical Chemistry and Scientific Skills
Laboratory Techniques
Preparation of Solutions
Titration Methods
Chemical Calculations
Observation and Recording
Error Analysis
Laboratory Report Writing
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Heuristic: Uppercase lines are topics, or lines starting with numbers
    const isTopic = /^\d+\.\s/.test(line) || line === "Foundations of Chemistry";
    
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
  console.log('Starting seeding Chemistry...');
  
  const subjectName = 'Chemistry';
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
        description: 'The branch of science that deals with the properties, composition, and structure of substances.',
        icon: 'FlaskConical', 
        color: '#F97316', // Orange
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
          content: `Introduction to ${lessonTitle}. This lesson covers the fundamental chemical principles of ${lessonTitle} as part of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `What is a core concept in ${lessonTitle}?`,
          options: ['Atomic Structure', 'Chemical Equilibrium', 'Mole Concept', 'Thermodynamics'],
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
  
  console.log('Chemistry Seeding complete!');
}

seed();
