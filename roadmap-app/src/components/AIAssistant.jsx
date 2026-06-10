/**
 * AI Assistant Component - Main chatbot interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import './AIAssistant.css';

export function AIAssistant({ isOpen, onClose, projectContext }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    chatService.initialize();

    if (!activeConversationId) {
      const newConvId = chatService.createConversation('New Chat');
      setActiveConversationId(newConvId);
    }

    updateConversationList();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      const history = chatService.getConversationHistory(activeConversationId);
      setMessages(history);
      chatService.setActiveConversation(activeConversationId);
    }
  }, [activeConversationId]);

  const updateConversationList = () => {
    const convs = chatService.getAllConversations();
    setConversations(convs);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const context = projectContext ? {
        projectId: projectContext.id,
        currentModule: projectContext.currentModule,
        progress: projectContext.progress,
        completedModules: projectContext.completedModules,
        skills: projectContext.skills
      } : undefined;

      const response = await chatService.sendMessage(
        'user-' + Date.now(),
        userMessage,
        context
      );

      const updatedHistory = chatService.getConversationHistory(activeConversationId);
      setMessages(updatedHistory);
      updateConversationList();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: '💡 Explain Concept', action: 'Can you explain how [concept] works?' },
    { label: '🐛 Debug Error', action: 'I\'m getting an error. Can you help me debug?' },
    { label: '📚 Next Steps', action: 'What should I learn next?' },
    { label: '✨ Improve Code', action: 'How can I improve this code?' },
    { label: '🎯 Learning Path', action: 'Create a learning path for [skill]' },
    { label: '⚡ Quick Tip', action: 'Give me a quick programming tip' }
  ];

  const handleQuickAction = (action) => {
    setInputValue(action);
  };

  const handleNewConversation = () => {
    const newConvId = chatService.createConversation('New Chat');
    setActiveConversationId(newConvId);
    updateConversationList();
    setShowConversationList(false);
  };

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
    setShowConversationList(false);
  };

  const handleDeleteConversation = (convId, e) => {
    e.stopPropagation();
    chatService.deleteConversation(convId);
    updateConversationList();
    if (activeConversationId === convId) {
      const remaining = conversations.filter(c => c.id !== convId);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      } else {
        handleNewConversation();
      }
    }
  };

  const handleExportConversation = () => {
    if (!activeConversationId) return;

    const markdown = chatService.exportConversation(activeConversationId, 'markdown');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().getTime()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay" onClick={onClose}>
      <div className="ai-assistant-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-assistant-header">
          <div className="header-left">
            <h2>🤖 AI Assistant</h2>
            <button
              className="icon-button conversation-button"
              onClick={() => setShowConversationList(!showConversationList)}
              title="Conversations"
            >
              💬
            </button>
          </div>
          <button
            className="icon-button close-button"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Conversation List Sidebar */}
        {showConversationList && (
          <div className="conversation-list-sidebar">
            <button
              className="new-conversation-btn"
              onClick={handleNewConversation}
            >
              + New Chat
            </button>
            <div className="conversation-list">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <div className="conv-title">{conv.title}</div>
                  <div className="conv-meta">
                    {conv.messages.length} messages
                  </div>
                  <button
                    className="delete-conv-btn"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            <div className="export-section">
              <button
                className="export-btn"
                onClick={handleExportConversation}
                disabled={!activeConversationId}
              >
                📥 Export Chat
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-section">
              <h3>Welcome to AI Assistant! 👋</h3>
              <p>I can help you with:</p>
              <ul>
                <li>✨ Explaining programming concepts</li>
                <li>🐛 Debugging code issues</li>
                <li>📚 Creating learning paths</li>
                <li>🎯 Planning your projects</li>
                <li>💡 Improving your code</li>
              </ul>
              <p className="hint">Click a quick action below to get started!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  {msg.codeBlock && (
                    <pre className="code-block">
                      <code>{msg.codeBlock}</code>
                    </pre>
                  )}
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant">
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

        {/* Quick Actions */}
        {messages.length === 0 && !isLoading && (
          <div className="quick-actions">
            <p className="quick-actions-label">Quick Actions:</p>
            <div className="quick-action-buttons">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  className="quick-action-btn"
                  onClick={() => handleQuickAction(action.action)}
                  title={action.action}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="input-area">
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything... (e.g., 'Explain recursion', 'Debug this error', 'What to learn next')"
              disabled={isLoading}
              className="message-input"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="send-button"
            >
              {isLoading ? '⏳' : '→'}
            </button>
          </form>
          <div className="input-hint">
            Tip: Include code snippets for better debugging help
          </div>
        </div>
      </div>
    </div>
  );
}
