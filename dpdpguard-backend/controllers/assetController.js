const Asset = require('../models/Asset');
const { v4: uuidv4 } = require('uuid');

exports.getAllAssets = async (req, res, next) => {
  try {
    const { type, status, priority } = req.query;
    const orgId = req.organization;

    let query = { organization: orgId };

    if (type) query.type = type;
    if (status) query.assuranceStatus = status;
    if (priority) query.priority = priority;

    const assets = await Asset.find(query)
      .populate('agent', 'agentId status lastCheckIn')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('agent')
      .populate('relatedControls');

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    if (asset.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

exports.createAsset = async (req, res, next) => {
  try {
    const { name, type, os, osVersion, ipAddress, macAddress, location, owner, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and Type are required'
      });
    }

    const assetId = `AST-${uuidv4().substring(0, 8).toUpperCase()}`;

    const asset = await Asset.create({
      assetId,
      name,
      type,
      os,
      osVersion,
      ipAddress,
      macAddress,
      location,
      owner,
      description,
      organization: req.organization
    });

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAsset = async (req, res, next) => {
  try {
    let asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    if (asset.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }

    if (asset.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    await Asset.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssetStats = async (req, res, next) => {
  try {
    const orgId = req.organization;

    const stats = await Asset.aggregate([
      {
        $match: { organization: orgId }
      },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$assuranceStatus', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
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
