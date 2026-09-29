const Asset = require('../models/Asset');
const Assessment = require('../models/Assessment');
const Gap = require('../models/Gap');
const Agent = require('../models/Agent');
const Control = require('../models/Control');
const ActionPlan = require('../models/ActionPlan');

exports.getDashboard = async (req, res, next) => {
  try {
    const orgId = req.organization;

    // Get stats
    const totalAssets = await Asset.countDocuments({ organization: orgId });
    const verifiedAssets = await Asset.countDocuments({
      organization: orgId,
      assuranceStatus: 'Evidence Verified'
    });
    const needsReviewAssets = await Asset.countDocuments({
      organization: orgId,
      assuranceStatus: 'Needs Review'
    });
    const openGaps = await Gap.countDocuments({
      organization: orgId,
      status: { $ne: 'Resolved' }
    });

    // Get latest assessment
    const assessment = await Assessment.findOne({
      organization: orgId
    }).sort({ createdAt: -1 });

    // Get agent stats
    const onlineAgents = await Agent.countDocuments({
      organization: orgId,
      status: 'Online'
    });

    const totalAgents = await Agent.countDocuments({ organization: orgId });

    // Get readiness trend (last 4 months)
    const readinessTrend = await Assessment.aggregate([
      {
        $match: { organization: orgId }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 4
      },
      {
        $project: {
          month: { $dateToString: { format: '%B', date: '$createdAt' } },
          readinessScore: 1,
          createdAt: 1
        }
      }
    ]);

    // Get control category scores
    const controls = await Control.find({ organization: orgId }).select('category status evidenceCount totalAssets');

    const controlScores = {};
    for (const control of controls) {
      if (!controlScores[control.category]) {
        controlScores[control.category] = [];
      }
      const score = control.totalAssets > 0
        ? Math.round((control.evidenceCount / control.totalAssets) * 100)
        : 0;
      controlScores[control.category].push(score);
    }

    const categoryScores = {};
    for (const [category, scores] of Object.entries(controlScores)) {
      const average = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      categoryScores[category] = average;
    }

    // Get asset status breakdown
    const assetsByType = await Asset.aggregate([
      {
        $match: { organization: orgId }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get gap priority breakdown
    const gapsByPriority = await Gap.aggregate([
      {
        $match: {
          organization: orgId,
          status: { $ne: 'Resolved' }
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent activity
    const recentGaps = await Gap.find({ organization: orgId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('gapId description priority status');

    const recentActions = await ActionPlan.find({ organization: orgId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('actionId title priority status dueDate');

    res.json({
      success: true,
      stats: {
        overallReadiness: assessment?.readinessScore || 0,
        totalAssets,
        evidenceVerified: verifiedAssets,
        needsReview: needsReviewAssets,
        potentialGaps: openGaps
      },
      agents: {
        online: onlineAgents,
        total: totalAgents
      },
      readinessTrend: readinessTrend.reverse(),
      controlScores: categoryScores,
      assetsByType,
      gapsByPriority,
      latestAssessment: assessment,
      recentActivity: {
        gaps: recentGaps,
        actions: recentActions
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getReadinessTrend = async (req, res, next) => {
  try {
    const orgId = req.organization;
    const months = parseInt(req.query.months) || 12;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trend = await Assessment.aggregate([
      {
        $match: {
          organization: orgId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $sort: { createdAt: 1 }
      },
      {
        $project: {
          month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          readinessScore: 1,
          status: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: trend
    });
  } catch (error) {
    next(error);
  }
};
