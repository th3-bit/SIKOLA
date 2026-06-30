import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { version as appVersion } from '../../package.json';
import logger from '../utils/logger';

// ── INSTANT CACHE HELPERS ─────────────────────────────────────────────────────
// On web, we use sessionStorage to cache auth state synchronously so the app
// can skip the loading screen on tab-return / page-reload.
const SESSION_CACHE_KEY = '@sikola_session_cache';
const ONBOARDING_CACHE_KEY = '@sikola_onboarding_cache';

function readWebCache(key) {
  try {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(key);
    }
  } catch (_) {}
  return null;
}

function writeWebCache(key, value) {
  try {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      if (value === null) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
      }
    }
  } catch (_) {}
}
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  // ── Synchronous hydration from web cache ───────────────────────────────────
  // If we have a cached session on web (i.e. the user already logged in this
  // browser session), start with loading=false so the loading screen is never
  // shown when they return to the tab or reload the page.
  const cachedHasSession = readWebCache(SESSION_CACHE_KEY) === '1';
  const cachedOnboarding = readWebCache(ONBOARDING_CACHE_KEY);
  // cachedOnboarding: '0' = done, '1' = show, null = unknown
  const initialShowOnboarding = cachedOnboarding === '1' ? true : cachedOnboarding === '0' ? false : null;

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  // Start with loading=false if we have a cached session (instant restore)
  const [loading, setLoading] = useState(cachedHasSession ? false : true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(initialShowOnboarding);
  // Where to send new users after onboarding: 'SignUp' (new user) or 'Login' (default)
  const [postOnboardingDestination, setPostOnboardingDestination] = useState('Login');

  useEffect(() => {
    // Check for active session on mount
    const checkSession = async () => {
      try {
        // Check session FIRST — logged-in users skip onboarding entirely
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        logger.log('[AuthContext] checkSession result:', initialSession ? `session for ${initialSession.user?.email}` : 'NO SESSION');

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Cache session existence for instant restore on next reload
        writeWebCache(SESSION_CACHE_KEY, initialSession ? '1' : null);

        // Show onboarding for new users or when the app is updated
        const savedVersion = await AsyncStorage.getItem('onboarding_version');
        const shouldShowOnboarding = savedVersion !== appVersion;

        setShowOnboarding(shouldShowOnboarding);
        // Cache onboarding state so we skip the loading screen on reload
        writeWebCache(ONBOARDING_CACHE_KEY, shouldShowOnboarding ? '1' : '0');
      } catch (error) {
        logger.error('Error checking initial session:', error);
        setShowOnboarding(false);
        writeWebCache(ONBOARDING_CACHE_KEY, '0');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.log(`[AuthContext] Auth event: ${_event} | session: ${session ? session.user?.email : 'NULL'}`);
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Keep cache in sync
      writeWebCache(SESSION_CACHE_KEY, session ? '1' : null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_version', appVersion);
      // New users finishing onboarding should land on Sign Up, not Login
      setPostOnboardingDestination('SignUp');
      setShowOnboarding(false);
      writeWebCache(ONBOARDING_CACHE_KEY, '0');
    } catch (error) {
      logger.error('Error saving onboarding version:', error);
      setShowOnboarding(false);
      writeWebCache(ONBOARDING_CACHE_KEY, '0');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isRecovering, setIsRecovering, signOut, showOnboarding, completeOnboarding, postOnboardingDestination }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
