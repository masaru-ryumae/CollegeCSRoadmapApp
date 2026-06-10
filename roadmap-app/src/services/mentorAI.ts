import type { TechLevel } from '../types';

export interface ConceptExplanation {
  concept: string;
  level: TechLevel;
  explanation: string;
  examples: string[];
  commonMistakes: string[];
  resources: string[];
}

export interface HintProgression {
  problemArea: string;
  hints: string[];
  currentHintLevel: number; // 0-indexed
  explicitSolution: string;
}

export interface CodeFeedback {
  language: string;
  issues: CodeIssue[];
  strengths: string[];
  suggestions: string[];
  overallScore: number; // 0-100
}

export interface CodeIssue {
  type: 'syntax' | 'logic' | 'performance' | 'style';
  severity: 'critical' | 'warning' | 'info';
  line?: number;
  description: string;
  suggestion: string;
}

export interface DebugGuidance {
  error: string;
  errorType: string;
  possibleCauses: string[];
  debugSteps: string[];
  resources: string[];
  estimatedTime: number; // minutes
}

export interface MentorConversation {
  userId: string;
  moduleId: string;
  messages: ChatMessage[];
  context: {
    problemArea: string;
    hintLevel: number;
    lastUpdate: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'mentor';
  content: string;
  timestamp: string;
  type?: 'question' | 'hint' | 'explanation' | 'feedback';
}

const CONVERSATION_KEY = 'mentor-conversation-';
const HINT_HISTORY_KEY = 'mentor-hints-';

/**
 * Generate progressive hints for problem areas
 */
export const generateHints = (
  moduleId: string,
  problemArea: string
): HintProgression => {
  // Knowledge base of common problem areas and hints
  const hintDatabase: Record<string, string[]> = {
    'algorithmic-thinking': [
      'Break down the problem into smaller subproblems.',
      'Try working through a simple example by hand first.',
      'Draw a diagram or flowchart to visualize the solution.',
      'What are the edge cases you need to handle?',
      'Can you simplify the approach or use a known algorithm?'
    ],
    'data-structures': [
      'Which data structure best represents your data?',
      'Consider the time complexity of your operations.',
      'Do you need fast lookups, insertions, or sorting?',
      'What about space complexity? Any constraints?',
      'Have you considered using a combination of structures?'
    ],
    'system-design': [
      'Clarify the requirements and constraints first.',
      'How would you scale this to millions of users?',
      'What are the bottlenecks in your design?',
      'Have you considered availability, consistency, and partition tolerance?',
      'How would you handle failures and data loss?'
    ],
    'debugging': [
      'Add console.log or print statements to track values.',
      'Check your assumptions about what the code does.',
      'Look at the stack trace - where does it point?',
      'Can you reproduce the bug with a minimal example?',
      'What changed since it last worked correctly?'
    ],
    'performance': [
      'Profile your code to find the bottleneck.',
      'What is the time complexity of your algorithm?',
      'Are you doing unnecessary work in loops?',
      'Can you use caching or memoization?',
      'Consider using a more efficient algorithm or data structure.'
    ]
  };

  const hints = hintDatabase[problemArea] || hintDatabase['algorithmic-thinking'];

  // Store hint history
  const key = `${HINT_HISTORY_KEY}${moduleId}-${problemArea}`;
  const stored = localStorage.getItem(key);
  const history = stored ? JSON.parse(stored) : { currentLevel: 0, firstAskedAt: new Date().toISOString() };

  return {
    problemArea,
    hints,
    currentHintLevel: history.currentLevel,
    explicitSolution: `For ${problemArea}, review the course materials and practice similar problems.`
  };
};

/**
 * Analyze code and provide feedback
 */
export const analyzeCode = (
  code: string,
  language: string
): CodeFeedback => {
  const issues: CodeIssue[] = [];
  const strengths: string[] = [];
  const suggestions: string[] = [];

  // Syntax checks (basic)
  if (language === 'javascript' || language === 'typescript') {
    if (code.includes('var ') && !code.includes('const ') && !code.includes('let ')) {
      issues.push({
        type: 'style',
        severity: 'warning',
        description: 'Using var instead of const/let',
        suggestion: 'Use const by default, let only when needed'
      });
    }

    if (!code.includes(';') && code.split('\n').length > 3) {
      suggestions.push('Consider adding semicolons for consistency');
    }

    if (code.includes('console.log')) {
      issues.push({
        type: 'style',
        severity: 'info',
        description: 'Debug console.log left in code',
        suggestion: 'Remove debug statements for production code'
      });
    }
  }

  if (language === 'python') {
    if (code.includes('import *')) {
      issues.push({
        type: 'style',
        severity: 'warning',
        description: 'Using wildcard imports',
        suggestion: 'Import specific items instead of *'
      });
    }
  }

  // Logic checks
  if (!code.includes('return') && language !== 'css') {
    suggestions.push('Does this function need to return a value?');
  }

  if (code.split('\n').length > 50) {
    suggestions.push('This function is quite long. Consider breaking it into smaller functions.');
  }

  if (code.includes('TODO') || code.includes('FIXME')) {
    issues.push({
      type: 'logic',
      severity: 'info',
      description: 'TODO/FIXME comments found',
      suggestion: 'Complete or remove these comments before submitting'
    });
  }

  // Strengths
  if (code.includes('test') || code.includes('expect') || code.includes('assert')) {
    strengths.push('Good: Tests are included with the code');
  }

  if (code.includes('//') || code.includes('/*')) {
    strengths.push('Good: Code is well-commented');
  }

  if (code.split('\n').length < 20) {
    strengths.push('Good: Code is concise and readable');
  }

  const overallScore = Math.max(50, 100 - issues.filter(i => i.severity === 'critical').length * 20 - issues.filter(i => i.severity === 'warning').length * 10 + strengths.length * 5);

  return {
    language,
    issues,
    strengths,
    suggestions,
    overallScore: Math.min(100, overallScore)
  };
};

/**
 * Suggest debugging steps for errors
 */
export const suggestDebugSteps = (
  error: string,
  moduleId: string,
  language: string = 'javascript'
): DebugGuidance => {
  // Parse error type
  let errorType = 'Unknown Error';
  let possibleCauses: string[] = [];
  let debugSteps: string[] = [];

  if (error.includes('undefined')) {
    errorType = 'Undefined Variable/Property';
    possibleCauses = [
      'Variable was never declared or initialized',
      'Property does not exist on the object',
      'Function returned undefined'
    ];
    debugSteps = [
      'Check where the variable is declared',
      'Print the entire object to see its properties',
      'Verify the function is returning the expected value',
      'Check for typos in property names'
    ];
  } else if (error.includes('null')) {
    errorType = 'Null Reference Error';
    possibleCauses = [
      'Variable was explicitly set to null',
      'Function returned null instead of object',
      'Element not found in DOM'
    ];
    debugSteps = [
      'Check if the value might be null before using it',
      'Add a null check: if (value !== null)',
      'Verify the function logic',
      'Use optional chaining (?.) if applicable'
    ];
  } else if (error.includes('TypeError')) {
    errorType = 'Type Error';
    possibleCauses = [
      'Wrong data type used',
      'Calling method on wrong type',
      'Trying to access property of non-object'
    ];
    debugSteps = [
      'Check data types with console.log(typeof variable)',
      'Add type checking before operations',
      'Review function parameters and return types',
      'Check for type coercion issues'
    ];
  } else if (error.includes('ReferenceError')) {
    errorType = 'Reference Error';
    possibleCauses = [
      'Variable not declared',
      'Typo in variable name',
      'Scope issue'
    ];
    debugSteps = [
      'Check variable spelling',
      'Verify variable is in scope',
      'Check if variable was declared with const/let/var',
      'Look at the line number in the error'
    ];
  } else if (error.includes('timeout') || error.includes('Timeout')) {
    errorType = 'Timeout Error';
    possibleCauses = [
      'Infinite loop detected',
      'Recursive function without base case',
      'Network request took too long',
      'Blocking operation'
    ];
    debugSteps = [
      'Check for loops and recursive calls',
      'Verify all loops have proper exit conditions',
      'Add timeout checks for network requests',
      'Profile the code to find slow sections'
    ];
  } else {
    possibleCauses = [
      'Logic error in algorithm',
      'Unexpected input values',
      'Missing error handling',
      'Environmental issue'
    ];
    debugSteps = [
      'Read the complete error message and stack trace',
      'Try to reproduce the error with a simple example',
      'Add logging to track variable values',
      'Check recent changes that might have caused it'
    ];
  }

  const resources = [
    'Module documentation',
    'Error handling guide',
    'Common errors in ' + language,
    'Debugging tools tutorial'
  ];

  return {
    error,
    errorType,
    possibleCauses,
    debugSteps,
    resources,
    estimatedTime: 15
  };
};

/**
 * Explain concepts at appropriate level
 */
export const explainConcept = (
  concept: string,
  level: TechLevel = 'beginner'
): ConceptExplanation => {
  // Concept knowledge base
  const concepts: Record<string, Record<TechLevel, string>> = {
    'binary-search': {
      beginner: 'Binary search is a way to find items in a sorted list quickly. It works like guessing a number: check the middle, then go left or right depending on the answer.',
      intermediate: 'Binary search divides the search space in half each iteration (O(log n)). It requires a sorted input and uses the divide-and-conquer approach.',
      advanced: 'Binary search is optimal for searching sorted data. Variants include lower_bound, upper_bound, and can solve problems beyond basic search like finding minimum in rotated array.'
    },
    'recursion': {
      beginner: 'Recursion is when a function calls itself to solve a smaller version of the problem. Every recursive function needs a base case (when to stop) and a recursive case.',
      intermediate: 'Recursion uses the call stack. Understanding base cases, recursive cases, and time/space complexity (potential stack overflow) is crucial.',
      advanced: 'Advanced recursion includes tail recursion optimization, mutual recursion, and using recursion to solve complex problems like graph traversals and dynamic programming.'
    },
    'dynamic-programming': {
      beginner: 'Dynamic programming solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation.',
      intermediate: 'DP can use top-down (memoization) or bottom-up (tabulation) approaches. Identify optimal substructure and overlapping subproblems.',
      advanced: 'Master DP optimizations like matrix chain multiplication, digit DP, and game theory problems. Understanding constraints and state representation is key.'
    },
    'api-design': {
      beginner: 'APIs are contracts between systems. REST APIs use HTTP methods (GET, POST, etc.) and endpoints to allow programs to communicate.',
      intermediate: 'Design APIs with clear naming, proper status codes, pagination, and versioning. Consider security, rate limiting, and documentation.',
      advanced: 'Advanced API design includes GraphQL, gRPC, API versioning strategies, backwards compatibility, and handling scale.'
    }
  };

  const conceptData = concepts[concept] || {
    beginner: `${concept} is a fundamental concept in computer science.`,
    intermediate: `${concept} is important for intermediate problem-solving and system design.`,
    advanced: `${concept} has advanced applications and optimizations worth exploring.`
  };

  return {
    concept,
    level,
    explanation: conceptData[level] || conceptData.intermediate,
    examples: [
      `Example 1: Common use case for ${concept}`,
      `Example 2: Real-world application`,
      `Example 3: Interview question`
    ],
    commonMistakes: [
      `Mistake 1: Misunderstanding the concept`,
      `Mistake 2: Not considering edge cases`,
      `Mistake 3: Ignoring complexity implications`
    ],
    resources: [
      `${concept} tutorial`,
      `Visualizations for ${concept}`,
      `Practice problems`,
      `Related concepts`
    ]
  };
};

/**
 * Start or retrieve mentor conversation
 */
export const getMentorConversation = (
  userId: string,
  moduleId: string
): MentorConversation => {
  const key = `${CONVERSATION_KEY}${userId}-${moduleId}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    return JSON.parse(stored);
  }

  // Create new conversation
  const conversation: MentorConversation = {
    userId,
    moduleId,
    messages: [
      {
        role: 'mentor',
        content: `Hi! I'm your AI mentor. I'm here to help you with ${moduleId}. What do you need help with today?`,
        timestamp: new Date().toISOString(),
        type: 'greeting'
      }
    ],
    context: {
      problemArea: '',
      hintLevel: 0,
      lastUpdate: new Date().toISOString()
    }
  };

  localStorage.setItem(key, JSON.stringify(conversation));
  return conversation;
};

/**
 * Add message to conversation
 */
export const addMentorMessage = (
  userId: string,
  moduleId: string,
  message: string,
  role: 'user' | 'mentor' = 'user'
): MentorConversation => {
  const key = `${CONVERSATION_KEY}${userId}-${moduleId}`;
  const conversation = getMentorConversation(userId, moduleId);

  conversation.messages.push({
    role,
    content: message,
    timestamp: new Date().toISOString(),
    type: role === 'mentor' ? 'response' : 'question'
  });

  conversation.context.lastUpdate = new Date().toISOString();

  localStorage.setItem(key, JSON.stringify(conversation));
  return conversation;
};

/**
 * Generate mentor response to user question
 */
export const generateMentorResponse = (
  userMessage: string,
  moduleId: string,
  userLevel: TechLevel = 'beginner'
): string => {
  const lower = userMessage.toLowerCase();

  // Pattern matching for common questions
  if (lower.includes('hint') || lower.includes('stuck') || lower.includes('help')) {
    const hints = generateHints(moduleId, 'algorithmic-thinking');
    return `Here's a hint to get you started: "${hints.hints[hints.currentHintLevel]}". Try working through this and let me know if you need more help!`;
  }

  if (lower.includes('explain') || lower.includes('understand') || lower.includes('what is')) {
    const concept = userMessage.split('?')[0].split('about ')[1] || 'algorithms';
    const explanation = explainConcept(concept, userLevel);
    return explanation.explanation;
  }

  if (lower.includes('error') || lower.includes('bug') || lower.includes('wrong')) {
    return 'Can you share the error message or describe what\'s happening? That will help me guide you better.';
  }

  if (lower.includes('review') || lower.includes('check') || lower.includes('feedback')) {
    return 'I can help review your code! Please share the code snippet and the language it\'s written in.';
  }

  // Default encouraging response
  const responses = [
    'That\'s a great question! Let me help you think through this step by step.',
    'Good curiosity! Here\'s how you might approach this...',
    'I see what you\'re asking. Let me break this down for you.',
    'Excellent problem-solving instinct! Consider this perspective...'
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * Clear conversation history
 */
export const clearMentorConversation = (userId: string, moduleId: string): void => {
  const key = `${CONVERSATION_KEY}${userId}-${moduleId}`;
  localStorage.removeItem(key);
};
