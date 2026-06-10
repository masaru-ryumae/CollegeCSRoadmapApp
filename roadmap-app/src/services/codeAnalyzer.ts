/**
 * Code Analyzer Service - Analyzes code for issues, improvements, and explanations
 */

interface CodeIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  category: string;
}

interface AnalysisResult {
  language: string;
  issues: CodeIssue[];
  improvements: string[];
  summary: string;
  complexity: 'low' | 'medium' | 'high';
}

interface CodeExplanation {
  overview: string;
  sections: Array<{
    startLine: number;
    endLine: number;
    explanation: string;
  }>;
  keyPatterns: string[];
}

class CodeAnalyzer {
  private supportedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin'
  ];

  private codePatterns = {
    unusedVariable: /const\s+(\w+)\s*=\s*.*;(?!.*\1)/g,
    emptyFunction: /function\s+\w+\(\)\s*{\s*}/g,
    console: /console\.(log|error|warn|info)\(/g,
    debugger: /debugger;/g,
    todoComment: /\/\/\s*(TODO|FIXME|HACK):/gi,
  };

  /**
   * Analyze code for issues
   */
  analyzeCode(code: string, language: string = 'javascript'): AnalysisResult {
    const issues: CodeIssue[] = [];
    const improvements: string[] = [];

    // Normalize language
    const normalizedLang = language.toLowerCase();
    if (!this.supportedLanguages.includes(normalizedLang)) {
      return {
        language: normalizedLang,
        issues,
        improvements: ['Language not fully supported - providing general analysis'],
        summary: 'Analysis limited for this language',
        complexity: 'medium'
      };
    }

    // Check for common issues
    this.checkForCommonIssues(code, normalizedLang, issues);

    // Analyze complexity
    const complexity = this.estimateComplexity(code, normalizedLang);

    // Generate improvements
    this.generateImprovements(code, normalizedLang, improvements);

    const summary = this.generateSummary(issues, complexity);

    return {
      language: normalizedLang,
      issues,
      improvements,
      summary,
      complexity
    };
  }

  /**
   * Get improvement suggestions
   */
  suggestImprovements(code: string, language: string = 'javascript'): string[] {
    const suggestions: string[] = [];
    const lines = code.split('\n');

    // Check for common patterns
    if (code.includes('var ')) {
      suggestions.push('Use "const" or "let" instead of "var" for better scoping');
    }

    if (code.match(/==\s/)) {
      suggestions.push('Use "===" instead of "==" for strict equality');
    }

    if (code.includes('any')) {
      suggestions.push('Avoid "any" type - use specific types for better type safety');
    }

    if (lines.length > 100) {
      suggestions.push('Consider breaking this file into smaller, focused modules');
    }

    if (!code.includes('try') && code.includes('throw')) {
      suggestions.push('Add error handling with try-catch blocks');
    }

    // Add language-specific suggestions
    const langSpecific = this.getLanguageSpecificSuggestions(code, language);
    suggestions.push(...langSpecific);

    return suggestions;
  }

  /**
   * Debug an error
   */
  debugError(error: string, code: string): string {
    const errorKey = error.toLowerCase();

    // Common JavaScript/TypeScript errors
    if (errorKey.includes('undefined')) {
      return this.debugUndefinedError(code);
    }
    if (errorKey.includes('cannot read') || errorKey.includes('null')) {
      return this.debugNullError(code);
    }
    if (errorKey.includes('syntax')) {
      return this.debugSyntaxError(code);
    }
    if (errorKey.includes('reference') || errorKey.includes('not defined')) {
      return this.debugReferenceError(code);
    }
    if (errorKey.includes('type')) {
      return this.debugTypeError(code);
    }

    return this.debugGenericError(error, code);
  }

  /**
   * Explain code line by line
   */
  explainCode(code: string, language: string = 'javascript'): CodeExplanation {
    const lines = code.split('\n');
    const sections: CodeExplanation['sections'] = [];
    const keyPatterns: string[] = [];

    let currentSection: CodeExplanation['sections'][0] | null = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) return;

      if (!currentSection) {
        currentSection = {
          startLine: index + 1,
          endLine: index + 1,
          explanation: this.explainLine(line, language)
        };
      } else if (this.isLogicalGroupEnd(trimmed)) {
        currentSection.endLine = index + 1;
        sections.push(currentSection);
        currentSection = null;
      } else {
        currentSection.endLine = index + 1;
        currentSection.explanation += '\n' + this.explainLine(line, language);
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    // Extract key patterns
    if (code.includes('function')) keyPatterns.push('Function definition');
    if (code.includes('class')) keyPatterns.push('Class/Object definition');
    if (code.includes('for ') || code.includes('while ')) keyPatterns.push('Loop construct');
    if (code.includes('if ') || code.includes('else')) keyPatterns.push('Conditional logic');
    if (code.includes('try') || code.includes('catch')) keyPatterns.push('Error handling');
    if (code.includes('=>')) keyPatterns.push('Arrow function');

    const overview = `This ${language} code snippet contains ${lines.length} lines with ${sections.length} main logical sections.`;

    return {
      overview,
      sections: sections.slice(0, 10), // Limit to first 10 sections
      keyPatterns
    };
  }

  /**
   * Generate docstring for code
   */
  generateDocstring(code: string, language: string = 'javascript'): string {
    // Extract function signature
    const funcMatch = code.match(/function\s+(\w+)\s*\((.*?)\)/);
    const arrowMatch = code.match(/const\s+(\w+)\s*=\s*\((.*?)\)\s*=>/);

    const match = funcMatch || arrowMatch;
    if (!match) {
      return `/**\n * Function description\n */`;
    }

    const [, funcName, paramsStr] = match;
    const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];

    let docstring = `/**\n`;
    docstring += ` * ${funcName} - Brief description of what this function does\n`;
    docstring += ` *\n`;

    if (params.length > 0) {
      docstring += ` * @param {type} ${params[0]} - Description of first parameter\n`;
      params.slice(1).forEach(param => {
        docstring += ` * @param {type} ${param} - Description\n`;
      });
      docstring += ` *\n`;
    }

    docstring += ` * @returns {type} Description of return value\n`;
    docstring += ` *\n`;
    docstring += ` * @example\n`;
    docstring += ` * ${funcName}(arg1, arg2); // returns something\n`;
    docstring += ` */`;

    return docstring;
  }

  // Private helper methods

  private checkForCommonIssues(code: string, language: string, issues: CodeIssue[]): void {
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Debugger statements
      if (line.includes('debugger')) {
        issues.push({
          line: index + 1,
          severity: 'warning',
          message: 'Debugger statement found',
          suggestion: 'Remove debugger statements before production',
          category: 'debugging'
        });
      }

      // Console statements
      if (line.includes('console.') && !line.trim().startsWith('//')) {
        issues.push({
          line: index + 1,
          severity: 'info',
          message: 'Console statement',
          suggestion: 'Use proper logging framework instead of console',
          category: 'logging'
        });
      }

      // Long lines
      if (line.length > 120) {
        issues.push({
          line: index + 1,
          severity: 'warning',
          message: 'Line too long',
          suggestion: `This line is ${line.length} characters. Consider breaking it up`,
          category: 'formatting'
        });
      }

      // Empty blocks
      if (line.includes('{}')) {
        issues.push({
          line: index + 1,
          severity: 'warning',
          message: 'Empty code block',
          suggestion: 'Add implementation or remove empty block',
          category: 'implementation'
        });
      }

      // TODO/FIXME comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          line: index + 1,
          severity: 'info',
          message: 'TODO/FIXME comment',
          suggestion: 'Address this TODO before committing',
          category: 'documentation'
        });
      }
    });
  }

  private estimateComplexity(code: string, language: string): 'low' | 'medium' | 'high' {
    const lines = code.split('\n').length;
    const loops = (code.match(/for\s|while\s/g) || []).length;
    const conditionals = (code.match(/if\s|else|switch/g) || []).length;
    const functions = (code.match(/function|=>/g) || []).length;

    const complexityScore = lines / 10 + loops * 3 + conditionals * 2 + functions;

    if (complexityScore > 40) return 'high';
    if (complexityScore > 20) return 'medium';
    return 'low';
  }

  private generateImprovements(code: string, language: string, improvements: string[]): void {
    const suggestions = this.suggestImprovements(code, language);
    improvements.push(...suggestions);
  }

  private generateSummary(issues: CodeIssue[], complexity: string): string {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    return `Found ${errorCount} errors, ${warningCount} warnings, and ${infoCount} info items. Complexity: ${complexity}`;
  }

  private getLanguageSpecificSuggestions(code: string, language: string): string[] {
    const suggestions: string[] = [];

    if (language === 'python') {
      if (!code.includes('"""') && !code.includes("'''")) {
        suggestions.push('Add docstrings to functions');
      }
      if (code.includes('import *')) {
        suggestions.push('Avoid wildcard imports (import *)');
      }
    }

    if (language === 'javascript' || language === 'typescript') {
      if (code.includes('eval(')) {
        suggestions.push('Avoid using eval() - it\'s a security risk');
      }
      if (code.includes('innerHTML')) {
        suggestions.push('Use textContent or React props instead of innerHTML');
      }
    }

    return suggestions;
  }

  private debugUndefinedError(code: string): string {
    return `**Debugging: "Undefined" Error**

This typically means you're trying to access a variable that hasn't been declared or initialized.

**Common Causes:**
1. Variable declared inside a conditional block but used outside
2. Forgot to initialize a variable
3. Typo in variable name (JavaScript is case-sensitive)
4. Accessing object property that doesn't exist

**Solutions:**
1. Check variable declarations at the top of your scope
2. Use console.log() to print values before using them
3. Double-check spelling and capitalization
4. Use optional chaining (?.) or nullish coalescing (??)

**Next Steps:**
1. Find the exact line number where the error occurs
2. Trace back where that variable should have been defined
3. Add console logs to see what values you actually have
4. Use a debugger to step through the code`;
  }

  private debugNullError(code: string): string {
    return `**Debugging: "Cannot Read Property" / Null Error**

You're trying to access a property or method on a null/undefined value.

**Checklist:**
1. Is the object initialized before use?
2. Did you forget to fetch/load data?
3. Is the API call completing before you use the data?
4. Did you check if the value exists before accessing it?

**Solutions:**
1. Add a null/undefined check: \`if (obj) { ... }\`
2. Use optional chaining: \`obj?.property\`
3. Use defensive programming: \`obj || defaultValue\`
4. Add proper async/await handling

**Debug Steps:**
1. Add console.log(obj) before accessing properties
2. Check network requests if data is async
3. Verify API response structure`;
  }

  private debugSyntaxError(code: string): string {
    return `**Debugging: Syntax Error**

Your code has invalid syntax that prevents it from running.

**Common Issues:**
1. Missing opening/closing braces, brackets, or parentheses
2. Missing semicolons (in some contexts)
3. Invalid characters or operators
4. Incorrect indentation (in Python)

**How to Fix:**
1. Look at the error line and context
2. Count your opening and closing brackets
3. Check for matching quotes around strings
4. Use IDE with syntax highlighting`;
  }

  private debugReferenceError(code: string): string {
    return `**Debugging: Reference Error**

Variable or function is not defined in the current scope.

**Common Causes:**
1. Typo in variable/function name
2. Variable used before declaration
3. Variable defined in different scope
4. Missing imports/requires

**Solutions:**
1. Check spelling exactly - JavaScript is case-sensitive
2. Declare variables before using them
3. Import needed modules
4. Check variable scope`;
  }

  private debugTypeError(code: string): string {
    return `**Debugging: Type Error**

Operation attempted on wrong data type.

**Examples:**
- Calling a non-function as a function
- Accessing array index on non-array
- String method on number

**Solutions:**
1. Check data types with console.log()
2. Add type checking: \`typeof x === 'string'\`
3. Convert types explicitly: \`String(x)\`, \`Number(x)\`
4. Use TypeScript for better type safety`;
  }

  private debugGenericError(error: string, code: string): string {
    return `**Debugging: "${error}"**

Error analysis:
1. Read the error message carefully - it usually points to the problem
2. Find the line number mentioned in the error
3. Look at the surrounding code context
4. Try the following debugging steps:

**Quick Fixes:**
- Add console.log() statements to trace execution
- Use browser DevTools debugger
- Check API responses and data structure
- Verify all variables are initialized
- Look for typos and case sensitivity`;
  }

  private explainLine(line: string, language: string): string {
    const trimmed = line.trim();

    if (!trimmed) return '';

    // Keywords
    if (trimmed.startsWith('function')) return 'Declares a function definition';
    if (trimmed.startsWith('const')) return 'Declares a constant variable';
    if (trimmed.startsWith('let')) return 'Declares a block-scoped variable';
    if (trimmed.startsWith('if')) return 'Conditional statement - executes code if condition is true';
    if (trimmed.startsWith('for')) return 'Loop statement - repeats code for each iteration';
    if (trimmed.startsWith('while')) return 'Loop statement - repeats while condition is true';
    if (trimmed.startsWith('return')) return 'Returns a value from the function';
    if (trimmed.startsWith('class')) return 'Defines a class/object template';
    if (trimmed.includes('=>')) return 'Arrow function - shorthand function definition';

    // Operations
    if (trimmed.includes('=')) return 'Variable assignment - stores a value';
    if (trimmed.includes('==') || trimmed.includes('===')) return 'Comparison - checks if values are equal';
    if (trimmed.includes('+') || trimmed.includes('-')) return 'Arithmetic operation';
    if (trimmed.includes('.')) return 'Property/method access - retrieves value from object';
    if (trimmed.includes('(') && trimmed.includes(')')) return 'Function call - executes a function';

    return 'Code statement - performs an action';
  }

  private isLogicalGroupEnd(trimmed: string): boolean {
    return trimmed === '}' || trimmed === '},' || trimmed.endsWith('};');
  }
}

export const codeAnalyzer = new CodeAnalyzer();
export type { CodeIssue, AnalysisResult, CodeExplanation };
