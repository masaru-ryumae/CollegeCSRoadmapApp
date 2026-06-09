import { useApp } from '../context/AppContext';
import type { DecisionAnswers } from '../types';
import { generateRoadmap } from '../utils/roadmapGenerator';
import moduleData from '../data/MODULE_DATA.json';
import './DecisionTree.css';

const questions = moduleData.decision_tree as {
  question_id: string;
  question: string;
  type: 'radio';
  options: { value: string; label: string }[];
  impact: string;
}[];

export function DecisionTree() {
  const { state, dispatch } = useApp();
  const currentQuestion = questions[state.currentStep];
  
  const handleOptionChange = (value: string) => {
    dispatch({ type: 'SET_ANSWER', key: currentQuestion.question_id as keyof DecisionAnswers, value });
  };
  
  const handleNext = () => {
    const answer = state.answers[currentQuestion.question_id as keyof DecisionAnswers];
    if (!answer) return;
    
    if (state.currentStep < questions.length - 1) {
      dispatch({ type: 'NEXT_STEP' });
    } else {
      const roadmap = generateRoadmap(state.answers as DecisionAnswers);
      dispatch({ type: 'COMPLETE_ASSESSMENT', roadmap });
    }
  };
  
  const handleBack = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'PREV_STEP' });
    }
  };
  
  const progress = ((state.currentStep + 1) / questions.length) * 100;
  
  return (
    <div className="decision-tree-container">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-labels">
          <span>Step {state.currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Question Card */}
      <div className="question-card">
        <div className="question-header">
          <h1 className="question-title">CS Internship Roadmap</h1>
          <p className="question-subtitle">Answer 5 questions to get your personalized study plan</p>
        </div>
        
        <div className="question-body">
          <h2 className="question-text">{currentQuestion.question}</h2>
          
          <div className="options-list" role="radiogroup" aria-label={currentQuestion.question}>
            {currentQuestion.options.map((option) => (
              <label
                key={option.value}
                className={`option-card ${
                  state.answers[currentQuestion.question_id as keyof DecisionAnswers] === option.value
                    ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.question_id}
                  value={option.value}
                  checked={state.answers[currentQuestion.question_id as keyof DecisionAnswers] === option.value}
                  onChange={() => handleOptionChange(option.value)}
                  className="option-radio"
                />
                <span className="option-label">{option.label}</span>
              </label>
            ))}
          </div>
          
          <div className="impact-hint">
            💡 This affects: {currentQuestion.impact.replace(/_/g, ' ')}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="navigation">
          <button
            onClick={handleBack}
            disabled={state.currentStep === 0}
            className="btn btn-secondary"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!state.answers[currentQuestion.question_id as keyof DecisionAnswers]}
            className="btn btn-primary"
          >
            {state.currentStep === questions.length - 1 ? 'Generate Roadmap' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}