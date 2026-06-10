import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware, requirePremium } from '../middleware/auth';

const router = Router();

// Mock database
const collections: any[] = [];
let collectionIdCounter = 1;

/**
 * @swagger
 * /api/v1/collections:
 *   get:
 *     summary: List collections
 *     tags: [Collections]
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
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of collections
 */
router.get('/', optionalAuthMiddleware, (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const category = req.query.category as string;

  let filtered = req.user
    ? collections.filter(c => c.userId === req.user?.id || c.public === true)
    : collections.filter(c => c.public === true);

  if (category) {
    filtered = filtered.filter(c => c.category === category);
  }

  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    data: paginated,
    pagination: {
      limit,
      offset,
      total: filtered.length,
      hasMore: offset + limit < filtered.length
    }
  });
});

/**
 * @swagger
 * /api/v1/collections/{id}:
 *   get:
 *     summary: Get collection details
 *     tags: [Collections]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection details
 *       404:
 *         description: Collection not found
 */
router.get('/:id', optionalAuthMiddleware, (req: Request, res: Response) => {
  const collection = collections.find(c => c.id === req.params.id);

  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  if (!collection.public && req.user?.id !== collection.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({
    data: {
      ...collection,
      modules: collection.modules || [],
      followers: collection.followers?.length || 0,
      views: collection.views || 0
    }
  });
});

/**
 * @swagger
 * /api/v1/collections:
 *   post:
 *     summary: Create a new collection
 *     tags: [Collections]
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
 *               category:
 *                 type: string
 *               modules:
 *                 type: array
 *                 items:
 *                   type: string
 *               public:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Collection created
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { name, description, category, modules, public: isPublic } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'name is required'
    });
  }

  const newCollection = {
    id: `collection-${collectionIdCounter++}`,
    userId: req.user?.id,
    name,
    description: description || '',
    category: category || 'general',
    modules: modules || [],
    public: isPublic || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    followers: [],
    views: 0,
    likes: 0
  };

  collections.push(newCollection);
  res.status(201).json({ data: newCollection });
});

/**
 * @swagger
 * /api/v1/collections/{id}:
 *   put:
 *     summary: Update collection
 *     tags: [Collections]
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
 *         description: Collection updated
 *       404:
 *         description: Collection not found
 */
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  const collection = collections.find(c => c.id === req.params.id);

  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  if (collection.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const updated = {
    ...collection,
    ...req.body,
    id: collection.id,
    userId: collection.userId,
    updatedAt: new Date().toISOString()
  };

  const index = collections.indexOf(collection);
  collections[index] = updated;

  res.json({ data: updated });
});

/**
 * @swagger
 * /api/v1/collections/{id}:
 *   delete:
 *     summary: Delete collection
 *     tags: [Collections]
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
 *         description: Collection deleted
 *       404:
 *         description: Collection not found
 */
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  const index = collections.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  if (collections[index].userId !== req.user?.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  collections.splice(index, 1);
  res.status(204).send();
});

/**
 * @swagger
 * /api/v1/collections/{id}/follow:
 *   post:
 *     summary: Follow a collection
 *     tags: [Collections]
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
 *         description: Collection followed
 */
router.post('/:id/follow', authMiddleware, (req: Request, res: Response) => {
  const collection = collections.find(c => c.id === req.params.id);

  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  if (!collection.followers) {
    collection.followers = [];
  }

  if (!collection.followers.includes(req.user?.id)) {
    collection.followers.push(req.user?.id);
  }

  res.json({
    data: {
      collectionId: collection.id,
      followers: collection.followers.length,
      isFollowing: true
    }
  });
});

/**
 * @swagger
 * /api/v1/collections/{id}/like:
 *   post:
 *     summary: Like a collection
 *     tags: [Collections]
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
 *         description: Collection liked
 */
router.post('/:id/like', authMiddleware, (req: Request, res: Response) => {
  const collection = collections.find(c => c.id === req.params.id);

  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }

  collection.likes = (collection.likes || 0) + 1;

  res.json({
    data: {
      collectionId: collection.id,
      likes: collection.likes
    }
  });
});

export default router;
