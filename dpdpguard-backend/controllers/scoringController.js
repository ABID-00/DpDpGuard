const Asset = require('../models/Asset');

const checkRules = {
  bitlocker: c => c?.status === 'Enabled',
  firewall: c => c?.status === 'Enabled',
  windowsDefender: c =>
    ['Microsoft Defender Active', 'Third-Party Antivirus Detected'].includes(c?.status),
  windowsUpdate: c =>
    c?.patchEvidenceAvailable === true && c?.service?.running === true,
  passwordPolicy: c => {
    const minLength = parseInt(c?.minimumPasswordLength, 10);
    const maxAge = String(c?.maximumPasswordAge || '');
    return minLength >= 8 && !/unlimited/i.test(maxAge);
  },
  screenLock: c => c?.status === 'Enabled',
};

const labels = {
  bitlocker: 'Disk encryption (BitLocker)',
  firewall: 'Firewall enabled',
  windowsDefender: 'Antivirus active',
  windowsUpdate: 'Windows updates',
  passwordPolicy: 'Password policy',
  screenLock: 'Screen lock',
};

function scoreChecks(checks = {}) {
  const results = Object.keys(checkRules).map(key => ({
    control: labels[key],
    passed: checkRules[key](checks[key]),
  }));
  const passed = results.filter(r => r.passed).length;
  return {
    score: Math.round((passed / results.length) * 100),
    results,
  };
}

exports.getScoring = async (req, res, next) => {
  try {
    const assets = await Asset.find({ organization: req.organization })
      .select('name type securityChecks collectedAt lastCheckIn');

    const perAsset = assets.map(a => {
      const reported = !!a.collectedAt;
      const { score, results } = scoreChecks(a.securityChecks || {});
      return {
        assetId: a._id,
        name: a.name,
        type: a.type,
        lastCheckIn: a.lastCheckIn,
        reported,
        score: reported ? score : null,
        checks: results,
      };
    });

    const scored = perAsset.filter(a => a.reported);
    const organizationScore = scored.length
      ? Math.round(scored.reduce((sum, a) => sum + a.score, 0) / scored.length)
      : null;

    res.json({
      success: true,
      data: { organizationScore, assets: perAsset },
    });
  } catch (error) {
    next(error);
  }
};