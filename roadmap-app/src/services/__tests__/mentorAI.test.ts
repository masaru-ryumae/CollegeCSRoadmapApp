import {
  generateHints,
  analyzeCode,
  suggestDebugSteps,
  explainConcept,
  getMentorConversation,
  addMentorMessage,
  generateMentorResponse,
  clearMentorConversation,
  type HintProgression,
  type CodeFeedback,
  type DebugGuidance
} from '../mentorAI';

describe('Mentor AI Assistant', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('generateHints - returns hints for known problem areas', () => {
    const hints = generateHints('module-1', 'algorithmic-thinking');

    expect(hints.problemArea).toBe('algorithmic-thinking');
    expect(hints.hints.length).toBeGreaterThan(0);
    expect(hints.currentHintLevel).toBeGreaterThanOrEqual(0);
    expect(hints.explicitSolution).toBeDefined();
  });

  test('generateHints - returns default hints for unknown problem areas', () => {
    const hints = generateHints('module-1', 'unknown-area');

    expect(hints.hints.length).toBeGreaterThan(0);
    expect(hints.hints[0]).toBeTruthy();
  });

  test('generateHints - tracks hint history', () => {
    const moduleId = 'module-2';
    const hints1 = generateHints(moduleId, 'data-structures');
    const hints2 = generateHints(moduleId, 'data-structures');

    expect(hints2.currentHintLevel).toBeDefined();
  });

  test('analyzeCode - detects JavaScript/TypeScript issues', () => {
    const code = `
      var x = 5;
      console.log(x);
      let y = 10;
    `;

    const feedback = analyzeCode(code, 'javascript');

    expect(feedback.language).toBe('javascript');
    expect(feedback.issues).toBeInstanceOf(Array);
    expect(feedback.strengths).toBeInstanceOf(Array);
    expect(feedback.suggestions).toBeInstanceOf(Array);
    expect(feedback.overallScore).toBeGreaterThanOrEqual(0);
    expect(feedback.overallScore).toBeLessThanOrEqual(100);
  });

  test('analyzeCode - detects Python issues', () => {
    const code = `
      from numpy import *
      x = [1, 2, 3]
    `;

    const feedback = analyzeCode(code, 'python');

    expect(feedback.language).toBe('python');
    expect(feedback.issues.length).toBeGreaterThan(0);
  });

  test('analyzeCode - recognizes well-written code', () => {
    const code = `
      // Binary search implementation
      const binarySearch = (arr, target) => {
        let left = 0, right = arr.length - 1;
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (arr[mid] === target) return mid;
          if (arr[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      };

      // Test cases
      expect(binarySearch([1, 3, 5, 7], 5)).toBe(2);
    `;

    const feedback = analyzeCode(code, 'typescript');

    expect(feedback.strengths.length).toBeGreaterThan(0);
    expect(feedback.overallScore).toBeGreaterThan(50);
  });

  test('suggestDebugSteps - identifies undefined errors', () => {
    const guidance = suggestDebugSteps('Cannot read property x of undefined', 'module-1', 'javascript');

    expect(guidance.errorType).toContain('Undefined');
    expect(guidance.possibleCauses.length).toBeGreaterThan(0);
    expect(guidance.debugSteps.length).toBeGreaterThan(0);
    expect(guidance.resources).toBeDefined();
    expect(guidance.estimatedTime).toBeGreaterThan(0);
  });

  test('suggestDebugSteps - identifies type errors', () => {
    const guidance = suggestDebugSteps('TypeError: x.map is not a function', 'module-1', 'javascript');

    expect(guidance.errorType).toContain('Type');
    expect(guidance.possibleCauses.length).toBeGreaterThan(0);
  });

  test('suggestDebugSteps - identifies timeout errors', () => {
    const guidance = suggestDebugSteps('Timeout: operation exceeded time limit', 'module-1', 'javascript');

    expect(guidance.errorType).toContain('Timeout');
    expect(guidance.debugSteps.some(step => step.includes('loop'))).toBe(true);
  });

  test('suggestDebugSteps - generic error handling', () => {
    const guidance = suggestDebugSteps('Something went wrong', 'module-1', 'javascript');

    expect(guidance.possibleCauses.length).toBeGreaterThan(0);
    expect(guidance.debugSteps.length).toBeGreaterThan(0);
  });

  test('explainConcept - explains concept at beginner level', () => {
    const explanation = explainConcept('binary-search', 'beginner');

    expect(explanation.concept).toBe('binary-search');
    expect(explanation.level).toBe('beginner');
    expect(explanation.explanation.length).toBeGreaterThan(0);
    expect(explanation.examples.length).toBeGreaterThan(0);
    expect(explanation.commonMistakes.length).toBeGreaterThan(0);
    expect(explanation.resources.length).toBeGreaterThan(0);
  });

  test('explainConcept - explains concept at intermediate level', () => {
    const explanation = explainConcept('recursion', 'intermediate');

    expect(explanation.level).toBe('intermediate');
    expect(explanation.explanation).not.toBe('');
  });

  test('explainConcept - explains concept at advanced level', () => {
    const explanation = explainConcept('dynamic-programming', 'advanced');

    expect(explanation.level).toBe('advanced');
    expect(explanation.explanation).not.toBe('');
  });

  test('explainConcept - handles unknown concepts', () => {
    const explanation = explainConcept('unknown-concept', 'beginner');

    expect(explanation.explanation).not.toBe('');
    expect(explanation.examples.length).toBeGreaterThan(0);
  });

  test('getMentorConversation - creates new conversation', () => {
    const conversation = getMentorConversation('user-1', 'module-1');

    expect(conversation.userId).toBe('user-1');
    expect(conversation.moduleId).toBe('module-1');
    expect(conversation.messages.length).toBeGreaterThan(0);
    expect(conversation.messages[0].role).toBe('mentor');
    expect(conversation.context.hintLevel).toBe(0);
  });

  test('getMentorConversation - retrieves existing conversation', () => {
    const userId = 'user-2';
    const moduleId = 'module-2';

    const conv1 = getMentorConversation(userId, moduleId);
    const conv2 = getMentorConversation(userId, moduleId);

    expect(conv1.messages.length).toBe(conv2.messages.length);
    expect(conv1.messages[0].content).toBe(conv2.messages[0].content);
  });

  test('addMentorMessage - adds user message', () => {
    const conversation = getMentorConversation('user-3', 'module-3');
    const initialCount = conversation.messages.length;

    const updated = addMentorMessage('user-3', 'module-3', 'I need help with sorting', 'user');

    expect(updated.messages.length).toBe(initialCount + 1);
    expect(updated.messages[updated.messages.length - 1].role).toBe('user');
    expect(updated.messages[updated.messages.length - 1].content).toBe('I need help with sorting');
  });

  test('addMentorMessage - adds mentor message', () => {
    getMentorConversation('user-4', 'module-4');
    const updated = addMentorMessage('user-4', 'module-4', 'Try breaking down the problem', 'mentor');

    expect(updated.messages[updated.messages.length - 1].role).toBe('mentor');
  });

  test('generateMentorResponse - provides hint when asked', () => {
    const response = generateMentorResponse('I am stuck, can I get a hint?', 'module-5', 'beginner');

    expect(response).toContain('hint');
  });

  test('generateMentorResponse - explains concepts', () => {
    const response = generateMentorResponse('Can you explain binary search?', 'module-5', 'beginner');

    expect(response.length).toBeGreaterThan(0);
  });

  test('generateMentorResponse - helps with errors', () => {
    const response = generateMentorResponse('I got an error, what should I do?', 'module-5', 'beginner');

    expect(response.length).toBeGreaterThan(0);
  });

  test('generateMentorResponse - offers code review', () => {
    const response = generateMentorResponse('Can you review my code?', 'module-5', 'beginner');

    expect(response.length).toBeGreaterThan(0);
  });

  test('generateMentorResponse - provides encouraging default response', () => {
    const response = generateMentorResponse('What is the best approach here?', 'module-5', 'beginner');

    expect(response.length).toBeGreaterThan(0);
  });

  test('clearMentorConversation - removes conversation history', () => {
    const userId = 'user-6';
    const moduleId = 'module-6';

    getMentorConversation(userId, moduleId);
    addMentorMessage(userId, moduleId, 'Hello', 'user');

    clearMentorConversation(userId, moduleId);

    const newConversation = getMentorConversation(userId, moduleId);
    expect(newConversation.messages.length).toBe(1); // Only greeting
  });

  test('No console errors during operations', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    generateHints('module-test', 'algorithmic-thinking');
    analyzeCode('const x = 5;', 'typescript');
    suggestDebugSteps('Error occurred', 'module-test', 'javascript');
    explainConcept('recursion', 'intermediate');
    getMentorConversation('user-test', 'module-test');
    addMentorMessage('user-test', 'module-test', 'test', 'user');
    generateMentorResponse('test question', 'module-test', 'beginner');

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
