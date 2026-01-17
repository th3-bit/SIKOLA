const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
30. Atomic Structure
Discovery of electron
Atomic models
Energy levels
Spectra

31. Nuclear Physics
Nucleus
Radioactivity
Nuclear reactions
Applications

32. Semiconductor Physics
Energy bands
Intrinsic and extrinsic semiconductors
Diodes
Transistors
Basic electronics

33. Mathematical Methods for Physics
Vector calculus
Differential equations
Linear algebra
Fourier series

34. Classical Mechanics (Advanced)
Lagrangian mechanics
Hamiltonian mechanics
Central force motion
Rigid body dynamics

35. Electrodynamics
Maxwell’s equations
Electromagnetic waves
Radiation
Potentials

36. Quantum Mechanics I
Wave-particle duality
Schrödinger equation
Operators
Eigenvalues
Probability interpretation

37. Quantum Mechanics II
Angular momentum
Hydrogen atom
Approximation methods
Perturbation theory

38. Solid State Physics
Crystal structures
X-ray diffraction
Band theory
Conductors and insulators

39. Statistical Mechanics
Microstates and microstates
Maxwell-Boltzmann statistics
Bose-Einstein statistics
Fermi-Dirac statistics

40. Advanced Quantum Mechanics
Dirac notation
Relativistic quantum mechanics
Spin systems
Scattering theory

41. Advanced Electromagnetism
Gauge transformations
Electromagnetic radiation
Relativistic editodynamics

42. Condensed Matter Physics
Superconductivity
Magnetism
Semiconductors
Nanomaterials

43. Nuclear and Particle Physics
Nuclear models
Particle classification
Standard Model
Accelerators

44. Plasma Physics
Plasma properties
Plasma waves
Applications in fusion

45. Computational Physics
Numerical methods
Simulation techniques
Modeling physical systems

46. Quantum Field Theory
Field quantization
Feynman diagrams
Gauge theories

47. General Relativity
Curved spacetime
Einstein field equations
Black holes
Cosmology

48. Astrophysics
Stellar structure
Galaxies
Cosmic radiation
Observational techniques

49. Cosmology
Big Bang theory
Dark matter
Dark energy
Cosmic microwave background

50. Advanced Research Methods in Physics
Scientific writing
Research methodology
Data analysis
Experimental design
Ethics in research

51. Physics Thesis and Dissertation Preparation
Literature review
Problem formulation
Modeling and experimentation
Publication strategies
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Check if line starts with a number followed by a dot (e.g., "30. ")
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
  console.log('Starting Physics extension seeding...');
  
  const subjectName = 'Physics';
  const { data: subjectData, error: subjectError } = await supabase
    .from('subjects')
    .select('id')
    .ilike('name', subjectName)
    .single();
    
  if (subjectError || !subjectData) {
    console.error('Error fetching subject (must exist!):', subjectError);
    return;
  }

  const subjectId = subjectData.id;
  console.log(`Using existing ${subjectName} subject:`, subjectId);

  const topics = parseData(RAW_DATA);
  console.log(`Parsed ${topics.length} new or existing topics.`);

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
       console.log(`  Topic "${topic.title}" already exists. Skipping topic insertion.`);
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

    // Checking for existing lessons in this topic to avoid duplicates
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('title')
      .eq('topic_id', topicId);
    
    const existingTitles = new Set(existingLessons?.map(l => l.title) || []);

    const lessonsToInsert = topic.lessons
      .filter(lt => !existingTitles.has(lt))
      .map((lessonTitle) => ({
        topic_id: topicId,
        title: lessonTitle,
        content: JSON.stringify([
          {
            type: 'text',
            title: lessonTitle,
            content: `Advanced study of ${lessonTitle}. This lesson covers complex theories and applications of ${lessonTitle} within ${topic.title}.`
          },
          {
            type: 'quiz',
            question: `Which concept is central to ${lessonTitle}?`,
            options: ['Relativity', 'Quantum States', 'Mathematical Modeling', 'Experimental Validation'],
            correctAnswer: 2
          }
        ]),
        duration: 20 // Advanced topics might take longer
      }));

    if (lessonsToInsert.length > 0) {
      const { error: lessonsError } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);
        
      if (lessonsError) {
        console.error(`Error inserting lessons for ${topic.title}:`, lessonsError);
      } else {
        console.log(`  Inserted ${lessonsToInsert.length} new lessons.`);
      }
    } else {
      console.log(`  All lessons for "${topic.title}" already exist. Skipping.`);
    }
  }
  
  console.log('Physics extension seeding complete!');
}

seed();
