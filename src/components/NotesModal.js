import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Dimensions, 
  ScrollView,
  Platform
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
  const [viewPdf, setViewPdf] = useState(false);

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
            return notes && notes.split('\n\n').map((line, idx) => {
              const trimmed = line.trim();
              const sectionHeaders = ['EXPLANATION', 'EXAMPLES', 'KEY TAKEAWAYS', 'CORE CONCEPTS', 'PRACTICAL EXAMPLES'];
              
              if (sectionHeaders.includes(trimmed)) {
                currentSection = trimmed;
                return (
                  <Text key={idx} style={[styles.sectionHeading, { color: theme.colors.secondary }]}>
                    {trimmed}
                  </Text>
                );
              }

              if (line === '───────────────────') {
                return <View key={idx} style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />;
              }

              if (currentSection === 'KEY TAKEAWAYS') {
                const subCards = line.split('---TAKAEAWAY_CARD---');
                return subCards.map((cardContent, cIdx) => (
                  <View key={`${idx}-${cIdx}`} style={styles.takeawayCard}>
                    <View style={[styles.takeawayIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
                      <Zap size={16} color={theme.colors.secondary} />
                    </View>
                    <View style={styles.takeawayContent}>
                       <Text style={[styles.takeawayText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                         {cardContent.replace(/^[\r\n]+/, '').replace(/[\r\n]+$/, '')}
                       </Text>
                    </View>
                  </View>
                ));
              }

              if (line.startsWith('## ')) {
                return (
                  <Text key={idx} style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>
                    {line.replace('## ', '')}
                  </Text>
                );
              }

              return (
                <Text key={idx} style={[styles.notesText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {line}
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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <BlurView 
          intensity={Platform.OS === 'ios' ? 95 : 100} 
          tint={isDark ? "dark" : "light"} 
          style={styles.container}
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
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  itemTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
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
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    marginBottom: 16,
    flexDirection: 'row',
    gap: 15,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.1)',
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
