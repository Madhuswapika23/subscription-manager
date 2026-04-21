const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const verifyToken = require('../middleware/verifyToken');
const {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getStats,
} = require('../controllers/subscriptionController');

// ─── Apply verifyToken to every route in this router ─────────────────────────
router.use(verifyToken);

// ─── Shared validation rules ──────────────────────────────────────────────────
const subscriptionBodyValidation = [
  body('serviceName')
    .trim()
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ max: 100 })
    .withMessage('Service name cannot exceed 100 characters'),

  body('cost')
    .notEmpty()
    .withMessage('Cost is required')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a non-negative number'),

  body('billingCycle')
    .notEmpty()
    .withMessage('Billing cycle is required')
    .isIn(['monthly', 'yearly'])
    .withMessage('Billing cycle must be monthly or yearly'),

  body('renewalDate')
    .notEmpty()
    .withMessage('Renewal date is required')
    .isISO8601()
    .withMessage('Renewal date must be a valid date (ISO 8601)'),

  body('category')
    .optional()
    .isIn(['streaming', 'software', 'fitness', 'cloud', 'learning', 'other'])
    .withMessage('Invalid category'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),

  body('usageFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'rarely'])
    .withMessage('Invalid usage frequency'),
];

// PUT validation — same rules but all fields optional (PATCH-style update)
const subscriptionUpdateValidation = [
  body('serviceName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Service name cannot be blank')
    .isLength({ max: 100 })
    .withMessage('Service name cannot exceed 100 characters'),

  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a non-negative number'),

  body('billingCycle')
    .optional()
    .isIn(['monthly', 'yearly'])
    .withMessage('Billing cycle must be monthly or yearly'),

  body('renewalDate')
    .optional()
    .isISO8601()
    .withMessage('Renewal date must be a valid date (ISO 8601)'),

  body('category')
    .optional()
    .isIn(['streaming', 'software', 'fitness', 'cloud', 'learning', 'other'])
    .withMessage('Invalid category'),

  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),

  body('usageFrequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'rarely'])
    .withMessage('Invalid usage frequency'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────
// IMPORTANT: /stats must be registered BEFORE /:id to avoid Express
// treating the literal string "stats" as an ObjectId parameter.
router.get('/stats', getStats);

router.get('/', getSubscriptions);
router.post('/', subscriptionBodyValidation, createSubscription);
router.put('/:id', subscriptionUpdateValidation, updateSubscription);
router.delete('/:id', deleteSubscription);

module.exports = router;
