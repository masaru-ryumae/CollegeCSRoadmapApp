import React, { useState } from 'react';
import {
  generateCodeDocumentation,
  generateAPIDocumentation,
  generateArchitectureDocumentation,
  generateDeploymentGuide,
  generateTroubleshootingGuide,
} from '../services/docGenerator';
import './DocBuilder.css';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  params?: Record<string, string>;
  responses?: Record<string, unknown>;
}

type DocType = 'code' | 'api' | 'architecture' | 'deployment' | 'troubleshooting';

export const DocBuilder: React.FC = () => {
  const [docType, setDocType] = useState<DocType>('code');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // API Documentation
  const [apiName, setApiName] = useState('My API');
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([
    {
      method: 'GET',
      path: '/api/users',
      description: 'Get all users',
    },
  ]);

  // Architecture Documentation
  const [projectName, setProjectName] = useState('My Project');
  const [components, setComponents] = useState<string[]>(['Frontend', 'Backend', 'Database']);
  const [relationships, setRelationships] = useState<string[]>([
    'Frontend communicates with Backend via REST API',
    'Backend stores data in Database',
  ]);
  const [dataFlow, setDataFlow] = useState('User interaction → Frontend → Backend → Database');

  // Deployment
  const [deploymentPlatform, setDeploymentPlatform] = useState<'vercel' | 'heroku' | 'aws' | 'docker'>('vercel');

  // Troubleshooting
  const [commonIssues, setCommonIssues] = useState<Record<string, string[]>>({
    'Build failures': [
      'Check if all dependencies are installed',
      'Clear cache and reinstall',
      'Check Node.js version compatibility',
    ],
    'Runtime errors': [
      'Check console logs for detailed errors',
      'Verify environment variables are set',
      'Check for typos in code',
    ],
  });

  // Generate documentation
  const handleGenerate = async () => {
    setIsLoading(true);

    try {
      let doc;

      if (docType === 'code') {
        const codeFiles = [
          {
            path: 'src/main.ts',
            content: 'export function main() { /* implementation */ }',
            language: 'typescript',
          },
        ];
        doc = generateCodeDocumentation(codeFiles);
      } else if (docType === 'api') {
        doc = generateAPIDocumentation(endpoints, apiName);
      } else if (docType === 'architecture') {
        doc = generateArchitectureDocumentation(
          {
            components,
            relationships,
            dataFlow,
          },
          projectName
        );
      } else if (docType === 'deployment') {
        doc = generateDeploymentGuide(projectName, deploymentPlatform);
      } else if (docType === 'troubleshooting') {
        doc = generateTroubleshootingGuide(commonIssues);
      }

      if (doc) {
        setGeneratedContent(doc.markdown);
      }
    } catch (error) {
      console.error('Error generating documentation:', error);
      alert('Error generating documentation');
    } finally {
      setIsLoading(false);
    }
  };

  // Export as Markdown
  const handleExport = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `documentation-${Date.now()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    alert('Documentation copied to clipboard!');
  };

  return (
    <div className="doc-builder">
      <div className="doc-header">
        <h1>Documentation Generator</h1>
        <p>Generate professional documentation automatically from your code, API, or architecture</p>
      </div>

      <div className="doc-container">
        {/* Configuration Panel */}
        <div className="config-panel">
          <h2>Documentation Type</h2>

          <div className="doc-type-selector">
            {(['code', 'api', 'architecture', 'deployment', 'troubleshooting'] as DocType[]).map(
              (type) => (
                <button
                  key={type}
                  className={`type-btn ${docType === type ? 'active' : ''}`}
                  onClick={() => setDocType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )
            )}
          </div>

          {/* Dynamic Configuration Based on Type */}
          <div className="config-options">
            {docType === 'api' && (
              <>
                <h3>API Configuration</h3>
                <div className="form-group">
                  <label>API Name</label>
                  <input
                    type="text"
                    value={apiName}
                    onChange={(e) => setApiName(e.target.value)}
                    placeholder="My API"
                  />
                </div>

                <h4>Endpoints</h4>
                {endpoints.map((endpoint, idx) => (
                  <div key={idx} className="endpoint-config">
                    <input
                      type="text"
                      value={endpoint.method}
                      onChange={(e) => {
                        const updated = [...endpoints];
                        updated[idx].method = e.target.value;
                        setEndpoints(updated);
                      }}
                      placeholder="GET"
                      style={{ width: '80px' }}
                    />
                    <input
                      type="text"
                      value={endpoint.path}
                      onChange={(e) => {
                        const updated = [...endpoints];
                        updated[idx].path = e.target.value;
                        setEndpoints(updated);
                      }}
                      placeholder="/api/endpoint"
                    />
                    <input
                      type="text"
                      value={endpoint.description}
                      onChange={(e) => {
                        const updated = [...endpoints];
                        updated[idx].description = e.target.value;
                        setEndpoints(updated);
                      }}
                      placeholder="Description"
                    />
                  </div>
                ))}
                <button
                  className="btn-small"
                  onClick={() =>
                    setEndpoints([
                      ...endpoints,
                      { method: 'GET', path: '/api/new', description: '' },
                    ])
                  }
                >
                  + Add Endpoint
                </button>
              </>
            )}

            {docType === 'architecture' && (
              <>
                <h3>Architecture Configuration</h3>
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Components (one per line)</label>
                  <textarea
                    value={components.join('\n')}
                    onChange={(e) => setComponents(e.target.value.split('\n').filter((c) => c))}
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label>Relationships (one per line)</label>
                  <textarea
                    value={relationships.join('\n')}
                    onChange={(e) => setRelationships(e.target.value.split('\n').filter((r) => r))}
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label>Data Flow</label>
                  <textarea
                    value={dataFlow}
                    onChange={(e) => setDataFlow(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}

            {docType === 'deployment' && (
              <>
                <h3>Deployment Configuration</h3>
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Platform</label>
                  <select
                    value={deploymentPlatform}
                    onChange={(e) =>
                      setDeploymentPlatform(e.target.value as 'vercel' | 'heroku' | 'aws' | 'docker')
                    }
                  >
                    <option value="vercel">Vercel</option>
                    <option value="heroku">Heroku</option>
                    <option value="aws">AWS</option>
                    <option value="docker">Docker</option>
                  </select>
                </div>
              </>
            )}

            {docType === 'troubleshooting' && (
              <>
                <h3>Common Issues</h3>
                {Object.entries(commonIssues).map(([issue, solutions]) => (
                  <div key={issue} className="issue-config">
                    <input
                      type="text"
                      value={issue}
                      disabled
                      style={{ fontWeight: 'bold' }}
                    />
                    <textarea
                      value={solutions.join('\n')}
                      onChange={(e) => {
                        const updated = { ...commonIssues };
                        updated[issue] = e.target.value.split('\n').filter((s) => s);
                        setCommonIssues(updated);
                      }}
                      rows={3}
                    />
                  </div>
                ))}
              </>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={isLoading}
            style={{ marginTop: '20px', width: '100%' }}
          >
            {isLoading ? 'Generating...' : 'Generate Documentation'}
          </button>
        </div>

        {/* Preview Panel */}
        <div className="preview-panel">
          <div className="preview-header">
            <h2>Documentation Preview</h2>
            {generatedContent && (
              <div className="preview-actions">
                <button className="btn-secondary" onClick={handleCopy}>
                  Copy
                </button>
                <button className="btn-secondary" onClick={handleExport}>
                  Export
                </button>
              </div>
            )}
          </div>

          {generatedContent ? (
            <div className="preview-content">
              <div className="markdown-preview">{renderMarkdown(generatedContent)}</div>
            </div>
          ) : (
            <div className="empty-preview">
              <p>Select a documentation type and click "Generate Documentation" to see the preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Markdown renderer
function renderMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={idx}>{line.replace('# ', '')}</h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={idx}>{line.replace('## ', '')}</h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={idx}>{line.replace('### ', '')}</h3>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={idx}>{line.replace('- ', '')}</li>
      );
    } else if (line.startsWith('```')) {
      // Handle code blocks
      elements.push(<code key={idx} className="code-block">{line}</code>);
    } else if (line.trim()) {
      elements.push(
        <p key={idx}>{line}</p>
      );
    }
  });

  return <div className="markdown-content">{elements}</div>;
}

export default DocBuilder;
