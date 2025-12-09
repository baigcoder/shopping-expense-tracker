// Auth Hook - Uses Supabase Auth + Per-User Card Sync + Extension Sync
import { useEffect, useCallback } from "react";
import { useAuthStore, useCardStore } from "../store/useStore";
import { supabase, onAuthStateChange } from "../config/supabase";
import { cardService } from "../services/cardService";
import { extensionService } from "../services/extensionService";
import { useNotificationStore } from "../services/notificationService";
import { User } from "../types";

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

            // Sync session with extension if installed
            extensionService.notifyLogin(session, session.user).then(synced => {
              if (synced) {
                console.log('✅ Extension synced with website session');
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

        // Sync session with extension and show notification
        extensionService.notifyLogin(session, session.user).then(synced => {
          if (synced) {
            console.log('✅ Extension synced on login');
            addNotification({
              type: 'system',
              title: '🔗 Extension Synced!',
              message: 'Browser extension is now connected and tracking your purchases.'
            });
          }
        });

      } else if (event === "SIGNED_OUT") {
        console.log("User signed out - clearing all data");
        clearCards(); // Clear cards on logout
        extensionService.notifyLogout(); // Notify extension
        logout();
        setLoading(false);

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
  }, [setUser, setLoading, logout, setCards, clearCards, loadUserCards]);

  // Return the state for components to use
  const { isAuthenticated, isLoading, user } = useAuthStore();
  return { isAuthenticated, isLoading, user };
};
