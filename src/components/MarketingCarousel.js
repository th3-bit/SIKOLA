import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity 
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

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

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
        {PROMOS.map((promo) => {
          const Icon = promo.icon;
          return (
            <TouchableOpacity
              key={promo.id}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Subscription')}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={promo.colors}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Decorative Shapes */}
                <View style={[styles.circle, { top: -20, right: -20, backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                <View style={[styles.circle, { bottom: -30, left: -20, width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.05)' }]} />

                <View style={styles.content}>
                  <View style={styles.header}>
                    <View style={styles.tagContainer}>
                      <Sparkles size={10} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.tagText}>{promo.tag}</Text>
                    </View>
                    <Icon size={32} color="#FFF" />
                  </View>

                  <View style={styles.footer}>
                    <View style={styles.textContainer}>
                      <Text style={styles.title}>{promo.title}</Text>
                      <Text style={styles.subtitle}>{promo.subtitle}</Text>
                    </View>
                    <View style={styles.arrowContainer}>
                      <ChevronRight size={20} color="#FFF" />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  cardWrapper: {
    width: CARD_WIDTH,
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
  circle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
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
    fontSize: 19,
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
