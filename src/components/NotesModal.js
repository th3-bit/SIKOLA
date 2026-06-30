import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  ScrollView,
  Platform,
  useWindowDimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { WebView } from 'react-native-webview';
import { 
  X, 
  FileText, 
  ExternalLink, 
  BookOpen, 
  Download,
  Info,
  Zap,
  Lightbulb
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function NotesModal({ visible, onClose, notes, pdfUrl }) {
  const { theme, isDark } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const [viewPdf, setViewPdf] = useState(false);

  const renderBoldText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|\$.*?\$|Step \d+:?)/gi);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <Text key={index} style={{ fontWeight: '900', color: theme.colors.textPrimary }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        return (
          <Text key={index} style={{ fontWeight: '900', color: theme.colors.textPrimary }}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      if (/^Step \d+:?$/i.test(part)) {
        return (
          <Text key={index} style={{ fontWeight: '900', color: theme.colors.textPrimary }}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const renderNotesContent = () => (
    <View style={styles.contentContainer}>
      <View style={[styles.header, { borderBottomColor: theme.colors.glassBorder }]}>
        <View style={styles.headerLeft}>
          <FileText size={22} color={theme.colors.secondary} />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Study Notes</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} indicatorStyle={isDark ? 'white' : 'black'} contentContainerStyle={styles.scrollContent}>
        {/* Resource Badge */}
        {pdfUrl && (
          <TouchableOpacity 
            style={[styles.pdfBadge, { backgroundColor: theme.colors.secondary + '15', borderColor: theme.colors.secondary + '30' }]}
            onPress={() => setViewPdf(true)}
          >
            <View style={styles.pdfBadgeLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.secondary }]}>
                <Download size={16} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.pdfBadgeTitle, { color: theme.colors.textPrimary }]}>Reference PDF Available</Text>
                <Text style={[styles.pdfBadgeSub, { color: theme.colors.textSecondary }]}>Tap to view full documentation</Text>
              </View>
            </View>
            <ExternalLink size={18} color={theme.colors.secondary} />
          </TouchableOpacity>
        )}

        {/* Text Content */}
        <View style={styles.infoBox}>
           <Info size={18} color={theme.colors.secondary} />
           <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
             These notes are curated by instructors to help you master the key principles of this lesson.
           </Text>
        </View>

        <View style={styles.notesContainer}>
          {(() => {
            let currentSection = '';
            const sectionHeaders = ['EXPLANATION', 'EXAMPLES', 'KEY TAKEAWAYS', 'CORE CONCEPTS', 'PRACTICAL EXAMPLES'];

            return notes && notes.split('\n\n').map((line, idx) => {
              const trimmed = line.trim();
              
              if (sectionHeaders.includes(trimmed)) {
                currentSection = trimmed;
                return (
                  <Text key={idx} style={[styles.sectionHeading, { color: theme.colors.secondary }]}>
                    {trimmed}
                  </Text>
                );
              }

              if (line === '───────────────────') {
                currentSection = ''; 
                return <View key={idx} style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />;
              }

              if (line.startsWith('[||TAKEAWAY||]')) {
                const cleaned = line.replace('[||TAKEAWAY||]', '').trim();
                return (
                  <View key={idx} style={styles.takeawayCard}>
                    <View style={[styles.takeawayIcon, { backgroundColor: '#FEE2E2' }]}>
                      <Zap size={16} color="#EF4444" fill="#EF4444" />
                    </View>
                    <View style={styles.takeawayContent}>
                       <Text style={{ fontSize: 10, fontWeight: '900', color: '#EF4444', marginBottom: 4, letterSpacing: 1 }}>KEY TAKEAWAY</Text>
                        <Text style={[styles.takeawayText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                          {cleaned.split('\n').map((line, lidx) => {
                            if (line.startsWith('WHAT:')) {
                              return <Text key={lidx}><Text style={{ fontWeight: '900', color: theme.colors.textPrimary }}>WHAT: </Text>{renderBoldText(line.replace('WHAT:', '').trim())}{"\n"}</Text>;
                            }
                            if (line.startsWith('WHY:')) {
                              return <Text key={lidx}><Text style={{ fontWeight: '900', color: theme.colors.textPrimary }}>WHY: </Text>{renderBoldText(line.replace('WHY:', '').trim())}</Text>;
                            }
                            return <Text key={lidx}>{renderBoldText(line)}</Text>;
                          })}
                        </Text>
                    </View>
                  </View>
                );
              }

              if (line.startsWith('## ')) {
                const titleText = line.replace('## ', '');
                const [label, title] = titleText.split(': ');
                return (
                  <View key={idx} style={styles.exampleHeader}>
                    <Text style={[styles.itemTitle, { color: theme.colors.secondary }]}>
                      {label}: <Text style={{ textDecorationLine: 'underline' }}>{title}</Text>
                    </Text>
                  </View>
                );
              }

              if (line.startsWith('PROBLEM: ')) {
                const content = line.replace('PROBLEM: ', '');
                return (
                  <Text key={idx} style={[styles.notesText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    <Text style={{ fontWeight: '900', color: '#EF4444', textTransform: 'lowercase' }}>problem: </Text>
                    {renderBoldText(content)}
                  </Text>
                );
              }

              if (line.startsWith('SOLUTION: ')) {
                const content = line.replace('SOLUTION: ', '');
                return (
                  <Text key={idx} style={[styles.notesText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    <Text style={{ fontWeight: '900', color: '#10B981', textTransform: 'lowercase' }}>solution: </Text>
                    {renderBoldText(content)}
                  </Text>
                );
              }

              return (
                <Text key={idx} style={[styles.notesText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {renderBoldText(line)}
                </Text>
              );
            });
          })()}
          {!notes && (
            <Text style={[styles.notesText, { color: theme.colors.textSecondary, fontStyle: 'italic' }]}>
              No detailed notes provided for this lesson yet.
            </Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );

  const renderPdfViewer = () => (
    <View style={styles.pdfContainer}>
      <View style={[styles.pdfHeader, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
        <TouchableOpacity onPress={() => setViewPdf(false)} style={styles.backBtn}>
          <Text style={{ color: theme.colors.secondary, fontWeight: '700' }}>Back to Notes</Text>
        </TouchableOpacity>
        <Text style={[styles.pdfHeaderTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>Document Viewer</Text>
        <View style={{ width: 80 }} />
      </View>
      <WebView 
        source={{ uri: pdfUrl }}
        style={{ flex: 1 }}
        startInLoadingState={true}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType={isLargeScreen ? 'fade' : 'slide'}>
      <View style={[
        styles.overlay,
        isLargeScreen && { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 40 }
      ]}>
        <BlurView 
          intensity={100} 
          tint={isDark ? "dark" : "light"} 
          style={[
            styles.container,
            { backgroundColor: isDark ? 'rgba(20,20,20,0.6)' : 'rgba(255,255,255,0.45)' },
            isLargeScreen && {
              width: '100%',
              maxWidth: 900,
              height: windowHeight * 0.85,
              borderRadius: 32,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
            }
          ]}
        >
          {viewPdf ? renderPdfViewer() : renderNotesContent()}
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: '100%',
    height: height * 0.85,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 5,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 25,
  },
  pdfBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfBadgeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  pdfBadgeSub: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  notesContainer: {
    paddingBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 15,
    opacity: 0.8,
  },
  exampleHeader: {
    marginTop: 30,
    marginBottom: 15,
    paddingBottom: 4,
  },
  itemTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 28,
    opacity: 0.8,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 30,
  },
  takeawayCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 16,
    flexDirection: 'row',
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  takeawayIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  takeawayContent: {
    flex: 1,
  },
  takeawayText: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.9,
  },
  pdfContainer: {
    flex: 1,
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  pdfHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backBtn: {
    padding: 10,
  }
});
