const Agent = require('../models/Agent');
const Asset = require('../models/Asset');
const Organization = require('../models/Organization');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

exports.getAllAgents = async (req, res, next) => {
  try {
    const agents = await Agent.find({ organization: req.organization })
      .populate('asset', 'name assetId type')
      .sort({ createdAt: -1 });

    const stats = {
      total: agents.length,
      online: agents.filter(a => a.status === 'Online').length,
      offline: agents.filter(a => a.status === 'Offline').length,
      updateRequired: agents.filter(a => a.status === 'Update Required').length
    };

    res.json({
      success: true,
      stats,
      data: agents
    });
  } catch (error) {
    next(error);
  }
};

exports.registerAgent = async (req, res, next) => {
  try {
    const { agentId, hostname, assetName, assetType, registrationKey, os, osVersion } = req.body;
    const org = await Organization.findById(req.organization);

    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Verify registration key
    if (registrationKey !== org.agentRegistrationKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid registration key'
      });
    }

    // Check if agent already exists
    const existingAgent = await Agent.findOne({ agentId });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID already registered'
      });
    }

    // Create or link asset
    let asset = await Asset.findOne({ name: hostname, organization: req.organization });

    if (!asset) {
      const assetId = `AST-${uuidv4().substring(0, 8).toUpperCase()}`;
      asset = await Asset.create({
        assetId,
        name: assetName || hostname,
        type: assetType || 'Server',
        organization: req.organization,
        os,
        osVersion
      });
    }

    // Create agent
    const apiKey = crypto.randomBytes(32).toString('hex');
    const agent = await Agent.create({
      agentId,
      hostname,
      organization: req.organization,
      asset: asset._id,
      apiKey,
      status: 'Offline',
      os,
      osVersion
    });

    res.status(201).json({
      success: true,
      message: 'Agent registered successfully',
      data: {
        agentId: agent.agentId,
        apiKey: agent.apiKey,
        organizationId: req.organization.toString(),
        assetId: asset._id.toString(),
        nextCheckInAfter: agent.evidenceFrequency // seconds
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.submitEvidence = async (req, res, next) => {
  try {
    const { agentId, evidence, os, osVersion } = req.body;
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    // Find agent
    const agent = await Agent.findOne({ agentId });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    if (agent.apiKey !== apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Update agent status
    agent.lastCheckIn = new Date();
    agent.status = 'Online';
    agent.totalEvidenceSubmissions += 1;
    agent.lastEvidenceSubmission = new Date();

    if (os) agent.os = os;
    if (osVersion) agent.osVersion = osVersion;

    await agent.save();

    // Update asset
    if (agent.asset) {
      const asset = await Asset.findById(agent.asset);
      if (asset) {
        asset.lastCheckIn = new Date();
        asset.evidence = evidence && Array.isArray(evidence) ? evidence : [];
        if (os) asset.os = os;
        if (osVersion) asset.osVersion = osVersion;

        // Determine assurance status based on evidence count
        if (evidence && evidence.length >= 4) {
          asset.assuranceStatus = 'Evidence Verified';
        } else if (evidence && evidence.length > 0) {
          asset.assuranceStatus = 'Needs Review';
        }

        await asset.save();
      }
    }

    res.json({
      success: true,
      message: 'Evidence received successfully',
      data: {
        agentId: agent.agentId,
        nextCheckInAfter: agent.evidenceFrequency,
        receivedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAgentById = async (req, res, next) => {
  try {
    const agent = await Agent.findById(req.params.id)
      .populate('asset')
      .populate('organization', 'name');

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    if (agent.organization._id.toString() !== req.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAgentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Online', 'Offline', 'Update Required'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { status, lastCheckIn: new Date() },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      message: 'Agent status updated',
      data: agent
    });
  } catch (error) {
    next(error);
  }
};

exports.disableAgent = async (req, res, next) => {
  try {
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { isEnabled: false },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      message: 'Agent disabled',
      data: agent
    });
  } catch (error) {
    next(error);
  }
};

exports.rotateApiKey = async (req, res, next) => {
  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    if (agent.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    const newApiKey = crypto.randomBytes(32).toString('hex');
    agent.apiKey = newApiKey;
    await agent.save();

    res.json({
      success: true,
      message: 'API key rotated successfully',
      data: {
        agentId: agent.agentId,
        newApiKey: newApiKey
      }
    });
  } catch (error) {
    next(error);
  }
};
