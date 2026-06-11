import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { DecisionAnswers, PersonalizedRoadmap, ModuleProgress, RoadmapProgress } from '../types';
import type { AuthUser } from '../services/supabaseAuth';

interface AppState {
  currentStep: number;
  answers: Partial<DecisionAnswers>;
  assessmentComplete: boolean;
  roadmap: PersonalizedRoadmap | null;
  roadmapProgress: RoadmapProgress | null;
  darkMode: boolean;
  activeView: 'assessment' | 'timeline' | 'dashboard';
  user: AuthUser | null;
  favorites: string[];
  isAuthenticated: boolean;
  isSyncing: boolean;
}

type AppAction =
  | { type: 'SET_ANSWER'; key: keyof DecisionAnswers; value: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'COMPLETE_ASSESSMENT'; roadmap: PersonalizedRoadmap }
  | { type: 'SET_ROADMAP'; roadmap: PersonalizedRoadmap }
  | { type: 'UPDATE_MODULE_PROGRESS'; moduleId: string; progress: Partial<ModuleProgress> }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_ACTIVE_VIEW'; view: AppState['activeView'] }
  | { type: 'SET_USER'; user: AuthUser | null }
  | { type: 'SET_AUTHENTICATED'; isAuthenticated: boolean }
  | { type: 'SET_FAVORITES'; favorites: string[] }
  | { type: 'ADD_FAVORITE'; moduleId: string }
  | { type: 'REMOVE_FAVORITE'; moduleId: string }
  | { type: 'SET_SYNCING'; isSyncing: boolean }
  | { type: 'RESET' };

const initialState: AppState = {
  currentStep: 0,
  answers: {},
  assessmentComplete: false,
  roadmap: null,
  roadmapProgress: null,
  darkMode: false,
  activeView: 'assessment',
  user: null,
  favorites: [],
  isAuthenticated: false,
  isSyncing: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.value }
      };
    case 'NEXT_STEP':
      return { ...state, currentStep: state.currentStep + 1 };
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) };
    case 'COMPLETE_ASSESSMENT':
      return {
        ...state,
        assessmentComplete: true,
        roadmap: action.roadmap,
        activeView: 'dashboard'
      };
    case 'SET_ROADMAP':
      return { ...state, roadmap: action.roadmap };
    case 'UPDATE_MODULE_PROGRESS':
      if (!state.roadmapProgress) return state;
      return {
        ...state,
        roadmapProgress: {
          ...state.roadmapProgress,
          moduleProgress: state.roadmapProgress.moduleProgress.map(mp =>
            mp.moduleId === action.moduleId ? { ...mp, ...action.progress } : mp
          )
        }
      };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.view };
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.isAuthenticated };
    case 'SET_FAVORITES':
      return { ...state, favorites: action.favorites };
    case 'ADD_FAVORITE':
      if (!state.favorites.includes(action.moduleId)) {
        return { ...state, favorites: [...state.favorites, action.moduleId] };
      }
      return state;
    case 'REMOVE_FAVORITE':
      return { ...state, favorites: state.favorites.filter(id => id !== action.moduleId) };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.isSyncing };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  useEffect(() => {
    // Load saved app state
    const saved = localStorage.getItem('cs-roadmap-app');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.darkMode !== undefined && parsed.darkMode !== state.darkMode) {
          dispatch({ type: 'TOGGLE_DARK_MODE' });
        }
        if (parsed.favorites) {
          dispatch({ type: 'SET_FAVORITES', favorites: parsed.favorites });
        }
      } catch (e) {
        console.warn('Failed to load saved state', e);
      }
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      dispatch({ type: 'TOGGLE_DARK_MODE' });
    }

    // Initialize Supabase and load auth state
    const initAuth = async () => {
      try {
        const { initSupabase, getCurrentUser, onAuthStateChanged } = await import('../services/supabaseAuth');
        initSupabase();

        const user = await getCurrentUser();
        if (user) {
          dispatch({ type: 'SET_USER', user });
          dispatch({ type: 'SET_AUTHENTICATED', isAuthenticated: true });
        }

        // Setup auth state listener
        const unsubscribe = onAuthStateChanged((user) => {
          dispatch({ type: 'SET_USER', user });
          dispatch({ type: 'SET_AUTHENTICATED', isAuthenticated: user !== null });
        });

        return unsubscribe;
      } catch (e) {
        console.warn('Failed to initialize auth', e);
      }
    };

    const unsubscribe = initAuth();
    return () => {
      unsubscribe?.then(unsub => unsub?.());
    };
  }, []);
  
  useEffect(() => {
    const toSave = {
      answers: state.answers,
      roadmap: state.roadmap,
      darkMode: state.darkMode,
      activeView: state.activeView,
      favorites: state.favorites
    };
    localStorage.setItem('cs-roadmap-app', JSON.stringify(toSave));

    // Sync to cloud if authenticated
    if (state.isAuthenticated && state.user) {
      const syncToCloud = async () => {
        try {
          const { syncFavoritesToCloud, syncAnswersToCloud, syncRoadmapToCloud } = await import('../services/cloudSync');
          dispatch({ type: 'SET_SYNCING', isSyncing: true });

          if (state.favorites.length > 0) {
            await syncFavoritesToCloud(state.user!.id, state.favorites);
          }
          if (Object.keys(state.answers).length > 0) {
            await syncAnswersToCloud(state.user!.id, state.answers);
          }
          if (state.roadmap) {
            await syncRoadmapToCloud(state.user!.id, state.roadmap);
          }

          dispatch({ type: 'SET_SYNCING', isSyncing: false });
        } catch (e) {
          console.warn('Failed to sync to cloud', e);
          dispatch({ type: 'SET_SYNCING', isSyncing: false });
        }
      };

      syncToCloud();
    }
  }, [state.answers, state.roadmap, state.darkMode, state.activeView, state.favorites, state.isAuthenticated, state.user]);
  
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}