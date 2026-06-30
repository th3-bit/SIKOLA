import sys

file_path = "c:\\Users\\HP\\OneDrive\\Desktop\\CODES\\sikola-app\\src\\screens\\SubjectDetailScreen.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "BackHandler } from 'react-native';",
    "BackHandler, useWindowDimensions } from 'react-native';"
)

# 2. isLargeScreen
content = content.replace(
    "const { theme, isDark } = useTheme();",
    "const { width: windowWidth } = useWindowDimensions();\n  const isLargeScreen = windowWidth >= 768;\n  const { theme, isDark } = useTheme();"
)

# 3. Restructuring return block
old_return = """  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>"""

new_return = """  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <SubjectDetailSkeleton />
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={isLargeScreen ? styles.scrollContentLarge : styles.scrollContent}
          >
            <View style={isLargeScreen ? styles.largeScreenContainer : null}>
              
              {/* Left Column (Sticky Header & Stats) */}
              <View style={isLargeScreen ? styles.leftColumn : null}>
                <View style={[styles.header, isLargeScreen && { paddingHorizontal: 0, paddingTop: 10 }]}>"""
content = content.replace(old_return, new_return)

old_loading_stats = """         </View>
 
         {loading ? (
            <SubjectDetailSkeleton />
         ) : (
          <>
            {/* Stats Card */}
            <View style={[styles.statsRow, { marginBottom: verticalScale(25) }]}"""

new_loading_stats = """                </View>

                {/* Stats Card */}
                <View style={[styles.statsRow, { marginBottom: verticalScale(25) }, isLargeScreen && { flexDirection: 'column', gap: 12, paddingHorizontal: 0 }]}"""
content = content.replace(old_loading_stats, new_loading_stats)

old_stat_items = """                    borderRadius: moderateScale(16),
                    marginHorizontal: scale(4)
                  }]}"""

new_stat_items = """                    borderRadius: moderateScale(16),
                    marginHorizontal: isLargeScreen ? 0 : scale(4),
                    width: isLargeScreen ? '100%' : undefined
                  }]}"""
content = content.replace(old_stat_items, new_stat_items)

old_scroll_start = """            {/* Topics/Lessons List (Curriculum Style) */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.lessonsContent}
              showsVerticalScrollIndicator={false}
            >"""

new_scroll_start = """              </View>

              {/* Right Column (Courses List) */}
              <View style={isLargeScreen ? [styles.rightColumnGlass, { 
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'
              }] : { flex: 1 }}>
                
                {/* Topics/Lessons List (Curriculum Style) */}
                <View style={[styles.scrollView, isLargeScreen && { paddingHorizontal: 0 }]}"""
content = content.replace(old_scroll_start, new_scroll_start)

# The end of the ScrollView block
old_scroll_end = """                  )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
          </>
         )}
      </SafeAreaView>"""

new_scroll_end = """                  )}
                </View>

                {/* Padding at the bottom to ensure content doesn't get hidden behind banners */}
                <View style={{ height: 120 }} />

              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>"""
content = content.replace(old_scroll_end, new_scroll_end)

# Add styles
new_styles = """
  scrollContent: {
    paddingBottom: verticalScale(120),
  },
  scrollContentLarge: {
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(120),
  },
  largeScreenContainer: {
    flexDirection: 'row',
    gap: scale(30),
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    maxWidth: 350,
    position: 'sticky',
    top: verticalScale(10),
    zIndex: 10,
  },
  rightColumnGlass: {
    flex: 2,
    borderRadius: scale(32),
    borderWidth: 1,
    padding: scale(20),
    overflow: 'hidden',
  },
"""
content = content.replace("  header: {", new_styles + "  header: {")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated via python!")
