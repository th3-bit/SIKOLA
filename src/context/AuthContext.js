import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { version as appVersion } from '../../package.json';
import logger from '../utils/logger';

// ── INSTANT CACHE HELPERS ─────────────────────────────────────────────────────
// On web, we use localStorage to cache auth state synchronously so the app
// can skip the loading screen on page reload (F5) and tab-return.
// sessionStorage is cleared on reload — localStorage persists.
const SESSION_CACHE_KEY = '@sikola_session_cache';
const ONBOARDING_CACHE_KEY = '@sikola_onboarding_cache';

function readWebCache(key) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (_) {}
  return null;
}

function writeWebCache(key, value) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
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
  // If user has a cached session, they are a returning user — never show onboarding,
  // and never go null (null triggers the loading screen via `showOnboarding === null`).
  const initialShowOnboarding = cachedOnboarding === '1' ? true
    : cachedOnboarding === '0' ? false
    : cachedHasSession ? false   // returning user → skip onboarding immediately
    : null;                       // truly unknown — first ever visit

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  // Start with loading=false if we have a cached session (instant restore)
  const [loading, setLoading] = useState(cachedHasSession ? false : true);
  // When we know a session exists (from cache) but it hasn't been restored yet,
  // block the Login screen from flashing by marking session as "restoring".
  const [sessionRestoring, setSessionRestoring] = useState(cachedHasSession);
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
        setSessionRestoring(false); // session is now known
      }
    };

      checkSession();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate effect for auth state listener — also clears sessionRestoring
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      logger.log(`[AuthContext] Auth event: ${_event} | session: ${s ? s.user?.email : 'NULL'}`);
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      setSessionRestoring(false); // session is now known — stop blocking Login screen
      writeWebCache(SESSION_CACHE_KEY, s ? '1' : null);
    });
    return () => subscription?.unsubscribe();
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
    <AuthContext.Provider value={{
      user, session, loading, isRecovering, setIsRecovering,
      signOut, showOnboarding, completeOnboarding, postOnboardingDestination,
      cachedHasSession,     // true when localStorage says user has an active session
      sessionRestoring,     // true while we wait for supabase.auth.getSession() to resolve
    }}>
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
