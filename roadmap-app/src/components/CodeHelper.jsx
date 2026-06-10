/**
 * Code Helper Component - Code analysis and debugging assistant
 */

import React, { useState } from 'react';
import { codeAnalyzer } from '../services/codeAnalyzer';
import './CodeHelper.css';

export function CodeHelper({ isOpen, onClose }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [analysis, setAnalysis] = useState(null);
  const [view, setView] = useState('analysis'); // 'analysis', 'explanation', 'docstring'
  const [selectedIssue, setSelectedIssue] = useState(null);

  const languages = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin'
  ];

  const handleAnalyzeCode = () => {
    if (!code.trim()) return;

    const result = codeAnalyzer.analyzeCode(code, language);
    setAnalysis(result);
    setView('analysis');
  };

  const handleExplainCode = () => {
    if (!code.trim()) return;

    const explanation = codeAnalyzer.explainCode(code, language);
    setAnalysis({ explanation, view: 'explanation' });
    setView('explanation');
  };

  const handleGenerateDocstring = () => {
    if (!code.trim()) return;

    const docstring = codeAnalyzer.generateDocstring(code, language);
    setAnalysis({ docstring });
    setView('docstring');
  };

  const handleCopyDocstring = () => {
    if (analysis?.docstring) {
      navigator.clipboard.writeText(analysis.docstring);
      alert('Docstring copied to clipboard!');
    }
  };

  const handleCopyFix = (issue) => {
    if (issue.suggestion) {
      navigator.clipboard.writeText(issue.suggestion);
      alert('Suggestion copied to clipboard!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="code-helper-overlay" onClick={onClose}>
      <div className="code-helper-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="code-helper-header">
          <h2>🔍 Code Helper</h2>
          <button
            className="close-button"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="code-helper-content">
          {/* Left Panel - Input */}
          <div className="code-input-panel">
            <div className="panel-header">
              <h3>Paste Your Code</h3>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="code-textarea"
            />

            <div className="action-buttons">
              <button
                onClick={handleAnalyzeCode}
                className="action-btn analyze-btn"
                disabled={!code.trim()}
              >
                📊 Analyze
              </button>
              <button
                onClick={handleExplainCode}
                className="action-btn explain-btn"
                disabled={!code.trim()}
              >
                📖 Explain
              </button>
              <button
                onClick={handleGenerateDocstring}
                className="action-btn doc-btn"
                disabled={!code.trim()}
              >
                📝 Generate Docstring
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="code-results-panel">
            {!analysis ? (
              <div className="empty-state">
                <p>👈 Paste code and click Analyze to get started</p>
                <div className="tips">
                  <strong>Tips:</strong>
                  <ul>
                    <li>📊 Analyze: Find issues and improvements</li>
                    <li>📖 Explain: Understand code line-by-line</li>
                    <li>📝 Docstring: Generate documentation</li>
                  </ul>
                </div>
              </div>
            ) : view === 'analysis' && analysis.issues ? (
              <div className="analysis-results">
                <div className="summary-section">
                  <h3>Analysis Summary</h3>
                  <p className="summary-text">{analysis.summary}</p>
                  <div className="metrics">
                    <div className="metric">
                      <span className="metric-label">Complexity:</span>
                      <span className={`metric-value ${analysis.complexity}`}>
                        {analysis.complexity.toUpperCase()}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Issues Found:</span>
                      <span className="metric-value">{analysis.issues.length}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Language:</span>
                      <span className="metric-value">{analysis.language}</span>
                    </div>
                  </div>
                </div>

                {/* Issues Section */}
                {analysis.issues.length > 0 && (
                  <div className="issues-section">
                    <h3>Issues ({analysis.issues.length})</h3>
                    <div className="issues-list">
                      {analysis.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`issue-item ${issue.severity}`}
                          onClick={() => setSelectedIssue(selectedIssue === idx ? null : idx)}
                        >
                          <div className="issue-header">
                            <span className="severity-badge">{issue.severity.toUpperCase()}</span>
                            <span className="line-number">Line {issue.line}</span>
                            <span className="category">{issue.category}</span>
                          </div>
                          <p className="issue-message">{issue.message}</p>
                          {selectedIssue === idx && (
                            <div className="issue-suggestion">
                              <strong>Suggestion:</strong>
                              <p>{issue.suggestion}</p>
                              <button
                                className="copy-btn"
                                onClick={() => handleCopyFix(issue)}
                              >
                                📋 Copy Suggestion
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements Section */}
                {analysis.improvements.length > 0 && (
                  <div className="improvements-section">
                    <h3>Improvement Suggestions ({analysis.improvements.length})</h3>
                    <ul className="improvements-list">
                      {analysis.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : view === 'explanation' && analysis.explanation ? (
              <div className="explanation-results">
                <div className="overview-section">
                  <h3>Code Overview</h3>
                  <p>{analysis.explanation.overview}</p>
                </div>

                {analysis.explanation.keyPatterns.length > 0 && (
                  <div className="patterns-section">
                    <h3>Key Patterns</h3>
                    <ul>
                      {analysis.explanation.keyPatterns.map((pattern, idx) => (
                        <li key={idx}>{pattern}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.explanation.sections.length > 0 && (
                  <div className="sections-explanation">
                    <h3>Line-by-Line Breakdown</h3>
                    {analysis.explanation.sections.map((section, idx) => (
                      <div key={idx} className="section-item">
                        <div className="section-lines">
                          Lines {section.startLine}-{section.endLine}
                        </div>
                        <p>{section.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : view === 'docstring' && analysis.docstring ? (
              <div className="docstring-results">
                <div className="docstring-header">
                  <h3>Generated Docstring</h3>
                  <button
                    className="copy-btn"
                    onClick={handleCopyDocstring}
                  >
                    📋 Copy
                  </button>
                </div>
                <pre className="docstring-code">
                  <code>{analysis.docstring}</code>
                </pre>
                <div className="docstring-info">
                  <p><strong>How to use:</strong></p>
                  <ol>
                    <li>Copy the docstring above</li>
                    <li>Paste it at the top of your function</li>
                    <li>Fill in the parameter types and descriptions</li>
                    <li>Update the example if needed</li>
                  </ol>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
