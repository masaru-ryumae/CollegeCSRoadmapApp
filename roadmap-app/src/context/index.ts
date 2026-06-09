import { createContext, type ReactNode } from 'react';
import type { AppState, AppAction } from './appReducer';

export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export type { AppState, AppAction } from './appReducer';
export type { ReactNode };
