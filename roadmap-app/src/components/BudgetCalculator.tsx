import { useState } from 'react';
import { Module } from '../types/index';
import {
  estimateProjectCost,
  categorizeBudgetItems,
  suggestBudgetAlternatives,
  getPriceHistory,
  BudgetItem,
  CostReduction,
} from '../utils/budgetCalc';
import '../styles/BudgetCalculator.css';

interface BudgetCalculatorProps {
  modules: Module[];
  onClose?: () => void;
}

export function BudgetCalculator({
  modules,
  onClose,
}: BudgetCalculatorProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [customItems, setCustomItems] = useState<BudgetItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    name: '',
    category: 'other',
    minCost: 0,
    avgCost: 0,
    maxCost: 0,
    frequency: 'one-time',
    isOptional: false,
  });

  const selectedProject = modules.find((m) => m.id === selectedProjectId);
  const baseBudget = selectedProject
    ? estimateProjectCost(selectedProject)
    : null;

  const allItems = baseBudget
    ? [...baseBudget.items, ...customItems]
    : customItems;

  const budgetTiers = categorizeBudgetItems(allItems);
  const alternatives = allItems.length > 0
    ? suggestBudgetAlternatives(allItems)
    : [];

  // Recalculate totals with custom items
  let totalMin = baseBudget?.totalMinCost || 0;
  let totalAvg = baseBudget?.totalAvgCost || 0;
  let totalMax = baseBudget?.totalMaxCost || 0;

  customItems.forEach((item) => {
    const multiplier =
      item.frequency === 'monthly'
        ? 12
        : item.frequency === 'yearly'
          ? 1
          : 1;
    totalMin += item.minCost * multiplier;
    totalAvg += item.avgCost * multiplier;
    totalMax += item.maxCost * multiplier;
  });

  const handleAddCustomItem = () => {
    if (newItem.name && newItem.avgCost !== undefined) {
      setCustomItems([
        ...customItems,
        {
          id: `custom-${Date.now()}`,
          name: newItem.name,
          category: newItem.category || 'other',
          minCost: newItem.minCost || 0,
          avgCost: newItem.avgCost,
          maxCost: newItem.maxCost || newItem.avgCost,
          frequency: newItem.frequency || 'one-time',
          isOptional: newItem.isOptional || false,
          description: newItem.description,
        } as BudgetItem,
      ]);

      setNewItem({
        name: '',
        category: 'other',
        minCost: 0,
        avgCost: 0,
        maxCost: 0,
        frequency: 'one-time',
        isOptional: false,
      });
      setShowAddItem(false);
    }
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(customItems.filter((item) => item.id !== id));
  };

  const handleRemoveItem = (id: string) => {
    if (id.startsWith('custom-')) {
      handleRemoveCustomItem(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="budget-calculator-container">
      <div className="calc-header">
        <div>
          <h2>Budget Calculator</h2>
          <p>Estimate project costs and find budget-friendly alternatives</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-btn" aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="calc-layout">
        <div className="project-selector">
          <h3>Select a Project</h3>
          <div className="project-buttons">
            {modules.map((module) => (
              <button
                key={module.id}
                className={`project-btn ${
                  selectedProjectId === module.id ? 'active' : ''
                }`}
                onClick={() => {
                  setSelectedProjectId(module.id);
                  setCustomItems([]);
                }}
              >
                <div className="btn-title">{module.name}</div>
                <div className="btn-meta">
                  {module.hours.intermediate.toFixed(1)}h avg
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="calc-content">
          {!selectedProject ? (
            <div className="empty-state">
              <p>Select a project to calculate its budget</p>
            </div>
          ) : (
            <>
              <div className="budget-summary">
                <h3>{selectedProject.name} - Cost Estimate</h3>

                <div className="cost-ranges">
                  <div className="cost-range">
                    <span className="label">Minimum Cost</span>
                    <div className="amount">{formatCurrency(totalMin)}</div>
                    <span className="detail">One-time essentials only</span>
                  </div>

                  <div className="cost-range">
                    <span className="label">Average Cost</span>
                    <div className="amount primary">{formatCurrency(totalAvg)}</div>
                    <span className="detail">Recommended setup</span>
                  </div>

                  <div className="cost-range">
                    <span className="label">Maximum Cost</span>
                    <div className="amount">{formatCurrency(totalMax)}</div>
                    <span className="detail">Everything included</span>
                  </div>
                </div>

                <div className="range-visualization">
                  <div className="range-bar">
                    <div
                      className="range-segment min"
                      style={{ width: `${(totalMin / totalMax) * 100}%` }}
                      title={`Min: ${formatCurrency(totalMin)}`}
                    />
                    <div
                      className="range-segment avg"
                      style={{
                        width: `${((totalAvg - totalMin) / totalMax) * 100}%`,
                      }}
                      title={`Avg: ${formatCurrency(totalAvg)}`}
                    />
                    <div
                      className="range-segment max"
                      style={{
                        width: `${((totalMax - totalAvg) / totalMax) * 100}%`,
                      }}
                      title={`Max: ${formatCurrency(totalMax)}`}
                    />
                  </div>
                  <div className="range-labels">
                    <span>{formatCurrency(totalMin)}</span>
                    <span>{formatCurrency(totalAvg)}</span>
                    <span>{formatCurrency(totalMax)}</span>
                  </div>
                </div>
              </div>

              <div className="budget-breakdown">
                <h3>Budget Items</h3>

                <div className="items-section">
                  <h4>Must-Have Items ({budgetTiers.mustHaves.length})</h4>
                  <p className="section-desc">
                    Required for project completion (~{Math.round(budgetTiers.percentageRequired)}% of budget)
                  </p>
                  <div className="items-list">
                    {budgetTiers.mustHaves.map((item) => (
                      <BudgetItemRow
                        key={item.id}
                        item={item}
                        onRemove={() => handleRemoveItem(item.id)}
                        canRemove={false}
                      />
                    ))}
                  </div>
                </div>

                <div className="items-section">
                  <h4>Nice-to-Have Items ({budgetTiers.niceToHaves.length})</h4>
                  <p className="section-desc">
                    Optional enhancements (~{Math.round(100 - budgetTiers.percentageRequired)}% of budget)
                  </p>
                  <div className="items-list">
                    {budgetTiers.niceToHaves.map((item) => (
                      <BudgetItemRow
                        key={item.id}
                        item={item}
                        onRemove={() => handleRemoveItem(item.id)}
                        canRemove={item.id.startsWith('custom-')}
                      />
                    ))}
                  </div>
                </div>

                <div className="items-section">
                  <h4>Custom Items ({customItems.length})</h4>
                  <div className="items-list">
                    {customItems.map((item) => (
                      <BudgetItemRow
                        key={item.id}
                        item={item}
                        onRemove={() => handleRemoveItem(item.id)}
                        canRemove={true}
                      />
                    ))}
                  </div>

                  {!showAddItem ? (
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="add-item-btn"
                    >
                      + Add Custom Item
                    </button>
                  ) : (
                    <div className="add-item-form">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={newItem.name || ''}
                        onChange={(e) =>
                          setNewItem({ ...newItem, name: e.target.value })
                        }
                        className="form-input"
                      />

                      <select
                        value={newItem.category || 'other'}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            category: e.target.value as BudgetItem['category'],
                          })
                        }
                        className="form-select"
                      >
                        <option value="hardware">Hardware</option>
                        <option value="software">Software</option>
                        <option value="service">Service</option>
                        <option value="course">Course</option>
                        <option value="other">Other</option>
                      </select>

                      <input
                        type="number"
                        placeholder="Cost"
                        value={newItem.avgCost || 0}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            avgCost: parseFloat(e.target.value),
                          })
                        }
                        className="form-input"
                      />

                      <select
                        value={newItem.frequency || 'one-time'}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            frequency: e.target.value as BudgetItem['frequency'],
                          })
                        }
                        className="form-select"
                      >
                        <option value="one-time">One-time</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={newItem.isOptional || false}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              isOptional: e.target.checked,
                            })
                          }
                        />
                        Optional
                      </label>

                      <div className="form-buttons">
                        <button
                          onClick={handleAddCustomItem}
                          className="btn-add"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddItem(false)}
                          className="btn-cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {alternatives.length > 0 && (
                <div className="alternatives-section">
                  <h3>Cost-Saving Alternatives</h3>
                  <p className="section-desc">
                    Ways to reduce your project budget
                  </p>

                  {alternatives.map((alt, idx) => (
                    <div key={idx} className="alternative-card">
                      <div className="alt-header">
                        <h4>Replace: {alt.originalItem.name}</h4>
                        <div className="savings-badge">
                          Save {formatCurrency(alt.savings)}
                        </div>
                      </div>
                      <p className="alt-with">
                        with <strong>{alt.alternative.name}</strong>
                      </p>
                      <p className="alt-tradeoff">Tradeoff: {alt.tradeoff}</p>
                      <div className="alt-comparison">
                        <div className="alt-cost">
                          <span className="label">Original:</span>
                          <span className="amount">
                            {formatCurrency(alt.originalItem.avgCost)}
                          </span>
                        </div>
                        <div className="alt-cost">
                          <span className="label">Alternative:</span>
                          <span className="amount">
                            {formatCurrency(alt.alternative.avgCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface BudgetItemRowProps {
  item: BudgetItem;
  onRemove: () => void;
  canRemove: boolean;
}

function BudgetItemRow({ item, onRemove, canRemove }: BudgetItemRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const trend = getPriceHistory(item.name);

  const multiplier =
    item.frequency === 'monthly'
      ? 12
      : item.frequency === 'yearly'
        ? 1
        : 1;

  const displayCost = item.avgCost * multiplier;

  return (
    <div className="item-row">
      <div
        className="item-header"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="item-info">
          <h5>{item.name}</h5>
          <span className="category-badge">{item.category}</span>
          {item.isOptional && <span className="optional-badge">Optional</span>}
        </div>

        <div className="item-cost">${displayCost.toFixed(0)}</div>

        {canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="remove-btn"
            aria-label="Remove item"
          >
            🗑️
          </button>
        )}

        <span className="expand-icon">
          {showDetails ? '▼' : '▶'}
        </span>
      </div>

      {showDetails && (
        <div className="item-details">
          {item.description && (
            <p className="detail-desc">{item.description}</p>
          )}

          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Cost Range</span>
              <span className="detail-value">
                ${item.minCost.toFixed(0)} - ${item.maxCost.toFixed(0)}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Frequency</span>
              <span className="detail-value">{item.frequency}</span>
            </div>

            {item.frequency !== 'one-time' && (
              <div className="detail-item">
                <span className="detail-label">Annualized</span>
                <span className="detail-value">
                  ${displayCost.toFixed(0)}/year
                </span>
              </div>
            )}
          </div>

          <div className="price-trend">
            <span className="trend-icon">
              {trend.trend === 'increasing'
                ? '📈'
                : trend.trend === 'decreasing'
                  ? '📉'
                  : '➡️'}
            </span>
            <span className="trend-text">{trend.forecast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
