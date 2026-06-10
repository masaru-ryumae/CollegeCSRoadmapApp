import React, { useState } from 'react';
import { Tutorial, TutorialStep, CodeBlock, Quiz, SEOSettings } from '../types';
import {
  createTutorial,
  updateTutorial,
  publishTutorial,
  unpublishTutorial,
} from '../utils/tutorialEngine';
import './TutorialBuilder.css';

interface TutorialBuilderProps {
  initialTutorial?: Tutorial;
  onSave?: (tutorial: Tutorial) => void;
  onPublish?: (tutorial: Tutorial) => void;
}

export const TutorialBuilder: React.FC<TutorialBuilderProps> = ({
  initialTutorial,
  onSave,
  onPublish,
}) => {
  const [title, setTitle] = useState(initialTutorial?.title || '');
  const [description, setDescription] = useState(initialTutorial?.description || '');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    initialTutorial?.difficulty || 'beginner'
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialTutorial?.estimatedMinutes || 30
  );
  const [tags, setTags] = useState<string[]>(initialTutorial?.tags || []);
  const [steps, setSteps] = useState<TutorialStep[]>(initialTutorial?.steps || []);
  const [seo, setSeo] = useState<SEOSettings>(
    initialTutorial?.seo || {
      title: '',
      description: '',
      keywords: [],
      slug: '',
    }
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [publishStatus, setPublishStatus] = useState(initialTutorial?.status || 'draft');

  // Add new step
  const addStep = () => {
    const newStep: TutorialStep = {
      id: `step_${Date.now()}`,
      title: 'New Step',
      description: '',
      codeBlocks: [],
      images: [],
      videos: [],
    };
    setSteps([...steps, newStep]);
  };

  // Update step
  const updateStep = (index: number, updates: Partial<TutorialStep>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...updates };
    setSteps(updated);
  };

  // Delete step
  const deleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    if (currentStep >= steps.length - 1) {
      setCurrentStep(Math.max(0, steps.length - 2));
    }
  };

  // Add code block to step
  const addCodeBlock = (stepIndex: number) => {
    const newCodeBlock: CodeBlock = {
      id: `code_${Date.now()}`,
      code: '',
      language: 'javascript',
      filename: '',
    };
    const step = steps[stepIndex];
    if (!step.codeBlocks) step.codeBlocks = [];
    step.codeBlocks.push(newCodeBlock);
    updateStep(stepIndex, step);
  };

  // Add quiz checkpoint
  const addCheckpoint = (stepIndex: number) => {
    const newQuiz: Quiz = {
      id: `quiz_${Date.now()}`,
      question: 'What did you learn?',
      options: [
        { id: '1', text: 'Option 1', correct: true },
        { id: '2', text: 'Option 2', correct: false },
      ],
      explanation: '',
    };
    updateStep(stepIndex, { checkpoint: newQuiz });
  };

  // Save tutorial
  const handleSave = () => {
    if (!title.trim()) {
      alert('Tutorial title is required');
      return;
    }

    const tutorialData = {
      title,
      description,
      steps,
      tags,
      difficulty,
      estimatedMinutes,
    };

    let tutorial: Tutorial;
    if (initialTutorial) {
      tutorial = updateTutorial(initialTutorial.id, tutorialData) as Tutorial;
    } else {
      tutorial = createTutorial(tutorialData, {
        authorId: 'user_current', // Replace with actual user ID
        seo,
      });
    }

    onSave?.(tutorial);
    alert('Tutorial saved successfully!');
  };

  // Publish tutorial
  const handlePublish = () => {
    if (!initialTutorial?.id) {
      alert('Please save the tutorial first');
      return;
    }

    const published = publishTutorial(initialTutorial.id);
    if (published) {
      setPublishStatus('published');
      onPublish?.(published);
      alert('Tutorial published successfully!');
    }
  };

  // Unpublish tutorial
  const handleUnpublish = () => {
    if (!initialTutorial?.id) return;

    const unpublished = unpublishTutorial(initialTutorial.id);
    if (unpublished) {
      setPublishStatus('draft');
      alert('Tutorial unpublished');
    }
  };

  return (
    <div className="tutorial-builder">
      <div className="builder-header">
        <h1>Tutorial Builder</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'Edit Mode' : 'Preview'}
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save
          </button>
          {publishStatus === 'draft' ? (
            <button className="btn-success" onClick={handlePublish}>
              Publish
            </button>
          ) : (
            <button className="btn-warning" onClick={handleUnpublish}>
              Unpublish
            </button>
          )}
        </div>
      </div>

      {!showPreview ? (
        <>
          {/* Basic Info Section */}
          <section className="builder-section">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tutorial Title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tutorial description"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estimated Time (minutes)</label>
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                value={tags.join(', ')}
                onChange={(e) => setTags(e.target.value.split(',').map((t) => t.trim()))}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </section>

          {/* SEO Section */}
          <section className="builder-section">
            <h2>SEO Settings</h2>
            <div className="form-group">
              <label>SEO Title</label>
              <input
                type="text"
                value={seo.title}
                onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                placeholder="SEO title (50-60 chars)"
                maxLength={60}
              />
            </div>

            <div className="form-group">
              <label>SEO Description</label>
              <textarea
                value={seo.description}
                onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                placeholder="SEO description (150-160 chars)"
                maxLength={160}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Keywords</label>
              <input
                type="text"
                value={seo.keywords.join(', ')}
                onChange={(e) => setSeo({ ...seo, keywords: e.target.value.split(',').map((k) => k.trim()) })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>

            <div className="form-group">
              <label>URL Slug</label>
              <input
                type="text"
                value={seo.slug}
                onChange={(e) => setSeo({ ...seo, slug: e.target.value })}
                placeholder="url-slug"
              />
            </div>
          </section>

          {/* Steps Section */}
          <section className="builder-section">
            <div className="steps-header">
              <h2>Steps ({steps.length})</h2>
              <button className="btn-secondary" onClick={addStep}>
                + Add Step
              </button>
            </div>

            {steps.length === 0 ? (
              <p className="empty-state">No steps yet. Click "Add Step" to get started.</p>
            ) : (
              <>
                <div className="steps-list">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`step-card ${currentStep === index ? 'active' : ''}`}
                      onClick={() => setCurrentStep(index)}
                    >
                      <h4>Step {index + 1}</h4>
                      <p>{step.title || 'Untitled'}</p>
                    </div>
                  ))}
                </div>

                {/* Current Step Editor */}
                <div className="step-editor">
                  <h3>Edit Step {currentStep + 1}</h3>

                  <div className="form-group">
                    <label>Step Title</label>
                    <input
                      type="text"
                      value={steps[currentStep].title}
                      onChange={(e) => updateStep(currentStep, { title: e.target.value })}
                      placeholder="Step title"
                    />
                  </div>

                  <div className="form-group">
                    <label>Step Description</label>
                    <textarea
                      value={steps[currentStep].description}
                      onChange={(e) => updateStep(currentStep, { description: e.target.value })}
                      placeholder="Step description"
                      rows={5}
                    />
                  </div>

                  {/* Code Blocks */}
                  <div className="code-blocks-section">
                    <h4>Code Blocks</h4>
                    {steps[currentStep].codeBlocks?.map((block, blockIdx) => (
                      <div key={block.id} className="code-block">
                        <select
                          value={block.language}
                          onChange={(e) => {
                            const updated = [...(steps[currentStep].codeBlocks || [])];
                            updated[blockIdx].language = e.target.value;
                            updateStep(currentStep, { codeBlocks: updated });
                          }}
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="typescript">TypeScript</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                          <option value="html">HTML</option>
                          <option value="css">CSS</option>
                          <option value="sql">SQL</option>
                        </select>

                        <textarea
                          value={block.code}
                          onChange={(e) => {
                            const updated = [...(steps[currentStep].codeBlocks || [])];
                            updated[blockIdx].code = e.target.value;
                            updateStep(currentStep, { codeBlocks: updated });
                          }}
                          placeholder="Code..."
                          rows={6}
                        />
                      </div>
                    ))}
                    <button className="btn-secondary" onClick={() => addCodeBlock(currentStep)}>
                      + Add Code Block
                    </button>
                  </div>

                  {/* Checkpoint */}
                  <div className="checkpoint-section">
                    <h4>Checkpoint Quiz</h4>
                    {steps[currentStep].checkpoint ? (
                      <div className="checkpoint-editor">
                        <input
                          type="text"
                          value={steps[currentStep].checkpoint!.question}
                          onChange={(e) => {
                            const checkpoint = steps[currentStep].checkpoint!;
                            checkpoint.question = e.target.value;
                            updateStep(currentStep, { checkpoint });
                          }}
                          placeholder="Question"
                        />
                        <textarea
                          value={steps[currentStep].checkpoint!.explanation}
                          onChange={(e) => {
                            const checkpoint = steps[currentStep].checkpoint!;
                            checkpoint.explanation = e.target.value;
                            updateStep(currentStep, { checkpoint });
                          }}
                          placeholder="Explanation for correct answer"
                          rows={3}
                        />
                      </div>
                    ) : (
                      <button className="btn-secondary" onClick={() => addCheckpoint(currentStep)}>
                        + Add Checkpoint Quiz
                      </button>
                    )}
                  </div>

                  <button
                    className="btn-danger"
                    onClick={() => deleteStep(currentStep)}
                    style={{ marginTop: '20px' }}
                  >
                    Delete Step
                  </button>
                </div>
              </>
            )}
          </section>

          <div style={{ paddingBottom: '40px' }} />
        </>
      ) : (
        /* Preview Mode */
        <div className="preview-mode">
          <h1>{title}</h1>
          <p className="preview-meta">
            {difficulty} • {estimatedMinutes} minutes • Status: {publishStatus}
          </p>

          <div className="preview-description">{description}</div>

          {steps.length > 0 && (
            <>
              <h2>Steps</h2>
              {steps.map((step, index) => (
                <div key={step.id} className="preview-step">
                  <h3>
                    Step {index + 1}: {step.title}
                  </h3>
                  <p>{step.description}</p>

                  {step.codeBlocks?.map((block) => (
                    <pre key={block.id} className="code-preview">
                      <code>{block.code}</code>
                    </pre>
                  ))}

                  {step.checkpoint && (
                    <div className="checkpoint-preview">
                      <strong>Checkpoint:</strong> {step.checkpoint.question}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TutorialBuilder;
