const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
Foundations of Biology
Introduction to Biology
Branches of Biology
Importance of Biology in Daily Life
Biological Terminology
Scientific Method in Biology
Measurement and Units in Biology
Laboratory Safety and Ethics
Use of Microscopes and Basic Lab Tools

2. Cell Biology
Discovery of the Cell
Cell Theory
Types of Cells
Prokaryotic and Eukaryotic Cells
Cell Structure and Organelles
Cell Membrane Structure and Transport
Cytoplasm and Cytoskeleton
Nucleus and Genetic Material
Cell Cycle
Mitosis
Meiosis
Cell Differentiation
Stem Cells (Introductory)

3. Biomolecules and Biochemistry
Elements of Life
Water and Its Biological Importance
Carbohydrates
Proteins
Lipids
Nucleic Acids
Enzymes and Enzyme Action
Metabolism (Anabolism and Catabolism)
Vitamins and Minerals
Energy in Living Systems (ATP)

4. Nutrition and Digestion
Types of Nutrition
Human Digestive System
Digestion of Carbohydrates
Digestion of Proteins
Digestion of Fats
Absorption and Assimilation
Balanced Diet
Malnutrition and Deficiency Diseases
Nutrition in Plants

5. Plant Biology
Characteristics of Plants
Classification of Plants
Plant Cell Structure
Plant Tissues
Root System
Stem Structure
Leaf Structure
Photosynthesis
Factors Affecting Photosynthesis
Respiration in Plants
Transpiration
Transport in Plants
Plant Growth and Development
Plant Hormones
Plant Movements

6. Animal Biology
Characteristics of Animals
Classification of Animals
Invertebrates
Vertebrates
Structural Organization in Animals
Animal Tissues
Comparative Anatomy (Introductory)

7. Human Anatomy and Physiology
Levels of Organization in Humans
Skeletal System
Muscular System
Digestive System
Respiratory System
Circulatory System
Blood and Blood Groups
Lymphatic System
Excretory System
Nervous System
Sense Organs
Endocrine System
Immune System
Homeostasis

8. Respiration and Circulation
Types of Respiration
Aerobic Respiration
Anaerobic Respiration
Human Respiratory Mechanism
Transport of Gases
Structure of the Heart
Cardiac Cycle
Blood Pressure
Disorders of the Heart and Lungs

9. Excretion and Osmoregulation
Types of Excretory Products
Human Excretory System
Structure of the Kidney
Formation of Urine
Osmoregulation
Dialysis and Kidney Disorders

10. Coordination and Control
Nervous Coordination
Structure of Neurons
Transmission of Nerve Impulses
Central Nervous System
Peripheral Nervous System
Endocrine Glands
Hormones and Their Functions
Disorders of the Nervous and Endocrine Systems

11. Reproduction in Living Organisms
Types of Reproduction
Asexual Reproduction
Sexual Reproduction
Human Reproductive System
Gametogenesis
Menstrual Cycle
Fertilization and Implantation
Pregnancy and Birth
Growth and Development
Reproductive Health (Educational)

12. Genetics and Heredity
Introduction to Genetics
Mendel and His Experiments
Mendelian Laws of Inheritance
Monohybrid Cross
Dihybrid Cross
Chromosomes and Genes
DNA Structure
RNA Structure
Replication of DNA
Transcription
Translation
Mutations
Genetic Disorders
Blood Group Inheritance

13. Evolution
Origin of Life
Theories of Evolution
Lamarckism
Darwinism
Natural Selection
Evidence of Evolution
Speciation
Human Evolution

14. Ecology and Environment
Ecology and Ecosystem
Biotic and Abiotic Factors
Food Chains and Food Webs
Energy Flow in Ecosystems
Ecological Pyramids
Nutrient Cycles
Population Ecology
Biodiversity
Conservation of Biodiversity
Environmental Pollution
Climate Change
Sustainable Development

15. Microbiology
Introduction to Microorganisms
Bacteria
Viruses
Fungi
Protozoa
Algae
Beneficial Microorganisms
Harmful Microorganisms
Disease-Causing Microbes
Immunity and Vaccination
Antibiotics and Resistance

16. Health and Disease
Concept of Health
Communicable Diseases
Non-Communicable Diseases
Deficiency Diseases
Infectious Diseases
Body Defense Mechanisms
Vaccination and Immunization
Public Health and Hygiene

17. Biotechnology
Introduction to Biotechnology
Tools of Biotechnology
Genetic Engineering
Recombinant DNA Technology
Cloning
Applications of Biotechnology
Biotechnology in Medicine
Biotechnology in Agriculture
Bioethics

18. Applied Biology
Agricultural Biology
Animal Husbandry
Fisheries and Aquaculture
Forestry
Environmental Biology
Industrial Biology
Food Biology

19. Practical Biology and Scientific Skills
Biological Observation Skills
Biological Drawing and Labeling
Experimental Design
Data Collection and Analysis
Use of Charts and Models
Field Biology Techniques

20. Advanced and Pre-University Biology
Molecular Biology
Gene Regulation
Cell Signaling
Immunology (Introductory)
Neurobiology (Introductory)
Developmental Biology
Cancer Biology (Introductory)
Systems Biology (Introductory)
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Check if line starts with a number followed by a dot (e.g., "1. ")
    // Or if it matches certain known headers that don't have numbers
    const isTopic = /^\d+\.\s/.test(line) || line === "Foundations of Biology";
    
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
  console.log('Starting seeding Biology...');
  
  const subjectName = 'Biology';
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
        description: 'The study of living organisms and their vital processes.',
        icon: 'Dna', 
        color: '#10B981', // Emerald
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
          content: `Introduction to ${lessonTitle}. This lesson covers the fundamental biological principles of ${lessonTitle} within the study of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `What is a key concept related to ${lessonTitle}?`,
          options: ['Cell Theory', 'Natural Selection', 'Genetics', 'Homeostasis'],
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
  
  console.log('Biology Seeding complete!');
}

seed();
