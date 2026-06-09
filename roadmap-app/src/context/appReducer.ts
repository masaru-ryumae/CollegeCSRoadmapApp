import type { DecisionAnswers, PersonalizedRoadmap, ModuleProgress, RoadmapProgress } from '../types';

export interface AppState {
  currentStep: number;
  answers: Partial<DecisionAnswers>;
  assessmentComplete: boolean;
  roadmap: PersonalizedRoadmap | null;
  roadmapProgress: RoadmapProgress | null;
  darkMode: boolean;
  activeView: 'assessment' | 'timeline' | 'dashboard';
}

export type AppAction =
  | { type: 'SET_ANSWER'; key: keyof DecisionAnswers; value: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'COMPLETE_ASSESSMENT'; roadmap: PersonalizedRoadmap }
  | { type: 'SET_ROADMAP'; roadmap: PersonalizedRoadmap }
  | { type: 'UPDATE_MODULE_PROGRESS'; moduleId: string; progress: Partial<ModuleProgress> }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_ACTIVE_VIEW'; view: AppState['activeView'] }
  | { type: 'RESET' };

export const initialState: AppState = {
  currentStep: 0,
  answers: {},
  assessmentComplete: false,
  roadmap: null,
  roadmapProgress: null,
  darkMode: false,
  activeView: 'assessment'
};

export const appReducer = (state: AppState, action: AppAction): AppState => {
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
};
