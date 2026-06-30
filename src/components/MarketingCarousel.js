import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  useWindowDimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Crown, 
  Zap, 
  Coffee, 
  Trophy, 
  ChevronRight,
  Sparkles
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { scale } from '../utils/Scaling';

const PROMOS = [
  {
    id: 'coffee',
    title: 'Study for the price of coffee',
    subtitle: 'Unlock single courses from just ZMW 15 each.',
    icon: Coffee,
    colors: ['#F59E0B', '#D97706'],
    tag: 'BEST VALUE',
  },
  {
    id: 'elite',
    title: 'Join the Elite Circle',
    subtitle: 'Get Full Access to all subjects and premium tests.',
    icon: Crown,
    colors: ['#8B5CF6', '#6D28D9'],
    tag: 'PREMIUM',
  },
  {
    id: 'xp',
    title: 'Weekend XP Rush',
    subtitle: 'Earn 2x XP on all Law topics this Saturday!',
    icon: Zap,
    colors: ['#10B981', '#059669'],
    tag: 'LIMITED TIME',
  },
  {
    id: 'mastery',
    title: 'Track Your Mastery',
    subtitle: 'Detailed analytics to guarantee exam success.',
    icon: Trophy,
    colors: ['#3B82F6', '#2563EB'],
    tag: 'ANALYTICS',
  }
];

export default function MarketingCarousel({ navigation }) {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  
  const CARD_WIDTH = width * 0.8;

  const renderCard = (promo, additionalStyle, isWide = false) => {
    const Icon = promo.icon;
    return (
      <TouchableOpacity
        key={promo.id}
        activeOpacity={0.7}
        onPress={() => {
          let params = {};
          if (promo.id === 'elite') params = { defaultPlanType: 'monthly' };
          if (promo.id === 'xp') params = { defaultPlanType: 'daily' };
          if (promo.id === 'mastery') params = { defaultPlanType: 'per_course' };
          if (promo.id === 'coffee') params = { defaultPlanType: 'weekly' };
          navigation.navigate('Subscription', params);
        }}
        style={[styles.cardWrapper, additionalStyle]}
      >
        <LinearGradient
          colors={promo.colors}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative Circles */}
          <View style={[styles.circleLarge, { top: -30, right: -30 }, isWide && { width: 300, height: 300, borderRadius: 150, top: -100, right: -50 }]} />
          <View style={[styles.circleSmall, { bottom: -20, left: -15 }, isWide && { width: 150, height: 150, borderRadius: 75, bottom: -50, left: -30 }]} />

          <View style={[styles.content, isWide && { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            
            {isWide ? (
              <>
                <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
                  <View style={[styles.tagContainer, { alignSelf: 'flex-start', marginBottom: 16 }]}>
                    <Sparkles size={12} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={[styles.tagText, { fontSize: 12 }]}>{promo.tag}</Text>
                  </View>
                  <Text style={[styles.title, { fontSize: 24, marginBottom: 8 }]} numberOfLines={1}>
                    {promo.title}
                  </Text>
                  <Text style={[styles.subtitle, { fontSize: 15 }]}>{promo.subtitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                  <View style={[styles.iconBubble, { width: 64, height: 64, borderRadius: 20, marginBottom: 16 }]}>
                    <Icon size={36} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View style={[styles.arrowContainer, { width: 44, height: 44, borderRadius: 22 }]}>
                    <ChevronRight size={24} color="#FFF" />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.header}>
                  <View style={styles.tagContainer}>
                    <Sparkles size={10} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.tagText}>{promo.tag}</Text>
                  </View>
                  <View style={styles.iconBubble}>
                    <Icon size={28} color="rgba(255,255,255,0.9)" />
                  </View>
                </View>

                <View style={styles.footer}>
                  <View style={styles.textContainer}>
                    <Text 
                      style={styles.title} 
                      numberOfLines={1} 
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {promo.title}
                    </Text>
                    <Text style={styles.subtitle}>{promo.subtitle}</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <ChevronRight size={20} color="#FFF" />
                  </View>
                </View>
              </>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isDesktop) {
    return (
      <View style={[styles.desktopSectionCard, isDark && styles.desktopSectionCardDark]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
          Special Offers
        </Text>
        <View style={styles.desktopGridContainer}>
          {PROMOS.map(promo => renderCard(promo, { flex: 1, width: 'auto' }, false))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 15}
      >
        {PROMOS.map(promo => renderCard(promo, { width: CARD_WIDTH }))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopSectionCard: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: scale(24),
    borderRadius: scale(28),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 30,
    marginTop: 20,
  },
  desktopSectionCardDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  desktopGridContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  container: {
    marginVertical: 20,
    marginHorizontal: -20, // Break out of parent's paddingHorizontal to reach screen edges
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  cardWrapper: {
    height: 140,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  circleLarge: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  circleSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tagContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
