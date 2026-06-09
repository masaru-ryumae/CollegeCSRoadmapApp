import type { Module, Path, DecisionAnswers, ScheduledModule, WeeklyPlan, PersonalizedRoadmap } from '../types';
import moduleData from '../data/MODULE_DATA.json';

const MODULES = moduleData.modules as Module[];
const PATHS = moduleData.paths as { 'leetcode-heavy': Path; 'system-design': Path; 'balanced': Path };

// Extended module type with assignedHours
interface ModuleWithHours extends Module {
  assignedHours: number;
}

// Helper: Convert timeline string to weeks
const timelineToWeeks = (timeline: DecisionAnswers['timeline']): number => {
  switch (timeline) {
    case 'summer-2026': return 8;
    case 'fall-2026': return 16;
    case 'spring-2027': return 24;
    default: return 12;
  }
};

// Helper: Convert hours per week string to number
const hoursPerWeekToNumber = (hours: DecisionAnswers['hoursPerWeek']): number => {
  switch (hours) {
    case '5-10': return 7.5;
    case '10-15': return 12.5;
    case '15-20': return 17.5;
    default: return 10;
  }
};

// Select modules based on answers
const selectModules = (answers: DecisionAnswers): Module[] => {
  let pathKey: keyof typeof PATHS;
  switch (answers.targetCompanyType) {
    case 'faang': pathKey = 'leetcode-heavy'; break;
    case 'startup': pathKey = 'system-design'; break;
    default: pathKey = 'balanced';
  }
  
  const path = PATHS[pathKey];
  const moduleOrder = path.moduleOrder;
  
  const startIndex = answers.hasExistingProject === 'yes' ? 3 : 0;
  const selectedModuleIds = moduleOrder.slice(startIndex);
  
  return selectedModuleIds
    .map(id => MODULES.find(m => m.id === id))
    .filter((m): m is Module => m !== undefined);
};

// Topological sort respecting dependencies
const topologicalSort = (modules: ModuleWithHours[]): ModuleWithHours[] => {
  const moduleMap = new Map(modules.map(m => [m.id, m]));
  const visited = new Set<string>();
  const result: ModuleWithHours[] = [];
  
  const visit = (moduleId: string) => {
    if (visited.has(moduleId)) return;
    visited.add(moduleId);
    
    const module = moduleMap.get(moduleId);
    if (!module) return;
    
    for (const depId of module.dependencies) {
      if (moduleMap.has(depId)) {
        visit(depId);
      }
    }
    
    result.push(module);
  };
  
  for (const module of modules) {
    visit(module.id);
  }
  
  return result;
};

// Calculate deadline date
const calculateDeadline = (weeks: number): string => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + weeks * 7);
  return deadline.toISOString().split('T')[0];
};

// Main roadmap generation function
export const generateRoadmap = (answers: DecisionAnswers): PersonalizedRoadmap => {
  const selected = selectModules(answers);
  
  const modulesWithHours: ModuleWithHours[] = selected.map(m => ({
    ...m,
    assignedHours: m.hours[answers.techLevel]
  }));
  
  const ordered = topologicalSort(modulesWithHours);
  
  const weeksAvailable = timelineToWeeks(answers.timeline);
  const hoursPerWeek = hoursPerWeekToNumber(answers.hoursPerWeek);
  const totalCapacity = weeksAvailable * hoursPerWeek;
  const totalHours = ordered.reduce((sum, m) => sum + m.assignedHours, 0);
  
  const finalModules = (() => {
    const modules = [...ordered];
    if (totalHours > totalCapacity) {
      while (modules.reduce((sum, m) => sum + m.assignedHours, 0) > totalCapacity && modules.length > 1) {
        modules.pop();
      }
    }
    return modules;
  })();
  
  const weeklySchedule: WeeklyPlan[] = Array.from({ length: weeksAvailable }, (_, i) => ({
    week: i + 1,
    moduleIds: [],
    hoursAllocated: 0,
    milestones: []
  }));
  
  const scheduledModules: ScheduledModule[] = [];
  let currentWeek = 1;
  
  for (const module of finalModules) {
    const modWeeks = Math.ceil(module.assignedHours / hoursPerWeek);
    
    const depEndWeeks = module.dependencies
      .map(depId => {
        const dep = scheduledModules.find(s => s.id === depId);
        return dep?.endWeek || 0;
      });
    const earliestStartFromDeps = depEndWeeks.length > 0 ? Math.max(...depEndWeeks) + 1 : 1;
    const earliestStart = Math.max(currentWeek, earliestStartFromDeps);
    
    const startWeek = Math.min(earliestStart, weeksAvailable);
    const endWeek = Math.min(startWeek + modWeeks - 1, weeksAvailable);
    
    const scheduled: ScheduledModule = {
      ...module,
      startWeek,
      endWeek,
      status: 'pending',
      assignedHours: module.assignedHours
    };
    scheduledModules.push(scheduled);
    
    for (let w = startWeek; w <= endWeek; w++) {
      const weekIndex = w - 1;
      if (weeklySchedule[weekIndex]) {
        weeklySchedule[weekIndex].moduleIds.push(module.id);
        weeklySchedule[weekIndex].hoursAllocated += Math.min(hoursPerWeek, module.assignedHours);
        
        if (w === startWeek) {
          weeklySchedule[weekIndex].milestones.push(`Start: ${module.name}`);
        }
        if (w === endWeek) {
          weeklySchedule[weekIndex].milestones.push(`Complete: ${module.name}`);
        }
      }
    }
    
    currentWeek = endWeek + 1;
  }
  
  const pathKey = answers.targetCompanyType === 'faang' ? 'leetcode-heavy' : 
                  answers.targetCompanyType === 'startup' ? 'system-design' : 'balanced';
  
  return {
    modules: scheduledModules,
    weeklySchedule,
    deadline: calculateDeadline(weeksAvailable),
    totalHours: scheduledModules.reduce((sum, m) => sum + m.assignedHours, 0),
    generatedAt: new Date().toISOString(),
    pathName: PATHS[pathKey as keyof typeof PATHS].name,
    answers
  };
};

export const recalculateRoadmap = (roadmap: PersonalizedRoadmap, updatedAnswers: Partial<DecisionAnswers>): PersonalizedRoadmap => {
  const mergedAnswers = { ...roadmap.answers, ...updatedAnswers } as DecisionAnswers;
  return generateRoadmap(mergedAnswers);
};

export const getCriticalPath = (roadmap: PersonalizedRoadmap): ScheduledModule[] => {
  return roadmap.modules.filter(m => 
    m.dependencies.length > 0 || 
    roadmap.modules.some(other => other.dependencies.includes(m.id))
  );
};

export const estimateCompletionDate = (roadmap: PersonalizedRoadmap): string => {
  return roadmap.deadline;
};