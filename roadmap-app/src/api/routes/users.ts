import { Router, Request, Response } from 'express';
import { authMiddleware, generateJWT, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Mock database
const users: any[] = [];
let userIdCounter = 1;

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 */
router.get('/:id', optionalAuthMiddleware, (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Only return full profile if it's the user or they're public
  const profile = user.id === req.user?.id || user.public
    ? user
    : {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        stats: user.stats
      };

  res.json({ data: profile });
});

/**
 * @swagger
 * /api/v1/users/{id}/progress:
 *   get:
 *     summary: Get user's learning progress
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User progress data
 */
router.get('/:id/progress', optionalAuthMiddleware, (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    data: {
      userId: user.id,
      totalRoadmaps: user.roadmaps?.length || 0,
      totalHoursLogged: user.stats?.totalHours || 0,
      currentStreak: user.stats?.currentStreak || 0,
      longestStreak: user.stats?.longestStreak || 0,
      achievements: user.achievements || [],
      recentActivity: user.recentActivity || [],
      badges: user.badges || []
    }
  });
});

/**
 * @swagger
 * /api/v1/users/{id}/progress:
 *   post:
 *     summary: Update user progress
 *     tags: [Users]
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
 *             properties:
 *               hoursLogged:
 *                 type: number
 *               moduleCompleted:
 *                 type: string
 *               roadmapId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Progress updated
 */
router.post('/:id/progress', authMiddleware, (req: Request, res: Response) => {
  if (req.user?.id !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const user = users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { hoursLogged, moduleCompleted, roadmapId } = req.body;

  // Update user stats
  user.stats = user.stats || {};
  user.stats.totalHours = (user.stats.totalHours || 0) + (hoursLogged || 0);
  user.stats.lastActive = new Date().toISOString();

  // Track recent activity
  user.recentActivity = user.recentActivity || [];
  user.recentActivity.unshift({
    type: moduleCompleted ? 'module_completed' : 'hours_logged',
    details: {
      moduleId: moduleCompleted,
      hoursLogged,
      roadmapId,
      timestamp: new Date().toISOString()
    }
  });

  user.recentActivity = user.recentActivity.slice(0, 50); // Keep last 50

  res.json({
    data: {
      userId: user.id,
      totalHours: user.stats.totalHours,
      lastActive: user.stats.lastActive,
      recentActivity: user.recentActivity.slice(0, 5)
    }
  });
});

/**
 * @swagger
 * /api/v1/users/{id}/badges:
 *   get:
 *     summary: Get user's achievements and badges
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User badges and achievements
 */
router.get('/:id/badges', optionalAuthMiddleware, (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    data: {
      badges: user.badges || [],
      achievements: user.achievements || [],
      totalPoints: user.stats?.totalPoints || 0
    }
  });
});

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered
 */
router.post('/register', (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'email, name, and password are required'
    });
  }

  // Check if user exists
  if (users.some(u => u.email === email)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const newUser = {
    id: `user-${userIdCounter++}`,
    email,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    bio: '',
    tier: 'free',
    public: false,
    createdAt: new Date().toISOString(),
    stats: {
      totalHours: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0
    },
    badges: [],
    achievements: [],
    roadmaps: [],
    recentActivity: []
  };

  users.push(newUser);

  const token = generateJWT(newUser.id, newUser.email, newUser.tier);

  res.status(201).json({
    data: {
      user: newUser,
      token
    }
  });
});

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in
 */
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'email and password are required'
    });
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // In production, verify password hash
  const token = generateJWT(user.id, user.email, user.tier);

  res.json({
    data: {
      user,
      token
    }
  });
});

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
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
 *         description: User updated
 */
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  if (req.user?.id !== req.params.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const user = users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, bio, avatar, public: isPublic } = req.body;

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar) user.avatar = avatar;
  if (isPublic !== undefined) user.public = isPublic;

  user.updatedAt = new Date().toISOString();

  res.json({ data: user });
});

export default router;
