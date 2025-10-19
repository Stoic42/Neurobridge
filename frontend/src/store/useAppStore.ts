import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, UserRole, TranslationResult, TranslationHistory } from '../types/index.ts';

interface AppStore extends AppState {
  // Actions
  setUserRole: (role: UserRole) => void;
  setInputText: (text: string) => void;
  setTranslationResult: (result: TranslationResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (result: TranslationResult, originalText: string) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  clearError: () => void;
  acceptPrivacy: () => void;
  setShowPrivacyNotice: (show: boolean) => void;
  clearAllData: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      userRole: 'UNCERTAIN',
      inputText: '',
      translationResult: null,
      isLoading: false,
      error: null,
      history: [],
      privacyAccepted: false,
      showPrivacyNotice: false,

      // Actions
      setUserRole: (role) => set({ userRole: role }),

      setInputText: (text) => set({ inputText: text }),

      setTranslationResult: (result) => set({ translationResult: result }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      addToHistory: (result, originalText) => {
        const history = get().history;
        const newEntry: TranslationHistory = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          originalText,
          userRole: get().userRole,
          result,
        };

        // Keep only the last 10 entries
        const updatedHistory = [newEntry, ...history].slice(0, 10);
        set({ history: updatedHistory });
      },

      removeFromHistory: (id) => {
        const history = get().history;
        const updatedHistory = history.filter(item => item.id !== id);
        set({ history: updatedHistory });
      },

      clearHistory: () => set({ history: [] }),

      clearError: () => set({ error: null }),

      acceptPrivacy: () => set({ privacyAccepted: true, showPrivacyNotice: false }),

      setShowPrivacyNotice: (show) => set({ showPrivacyNotice: show }),

      clearAllData: () => {
        set({
          userRole: 'UNCERTAIN',
          inputText: '',
          translationResult: null,
          history: [],
          error: null,
          privacyAccepted: false,
          showPrivacyNotice: false,
        });
        // Clear localStorage
        localStorage.removeItem('neurobridge-storage');
      },
    }),
    {
      name: 'neurobridge-storage',
      partialize: (state) => ({
        userRole: state.userRole,
        history: state.history,
        privacyAccepted: state.privacyAccepted,
      }),
    }
  )
);
