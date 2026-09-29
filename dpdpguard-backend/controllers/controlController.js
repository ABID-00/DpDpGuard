const Control = require('../models/Control');

exports.getAllControls = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const query = { organization: req.organization };

    if (category) query.category = category;
    if (status) query.status = status;

    const controls = await Control.find(query)
      .populate('associatedAssets', 'name assetId')
      .sort({ category: 1, createdAt: -1 });

    res.json({
      success: true,
      count: controls.length,
      data: controls
    });
  } catch (error) {
    next(error);
  }
};

exports.getControlById = async (req, res, next) => {
  try {
    const control = await Control.findById(req.params.id)
      .populate('associatedAssets');

    if (!control) {
      return res.status(404).json({
        success: false,
        error: 'Control not found'
      });
    }

    res.json({
      success: true,
      data: control
    });
  } catch (error) {
    next(error);
  }
};

exports.updateControl = async (req, res, next) => {
  try {
    const control = await Control.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!control) {
      return res.status(404).json({
        success: false,
        error: 'Control not found'
      });
    }

    res.json({
      success: true,
      message: 'Control updated',
      data: control
    });
  } catch (error) {
    next(error);
  }
};

exports.getControlStats = async (req, res, next) => {
  try {
    const stats = await Control.aggregate([
      {
        $match: { organization: req.organization }
      },
      {
        $facet: {
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
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
