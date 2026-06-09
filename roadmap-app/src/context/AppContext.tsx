import { useReducer, useEffect, type ReactNode } from 'react';
import { appReducer, initialState } from './appReducer';
import { AppContext } from './index';

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

    if (window.matchMedia('(prefers-color-scheme: dark)').matches && !state.darkMode) {
      dispatch({ type: 'TOGGLE_DARK_MODE' });
    }
  }, [state.darkMode]);
  
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

