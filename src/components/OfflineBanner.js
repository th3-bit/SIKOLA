import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useNetwork } from '../context/NetworkContext';

/**
 * OfflineBanner.js
 * A slim, non-blocking animated banner that slides in from the top when the
 * device loses internet connectivity. It slides out automatically on reconnect.
 *
 * Shows pending sync count when there are queued writes waiting to be sent.
 */

export default function OfflineBanner() {
  const { isOnline, pendingCount } = useNetwork();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const wasOnline  = useRef(true);

  useEffect(() => {
    // isOnline === null means we don't know yet — do nothing
    if (isOnline === null) return;

    if (!isOnline) {
      // Slide down into view
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else if (wasOnline.current === false) {
      // Was offline, now back — slide away after a brief "syncing" display
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 400,
        delay: 1200,
        useNativeDriver: true,
      }).start();
    }
    wasOnline.current = isOnline;
  }, [isOnline]);

  // Don't mount at all during startup (isOnline === null)
  if (isOnline === null || (isOnline && pendingCount === 0)) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] },
        { backgroundColor: isOnline && pendingCount > 0 ? '#0D9488' : '#1F2937' },
      ]}
      pointerEvents="none"   // Never blocks touches on content below
    >
      <View style={styles.row}>
        {isOnline && pendingCount > 0 ? (
          <>
            <RefreshCw size={14} color="#FFF" style={styles.icon} />
            <Text style={styles.text}>
              Syncing {pendingCount} offline {pendingCount === 1 ? 'action' : 'actions'}…
            </Text>
          </>
        ) : (
          <>
            <WifiOff size={14} color="#FFF" style={styles.icon} />
            <Text style={styles.text}>
              No internet — showing cached content
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 44,   // Account for status bar
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
