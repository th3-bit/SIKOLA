import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '../services/offlineQueue';
import logger from '../utils/logger';

/**
 * NetworkContext.js
 * Provides real-time network connectivity status to the entire app.
 * When the device reconnects after being offline, it automatically
 * flushes the offline write queue to sync any pending progress saves.
 */

const NetworkContext = createContext({
  isOnline: true,   // Assume online until proven otherwise
  connectionType: null,
  pendingCount: 0,
});

export const NetworkProvider = ({ children }) => {
  // null = not yet determined, true = online, false = offline
  const [isOnline, setIsOnline]             = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const [pendingCount, setPendingCount]     = useState(0);
  const wasOffline   = useRef(false);
  const startupDone = useRef(false);  // Ignore first event for 2s to prevent startup flash

  const refreshPendingCount = useCallback(async () => {
    const count = await offlineQueue.getCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    // Give the app 2 seconds before we trust offline events.
    // This prevents a false 'offline' flash at startup before NetInfo stabilises.
    const startupTimer = setTimeout(() => {
      startupDone.current = true;
    }, 2000);

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      // Use ONLY isConnected — isInternetReachable is unreliable on Android
      // and often returns false/null even when the device is fully online.
      const online = state.isConnected === true;
      setConnectionType(state.type);

      if (!startupDone.current) {
        // During startup grace period, always treat as online
        setIsOnline(true);
        wasOffline.current = false;
        return;
      }

      setIsOnline(online);

      if (online && wasOffline.current) {
        logger.log('NetworkContext: back online, flushing offline queue...');
        await offlineQueue.flush();
        await refreshPendingCount();
      }

      wasOffline.current = !online;

      if (!online) {
        await refreshPendingCount();
      }
    });

    refreshPendingCount();

    return () => {
      clearTimeout(startupTimer);
      unsubscribe();
    };
  }, [refreshPendingCount]);

  return (
    <NetworkContext.Provider value={{ isOnline, connectionType, pendingCount, refreshPendingCount }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
