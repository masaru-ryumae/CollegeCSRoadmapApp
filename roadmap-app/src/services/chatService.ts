/**
 * Chat Service - Manages AI chatbot conversations
 * Handles message processing, conversation history, and context generation
 */

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlock?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ContextData {
  projectId: string;
  currentModule?: string;
  progress?: number;
  completedModules?: string[];
  userGoals?: string[];
  skills?: string[];
}

class ChatService {
  private conversations: Map<string, Conversation> = new Map();
  private currentConversationId: string | null = null;
  private messageCounter: number = 0;

  /**
   * Initialize the chat service and load conversation history
   */
  initialize(): void {
    const saved = localStorage.getItem('chat-conversations');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([id, conv]: [string, any]) => {
          this.conversations.set(id, {
            ...conv,
            messages: conv.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })),
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt)
          });
        });
      } catch (e) {
        console.error('Failed to load conversations:', e);
      }
    }
  }

  /**
   * Create a new conversation
   */
  createConversation(title: string = 'New Chat'): string {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.conversations.set(id, {
      id,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.currentConversationId = id;
    this.saveConversations();
    return id;
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(userId: string, message: string, context?: ContextData): Promise<string> {
    if (!this.currentConversationId) {
      this.createConversation();
    }

    const conversation = this.conversations.get(this.currentConversationId)!;

    // Add user message
    const userMessage: Message = {
      id: `msg-${++this.messageCounter}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    conversation.messages.push(userMessage);

    // Generate AI response
    const response = await this.generateResponse(message, conversation.messages.slice(0, -1), context);

    // Add assistant message
    const assistantMessage: Message = {
      id: `msg-${++this.messageCounter}`,
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };
    conversation.messages.push(assistantMessage);

    conversation.updatedAt = new Date();
    this.saveConversations();

    return response;
  }

  /**
   * Generate context from project data
   */
  generateContextFromProject(projectId: string, roadmapData?: any): ContextData {
    const context: ContextData = {
      projectId,
      userGoals: [],
      skills: [],
      completedModules: []
    };

    if (roadmapData) {
      context.progress = roadmapData.progress || 0;
      context.currentModule = roadmapData.currentModule;
      context.completedModules = roadmapData.modules
        ?.filter((m: any) => m.status === 'done')
        .map((m: any) => m.name) || [];
      context.skills = roadmapData.skills || [];
    }

    return context;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): Message[] {
    const conversation = this.conversations.get(conversationId);
    return conversation?.messages || [];
  }

  /**
   * Get all conversations
   */
  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Set active conversation
   */
  setActiveConversation(conversationId: string): void {
    if (this.conversations.has(conversationId)) {
      this.currentConversationId = conversationId;
    }
  }

  /**
   * Export conversation as markdown
   */
  exportConversation(conversationId: string, format: 'markdown' | 'json' = 'markdown'): string {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return '';

    if (format === 'json') {
      return JSON.stringify(conversation, null, 2);
    }

    // Markdown format
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `*Generated: ${conversation.createdAt.toLocaleString()}*\n\n`;
    markdown += `---\n\n`;

    conversation.messages.forEach(msg => {
      const role = msg.role === 'user' ? '👤 You' : '🤖 Assistant';
      markdown += `### ${role}\n\n${msg.content}\n\n`;
      if (msg.codeBlock) {
        markdown += `\`\`\`\n${msg.codeBlock}\n\`\`\`\n\n`;
      }
    });

    return markdown;
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
    this.saveConversations();
  }

  /**
   * Generate AI response (simulated)
   * In production, this would call an actual AI API
   */
  private async generateResponse(
    message: string,
    history: Message[],
    context?: ContextData
  ): Promise<string> {
    // Simulate API call with timeout
    await new Promise(resolve => setTimeout(resolve, 500));

    const messageKey = message.toLowerCase();

    // Context-aware responses
    if (context?.currentModule) {
      if (messageKey.includes('help') || messageKey.includes('stuck') || messageKey.includes('error')) {
        return this.generateDebuggingAdvice(message, context);
      }
      if (messageKey.includes('next') || messageKey.includes('what to do')) {
        return this.generateNextStepsAdvice(context);
      }
    }

    // General responses
    if (messageKey.includes('explain') || messageKey.includes('what')) {
      return this.generateExplanation(message);
    }
    if (messageKey.includes('improve') || messageKey.includes('optimize') || messageKey.includes('refactor')) {
      return this.generateImprovementSuggestions(message);
    }
    if (messageKey.includes('learn') || messageKey.includes('how to')) {
      return this.generateLearningPath(message);
    }

    // Default response
    return this.generateDefaultResponse(message);
  }

  private generateExplanation(message: string): string {
    return `I'd be happy to explain! Based on your question about "${message.slice(0, 50)}...", here are the key concepts:

1. **Core Concept**: This is a fundamental building block that helps you understand...
2. **Why It Matters**: Understanding this will help you tackle more complex problems
3. **Real-world Application**: This is used in practical scenarios like...
4. **Common Pitfalls**: Many people struggle with...

Would you like me to dive deeper into any specific aspect?`;
  }

  private generateImprovementSuggestions(message: string): string {
    return `Great question! Here are some optimization suggestions:

**Performance Improvements:**
- Reduce time complexity from O(n²) to O(n log n)
- Cache frequently computed values
- Use appropriate data structures (hash tables, trees)

**Code Quality:**
- Add error handling for edge cases
- Improve variable naming for clarity
- Extract complex logic into separate functions

**Best Practices:**
- Follow DRY (Don't Repeat Yourself) principle
- Add meaningful comments and documentation
- Consider testability in your design

Would you like me to show specific code examples?`;
  }

  private generateLearningPath(message: string): string {
    return `Here's a recommended learning path:

**Phase 1: Foundations (Weeks 1-2)**
- Basic concepts and terminology
- Interactive tutorials
- Hands-on exercises

**Phase 2: Core Skills (Weeks 3-4)**
- Intermediate techniques
- Real-world projects
- Code review practice

**Phase 3: Advanced Topics (Weeks 5-6)**
- Complex problem-solving
- Optimization strategies
- Professional workflows

**Phase 4: Mastery (Weeks 7-8)**
- Advanced patterns
- Teaching others
- Contribution to projects

I recommend spending 2-3 hours per week. Would you like specific resources for any phase?`;
  }

  private generateDebuggingAdvice(message: string, context: ContextData): string {
    return `I'm here to help you debug! Let's break this down:

**Debugging Strategy:**
1. **Reproduce**: Can you consistently reproduce the error?
2. **Isolate**: What's the smallest code that triggers it?
3. **Hypothesis**: What do you think is causing it?
4. **Test**: Let's verify your hypothesis

**Common Issues in "${context.currentModule}":**
- Incorrect variable initialization
- Missing error handling
- Off-by-one errors in loops
- Type mismatches

**Debug Tools:**
- Use console.log() or print() at key points
- Use a debugger to step through code
- Check variable values at each step
- Review error messages carefully

Can you share the error message or code snippet? That'll help me give more specific advice!`;
  }

  private generateNextStepsAdvice(context: ContextData): string {
    const completed = context.completedModules?.length || 0;
    const total = completed + 5; // Assume 5 modules left

    return `Great progress! You've completed ${completed} modules. Here's what I recommend next:

**Immediate Next Steps:**
1. Review what you've learned so far
2. Build a small project using your new skills
3. Challenge yourself with harder problems
4. Help others by explaining concepts

**Short-term (1-2 weeks):**
- Start the next module
- Practice with 3-5 coding challenges
- Read documentation on advanced topics

**Long-term (1-2 months):**
- Build a portfolio project
- Contribute to open source
- Mentor someone else

**Skills to Focus On:**
${context.skills?.slice(0, 3).map(s => `- ${s}`).join('\n') || '- Problem solving\n- Code organization\n- Testing'}

You're ${Math.round((completed / total) * 100)}% through your roadmap. Keep going! 🚀`;
  }

  private generateDefaultResponse(message: string): string {
    return `Thanks for your question! I'm here to help with:

- **Code explanations**: Understand difficult concepts
- **Debugging help**: Fix errors and issues
- **Performance tips**: Optimize your code
- **Learning paths**: Structure your learning
- **Best practices**: Write better code

What would you like help with? Feel free to ask about:
- Specific code or concepts
- Project advice
- Learning strategies
- Debugging techniques

I'm ready to help! 💡`;
  }

  /**
   * Save conversations to localStorage
   */
  private saveConversations(): void {
    const data: Record<string, any> = {};
    this.conversations.forEach((conv, id) => {
      data[id] = conv;
    });
    localStorage.setItem('chat-conversations', JSON.stringify(data));
  }
}

export const chatService = new ChatService();
export type { Message, Conversation, ContextData };
