# AI Personalization System (v3.0)

## Overview

The AI Personalization System is a comprehensive machine learning-powered subsystem that adapts the learning experience to each user's unique needs, preferences, and learning patterns. It consists of 4 core AI services that work together to provide intelligent recommendations, adaptive difficulty, personalized mentoring, and performance analytics.

## Architecture

### 4 Core AI Services

#### 1. AI Recommendation Engine (`src/services/aiRecommender.ts`)
**Purpose**: Analyze user behavior and suggest personalized learning paths

**Key Features**:
- User behavior analysis (ratings, time spent, completion rates)
- Learning pattern derivation (difficulty preferences, category affinities, risk profiles)
- Project relevance scoring (multi-factor scoring system)
- Personalized roadmap generation (top 5 recommendations with confidence scores)
- Next project prediction
- Difficulty adaptation based on performance
- Module engagement tracking

**Key Types**:
```typescript
UserBehavior - Tracks user interactions and engagement
LearningPattern - Derived patterns from behavior
ProjectRecommendation - Single recommended module with scoring
RecommendationSet - Collection of recommendations
AdaptiveSettings - Difficulty adjustment recommendations
```

**Main Functions**:
- `analyzeUserBehavior(userId)` - Retrieve/create user behavior profile
- `deriveLearningPattern(behavior, currentDifficulty)` - Extract learning patterns
- `scoreProjectRelevance(module, userProfile, behavior)` - Calculate relevance (0-1)
- `generatePersonalizedRoadmap(userId, modules, roadmap)` - Generate top 5 recommendations
- `predictNextProject(userId, modules, roadmap)` - Get highest-scored recommendation
- `adaptDifficulty(userId, completionRate, avgTime)` - Suggest difficulty adjustment
- `trackModuleEngagement(userId, moduleId, hours, rating)` - Record user activity

#### 2. Adaptive Learning Algorithm (`src/services/adaptiveAlgorithm.ts`)
**Purpose**: Track skill progression and auto-adjust learning path based on performance

**Key Features**:
- Optimal difficulty calculation based on readiness score
- Prerequisite analysis and validation
- Time-to-completion estimation with adjustments
- Learning velocity tracking (modules/week, hours/week, trend analysis)
- Completion metrics calculation (progress, velocity, deadlines)
- Next step suggestions respecting dependencies

**Key Types**:
```typescript
LearningVelocity - Learning speed metrics and trends
DifficultyProgression - Current and recommended difficulty levels
PrerequisiteAnalysis - Module readiness assessment
TimeEstimate - Estimated completion time with confidence
CompletionMetrics - Overall progress and deadline tracking
```

**Main Functions**:
- `calculateOptimalDifficulty(userId, performance, completion, current)` - Determine progression
- `suggestPrerequisites(module, behavior, allModules)` - Check readiness
- `estimateTimeToCompletion(module, userId, difficulty, history)` - Predict time needed
- `trackLearningVelocity(userId)` - Calculate learning speed and trend
- `recordLearningActivity(userId, moduleId, hours)` - Log learning session
- `calculateCompletionMetrics(userId, roadmap, progress)` - Generate progress report
- `suggestOptimalNextSteps(userId, roadmap, progress, modules)` - Recommend next modules

#### 3. Mentor AI Assistant (`src/services/mentorAI.ts`)
**Purpose**: Provide intelligent, personalized guidance and feedback

**Key Features**:
- Progressive hint system (break down problems gradually)
- Code analysis and feedback with severity levels
- Debug guidance with error-specific help
- Concept explanation at appropriate skill levels
- Conversation management (persistent chat history)
- Mentor response generation based on user messages

**Key Types**:
```typescript
ConceptExplanation - Concept teaching at different levels
HintProgression - Progressive hint system for problems
CodeFeedback - Code review results with issues and strengths
CodeIssue - Individual code quality issues
DebugGuidance - Step-by-step debugging help
MentorConversation - Persistent conversation thread
ChatMessage - Individual message in conversation
```

**Main Functions**:
- `generateHints(moduleId, problemArea)` - Get progressive hints
- `analyzeCode(code, language)` - Review code quality (0-100)
- `suggestDebugSteps(error, moduleId, language)` - Debug guidance
- `explainConcept(concept, level)` - Teach concept at appropriate level
- `getMentorConversation(userId, moduleId)` - Create/retrieve chat
- `addMentorMessage(userId, moduleId, message, role)` - Add to conversation
- `generateMentorResponse(userMessage, moduleId, level)` - AI-generated response
- `clearMentorConversation(userId, moduleId)` - Clear chat history

#### 4. Performance Analytics (`src/services/performanceML.ts`)
**Purpose**: Track learning outcomes and identify improvement opportunities

**Key Features**:
- Performance trend analysis (weekly, monthly)
- Strength/weakness identification by category
- Churn risk prediction with intervention suggestions
- Cohort comparison and percentile ranking
- Focus area recommendations based on improvement potential
- Performance insight generation

**Key Types**:
```typescript
PerformanceTrend - Success rate and velocity trends
StrengthWeakness - Category-level performance analysis
PerformanceInsights - Comprehensive performance report
ChurnRiskAssessment - Dropout risk with interventions
CohortComparison - User vs cohort percentiles
FocusArea - Recommended improvement areas
```

**Main Functions**:
- `analyzePerformanceTrends(userId, roadmap, progress)` - Generate insights
- `predictChurnRisk(userId, progress, roadmap)` - Assess dropout risk
- `suggestFocusAreas(userId, insights)` - Recommend improvement areas (top 3)
- `compareWithCohort(userId, insights, cohortSize)` - Percentile comparisons

## Data Storage

All data is stored in **LocalStorage** with the following key patterns:

```
ai-user-behavior-{userId}              // User behavior profile
ai-recommendations-{userId}             // Cached recommendations (24hr cache)
ai-analytics-{userId}                   // Difficulty progression history
learning-velocity-{userId}              // Learning activity log
mentor-conversation-{userId}-{moduleId} // Chat conversation
mentor-hints-{moduleId}-{problemArea}  // Hint history
performance-analytics-{userId}          // Performance history (90 days)
cohort-analytics-general                // Cohort metrics
adaptive-analytics-{userId}             // Adaptive progression history
```

### Data Persistence

- **LocalStorage**: 100 most recent progression records, 365 days of activity
- **Cache invalidation**: Recommendations expire after 24 hours
- **History limits**: Performance analytics keeps last 90 days, activity keeps 1 year

## Integration Points

### With Roadmap System
```typescript
interface PersonalizedRoadmap {
  modules: ScheduledModule[];
  weeklySchedule: WeeklyPlan[];
  deadline: string;
  totalHours: number;
  answers: DecisionAnswers;
}
```

### With Progress Tracking
```typescript
interface ModuleProgress {
  moduleId: string;
  status: 'pending' | 'in-progress' | 'done';
  completedKeyPoints: string[];
  startedAt?: string;
  completedAt?: string;
}
```

## Usage Examples

### Example 1: Get Personalized Recommendations
```typescript
import { generatePersonalizedRoadmap } from './services';

const recommendations = generatePersonalizedRoadmap(
  userId,
  availableModules,
  currentRoadmap
);

console.log(recommendations.recommendations[0].reasoning);
// Output: "You've shown strong interest in algo modules with an average rating of 4.5/5..."
```

### Example 2: Track Learning and Get Difficulty Adjustment
```typescript
import { trackModuleEngagement, adaptDifficulty } from './services';

// User completes module
trackModuleEngagement(userId, 'algo-sorting', 12, 5);

// Check if difficulty should adjust
const adjustment = adaptDifficulty(userId, 0.85, 12);
if (adjustment.shouldAdjust) {
  console.log(`Recommend progressing to: ${adjustment.recommendedDifficulty}`);
}
```

### Example 3: Get Mentor Help
```typescript
import { getMentorConversation, generateMentorResponse } from './services';

const conversation = getMentorConversation(userId, moduleId);

const userQuestion = "I'm stuck on the sorting algorithm, can you help?";
const mentorResponse = generateMentorResponse(userQuestion, moduleId, 'beginner');

console.log(mentorResponse);
```

### Example 4: Analyze Performance
```typescript
import { analyzePerformanceTrends, predictChurnRisk } from './services';

const insights = analyzePerformanceTrends(userId, roadmap, progress);
console.log(`Overall performance: ${insights.overallPerformance}%`);
console.log(`Recommendations:`, insights.recommendations);

const churnRisk = predictChurnRisk(userId, progress, roadmap);
if (churnRisk.riskLevel === 'high') {
  console.log('Interventions needed:', churnRisk.interventions);
}
```

## Algorithms

### Relevance Scoring (0-1 scale)
```
Score = 
  (Category Affinity × 0.3) +           // How much user likes this category
  (Difficulty Match × 0.25) +           // Does it match user skill level
  (Career Relevance × 0.2) +            // Aligns with user goals
  (Dependency Completion × 0.15) +      // Prerequisites met
  (Engagement Bonus × 0.1)              // User is actively engaged
```

### Readiness Score
```
Readiness = (Performance × 0.6) + (Completion Rate × 0.4)

Progression Rules:
- Score > 0.85: Progress to next level
- Score 0.75-0.85: Strong consideration for progression
- Score 0.6-0.75: Maintain current level
- Score < 0.6: Consider regression
```

### Churn Risk Calculation
```
Risk Score = 
  (Inactivity Factor × 0.5) +          // Days since last activity (2 weeks max)
  (Decline Factor × 0.3) +             // Engagement decline trend
  (Incompletion Factor × 0.2)          // Percentage of started but unfinished

Risk Levels:
- Score > 0.65: HIGH (intervention needed)
- Score 0.35-0.65: MEDIUM (monitoring)
- Score < 0.35: LOW
```

## Testing

### Running Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Generate coverage report
```

### Test Coverage
- **4 service test suites**: ~50 tests each
- **1 integration test suite**: ~15 complex scenario tests
- **Total**: 215+ individual test assertions
- **Coverage target**: 75% across all services

### Test Files
- `src/services/__tests__/aiRecommender.test.ts` - Recommender tests
- `src/services/__tests__/adaptiveAlgorithm.test.ts` - Adaptive algorithm tests
- `src/services/__tests__/mentorAI.test.ts` - Mentor AI tests
- `src/services/__tests__/performanceML.test.ts` - Analytics tests
- `src/services/__tests__/integration.test.ts` - End-to-end integration tests

## Performance Characteristics

### Time Complexity
- `analyzeUserBehavior`: O(1)
- `scoreProjectRelevance`: O(1)
- `generatePersonalizedRoadmap`: O(n log n) where n = module count
- `predictChurnRisk`: O(d) where d = days of history
- `analyzePerformanceTrends`: O(d) where d = days of history

### Space Complexity
- Per-user storage: ~5-10 KB (behavior + history)
- Scales linearly with number of users
- LocalStorage limit: Typically 5-10 MB

### Optimization Tips
1. Cache recommendations for 24 hours
2. Limit history to 90 days (performance) / 365 days (activity)
3. Use selective updates instead of rewriting entire profiles
4. Clear old conversation history periodically

## Configuration

### Feature Toggles (Environment Variables)
```
VITE_AI_RECOMMENDATIONS_ENABLED=true
VITE_ADAPTIVE_LEARNING_ENABLED=true
VITE_MENTOR_AI_ENABLED=true
VITE_PERFORMANCE_ANALYTICS_ENABLED=true
```

### Customizable Parameters
- Recommendation cache duration: 24 hours (in `aiRecommender.ts`)
- History retention: 90 days (performance), 365 days (activity)
- Cohort size for comparisons: Default 100 users
- Progression thresholds: Adjustable in `adaptiveAlgorithm.ts`

## Error Handling

All services handle errors gracefully:
- **Missing user**: Returns default/empty profile
- **Expired cache**: Regenerates fresh data
- **LocalStorage full**: Oldest records are pruned
- **Malformed data**: Falls back to defaults

## Future Enhancements

1. **Backend Integration**: Replace LocalStorage with Supabase
2. **Advanced ML**: Implement clustering and deep learning models
3. **Real-time Adaptation**: WebSocket-based live adjustments
4. **A/B Testing**: Measure recommendation effectiveness
5. **Collaborative Filtering**: Learn from similar users
6. **Predictive Analytics**: Forecast user success rates
7. **Natural Language Processing**: Better error analysis
8. **Spaced Repetition**: Integrate SRS algorithms

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         Roadmap App Frontend (React)            │
├─────────────────────────────────────────────────┤
│    AI Personalization Service Layer             │
├──────────┬──────────┬──────────┬───────────────┤
│ AI       │ Adaptive │ Mentor   │ Performance   │
│ Recomm.  │ Learning │ AI       │ Analytics     │
├──────────┼──────────┼──────────┼───────────────┤
│        LocalStorage / Supabase                  │
├─────────────────────────────────────────────────┤
│     User Data • Behavior • Progress • History   │
└─────────────────────────────────────────────────┘
```

## Support & Debugging

### Common Issues

**Q: Recommendations not updating?**
A: Check if cache is expired (24hrs). Clear with `localStorage.clear()` or wait.

**Q: LocalStorage quota exceeded?**
A: Reduce history retention or clear old user data.

**Q: Mentor not responding?**
A: Verify `getMentorConversation()` is called first to initialize.

### Debug Tips

```typescript
// Check user behavior
console.log(analyzeUserBehavior(userId));

// Verify learning velocity
console.log(trackLearningVelocity(userId));

// Inspect cached recommendations
console.log(getCachedRecommendations(userId));

// Check performance insights
console.log(analyzePerformanceTrends(userId, roadmap, progress));
```

## License

Part of College CS Roadmap App v3.0 - All Rights Reserved

## Contributors

- AI Recommendation Engine: Claude Haiku 4.5
- Adaptive Learning Algorithm: Claude Haiku 4.5
- Mentor AI Assistant: Claude Haiku 4.5
- Performance Analytics: Claude Haiku 4.5
