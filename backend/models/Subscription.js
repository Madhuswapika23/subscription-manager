const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    billingCycle: {
      type: String,
      enum: {
        values: ['monthly', 'yearly'],
        message: 'Billing cycle must be monthly or yearly',
      },
      required: [true, 'Billing cycle is required'],
    },
    renewalDate: {
      type: Date,
      required: [true, 'Renewal date is required'],
    },
    category: {
      type: String,
      enum: {
        values: ['streaming', 'software', 'fitness', 'cloud', 'learning', 'other'],
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be active or inactive',
      },
      default: 'active',
    },
    usageFrequency: {
      type: String,
      enum: {
        values: ['daily', 'weekly', 'monthly', 'rarely'],
        message: '{VALUE} is not a valid usage frequency',
      },
      default: 'monthly',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: normalise cost to a monthly figure
subscriptionSchema.virtual('monthlyCost').get(function () {
  return this.billingCycle === 'yearly'
    ? parseFloat((this.cost / 12).toFixed(2))
    : this.cost;
});

// Virtual: normalise cost to a yearly figure
subscriptionSchema.virtual('yearlyCost').get(function () {
  return this.billingCycle === 'monthly'
    ? parseFloat((this.cost * 12).toFixed(2))
    : this.cost;
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
