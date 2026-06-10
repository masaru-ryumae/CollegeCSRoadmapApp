import React, { useState, useEffect, useRef } from 'react';
import {
  generateHints,
  analyzeCode,
  suggestDebugSteps,
  explainConcept,
  getMentorConversation,
  addMentorMessage,
  generateMentorResponse,
  clearMentorConversation
} from '../services/mentorAI';
import './AIMentor.css';

export function AIMentor({ userId, moduleId, userLevel = 'beginner' }) {
  const [conversation, setConversation] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [codeInput, setCodeInput] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeFeedback, setCodeFeedback] = useState(null);
  const [debugError, setDebugError] = useState('');
  const [debugGuidance, setDebugGuidance] = useState(null);
  const [conceptName, setConceptName] = useState('');
  const [conceptExplanation, setConceptExplanation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const conv = getMentorConversation(userId, moduleId);
    setConversation(conv);
  }, [userId, moduleId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !conversation) return;

    setLoading(true);
    const userMsg = userInput;
    setUserInput('');

    // Add user message
    let updated = addMentorMessage(userId, moduleId, userMsg, 'user');
    setConversation(updated);

    // Generate mentor response
    await new Promise(resolve => setTimeout(resolve, 500));
    const mentorResponse = generateMentorResponse(userMsg, moduleId, userLevel);
    updated = addMentorMessage(userId, moduleId, mentorResponse, 'mentor');
    setConversation(updated);
    setLoading(false);
  };

  const handleAnalyzeCode = () => {
    if (!codeInput.trim()) return;
    const feedback = analyzeCode(codeInput, codeLanguage);
    setCodeFeedback(feedback);
  };

  const handleDebugError = () => {
    if (!debugError.trim()) return;
    const guidance = suggestDebugSteps(debugError, moduleId, codeLanguage);
    setDebugGuidance(guidance);
  };

  const handleExplainConcept = () => {
    if (!conceptName.trim()) return;
    const explanation = explainConcept(conceptName, userLevel);
    setConceptExplanation(explanation);
  };

  const handleGetHint = () => {
    const hints = generateHints(moduleId, 'algorithmic-thinking');
    const hintMessage = `Here's a hint: "${hints.hints[Math.min(hints.currentHintLevel, hints.hints.length - 1)]}"`;
    let updated = addMentorMessage(userId, moduleId, 'Can I get a hint?', 'user');
    updated = addMentorMessage(userId, moduleId, hintMessage, 'mentor');
    setConversation(updated);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      clearMentorConversation(userId, moduleId);
      const conv = getMentorConversation(userId, moduleId);
      setConversation(conv);
    }
  };

  if (!conversation) {
    return <div className="ai-mentor loading">Loading mentor...</div>;
  }

  return (
    <div className="ai-mentor">
      <div className="mentor-header">
        <h2>🎓 AI Mentor Assistant</h2>
        <p className="mentor-subtitle">Your personalized learning guide</p>
      </div>

      <div className="mentor-tabs">
        <button
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button
          className={`tab-button ${activeTab === 'code-review' ? 'active' : ''}`}
          onClick={() => setActiveTab('code-review')}
        >
          📝 Code Review
        </button>
        <button
          className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`}
          onClick={() => setActiveTab('debug')}
        >
          🐛 Debug Help
        </button>
        <button
          className={`tab-button ${activeTab === 'concepts' ? 'active' : ''}`}
          onClick={() => setActiveTab('concepts')}
        >
          📚 Learn Concepts
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="mentor-chat">
          <div className="messages-container">
            {conversation.messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'mentor' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message message-mentor loading-indicator">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-actions">
            <button className="action-btn" onClick={handleGetHint}>
              💡 Get a Hint
            </button>
            <button className="action-btn" onClick={() => {
              const msg = "I'm stuck on the problem. Can you help?";
              setUserInput(msg);
            }}>
              🆘 Ask for Help
            </button>
            <button className="action-btn" onClick={() => {
              setUserInput("Can you explain this concept?");
            }}>
              ❓ Explain Concept
            </button>
          </div>

          <div className="input-area">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me anything about this module... (Shift+Enter for newline)"
              disabled={loading}
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={!userInput.trim() || loading}
            >
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </div>

          <button className="btn-clear-chat" onClick={handleClearChat}>
            Clear Conversation
          </button>
        </div>
      )}

      {/* Code Review Tab */}
      {activeTab === 'code-review' && (
        <div className="mentor-code-review">
          <div className="code-section">
            <h3>Code Review Assistant</h3>
            <p>Paste your code for AI-powered feedback and suggestions</p>

            <div className="code-input-group">
              <label>Language:</label>
              <select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)}>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="css">CSS</option>
              </select>
            </div>

            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Paste your code here..."
              className="code-input"
            />

            <button
              className="btn-analyze"
              onClick={handleAnalyzeCode}
              disabled={!codeInput.trim()}
            >
              Analyze Code
            </button>

            {codeFeedback && (
              <div className="feedback-container">
                <div className="score-card">
                  <div className="score">{codeFeedback.overallScore}</div>
                  <div className="score-label">Score</div>
                </div>

                {codeFeedback.issues.length > 0 && (
                  <div className="issues-section">
                    <h4>Issues Found</h4>
                    {codeFeedback.issues.map((issue, idx) => (
                      <div key={idx} className={`issue issue-${issue.severity}`}>
                        <span className="issue-type">{issue.type}</span>
                        <p>{issue.description}</p>
                        <p className="suggestion">✓ {issue.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}

                {codeFeedback.strengths.length > 0 && (
                  <div className="strengths-section">
                    <h4>Strengths</h4>
                    {codeFeedback.strengths.map((strength, idx) => (
                      <p key={idx} className="strength">✓ {strength}</p>
                    ))}
                  </div>
                )}

                {codeFeedback.suggestions.length > 0 && (
                  <div className="suggestions-section">
                    <h4>Suggestions</h4>
                    {codeFeedback.suggestions.map((suggestion, idx) => (
                      <p key={idx} className="suggestion-item">💡 {suggestion}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Help Tab */}
      {activeTab === 'debug' && (
        <div className="mentor-debug">
          <div className="debug-section">
            <h3>Debug Assistant</h3>
            <p>Paste an error message to get debugging suggestions</p>

            <textarea
              value={debugError}
              onChange={(e) => setDebugError(e.target.value)}
              placeholder="Paste your error message here..."
              className="debug-input"
            />

            <button
              className="btn-debug"
              onClick={handleDebugError}
              disabled={!debugError.trim()}
            >
              Get Debug Help
            </button>

            {debugGuidance && (
              <div className="debug-guidance">
                <div className="error-type">
                  <strong>Error Type:</strong> {debugGuidance.errorType}
                </div>

                <div className="debug-section-box">
                  <h4>Possible Causes</h4>
                  <ul>
                    {debugGuidance.possibleCauses.map((cause, idx) => (
                      <li key={idx}>{cause}</li>
                    ))}
                  </ul>
                </div>

                <div className="debug-section-box">
                  <h4>Debug Steps</h4>
                  <ol>
                    {debugGuidance.debugSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                  <p className="est-time">Est. time to resolve: {debugGuidance.estimatedTime} minutes</p>
                </div>

                <div className="resources-box">
                  <h4>Helpful Resources</h4>
                  <ul>
                    {debugGuidance.resources.map((resource, idx) => (
                      <li key={idx}>{resource}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Concepts Tab */}
      {activeTab === 'concepts' && (
        <div className="mentor-concepts">
          <div className="concepts-section">
            <h3>Learn Concepts</h3>
            <p>Ask about any concept and I'll explain it at your level</p>

            <div className="concept-input-group">
              <input
                type="text"
                value={conceptName}
                onChange={(e) => setConceptName(e.target.value)}
                placeholder="e.g., recursion, dynamic programming, binary search..."
                onKeyPress={(e) => e.key === 'Enter' && handleExplainConcept()}
              />
              <button
                className="btn-explain"
                onClick={handleExplainConcept}
                disabled={!conceptName.trim()}
              >
                Explain
              </button>
            </div>

            {conceptExplanation && (
              <div className="explanation-box">
                <div className="explanation-header">
                  <h4>{conceptExplanation.concept}</h4>
                  <span className="level-badge">{conceptExplanation.level}</span>
                </div>

                <div className="explanation-content">
                  <p>{conceptExplanation.explanation}</p>
                </div>

                <div className="explanation-section">
                  <h5>Examples</h5>
                  <ul>
                    {conceptExplanation.examples.map((example, idx) => (
                      <li key={idx}>{example}</li>
                    ))}
                  </ul>
                </div>

                <div className="explanation-section">
                  <h5>Common Mistakes</h5>
                  <ul>
                    {conceptExplanation.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="mistake">⚠️ {mistake}</li>
                    ))}
                  </ul>
                </div>

                <div className="explanation-section">
                  <h5>Learn More</h5>
                  <ul>
                    {conceptExplanation.resources.map((resource, idx) => (
                      <li key={idx}>📖 {resource}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
