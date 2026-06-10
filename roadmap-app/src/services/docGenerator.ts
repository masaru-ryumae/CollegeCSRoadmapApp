// Documentation Generator Service
// Generates documentation from code comments, API definitions, and architecture descriptions

interface CodeFile {
  path: string;
  content: string;
  language: string;
}

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  params?: Record<string, string>;
  responses?: Record<string, unknown>;
}

interface ArchitectureDescription {
  components: string[];
  relationships: string[];
  dataFlow: string;
}

interface GeneratedDoc {
  id: string;
  title: string;
  content: string;
  markdown: string;
  html: string;
  type: 'code' | 'api' | 'architecture' | 'deployment' | 'troubleshooting';
  createdAt: string;
  sourceFiles?: string[];
}

/**
 * Extract code comments from source files
 */
const extractComments = (code: string, language: string): string[] => {
  const comments: string[] = [];

  if (language === 'typescript' || language === 'javascript') {
    // Extract JSDoc comments
    const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
    const matches = code.match(jsdocRegex) || [];
    matches.forEach((match) => {
      comments.push(match.replace(/\/\*\*|\*\//g, '').trim());
    });

    // Extract line comments
    const lineRegex = /\/\/\s*(.+)/g;
    let lineMatch;
    while ((lineMatch = lineRegex.exec(code)) !== null) {
      comments.push(lineMatch[1]);
    }
  } else if (language === 'python') {
    // Extract Python docstrings
    const docstringRegex = /"""[\s\S]*?"""|'''[\s\S]*?'''/g;
    const matches = code.match(docstringRegex) || [];
    matches.forEach((match) => {
      comments.push(match.replace(/"""|'''/g, '').trim());
    });
  }

  return comments.filter((c) => c.length > 0);
};

/**
 * Generate documentation from code comments
 */
export const generateCodeDocumentation = (codeFiles: CodeFile[]): GeneratedDoc => {
  const allComments: string[] = [];
  const sourceFiles: string[] = [];

  codeFiles.forEach((file) => {
    const comments = extractComments(file.content, file.language);
    allComments.push(`## ${file.path}`);
    allComments.push(comments.join('\n'));
    sourceFiles.push(file.path);
  });

  const markdown = `# Code Documentation\n\n${allComments.join('\n\n')}`;
  const html = markdownToHtml(markdown);

  return {
    id: `doc_${Date.now()}_code`,
    title: 'Code Documentation',
    content: allComments.join('\n\n'),
    markdown,
    html,
    type: 'code',
    createdAt: new Date().toISOString(),
    sourceFiles,
  };
};

/**
 * Generate API documentation from endpoint definitions
 */
export const generateAPIDocumentation = (
  endpoints: APIEndpoint[],
  title: string = 'API Documentation'
): GeneratedDoc => {
  let markdown = `# ${title}\n\n`;
  markdown += `**Total Endpoints:** ${endpoints.length}\n\n`;

  endpoints.forEach((endpoint, index) => {
    markdown += `## ${index + 1}. ${endpoint.method.toUpperCase()} ${endpoint.path}\n\n`;
    markdown += `${endpoint.description}\n\n`;

    if (endpoint.params && Object.keys(endpoint.params).length > 0) {
      markdown += `### Parameters\n\n`;
      markdown += `| Name | Description |\n`;
      markdown += `|------|-------------|\n`;
      Object.entries(endpoint.params).forEach(([name, desc]) => {
        markdown += `| ${name} | ${desc} |\n`;
      });
      markdown += `\n`;
    }

    if (endpoint.responses && Object.keys(endpoint.responses).length > 0) {
      markdown += `### Responses\n\n`;
      Object.entries(endpoint.responses).forEach(([status, schema]) => {
        markdown += `\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\`\n\n`;
      });
    }

    markdown += `---\n\n`;
  });

  const html = markdownToHtml(markdown);

  return {
    id: `doc_${Date.now()}_api`,
    title,
    content: markdown,
    markdown,
    html,
    type: 'api',
    createdAt: new Date().toISOString(),
  };
};

/**
 * Generate architecture documentation from description
 */
export const generateArchitectureDocumentation = (
  architecture: ArchitectureDescription,
  projectName: string = 'Project'
): GeneratedDoc => {
  let markdown = `# ${projectName} Architecture\n\n`;

  markdown += `## Components\n\n`;
  architecture.components.forEach((comp) => {
    markdown += `- **${comp}**\n`;
  });

  markdown += `\n## Component Relationships\n\n`;
  architecture.relationships.forEach((rel) => {
    markdown += `- ${rel}\n`;
  });

  markdown += `\n## Data Flow\n\n`;
  markdown += `${architecture.dataFlow}\n\n`;

  markdown += `\n## Architecture Diagram\n\n`;
  markdown += `\`\`\`\n${generateASCIIDiagram(architecture.components)}\n\`\`\`\n`;

  const html = markdownToHtml(markdown);

  return {
    id: `doc_${Date.now()}_arch`,
    title: `${projectName} Architecture`,
    content: markdown,
    markdown,
    html,
    type: 'architecture',
    createdAt: new Date().toISOString(),
  };
};

/**
 * Generate deployment guide
 */
export const generateDeploymentGuide = (
  projectName: string,
  platform: 'vercel' | 'heroku' | 'aws' | 'docker' = 'vercel'
): GeneratedDoc => {
  let markdown = `# ${projectName} - Deployment Guide\n\n`;

  if (platform === 'vercel') {
    markdown += `## Deploy on Vercel\n\n`;
    markdown += `### Prerequisites\n`;
    markdown += `- Node.js 16+\n`;
    markdown += `- Vercel account\n`;
    markdown += `- Git repository\n\n`;

    markdown += `### Steps\n`;
    markdown += `1. Push your code to GitHub/GitLab/Bitbucket\n`;
    markdown += `2. Log in to Vercel at https://vercel.com\n`;
    markdown += `3. Click "New Project" and select your repository\n`;
    markdown += `4. Configure build settings (auto-detected for most frameworks)\n`;
    markdown += `5. Click "Deploy"\n\n`;

    markdown += `### Environment Variables\n`;
    markdown += `Set in Vercel dashboard under Project Settings > Environment Variables\n`;
    markdown += `\`\`\`\nREACT_APP_API_URL=https://api.example.com\nREACT_APP_ENV=production\n\`\`\`\n\n`;
  } else if (platform === 'docker') {
    markdown += `## Deploy with Docker\n\n`;
    markdown += `### Prerequisites\n`;
    markdown += `- Docker installed\n`;
    markdown += `- Docker Hub account (optional)\n\n`;

    markdown += `### Dockerfile\n`;
    markdown += `\`\`\`dockerfile\nFROM node:16-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nCMD ["npm", "start"]\n\`\`\`\n\n`;

    markdown += `### Build & Run\n`;
    markdown += `\`\`\`bash\ndocker build -t ${projectName.toLowerCase()} .\ndocker run -p 3000:3000 ${projectName.toLowerCase()}\n\`\`\`\n\n`;
  }

  markdown += `### Troubleshooting\n`;
  markdown += `- Check build logs for errors\n`;
  markdown += `- Verify environment variables are set\n`;
  markdown += `- Ensure all dependencies are in package.json\n\n`;

  const html = markdownToHtml(markdown);

  return {
    id: `doc_${Date.now()}_deploy`,
    title: `${projectName} Deployment Guide`,
    content: markdown,
    markdown,
    html,
    type: 'deployment',
    createdAt: new Date().toISOString(),
  };
};

/**
 * Generate troubleshooting guide
 */
export const generateTroubleshootingGuide = (issues: Record<string, string[]>): GeneratedDoc => {
  let markdown = `# Troubleshooting Guide\n\n`;

  Object.entries(issues).forEach(([issue, solutions]) => {
    markdown += `## ${issue}\n\n`;
    markdown += `### Solutions\n`;
    solutions.forEach((solution, index) => {
      markdown += `${index + 1}. ${solution}\n`;
    });
    markdown += `\n`;
  });

  markdown += `## Common Errors\n\n`;
  markdown += `### Error: Module not found\n`;
  markdown += `- Run \`npm install\`\n`;
  markdown += `- Clear node_modules: \`rm -rf node_modules && npm install\`\n\n`;

  markdown += `### Error: Port already in use\n`;
  markdown += `- Kill the process: \`lsof -i :3000 | kill -9\`\n`;
  markdown += `- Or change the port in your config\n\n`;

  const html = markdownToHtml(markdown);

  return {
    id: `doc_${Date.now()}_troubleshoot`,
    title: 'Troubleshooting Guide',
    content: markdown,
    markdown,
    html,
    type: 'troubleshooting',
    createdAt: new Date().toISOString(),
  };
};

/**
 * Convert Markdown to simple HTML (basic implementation)
 */
const markdownToHtml = (markdown: string): string => {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Lists
  html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  return html;
};

/**
 * Generate simple ASCII diagram
 */
const generateASCIIDiagram = (components: string[]): string => {
  let diagram = '';
  components.forEach((comp, index) => {
    if (index > 0) diagram += '\n       ↓\n';
    diagram += `    [${comp}]`;
  });
  return diagram;
};
