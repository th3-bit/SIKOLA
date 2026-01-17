const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
Foundations of Geography
Introduction to Geography
Branches of Geography
Scope and Importance of Geography
Geography and Human Life
Physical vs Human Geography
Environmental Geography
Geographical Terminology
Tools and Techniques of Geography

2. Earth and the Solar System
Earth in the Solar System
Shape and Size of the Earth
Rotation of the Earth
Revolution of the Earth
Effects of Rotation and Revolution
Time Zones
Latitude and Longitude
International Date Line

3. Map Work and Cartography
Introduction to Maps
Types of Maps
Map Scales
Symbols and Conventional Signs
Direction and Bearings
Topographical Maps
Interpretation of Maps
Map Projections
Errors in Map Projections
Geographic Coordinates

4. Geomorphology
Structure of the Earth
Rocks and Minerals
Rock Cycle
Plate Tectonics
Earthquakes
Volcanoes
Weathering Processes
Erosion and Deposition
Landforms of Rivers
Landforms of Glaciers
Landforms of Wind
Coastal Landforms

5. Climatology
Weather and Climate
Elements of Weather
Atmospheric Structure
Temperature Distribution
Atmospheric Pressure
Wind Systems
Humidity and Precipitation
Air Masses and Fronts
Cyclones and Anticyclones
Climate Change
Global Warming

6. Oceanography
Distribution of Oceans and Seas
Relief of the Ocean Floor
Temperature of Ocean Water
Salinity of Ocean Water
Ocean Currents
Tides
Waves
Marine Resources
Coral Reefs

7. Biogeography
Biosphere
Ecosystems
Natural Vegetation
Forest Types
Grasslands
Desert Vegetation
Wildlife Distribution
Biodiversity
Conservation of Biodiversity

8. Soil Geography
Formation of Soil
Soil Profile
Types of Soil
Soil Erosion
Soil Conservation
Soil Fertility
Land Degradation

9. Environmental Geography
Human–Environment Interaction
Natural Resources
Renewable Resources
Non-Renewable Resources
Environmental Pollution
Environmental Degradation
Environmental Conservation
Sustainable Development
Environmental Management

10. Human Geography
Human Geography: Scope and Importance
Population Distribution
Population Density
Population Growth
Migration
Settlement Patterns
Rural Settlements
Urban Settlements
Human Development Indicators

11. Population Geography
Population Composition
Population Structure
Population Theories
Demographic Transition Model
Population Policies
Population Problems
Census and Population Data

12. Economic Geography
Economic Activities
Primary Economic Activities
Secondary Economic Activities
Tertiary Economic Activities
Quaternary Economic Activities
Agriculture Geography
Industrial Geography
Trade and Commerce
Transport and Communication

13. Agricultural Geography
Types of Agriculture
Subsistence Agriculture
Commercial Agriculture
Plantation Agriculture
Crop Patterns
Irrigation
Agricultural Inputs
Agricultural Productivity
Food Security

14. Industrial Geography
Location of Industries
Factors Affecting Industrial Location
Industrial Regions
Manufacturing Industries
Energy Resources
Industrial Pollution
Industrial Development

15. Transport and Communication Geography
Transport Systems
Road Transport
Railway Transport
Water Transport
Air Transport
Communication Networks
Global Trade Routes

16. Urban Geography
Origin and Growth of Cities
Urbanization
Urban Land Use
Urban Problems
Urban Planning
Sustainable Cities
Smart Cities

17. Political Geography
Nation and State
Boundaries and Frontiers
Geopolitics
Electoral Geography
International Organizations
Global Power Structures

18. Regional Geography
Concept of Regions
Physical Regions of the World
Climatic Regions
Economic Regions
Cultural Regions
Regional Development Disparities

19. Geography of Africa
Physical Geography of Africa
Climate of Africa
Natural Resources of Africa
Population of Africa
Economic Activities in Africa
Development Challenges in Africa

20. Geography of Rwanda
Location and Size of Rwanda
Relief and Drainage of Rwanda
Climate of Rwanda
Vegetation and Wildlife of Rwanda
Population Distribution in Rwanda
Economic Activities in Rwanda
Urbanization in Rwanda
Environmental Issues in Rwanda

21. Geographic Information Systems and Remote Sensing
Introduction to GIS
Components of GIS
Spatial Data and Attributes
Map Digitization
Remote Sensing
Satellites and Sensors
Applications of GIS
GIS in Urban Planning
GIS in Environmental Management

22. Disaster and Hazard Geography
Natural Hazards
Earthquakes and Volcanoes
Floods and Droughts
Cyclones and Storms
Landslides
Disaster Management
Risk Reduction Strategies

23. Tourism Geography
Concept of Tourism
Types of Tourism
Tourism Resources
Tourism and Environment
Sustainable Tourism
Ecotourism
Tourism Planning and Management

24. Applied and Modern Geography
Climate Risk Analysis
Environmental Impact Assessment
Resource Management
Development Geography
Urban Sustainability
Geopolitical Analysis
Spatial Planning

25. Practical Geography and Field Skills
Fieldwork Techniques
Survey Methods
Data Collection
Map Drawing and Interpretation
Weather Instruments
Statistical Methods in Geography
Report Writing in Geography
`;

function parseData(rawData) {
  const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
  const topics = [];
  let currentTopic = null;

  lines.forEach(line => {
    // Heuristic: Topic headers are either numbered or the specific "Foundations of Geography"
    const isTopic = /^\d+\.\s/.test(line) || line === "Foundations of Geography";
    
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

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

async function seed() {
  console.log('Starting seeding Geography...');
  
  const subjectName = 'Geography';
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
        description: 'The study of places and the relationships between people and their environments.',
        icon: 'Globe', 
        color: '#10B981', // Neutral emerald
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
          content: `Introduction to ${lessonTitle}. This lesson covers the key concepts of ${lessonTitle} as part of ${topic.title}.`
        },
        {
          type: 'quiz',
          question: `Which of these is a key aspect of ${lessonTitle}?`,
          options: ['Physical Features', 'Human Interaction', 'Climate Patterns', 'Mapping'],
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
  
  console.log('Geography Seeding complete!');
}

seed();
