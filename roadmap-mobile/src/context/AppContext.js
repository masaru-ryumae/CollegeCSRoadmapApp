import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const initialState = {
  currentStep: 0,
  answers: {},
  assessmentComplete: false,
  roadmap: null,
  roadmapProgress: null,
  user: null,
  loading: true,
  notifications: [],
};

function appReducer(state, action) {
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
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.notification]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id)
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on startup
  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem('cs-roadmap-mobile');
        if (saved) {
          const parsed = JSON.parse(saved);
          dispatch({ type: 'SET_ROADMAP', roadmap: parsed.roadmap });
          dispatch({ type: 'COMPLETE_ASSESSMENT', roadmap: parsed.roadmap });
        }
      } catch (e) {
        console.warn('Failed to load saved state:', e);
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    };

    loadState();
  }, []);

  // Persist state changes
  useEffect(() => {
    if (state.roadmap && state.assessmentComplete) {
      const toSave = {
        roadmap: state.roadmap,
        answers: state.answers,
      };
      AsyncStorage.setItem('cs-roadmap-mobile', JSON.stringify(toSave));
    }
  }, [state.roadmap, state.answers, state.assessmentComplete]);

  const value = {
    state,
    dispatch,
  };

  return (
    <AppContext.Provider value={value}>
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
