import moduleData from '../data/MODULE_DATA.json';

const MODULES = moduleData.modules;
const PATHS = moduleData.paths;

// Helper: Convert timeline string to weeks
const timelineToWeeks = (timeline) => {
  switch (timeline) {
    case 'summer-2026': return 8;
    case 'fall-2026': return 16;
    case 'spring-2027': return 24;
    default: return 12;
  }
};

// Helper: Convert hours per week string to number
const hoursPerWeekToNumber = (hours) => {
  switch (hours) {
    case '5-10': return 7.5;
    case '10-15': return 12.5;
    case '15-20': return 17.5;
    default: return 10;
  }
};

// Select modules based on answers
const selectModules = (answers) => {
  let pathKey;
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
    .filter(m => m !== undefined);
};

// Topological sort respecting dependencies
const topologicalSort = (modules) => {
  const moduleMap = new Map(modules.map(m => [m.id, m]));
  const visited = new Set();
  const result = [];

  const visit = (moduleId) => {
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
const calculateDeadline = (weeks) => {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + weeks * 7);
  return deadline.toISOString().split('T')[0];
};

// Main roadmap generation function
export const generateRoadmap = (answers) => {
  const selected = selectModules(answers);

  const modulesWithHours = selected.map(m => ({
    ...m,
    assignedHours: m.hours[answers.techLevel]
  }));

  const ordered = topologicalSort(modulesWithHours);

  const weeksAvailable = timelineToWeeks(answers.timeline);
  const hoursPerWeek = hoursPerWeekToNumber(answers.hoursPerWeek);
  const totalCapacity = weeksAvailable * hoursPerWeek;
  const totalHours = ordered.reduce((sum, m) => sum + m.assignedHours, 0);

  let finalModules = [...ordered];
  if (totalHours > totalCapacity) {
    while (finalModules.reduce((sum, m) => sum + m.assignedHours, 0) > totalCapacity && finalModules.length > 1) {
      finalModules.pop();
    }
  }

  const weeklySchedule = Array.from({ length: weeksAvailable }, (_, i) => ({
    week: i + 1,
    moduleIds: [],
    hoursAllocated: 0,
    milestones: []
  }));

  const scheduledModules = [];
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

    const scheduled = {
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
    pathName: PATHS[pathKey].name,
    answers
  };
};
