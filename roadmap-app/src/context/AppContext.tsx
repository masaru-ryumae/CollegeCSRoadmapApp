import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { DecisionAnswers, PersonalizedRoadmap, ModuleProgress, RoadmapProgress } from '../types';

interface AppState {
  currentStep: number;
  answers: Partial<DecisionAnswers>;
  assessmentComplete: boolean;
  roadmap: PersonalizedRoadmap | null;
  roadmapProgress: RoadmapProgress | null;
  darkMode: boolean;
  activeView: 'assessment' | 'timeline' | 'dashboard';
  userRole: 'user' | 'admin';
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
  | { type: 'RESET' };

const initialState: AppState = {
  currentStep: 0,
  answers: {},
  assessmentComplete: false,
  roadmap: null,
  roadmapProgress: null,
  darkMode: false,
  activeView: 'assessment',
  userRole: 'user'
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
    const saved = localStorage.getItem('cs-roadmap-app');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.darkMode !== undefined && parsed.darkMode !== state.darkMode) {
          dispatch({ type: 'TOGGLE_DARK_MODE' });
        }
      } catch (e) {
        console.warn('Failed to load saved state', e);
      }
    }
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      dispatch({ type: 'TOGGLE_DARK_MODE' });
    }
  }, []);
  
  useEffect(() => {
    const toSave = {
      answers: state.answers,
      roadmap: state.roadmap,
      darkMode: state.darkMode,
      activeView: state.activeView
    };
    localStorage.setItem('cs-roadmap-app', JSON.stringify(toSave));
  }, [state.answers, state.roadmap, state.darkMode, state.activeView]);
  
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