const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
1. Introduction to Physics
Definition and scope of physics
Branches of physics
Physics in everyday life
Scientific thinking
Physics and technology

2. Physical Quantities and Measurement
Physical quantities
Fundamental and derived quantities
SI units
Measurement techniques
Errors and accuracy
Significant figures

3. Scalars and Vectors
Scalar quantities
Vector quantities
Vector representation
Vector addition and subtraction
Resolution of vectors
Applications

II. CLASSICAL MECHANICS (SECONDARY LEVEL)
4. Motion in One Dimension
Distance and displacement
Speed and velocity
Acceleration
Graphical analysis of motion
Uniform and non-uniform motion

5. Motion in Two Dimensions
Projectile motion
Relative velocity
Vector methods in motion

6. Laws of Motion
Newton’s first law
Second law and force
Third law
Free body diagrams
Applications of Newton’s laws

7. Work, Energy, and Power
Work done by a force
Kinetic energy
Potential energy
Conservation of energy
Power and efficiency

8. Momentum and Collisions
Linear momentum
Conservation of momentum
Elastic collisions
Inelastic collisions
Applications

9. Circular Motion
Angular velocity
Centripetal force
Banking of roads
Motion in vertical circles

10. Gravitation
Newton’s law of gravitation
Gravitational field
Acceleration due to gravity
Motion of planets
Satellites

III. PROPERTIES OF MATTER
11. Elasticity
Stress and strain
Hooke’s law
Young’s modulus
Applications

12. Fluid Mechanics
Pressure in fluids
Pascal’s law
Archimedes’ principle
Buoyancy
Bernoulli’s theorem

13. Surface Tension and Viscosity
Molecular theory
Capillary action
Viscous flow
Applications

IV. THERMAL PHYSICS
14. Temperature and Heat
Temperature scales
Heat transfer
Thermal equilibrium
Specific heat capacity

15. Kinetic Theory of Gases
Gas laws
Kinetic model
Root mean square speed
Applications

16. Thermodynamics
Zeroth law
First law
Second law
Heat engines
Entropy
Efficiency

V. WAVES AND SOUND
17. Oscillatory Motion
Simple harmonic motion
Period and frequency
Energy in SHM
Applications

18. Mechanical Waves
Types of waves
Wave equation
Reflection and refraction
Superposition

19. Sound Waves
Production of sound
Speed of sound
Doppler effect
Musical instruments

VI. OPTICS
20. Reflection of Light
Laws of reflection
Plane mirrors
Spherical mirrors
Image formation

21. Refraction of Light
Laws of refraction
Refractive index
Total internal reflection
Optical fibers

22. Optical Instruments
Human eye
Defects of vision
Microscope
Telescope

23. Wave Optics
Interference
Diffraction
Polarization
Young’s double slit experiment

VII. ELECTRICITY AND MAGNETISM
24. Electrostatics
Electric charge
Coulomb’s law
Electric field
Electric potential
Capacitors

25. Current Electricity
Electric current
Ohm’s law
Resistance
Electrical power
Circuits

26. Magnetism
Magnetic fields
Earth’s magnetism
Magnetic materials

27. Electromagnetic Induction
Faraday’s laws
Lenz’s law
Induced emf
Transformers

28. Alternating Current
AC voltage and current
RMS values
Reactance
Power in AC circuits

29. Electromagnetic Waves
Maxwell’s ideas
Spectrum of EM waves
Applications
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Skip Roman numeral headers (like "II. ...")
    if (/^[IVXLCDM]+\.\s/.test(line)) {
      return;
    }

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
  console.log('Starting seeding Physics...');
  
  const subjectName = 'Physics';
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
        description: 'The natural science that studies matter, its fundamental constituents, its motion and behavior through space and time.',
        icon: 'FlaskConical', 
        color: '#8B5CF6', 
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
          question: `Which of the following describes ${lessonTitle}?`,
          options: ['A fundamental law', 'A derived concept', 'A physical phenomenon', 'A mathematical model'],
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
  
  console.log('Physics Seeding complete!');
}

seed();
