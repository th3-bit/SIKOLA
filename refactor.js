const fs = require('fs');
const filePath = 'c:\\Users\\HP\\OneDrive\\Desktop\\CODES\\sikola-app\\src\\screens\\LessonDetailScreen.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useWindowDimensions
content = content.replace('BackHandler\n} from \'react-native\';', 'BackHandler,\n  useWindowDimensions\n} from \'react-native\';');

// 2. Add isLargeScreen
content = content.replace('const { theme, isDark } = useTheme();', 'const { width: screenWidth } = useWindowDimensions();\n  const isLargeScreen = screenWidth >= 768;\n  const { theme, isDark } = useTheme();');

// 3. Extract renderHeroAndAbout and renderCurriculum
const heroStartStr = '          {/* Hero Section */}';
const curriculumStartStr = '          {/* Curriculum Section */}';
const curriculumEndStr = '          <View style={{ height: 120 }} />';

const heroStartIndex = content.indexOf(heroStartStr);
const curriculumStartIndex = content.indexOf(curriculumStartStr);
const curriculumEndIndex = content.indexOf(curriculumEndStr);

if (heroStartIndex === -1 || curriculumStartIndex === -1 || curriculumEndIndex === -1) {
    console.log('Could not find section markers');
    process.exit(1);
}

const heroAndAboutCode = content.substring(heroStartIndex, curriculumStartIndex);
const curriculumCode = content.substring(curriculumStartIndex, curriculumEndIndex);

const extractedCode = `
  const renderHeroAndAbout = () => (
    <>
` + heroAndAboutCode.replace(/^          /gm, '      ') + `    </>
  );

  const renderCurriculum = () => (
    <>
` + curriculumCode.replace(/^          /gm, '      ') + `    </>
  );

  return (`

content = content.replace('  return (', extractedCode);

// 4. Replace ScrollView content
const scrollViewStartStr1 = '<ScrollView \n          showsVerticalScrollIndicator={false}\n          contentContainerStyle={styles.scrollContent}\n        >';
const scrollViewStartStr2 = '<ScrollView \r\n          showsVerticalScrollIndicator={false}\r\n          contentContainerStyle={styles.scrollContent}\r\n        >';

const newScrollView = `<ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isLargeScreen ? styles.scrollContentLarge : styles.scrollContent}
        >
          {isLargeScreen ? (
            <View style={styles.largeScreenContainer}>
              <View style={styles.leftColumn}>
                {renderHeroAndAbout()}
              </View>
              <View style={[styles.rightColumnGlass, { 
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
              }]}>
                {renderCurriculum()}
              </View>
            </View>
          ) : (
            <>
              {renderHeroAndAbout()}
              {renderCurriculum()}
            </>
          )}

          <View style={{ height: 120 }} />`;

let fullOldScrollContent = '';
if (content.indexOf(scrollViewStartStr1) !== -1) {
  fullOldScrollContent = content.substring(content.indexOf(scrollViewStartStr1), curriculumEndIndex + curriculumEndStr.length);
} else if (content.indexOf(scrollViewStartStr2) !== -1) {
  fullOldScrollContent = content.substring(content.indexOf(scrollViewStartStr2), curriculumEndIndex + curriculumEndStr.length);
} else {
  console.log("Could not find ScrollView start");
  process.exit(1);
}

content = content.replace(fullOldScrollContent, newScrollView);

// 5. Add styles
const newStyles = `
  scrollContentLarge: {
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(10),
  },
  largeScreenContainer: {
    flexDirection: 'row',
    gap: scale(20),
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    maxWidth: 400,
  },
  rightColumnGlass: {
    flex: 1.5,
    borderRadius: scale(32),
    borderWidth: 1,
    padding: scale(20),
    marginTop: verticalScale(10),
    overflow: 'hidden',
  },
`;
content = content.replace('scrollContent: {', newStyles + '  scrollContent: {');

fs.writeFileSync(filePath, content, 'utf8');
console.log('File updated successfully');
