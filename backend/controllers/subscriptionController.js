const { validationResult } = require('express-validator');
const Subscription = require('../models/Subscription');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verify that a subscription exists and belongs to the requesting user.
 * Returns the document on success or sends the appropriate HTTP error.
 */
const findOwnedSubscription = async (id, userId, res) => {
  const sub = await Subscription.findById(id);

  if (!sub) {
    res.status(404).json({ success: false, message: 'Subscription not found.' });
    return null;
  }

  if (sub.userId.toString() !== userId.toString()) {
    res.status(403).json({
      success: false,
      message: 'Forbidden — you do not own this subscription.',
    });
    return null;
  }

  return sub;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

// @route   GET /api/subscriptions
// @desc    Get all subscriptions for the logged-in user, sorted by renewalDate
// @access  Private
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user._id }).sort({
      renewalDate: 1,
    });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    console.error('getSubscriptions error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @route   POST /api/subscriptions
// @desc    Create a new subscription linked to req.user
// @access  Private
const createSubscription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { serviceName, cost, billingCycle, renewalDate, category, status, usageFrequency } =
      req.body;

    const subscription = await Subscription.create({
      userId: req.user._id,
      serviceName,
      cost,
      billingCycle,
      renewalDate,
      category,
      status,
      usageFrequency,
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully.',
      data: subscription,
    });
  } catch (error) {
    console.error('createSubscription error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @route   PUT /api/subscriptions/:id
// @desc    Update a subscription (ownership verified)
// @access  Private
const updateSubscription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const sub = await findOwnedSubscription(req.params.id, req.user._id, res);
    if (!sub) return; // response already sent by helper

    const allowedFields = [
      'serviceName',
      'cost',
      'billingCycle',
      'renewalDate',
      'category',
      'status',
      'usageFrequency',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        sub[field] = req.body[field];
      }
    });

    const updated = await sub.save();

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('updateSubscription error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @route   DELETE /api/subscriptions/:id
// @desc    Delete a subscription (ownership verified)
// @access  Private
const deleteSubscription = async (req, res) => {
  try {
    const sub = await findOwnedSubscription(req.params.id, req.user._id, res);
    if (!sub) return;

    await sub.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully.',
      data: { id: req.params.id },
    });
  } catch (error) {
    console.error('deleteSubscription error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// @route   GET /api/subscriptions/stats
// @desc    Return spending analytics for the logged-in user
// @access  Private
const getStats = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      userId: req.user._id,
      status: 'active',
    });

    // ── Spend totals ─────────────────────────────────────────────────────────
    let totalMonthlySpend = 0;
    let totalYearlySpend = 0;

    subscriptions.forEach((sub) => {
      if (sub.billingCycle === 'monthly') {
        totalMonthlySpend += sub.cost;
        totalYearlySpend += sub.cost * 12;
      } else {
        // yearly
        totalMonthlySpend += sub.cost / 12;
        totalYearlySpend += sub.cost;
      }
    });

    totalMonthlySpend = parseFloat(totalMonthlySpend.toFixed(2));
    totalYearlySpend = parseFloat(totalYearlySpend.toFixed(2));

    // ── Count by category ────────────────────────────────────────────────────
    const countByCategory = subscriptions.reduce((acc, sub) => {
      const cat = sub.category || 'other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    // ── Upcoming renewals (within next 7 days) ───────────────────────────────
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingRenewals = subscriptions
      .filter((sub) => sub.renewalDate >= now && sub.renewalDate <= sevenDaysFromNow)
      .sort((a, b) => a.renewalDate - b.renewalDate);

    // ── Rarely-used subscriptions ────────────────────────────────────────────
    const rarelyUsedSubs = subscriptions.filter(
      (sub) => sub.usageFrequency === 'rarely'
    );

    res.status(200).json({
      success: true,
      data: {
        totalMonthlySpend,
        totalYearlySpend,
        countByCategory,
        upcomingRenewals,
        rarelyUsedSubs,
      },
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getStats,
};
