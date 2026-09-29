const Gap = require('../models/Gap');
const { v4: uuidv4 } = require('uuid');

exports.getAllGaps = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const query = { organization: req.organization };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const gaps = await Gap.find(query)
      .populate('owner', 'fullName email')
      .populate('relatedControl', 'controlId name')
      .populate('affectedAssets', 'name assetId')
      .sort({ priority: 1, createdAt: -1 });

    res.json({
      success: true,
      count: gaps.length,
      data: gaps
    });
  } catch (error) {
    next(error);
  }
};

exports.createGap = async (req, res, next) => {
  try {
    const {
      description,
      priority,
      affectedAssets,
      relatedControl,
      owner,
      dueDate,
      recommendedAction,
      remediationSteps
    } = req.body;

    const gapId = `GAP-${uuidv4().substring(0, 8).toUpperCase()}`;

    const gap = await Gap.create({
      gapId,
      description,
      priority,
      affectedAssets,
      affectedAssetsCount: affectedAssets?.length || 0,
      relatedControl,
      owner,
      dueDate,
      recommendedAction,
      remediationSteps,
      organization: req.organization,
      status: 'Open'
    });

    await gap.populate('owner', 'fullName email');
    await gap.populate('relatedControl', 'name');
    await gap.populate('affectedAssets', 'name assetId');

    res.status(201).json({
      success: true,
      message: 'Gap created',
      data: gap
    });
  } catch (error) {
    next(error);
  }
};

exports.getGapById = async (req, res, next) => {
  try {
    const gap = await Gap.findById(req.params.id)
      .populate('owner', 'fullName email')
      .populate('relatedControl')
      .populate('affectedAssets');

    if (!gap) {
      return res.status(404).json({
        success: false,
        error: 'Gap not found'
      });
    }

    if (gap.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      data: gap
    });
  } catch (error) {
    next(error);
  }
};

exports.updateGap = async (req, res, next) => {
  try {
    const gap = await Gap.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('owner', 'fullName email');

    if (!gap) {
      return res.status(404).json({
        success: false,
        error: 'Gap not found'
      });
    }

    res.json({
      success: true,
      message: 'Gap updated',
      data: gap
    });
  } catch (error) {
    next(error);
  }
};

exports.updateGapStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Open', 'In Progress', 'Verification', 'Resolved', 'Deferred'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const updateData = { status };
    if (status === 'Resolved') {
      updateData.resolvedAt = new Date();
    }

    const gap = await Gap.findByIdAndUpdate(req.params.id, updateData, {
      new: true
    }).populate('owner', 'fullName email');

    if (!gap) {
      return res.status(404).json({
        success: false,
        error: 'Gap not found'
      });
    }

    res.json({
      success: true,
      message: 'Gap status updated',
      data: gap
    });
  } catch (error) {
    next(error);
  }
};

exports.getGapStats = async (req, res, next) => {
  try {
    const stats = await Gap.aggregate([
      {
        $match: { organization: req.organization }
      },
      {
        $facet: {
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteGap = async (req, res, next) => {
  try {
    const gap = await Gap.findByIdAndDelete(req.params.id);

    if (!gap) {
      return res.status(404).json({
        success: false,
        error: 'Gap not found'
      });
    }

    res.json({
      success: true,
      message: 'Gap deleted'
    });
  } catch (error) {
    next(error);
  }
};
