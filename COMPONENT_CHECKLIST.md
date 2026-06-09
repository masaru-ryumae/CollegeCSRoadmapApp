# Component Checklist — College CS Internship Roadmap App

---

## 1. DecisionTree
**Purpose**: Guided 5-question flow to determine student profile and recommend roadmap track.

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onComplete` | `(answers: DecisionAnswers) => void` | Yes | Callback with final answers |
| `initialAnswers` | `Partial<DecisionAnswers>` | No | Pre-filled answers for resume |
| `questions` | `Question[]` | No | Override default 5 questions |

### State
| State | Type | Description |
|-------|------|-------------|
| `currentStep` | `number` | 0–4 (5 questions) |
| `answers` | `DecisionAnswers` | Accumulated responses |
| `isComplete` | `boolean` | All questions answered |
| `direction` | `'forward' \| 'back'` | Animation direction |

### Questions (Fixed 5)
1. **Year in School** — `freshman` | `sophomore` | `junior` | `senior` | `grad`
2. **Primary Goal** — `big_tech` | `startup` | `research` | `undecided`
3. **Current Experience** — `none` | `coursework_only` | `1_internship` | `2+_internships`
4. **Technical Focus** — `frontend` | `backend` | `fullstack` | `data_ml` | `systems` | `mobile` | `unsure`
5. **Timeline Urgency** — `apply_now` | `this_semester` | `next_semester` | `exploring`

### Interactions
- **Next**: Validate current answer → advance step → animate slide-in
- **Back**: Decrement step → animate slide-out (preserve answer)
- **Skip (optional)**: Mark question as `skipped` → advance
- **Complete**: Fire `onComplete` with `answers` + derived `trackRecommendation`
- **Keyboard**: Enter = Next, Escape = Back, Arrow keys = option select

### Derived Output
```ts
type TrackRecommendation = 
  | 'accelerated_big_tech'
  | 'standard_big_tech'
  | 'startup_focused'
  | 'research_path'
  | 'foundational_build';
```

---

## 2. RoadmapGenerator
**Purpose**: Pure logic module — transforms `DecisionAnswers` into a structured timeline of milestones.

### Input
```ts
interface GeneratorInput {
  answers: DecisionAnswers;
  track: TrackRecommendation;
  startDate: Date;          // defaults to today
  academicCalendar: AcademicTerm[]; // fall/spring/summer dates
}
```

### Output
```ts
interface Roadmap {
  track: TrackRecommendation;
  milestones: Milestone[];
  totalWeeks: number;
  criticalPath: Milestone[];  // must-complete items
}

interface Milestone {
  id: string;
  title: string;
  category: 'prep' | 'application' | 'interview' | 'skill' | 'networking';
  startWeek: number;          // relative to startDate
  endWeek: number;
  durationWeeks: number;
  dependencies: string[];     // milestone IDs that must complete first
  isCritical: boolean;
  resources: ResourceRef[];   // links to playbook sections
  status: 'pending' | 'in_progress' | 'done' | 'blocked';
}
```

### Logic Rules
| Rule | Description |
|------|-------------|
| **Year-based compression** | Freshman: 52 weeks | Sophomore: 40 | Junior: 28 | Senior: 16 |
| **Goal-based weighting** | Big Tech: +3 interview prep weeks | Startup: +2 networking | Research: +4 skill/project |
| **Experience adjustment** | None: +4 foundational weeks | 2+ internships: -2 weeks |
| **Dependency chain** | Resume → Portfolio → Applications → OA → Behavioral → System Design → Offer |
| **Parallel tracks** | Skill building runs parallel to applications after week 4 |
| **Academic alignment** | No heavy milestones during finals weeks (marked in `academicCalendar`) |

### Exported Functions
| Function | Signature |
|----------|-----------|
| `generateRoadmap` | `(input: GeneratorInput) => Roadmap` |
| `recalculateRoadmap` | `(roadmap: Roadmap, updatedAnswers: Partial<DecisionAnswers>) => Roadmap` |
| `getCriticalPath` | `(roadmap: Roadmap) => Milestone[]` |
| `estimateCompletionDate` | `(roadmap: Roadmap) => Date` |

### No UI State — Pure Functions Only

---

## 3. TimelineView (Gantt-Style)
**Purpose**: Visual Gantt chart rendering of the generated roadmap.

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `roadmap` | `Roadmap` | Yes | Output from RoadmapGenerator |
| `currentWeek` | `number` | Yes | Highlighted "today" marker |
| `onMilestoneClick` | `(milestone: Milestone) => void` | No | Open detail drawer |
| `onStatusChange` | `(id: string, status: MilestoneStatus) => void` | No | Toggle completion |
| `viewMode` | `'weekly' \| 'monthly' \| 'quarterly'` | No | Zoom level (default: weekly) |
| `showCriticalOnly` | `boolean` | No | Filter to critical path |

### State
| State | Type | Description |
|-------|------|-------------|
| `scale` | `'week' \| 'month' \| 'quarter'` | Current zoom |
| `scrollPosition` | `number` | Horizontal scroll offset |
| `selectedMilestoneId` | `string \| null` | Highlighted row |
| `dragState` | `null \| { id, newStartWeek }` | Drag-to-reschedule |

### Layout
- **Header**: Time scale ruler (weeks/months) + "Today" vertical line
- **Rows**: One per milestone, grouped by category (color-coded)
- **Bars**: Horizontal bars from `startWeek` to `endWeek`
  - Critical = solid fill + bold border
  - Non-critical = lighter fill
  - Completed = checkered overlay
  - Blocked = red strikethrough pattern
- **Dependencies**: Curved arrows between bars (SVG overlay)
- **Sidebar**: Milestone title, category badge, status toggle

### Interactions
| Interaction | Behavior |
|-------------|----------|
| **Click milestone** | Fire `onMilestoneClick` → open detail drawer |
| **Click status badge** | Cycle `pending → in_progress → done` → fire `onStatusChange` |
| **Drag bar horizontally** | Preview new dates → confirm on drop → fire `onReschedule` |
| **Scroll/zoom** | Wheel = horizontal scroll, Ctrl+Wheel = zoom |
| **Filter toggle** | `showCriticalOnly` checkbox in toolbar |
| **Keyboard** | ←/→ = navigate milestones, Space = toggle status, Enter = open detail |

### Responsive
- `< 768px`: Collapse to vertical list with week-range labels
- `≥ 768px`: Full Gantt with horizontal scroll

---

## 4. ExportButton
**Purpose**: Dropdown button to export roadmap as PDF or iCal.

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `roadmap` | `Roadmap` | Yes | Data to export |
| `studentName` | `string` | Yes | For PDF header / iCal organizer |
| `onExportStart` | `() => void` | No | Loading indicator trigger |
| `onExportComplete` | `(format: 'pdf' \| 'ical') => void` | No | Success toast trigger |
| `onExportError` | `(error: Error) => void` | No | Error toast trigger |

### State
| State | Type | Description |
|-------|------|-------------|
| `isOpen` | `boolean` | Dropdown visibility |
| `exporting` | `'idle' \| 'pdf' \| 'ical'` | In-progress format |
| `error` | `string \| null` | Last error message |

### PDF Export Spec
| Section | Content |
|---------|---------|
| **Cover** | Student name, track, generation date, timeline span |
| **Overview** | Total weeks, critical path count, completion % |
| **Gantt Table** | Week-by-week table: Milestone | Category | Start | End | Status | Dependencies |
| **Critical Path Detail** | Expanded view of must-complete items with resources |
| **Weekly Checklist** | Per-week action items (derived from milestones) |
| **Resources Appendix** | Playbook section links referenced in roadmap |

**Styling**: A4, landscape, monospace table font, color-coded status columns

### iCal Export Spec
| Property | Mapping |
|----------|---------|
| `DTSTART` / `DTEND` | Milestone `startWeek`/`endWeek` → actual dates |
| `SUMMARY` | `[Category] Milestone Title` |
| `DESCRIPTION` | Dependencies + resource links |
| `CATEGORIES` | Milestone category |
| `STATUS` | `TENTATIVE` / `IN-PROCESS` / `COMPLETED` |
| `UID` | `milestone-{id}@{domain}` |
| `ORGANIZER` | `mailto:{studentEmail}` (if available) |

**Output**: Single `.ics` file with all milestones as `VTODO` components

### Interactions
- **Click button**: Toggle dropdown
- **Click "Export PDF"**: Generate blob → trigger download → `onExportComplete('pdf')`
- **Click "Export iCal"**: Generate blob → trigger download → `onExportComplete('ical')`
- **Click outside**: Close dropdown
- **Keyboard**: Enter/Space = open, Escape = close, ↑/↓ = navigate options

---

## 5. DashboardView (Tracking Mockup)
**Purpose**: Main landing page — progress overview, quick actions, upcoming milestones.

### Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `roadmap` | `Roadmap \| null` | Yes | Current roadmap (null = not generated) |
| `userProfile` | `UserProfile` | Yes | Name, year, track, email |
| `onGenerateRoadmap` | `() => void` | Yes | Navigate to DecisionTree |
| `onViewTimeline` | `() => void` | Yes | Navigate to TimelineView |
| `onOpenExport` | `() => void` | Yes | Open ExportButton dropdown |

### State (Local UI Only)
| State | Type | Description |
|-------|------|-------------|
| `activeTab` | `'overview' \| 'upcoming' \| 'completed'` | Tab selection |
| `dismissedTips` | `string[]` | Onboarding tip IDs dismissed |

### Layout Sections
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER:  [Logo]  College CS Roadmap        [ExportButton]  │
├─────────────────────────────────────────────────────────────┤
│  PROFILE BAR:  Name • Year • Track • [Edit Profile]         │
├─────────────────────────────────────────────────────────────┤
│  TABS:  [Overview]  [Upcoming]  [Completed]                 │
├─────────────────────────────────────────────────────────────┤
│  OVERVIEW TAB                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Progress Ring│ │ Weeks Left   │ │ Critical Left│         │
│  │   42% done   │ │    18 wks    │ │     5/12     │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  NEXT 3 MILESTONES (horizontal cards)                  │  │
│  │  [Resume Polish] [Portfolio Deploy] [Apply Batch 1]    │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌──────────────┐ ┌────────────────────────────────────────┐ │
│  │ QUICK ACTIONS│ │  RECENT ACTIVITY FEED                  │ │
│  │ [Generate]   │ │  ✓ Resume updated 2h ago               │ │
│  │ [Timeline]   │ │  ✓ Portfolio deployed 1d ago           │ │
│  │ [Export]     │ │  ● Interview prep started 3d ago       │ │
│  └──────────────┘ └────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  UPCOMING TAB                                               │
│  • Grouped by week: "Week 3 (Jan 20–26)"                   │
│  • Each: milestone title, category badge, status toggle    │
│  • "View Full Timeline" CTA at bottom                      │
├─────────────────────────────────────────────────────────────┤
│  COMPLETED TAB                                              │
│  • Checklist of done milestones with completion dates      │
│  • "Celebrate Progress" confetti trigger at 50%/100%       │
└─────────────────────────────────────────────────────────────┘
```

### Interactions
| Interaction | Behavior |
|-------------|----------|
| **Click "Generate Roadmap"** | `onGenerateRoadmap()` → navigate to DecisionTree |
| **Click "View Timeline"** | `onViewTimeline()` → navigate to TimelineView |
| **Click ExportButton** | `onOpenExport()` → open dropdown |
| **Click milestone in Upcoming** | Navigate to TimelineView with `selectedMilestoneId` |
| **Toggle status in Upcoming** | Optimistic update → sync to roadmap |
| **Tab switch** | Update `activeTab`, persist to localStorage |
| **Dismiss tip** | Add to `dismissedTips`, hide tip banner |
| **Pull-to-refresh (mobile)** | Re-fetch roadmap status |

### Empty State (No Roadmap)
- Large illustration + "Start Your Roadmap" CTA button
- Brief value prop: "5 questions → personalized timeline → track progress"

---

## Cross-Component Data Flow

```
DecisionTree
    │ onComplete(answers)
    ▼
RoadmapGenerator.generateRoadmap(answers) → Roadmap
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
TimelineView       ExportButton      DashboardView
(roadmap)          (roadmap)         (roadmap)
    │                  │                  │
    │ onStatusChange   │ onExportComplete │ onGenerateRoadmap
    ▼                  ▼                  ▼
RoadmapGenerator.recalculateRoadmap() ←──┘
    │
    ▼
Updated Roadmap → all consumers re-render
```

---

## Shared Types (Reference)

```ts
// Core enums
type Year = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'grad';
type Goal = 'big_tech' | 'startup' | 'research' | 'undecided';
type Experience = 'none' | 'coursework_only' | '1_internship' | '2+_internships';
type Focus = 'frontend' | 'backend' | 'fullstack' | 'data_ml' | 'systems' | 'mobile' | 'unsure';
type Urgency = 'apply_now' | 'this_semester' | 'next_semester' | 'exploring';
type Track = 'accelerated_big_tech' | 'standard_big_tech' | 'startup_focused' | 'research_path' | 'foundational_build';
type Category = 'prep' | 'application' | 'interview' | 'skill' | 'networking';
type Status = 'pending' | 'in_progress' | 'done' | 'blocked';

// Composite
interface DecisionAnswers {
  year: Year;
  goal: Goal;
  experience: Experience;
  focus: Focus;
  urgency: Urgency;
}

interface UserProfile {
  name: string;
  email: string;
  year: Year;
  track: Track | null;
  roadmapGeneratedAt: Date | null;
}
```

---

## Acceptance Checklist

| Component | Spec Complete | Props Defined | State Defined | Interactions Defined | Data Flow Mapped |
|-----------|---------------|---------------|---------------|----------------------|------------------|
| DecisionTree | ✅ | ✅ | ✅ | ✅ | ✅ |
| RoadmapGenerator | ✅ | ✅ (I/O) | ✅ (none) | ✅ (functions) | ✅ |
| TimelineView | ✅ | ✅ | ✅ | ✅ | ✅ |
| ExportButton | ✅ | ✅ | ✅ | ✅ | ✅ |
| DashboardView | ✅ | ✅ | ✅ | ✅ | ✅ |

---

*Generated for College CS Internship Roadmap App — Companion to College CS Internship Playbook*