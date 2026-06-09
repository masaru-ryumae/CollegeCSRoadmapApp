# College CS Internship Roadmap App — Architecture Document

> **Purpose**: Companion app to the *College CS Internship Playbook*. Helps students generate a personalized, semester-by-semester roadmap to a software engineering internship.
> **Scope**: Design-only — React 18 + Vite + TailwindCSS, no code implementation.
> **Status**: Checkpoint 0 — Blueprint for review.

---

## 1. App Structure

### 1.1 Tech Stack
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React 18 + TypeScript | Type safety for decision tree & roadmap logic |
| Build | Vite | Fast dev server, optimized production builds |
| Styling | TailwindCSS + dark mode | Utility-first, responsive, built-in dark mode |
| State | React Context + useReducer | Lightweight, no external deps for MVP |
| Persistence | localStorage | Zero backend, portable data |
| Export | jsPDF, ics.js, native JSON | Client-side generation |

### 1.2 Entry Point & State Flow
```
┌─────────────┐     ┌──────────────────┐    ┌──────────────┐
│ DecisionTree │───▶│ RoadmapGenerator │───▶│ TimelineView │
│ (5 questions)│    │ (pure functions) │    │ (Gantt chart)│
└─────────────┘     └──────────────────┘     └──────────────┘
                           │                        │
                           ▼                        ▼
                    ┌──────────────┐         ┌──────────────┐
                    │  localStorage │         │ ExportButton │
                    │  (persist)    │         │ (PDF/iCal)   │
                    └──────────────┘         └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Dashboard   │
                    │ (progress,   │
                    │  next step,  │
                    │  export)     │
                    └──────────────┘
```

### 1.3 Component Hierarchy
```
App
├── DecisionTree        // 5-question wizard (Page 1)
├── TimelineView        // Gantt-style weekly schedule (Page 2)
├── Dashboard           // Progress + next milestone + exports (Page 3)
└── ExportButton        // Shared: PDF / iCal / JSON
```

### 1.4 Routing (React Router v6)
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | DecisionTree | 5-question entry wizard |
| `/roadmap` | TimelineView | Gantt chart of weekly modules |
| `/dashboard` | Dashboard | Progress overview, next actions |

---

## 2. Data Model

### 2.1 DecisionAnswers (User Input)
```typescript
interface DecisionAnswers {
  techLevel: 'beginner' | 'intermediate' | 'advanced';
  // Self-assessed coding proficiency
  targetCompanyType: 'big-tech' | 'startup' | 'non-tech' | 'open';
  // Influences module emphasis (LeetCode vs projects vs system design)
  hoursPerWeek: 5 | 10 | 15 | 20;
  // Available study time outside classes
  hasExistingProject: boolean;
  // Skip "build portfolio project" module if true
  timeline: '3-month' | '6-month' | '9-month' | '12-month';
  // Target internship application window
}
```

### 2.2 Module Definition (Static Catalog)
```typescript
interface Module {
  id: string;                    // e.g., "01-fundamentals"
  title: string;                 // e.g., "Programming Fundamentals"
  description: string;
  hours: { beginner: number; intermediate: number; advanced: number };
  dependencies: string[];        // Module IDs that must complete first
  tags: string[];                // ['leetcode', 'project', 'system-design']
  pillar: 'core' | 'practice' | 'portfolio' | 'interview' | 'system-design';
}
```

### 2.3 PersonalizedRoadmap (Generated Output)
```typescript
interface PersonalizedRoadmap {
  modules: ScheduledModule[];    // Modules with assigned weeks
  weeklySchedule: WeeklyPlan[];  // Week-by-week breakdown
  deadline: string;              // ISO date (from timeline + start)
  totalHours: number;            // Sum of selected module hours
  generatedAt: string;           // ISO timestamp
}

interface ScheduledModule extends Module {
  startWeek: number;             // 1-indexed from roadmap start
  endWeek: number;
  status: 'pending' | 'in-progress' | 'done';
}

interface WeeklyPlan {
  week: number;
  moduleIds: string[];
  hoursAllocated: number;
  milestones: string[];          // e.g., ["Complete Loops", "Finish Project 1"]
}
```

---

## 3. Calculation Logic (Pseudocode)

### 3.1 Module Catalog (Embedded Constants)
```python
MODULES = [
  {id:"01", title:"Fundamentals", hours:{b:40,i:20,a:10}, deps:[], pillar:"core", tags:["basics"]},
  {id:"02", title:"Data Structures & Algorithms", hours:{b:80,i:50,a:30}, deps:["01"], pillar:"practice", tags:["leetcode"]},
  {id:"03", title:"System Design Basics", hours:{b:40,i:25,a:15}, deps:["01"], pillar:"system-design", tags:["design"]},
  {id:"04", title:"Databases & SQL", hours:{b:20,i:15,a:10}, deps:["01"], pillar:"core", tags:["sql"]},
  {id:"05", title:"Web Development Project", hours:{b:60,i:40,a:25}, deps:["01"], pillar:"portfolio", tags:["project"]},
  {id:"06", title:"LeetCode Patterns", hours:{b:60,i:40,a:20}, deps:["02"], pillar:"practice", tags:["leetcode"]},
  {id:"07", title:"Mock Interviews", hours:{b:20,i:15,a:10}, deps:["02","06"], pillar:"interview", tags:["interview"]},
  {id:"08", title:"Behavioral Prep", hours:{b:10,i:8,a:5}, deps:[], pillar:"interview", tags:["behavioral"]},
]
```

### 3.2 Roadmap Generation Algorithm
```python
def roadmapFromAnswers(answers: DecisionAnswers) -> PersonalizedRoadmap:
    # 1. Select relevant modules based on answers
    selected = selectModules(MODULES, answers)
    
    # 2. Determine hours per module for user's techLevel
    for m in selected:
        m.assignedHours = m.hours[answers.techLevel]
    
    # 3. Topological sort by dependencies
    ordered = topologicalSort(selected)
    
    # 4. Calculate weeks needed
    totalHours = sum(m.assignedHours for m in ordered)
    weeksAvailable = timelineToWeeks(answers.timeline)
    hoursPerWeek = answers.hoursPerWeek
    
    # Adjust scope if over capacity
    if totalHours > weeksAvailable * hoursPerWeek:
        ordered = trimToFit(ordered, weeksAvailable * hoursPerWeek)
    
    # 5. Distribute modules across weeks
    weeklySchedule = []
    currentWeek = 1
    for module in ordered:
        modWeeks = ceil(module.assignedHours / hoursPerWeek)
        # Respect dependencies: can't start until all deps' endWeek
        earliestStart = max(
            currentWeek,
            max((m.endWeek for m in ordered if m.id in module.dependencies), default=currentWeek)
        )
        scheduled = ScheduledModule(
            ...module,
            startWeek=earliestStart,
            endWeek=earliestStart + modWeeks - 1,
            status='pending'
        )
        # Fill weeklySchedule
        for w in range(earliestStart, earliestStart + modWeeks):
            weeklySchedule[w].moduleIds.append(module.id)
            weeklySchedule[w].hoursAllocated += min(hoursPerWeek, module.assignedHours)
        currentWeek = earliestStart + modWeeks
    
    # 6. Build final roadmap
    deadline = addWeeks(startDate=today(), weeks=weeksAvailable)
    return PersonalizedRoadmap(
        modules=ordered,
        weeklySchedule=weeklySchedule,
        deadline=deadline,
        totalHours=totalHours,
        generatedAt=now()
    )
```

### 3.3 Helper: Module Selection Rules
| Answer | Effect on Module Selection |
|--------|---------------------------|
| `targetCompanyType: big-tech` | Include all practice (02,06) + interview (07) modules |
| `targetCompanyType: startup` | Reduce LeetCode (06), emphasize project (05), system design (03) |
| `targetCompanyType: non-tech` | Core (01,04) + project (05) + behavioral (08) only |
| `hasExistingProject: true` | Drop module 05 (Web Dev Project) |
| `techLevel: advanced` | Use advanced hours, skip fundamentals if years>2 |
| `timeline` | Caps total weeks; trim lowest-priority modules first |

---

## 4. UI Mockups

### 4.1 Page 1: DecisionTree (`/`)
```
┌─────────────────────────────────────────────────────────────┐
│  🎓  CS Internship Roadmap                          [Dark]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Step 1 of 5                                               │
│   ████████████░░░░░░░░░░░░░░░░░░  20%                       │
│                                                              │
│   What's your current coding proficiency?                   │
│                                                              │
│   ○  Beginner      Just started / intro CS done             │
│   ◉  Intermediate  Comfortable with 1 language, built apps  │
│   ○  Advanced     Strong DS&A, multiple projects            │
│                                                              │
│   [Back]                                    [Next →]        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Questions (in order):
1. techLevel           → Beginner / Intermediate / Advanced
2. targetCompanyType   → Big Tech / Startup / Non-Tech / Open
3. hoursPerWeek        → 5 / 10 / 15 / 20
4. hasExistingProject  → Yes / No (toggle)
5. timeline            → 3 / 6 / 9 / 12 months
```

### 4.2 Page 2: TimelineView (`/roadmap`) — Gantt Style
```
┌────────────────────────────────────────────────────────────────────┐
│  ← Dashboard    Your Roadmap (12 weeks, 15h/wk)         [Export ▼] │
├────────────────────────────────────────────────────────────────────┤
│  Week:    1    2    3    4    5    6    7    8    9   10   11   12 │
│  ─────────────────────────────────────────────────────────────────  │
│  Fundamentals        ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  DS&A                ░░░░████████████████████░░░░░░░░░░░░░░░░░░░  │
│  System Design       ░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░  │
│  Databases           ░░░░░░██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  Web Project         ░░░░░░░░░░░░░░░░░░░████████████████░░░░░░  │
│  LeetCode Patterns   ░░░░░░░░░░░░░░░░░░░░░██████████████░░░░░░  │
│  Mock Interviews     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░░░  │
│  Behavioral Prep     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░■■■■■■  │
│  ─────────────────────────────────────────────────────────────────  │
│  Today ▼│                                                     │    │
│  Legend: ███ In Progress  ░░░ Pending  ■■■ Completed  ⬤ Milestone │
│  [Zoom: Week ◉ Month ○ Quarter ○]    [Filter: All ◉ Critical ○]  │
└────────────────────────────────────────────────────────────────────┘
```

### 4.3 Page 3: Dashboard (`/dashboard`)
```
┌─────────────────────────────────────────────────────────────┐
│  🎓  CS Internship Roadmap                    [Export ▼]    │
├─────────────────────────────────────────────────────────────┤
│  Alex Chen • Junior • 12-week Big Tech Track               │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Progress    │ │  Weeks Left  │ │  Next Milestone│        │
│  │  ████████░░  │ │      8       │ │  DS&A Week 3   │        │
│  │   42% done   │ │  (Apr 15)    │ │  Graphs & BFS  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  This Week (Week 5)                                 │    │
│  │  ▸ DS&A: Trees & Graphs (15h)        [Mark Done]   │    │
│  │  ▸ System Design: Load Balancing (5h)  [Mark Done] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────┐ ┌─────────────────────────────────────┐   │
│  │ Quick Actions│ │ Recent Activity                     │   │
│  │ [Timeline]   │  ✓ Arrays & Strings completed 2d ago  │   │
│  │ [Export PDF] │  ✓ Fundamentals done 1w ago            │   │
│  │ [Export iCal]│  ● DS&A started 5d ago                 │   │
│  └──────────────┘ └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Export Options

| Format | Trigger | Content |
|--------|---------|---------|
| **PDF** | ExportButton → "Download PDF" | Cover (name, track, date), Timeline table (week × module), Milestone checklist, Resource appendix |
| **iCal** | ExportButton → "Download .ics" | Each milestone as `VTODO` with `DTSTART`/`DTEND`, categories, dependencies in description |
| **JSON** | ExportButton → "Download JSON" | Full `PersonalizedRoadmap` object for backup/import |

---

## 6. Acceptance Criteria (Checkpoint 0)

- [ ] `ARCHITECTURE.md` documents structure, data model, logic, UI
- [ ] Decision tree has exactly 5 questions with defined options
- [ ] Module catalog covers 8 modules with dependencies
- [ ] `roadmapFromAnswers` pseudocode handles dependencies, capacity, trimming
- [ ] Three page mockups reflect actual user flows
- [ ] Export formats specified with content mapping

---

*End of design document. Awaiting greenlight to proceed to implementation (Checkpoint 1).*