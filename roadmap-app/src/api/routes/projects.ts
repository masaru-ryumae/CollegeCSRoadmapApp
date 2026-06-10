import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Mock database - in production, use real database
const projects: any[] = [];
let projectIdCounter = 1;

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         default: 20
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *         default: 0
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', optionalAuthMiddleware, (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const filteredProjects = req.user
    ? projects.filter(p => p.userId === req.user?.id || p.public === true)
    : projects.filter(p => p.public === true);

  const paginated = filteredProjects.slice(offset, offset + limit);

  res.json({
    data: paginated,
    pagination: {
      limit,
      offset,
      total: filteredProjects.length,
      hasMore: offset + limit < filteredProjects.length
    }
  });
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project details
 *     tags: [Projects]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/:id', optionalAuthMiddleware, (req: Request, res: Response) => {
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Check access permissions
  if (!project.public && req.user?.id !== project.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ data: project });
});

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               pathName:
 *                 type: string
 *               public:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Project created
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { name, description, pathName, public: isPublic } = req.body;

  if (!name || !description) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'name and description are required'
    });
  }

  const newProject = {
    id: `project-${projectIdCounter++}`,
    userId: req.user?.id,
    name,
    description,
    pathName: pathName || 'balanced',
    public: isPublic || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      completedModules: 0,
      totalModules: 0,
      progress: 0,
      hoursLogged: 0
    }
  };

  projects.push(newProject);
  res.status(201).json({ data: newProject });
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update project
 *     tags: [Projects]
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
 *         description: Project updated
 *       404:
 *         description: Project not found
 */
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updated = { ...project, ...req.body, id: project.id, userId: project.userId };
  const index = projects.indexOf(project);
  projects[index] = updated;

  res.json({ data: updated });
});

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  const index = projects.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (projects[index].userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  projects.splice(index, 1);
  res.status(204).send();
});

/**
 * @swagger
 * /api/v1/projects/{id}/share:
 *   post:
 *     summary: Share project with others
 *     tags: [Projects]
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
 *               emails:
 *                 type: array
 *                 items:
 *                   type: string
 *               permission:
 *                 type: string
 *                 enum: [view, comment, edit]
 *     responses:
 *       200:
 *         description: Project shared
 */
router.post('/:id/share', authMiddleware, (req: Request, res: Response) => {
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { emails, permission } = req.body;

  // In production, send invitations to emails
  const sharedWith = emails.map((email: string) => ({
    email,
    permission,
    sharedAt: new Date().toISOString()
  }));

  res.json({
    data: {
      projectId: project.id,
      sharedWith,
      shareUrl: `${process.env.APP_URL || 'http://localhost:5173'}/projects/${project.id}/share`
    }
  });
});

export default router;
