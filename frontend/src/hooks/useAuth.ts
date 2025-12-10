// Auth Hook - Uses Supabase Auth + Per-User Card Sync + Extension Sync
import { useEffect, useCallback } from "react";
import { useAuthStore, useCardStore } from "../store/useStore";
import { supabase, onAuthStateChange } from "../config/supabase";
import { cardService } from "../services/cardService";
import { extensionService } from "../services/extensionService";
import { useNotificationStore } from "../services/notificationService";
import { genZToast } from "../services/genZToast";
import { User } from "../types";

// Extension detection helper
const checkExtensionInstalled = async (): Promise<{ installed: boolean; synced: boolean }> => {
  try {
    // Method 1: Check localStorage flag set by content script
    const extensionFlag = localStorage.getItem('vibe_tracker_extension') ||
      localStorage.getItem('expense_tracker_extension');
    const isSynced = localStorage.getItem('extension_synced') === 'true';

    if (extensionFlag || isSynced) {
      return { installed: true, synced: isSynced };
    }

    // Method 2: Try chrome runtime message (if available)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ installed: false, synced: false });
        }, 1000);

        try {
          // Try to send a message to the extension
          chrome.runtime.sendMessage(
            { type: 'CHECK_EXTENSION' },
            (response: any) => {
              clearTimeout(timeout);
              if (chrome.runtime.lastError || !response) {
                resolve({ installed: false, synced: false });
              } else {
                resolve({
                  installed: true,
                  synced: response.loggedIn || false
                });
              }
            }
          );
        } catch {
          clearTimeout(timeout);
          resolve({ installed: false, synced: false });
        }
      });
    }

    return { installed: false, synced: false };
  } catch {
    return { installed: false, synced: false };
  }
};

export const useAuth = () => {
  const { setUser, setLoading, logout } = useAuthStore();
  const { setCards, clearCards, initializeCards } = useCardStore();
  const { addNotification } = useNotificationStore();

  // Load cards for a specific user from Supabase
  const loadUserCards = useCallback(async (userId: string) => {
    try {
      console.log(`Loading cards for user: ${userId}`);

      // First initialize local storage for this user
      initializeCards(userId);

      // Then try to load from Supabase
      const cards = await cardService.getAll(userId);

      if (cards && cards.length > 0) {
        // Convert Supabase card format to local format
        const localCards = cards.map(card => ({
          id: card.id,
          user_id: card.user_id,
          number: card.number,
          holder: card.holder,
          expiry: card.expiry,
          cvv: card.cvv,
          pin: card.pin,
          type: card.card_type as any,
          theme: card.theme
        }));
        setCards(localCards);
        console.log(`✅ Loaded ${cards.length} cards from Supabase`);
      } else {
        console.log('📭 No cards in Supabase, using local storage');
      }
    } catch (error) {
      console.error('Error loading cards from Supabase:', error);
      // Local cards are already initialized, so they'll still work
      console.log('🔄 Using locally stored cards');
    }
  }, [setCards, initializeCards]);

  // Handle post-login extension sync with appropriate alerts
  // STREAMLINED: Only show ONE notification instead of multiple
  const handleLoginExtensionSync = useCallback(async (session: any, user: any) => {
    try {
      // Check if extension is installed
      const extensionStatus = await checkExtensionInstalled();
      console.log('Extension status:', extensionStatus);

      if (extensionStatus.installed) {
        // Extension IS installed - try to sync
        const synced = await extensionService.notifyLogin(session, user);

        if (synced) {
          // SUCCESS: Extension installed AND synced!
          console.log('✅ Extension synced with website session');
          localStorage.setItem('extension_synced', 'true');

          // Show ONLY ONE success toast - no banner, no notification center
          genZToast.success('🔗 Extension synced! Auto-tracking active ✨', {
            autoClose: 4000,
            toastId: 'extension-synced' // Prevent duplicates
          });
        } else {
          // Extension installed but sync failed - let user know
          genZToast.info('🔌 Extension detected! Open popup to sync.', {
            autoClose: 4000,
            toastId: 'extension-needs-sync'
          });
        }
      } else {
        // Extension NOT installed - show ONE install prompt after delay
        console.log('📌 Extension not detected');

        setTimeout(() => {
          // Dispatch event for ExtensionAlert banner ONLY (no toast)
          window.dispatchEvent(new CustomEvent('show-extension-install-prompt'));
        }, 3000);
      }
    } catch (error) {
      console.error('Extension sync check error:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("Initializing Auth with Supabase...");

        // Check if user explicitly logged out
        const explicitLogout = sessionStorage.getItem('explicit_logout');
        if (explicitLogout === 'true') {
          console.log("User explicitly logged out - clearing data");
          sessionStorage.removeItem('explicit_logout');
          if (mounted) {
            setUser(null);
            setLoading(false);
            clearCards();
          }
          return;
        }

        // Check current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          console.log("Session restored:", session.user.email);

          // Extract user data including avatar
          const userData = session.user.user_metadata || {};
          const googleIdentity = session.user.identities?.find(id => id.provider === 'google');

          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            name: userData.full_name ||
              userData.name ||
              session.user.email?.split('@')[0] || 'User',
            avatarUrl: userData.avatar_url ||
              userData.picture ||
              googleIdentity?.identity_data?.avatar_url ||
              googleIdentity?.identity_data?.picture,
            currency: "PKR",
            createdAt: session.user.created_at || new Date().toISOString(),
          };

          if (mounted) {
            setUser(user);
            // Load THIS user's cards from Supabase
            loadUserCards(session.user.id);

            // Sync session with extension (silently on restore)
            extensionService.notifyLogin(session, session.user).then(synced => {
              if (synced) {
                console.log('✅ Extension synced with website session (restore)');
                localStorage.setItem('extension_synced', 'true');
              }
            });
          }
        } else {
          console.log("No active session found.");
          if (mounted) {
            setUser(null);
            clearCards(); // Clear cards when no session
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          setUser(null);
          clearCards();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);

      if (event === "SIGNED_IN" && session?.user) {
        sessionStorage.removeItem('explicit_logout');

        const userData = session.user.user_metadata || {};
        const googleIdentity = session.user.identities?.find((id: any) => id.provider === 'google');

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: userData.full_name ||
            userData.name ||
            session.user.email?.split('@')[0] || 'User',
          avatarUrl: userData.avatar_url ||
            userData.picture ||
            googleIdentity?.identity_data?.avatar_url ||
            googleIdentity?.identity_data?.picture,
          currency: "PKR",
          createdAt: session.user.created_at || new Date().toISOString(),
        };

        setUser(user);
        // Load THIS user's cards
        loadUserCards(session.user.id);

        // Handle extension sync with appropriate alerts
        handleLoginExtensionSync(session, session.user);

      } else if (event === "SIGNED_OUT") {
        console.log("User signed out - clearing all data");
        clearCards(); // Clear cards on logout

        // Notify extension to logout too
        extensionService.notifyLogout();

        // Clear extension sync state
        localStorage.removeItem('extension_synced');
        localStorage.removeItem('expense_tracker_session');
        localStorage.removeItem('expense_tracker_extension');
        localStorage.removeItem('vibe_tracker_extension');

        logout();
        setLoading(false);

        // Show logout toast
        genZToast.info('Logged out. Extension also signed out! 👋', {
          autoClose: 3000
        });

      } else if (event === "USER_UPDATED" && session?.user) {
        // User profile updated - refresh avatar
        const userData = session.user.user_metadata || {};
        const googleIdentity = session.user.identities?.find((id: any) => id.provider === 'google');

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: userData.full_name ||
            userData.name ||
            session.user.email?.split('@')[0] || 'User',
          avatarUrl: userData.avatar_url ||
            userData.picture ||
            googleIdentity?.identity_data?.avatar_url ||
            googleIdentity?.identity_data?.picture,
          currency: "PKR",
          createdAt: session.user.created_at || new Date().toISOString(),
        };

        setUser(user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, logout, setCards, clearCards, loadUserCards, handleLoginExtensionSync]);

  // Return the state for components to use
  const { isAuthenticated, isLoading, user } = useAuthStore();
  return { isAuthenticated, isLoading, user };
};
