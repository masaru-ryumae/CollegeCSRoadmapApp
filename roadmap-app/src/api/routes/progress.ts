import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Mock database
const progressRecords: any[] = [];
let progressIdCounter = 1;

/**
 * @swagger
 * /api/v1/progress:
 *   get:
 *     summary: Get user's progress records
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roadmapId
 *         in: query
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         default: 50
 *     responses:
 *       200:
 *         description: Progress records
 */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const roadmapId = req.query.roadmapId as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  let filtered = progressRecords.filter(p => p.userId === req.user?.id);

  if (roadmapId) {
    filtered = filtered.filter(p => p.roadmapId === roadmapId);
  }

  const sorted = filtered.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  res.json({
    data: sorted.slice(0, limit),
    total: filtered.length
  });
});

/**
 * @swagger
 * /api/v1/progress:
 *   post:
 *     summary: Log learning progress
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roadmapId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *               hoursLogged:
 *                 type: number
 *               keyPointsCompleted:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, done]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Progress logged
 *       400:
 *         description: Validation error
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { roadmapId, moduleId, hoursLogged, keyPointsCompleted, status, notes } = req.body;

  if (!roadmapId || !moduleId) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'roadmapId and moduleId are required'
    });
  }

  const newProgress = {
    id: `progress-${progressIdCounter++}`,
    userId: req.user?.id,
    roadmapId,
    moduleId,
    hoursLogged: hoursLogged || 0,
    keyPointsCompleted: keyPointsCompleted || [],
    status: status || 'in-progress',
    notes: notes || '',
    timestamp: new Date().toISOString()
  };

  progressRecords.push(newProgress);

  res.status(201).json({ data: newProgress });
});

/**
 * @swagger
 * /api/v1/progress/{id}:
 *   get:
 *     summary: Get specific progress record
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress record
 *       404:
 *         description: Not found
 */
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const progress = progressRecords.find(p => p.id === req.params.id);

  if (!progress) {
    return res.status(404).json({ error: 'Progress record not found' });
  }

  if (progress.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ data: progress });
});

/**
 * @swagger
 * /api/v1/progress/{id}:
 *   put:
 *     summary: Update progress record
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Progress updated
 *       404:
 *         description: Not found
 */
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const progress = progressRecords.find(p => p.id === req.params.id);

  if (!progress) {
    return res.status(404).json({ error: 'Progress record not found' });
  }

  if (progress.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updated = { ...progress, ...req.body, id: progress.id, userId: progress.userId };
  const index = progressRecords.indexOf(progress);
  progressRecords[index] = updated;

  res.json({ data: updated });
});

/**
 * @swagger
 * /api/v1/progress/stats/summary:
 *   get:
 *     summary: Get progress summary and statistics
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: roadmapId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress statistics
 */
router.get('/stats/summary', authMiddleware, (req: Request, res: Response) => {
  const roadmapId = req.query.roadmapId as string;

  let filtered = progressRecords.filter(p => p.userId === req.user?.id);

  if (roadmapId) {
    filtered = filtered.filter(p => p.roadmapId === roadmapId);
  }

  const stats = {
    totalHoursLogged: filtered.reduce((sum, p) => sum + (p.hoursLogged || 0), 0),
    totalModulesStarted: new Set(filtered.map(p => p.moduleId)).size,
    totalModulesCompleted: filtered.filter(p => p.status === 'done').length,
    averageHoursPerSession: filtered.length > 0
      ? filtered.reduce((sum, p) => sum + (p.hoursLogged || 0), 0) / filtered.length
      : 0,
    recentSessions: filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(p => ({
        moduleId: p.moduleId,
        hours: p.hoursLogged,
        status: p.status,
        timestamp: p.timestamp
      })),
    moduleBreakdown: Array.from(
      filtered.reduce((map, p) => {
        const key = p.moduleId;
        if (!map.has(key)) {
          map.set(key, { moduleId: key, hoursLogged: 0, status: p.status });
        }
        const entry = map.get(key)!;
        entry.hoursLogged += p.hoursLogged || 0;
        return map;
      }, new Map()).values()
    ),
    overallProgress: filtered.length > 0
      ? (filtered.filter(p => p.status === 'done').length / new Set(filtered.map(p => p.moduleId)).size) * 100
      : 0
  };

  res.json({ data: stats });
});

/**
 * @swagger
 * /api/v1/progress/achievements:
 *   get:
 *     summary: Get user achievements based on progress
 *     tags: [Progress]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements
 */
router.get('/achievements/list', authMiddleware, (req: Request, res: Response) => {
  const userProgress = progressRecords.filter(p => p.userId === req.user?.id);

  const totalHours = userProgress.reduce((sum, p) => sum + (p.hoursLogged || 0), 0);
  const completedModules = new Set(
    userProgress.filter(p => p.status === 'done').map(p => p.moduleId)
  ).size;

  const achievements = [];

  if (totalHours >= 10) {
    achievements.push({
      id: 'first-10-hours',
      name: '10 Hour Club',
      description: 'Logged 10+ hours of learning',
      icon: '⭐',
      unlockedAt: userProgress.find(p => p.hoursLogged >= 10)?.timestamp
    });
  }

  if (totalHours >= 50) {
    achievements.push({
      id: 'fifty-hours',
      name: 'Marathon Runner',
      description: 'Logged 50+ hours of learning',
      icon: '🏃',
      unlockedAt: userProgress[userProgress.length - 1]?.timestamp
    });
  }

  if (completedModules >= 1) {
    achievements.push({
      id: 'first-module',
      name: 'First Module Complete',
      description: 'Completed your first module',
      icon: '🎯',
      unlockedAt: userProgress.find(p => p.status === 'done')?.timestamp
    });
  }

  if (completedModules >= 5) {
    achievements.push({
      id: 'module-master',
      name: 'Module Master',
      description: 'Completed 5+ modules',
      icon: '👑',
      unlockedAt: userProgress[userProgress.length - 1]?.timestamp
    });
  }

  res.json({
    data: {
      achievements,
      totalAchievements: achievements.length,
      stats: {
        totalHours,
        completedModules
      }
    }
  });
});

export default router;
