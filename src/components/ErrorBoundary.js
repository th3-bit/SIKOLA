import React from 'react';
import logger from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * ErrorBoundary.js
 * Catches any uncaught React render error and shows a premium,
 * user-friendly fallback screen instead of a blank or red screen.
 *
 * Features:
 *  - Friendly copy above the fold (no scary red screen)
 *  - Error details hidden behind a toggle (shown only when needed)
 *  - "Copy Error Report" for sending to support via WhatsApp
 *  - Short error ID generated from timestamp (easy to reference)
 *  - "Try Again" resets the boundary so the app can re-render
 */

const SUPPORT_PHONE = '250728439394';

function generateErrorId() {
  return `ERR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// ─── Fallback UI (functional so we can use hooks later if needed) ────────────
function ErrorFallback({ error, errorInfo, errorId, onReset, showDetails, onToggleDetails }) {
  const errorReport = `Sikola+ Error Report
ID: ${errorId}
Platform: ${Platform.OS} ${Platform.Version}
Time: ${new Date().toISOString()}

Error: ${error?.toString() || 'Unknown error'}

Component Stack:${errorInfo?.componentStack || 'Not available'}`;

  const handleCopy = () => {
    Clipboard.setStringAsync(errorReport);
    Alert.alert(
      'Copied',
      `Error report "${errorId}" copied to clipboard.\n\nPaste it when contacting support.`
    );
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hello Sikola+ Support,\n\nI encountered an error in the app.\n\nError ID: ${errorId}\nPlatform: ${Platform.OS} ${Platform.Version}\n\nError: ${error?.toString() || 'Unknown'}`
    );
    const url = `whatsapp://send?phone=${SUPPORT_PHONE}&text=${msg}`;
    Linking.canOpenURL(url).then(ok => {
      Linking.openURL(ok ? url : `https://wa.me/${SUPPORT_PHONE}?text=${msg}`);
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A3E', '#0F0F23']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>⚠️</Text>
          </View>

          {/* Heading */}
          <Text style={styles.title}>Oops, something broke</Text>
          <Text style={styles.subtitle}>
            The app ran into an unexpected issue. This has been logged.{'\n'}
            Tap "Try Again" — it usually fixes it.
          </Text>

          {/* Error ID chip */}
          <View style={styles.errorIdChip}>
            <Text style={styles.errorIdLabel}>Error ID</Text>
            <Text style={styles.errorIdValue}>{errorId}</Text>
          </View>

          {/* Primary action */}
          <TouchableOpacity style={styles.primaryBtn} onPress={onReset} activeOpacity={0.85}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              style={styles.primaryBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary actions row */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopy} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>📋 Copy Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, styles.whatsappBtn]} onPress={handleWhatsApp} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>💬 Get Help</Text>
            </TouchableOpacity>
          </View>

          {/* Collapsible error details */}
          <TouchableOpacity onPress={onToggleDetails} style={styles.detailsToggle} activeOpacity={0.7}>
            <Text style={styles.detailsToggleText}>
              {showDetails ? '▲ Hide technical details' : '▼ Show technical details'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.detailsBox}>
              <Text style={styles.detailsLabel}>Error</Text>
              <Text style={styles.detailsText}>{error?.toString() || 'Unknown error'}</Text>
              {errorInfo?.componentStack && (
                <>
                  <Text style={[styles.detailsLabel, { marginTop: 12 }]}>Component Stack</Text>
                  <Text style={styles.detailsText}>{errorInfo.componentStack}</Text>
                </>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Error Boundary Class ────────────────────────────────────────────────────
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError:    false,
      error:       null,
      errorInfo:   null,
      errorId:     null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('━━━━━━━━ ErrorBoundary caught ━━━━━━━━');
    logger.error('Error:', error);
    logger.error('Component Stack:', errorInfo?.componentStack);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError:    false,
      error:       null,
      errorInfo:   null,
      errorId:     null,
      showDetails: false,
    });
  };

  handleToggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          showDetails={this.state.showDetails}
          onReset={this.handleReset}
          onToggleDetails={this.handleToggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99,102,241,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F1F5F9',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(241,245,249,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    marginBottom: 32,
  },
  errorIdLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorIdValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C7D2FE',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryBtnGrad: {
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 28,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  whatsappBtn: {
    backgroundColor: 'rgba(37,211,102,0.1)',
    borderColor: 'rgba(37,211,102,0.2)',
  },
  secondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  detailsToggleText: {
    color: 'rgba(241,245,249,0.35)',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  detailsText: {
    fontSize: 11,
    color: 'rgba(241,245,249,0.5)',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    lineHeight: 17,
  },
});
