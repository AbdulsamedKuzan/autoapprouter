const db = require('../config/db-sqlite');
const { UAParser } = require('ua-parser-js');

// Get device platform from user agent
const getPlatform = (userAgent) => {
  const parser = new UAParser(userAgent);
  const os = parser.getOS();
  const osName = os.name?.toLowerCase() || '';

  if (osName.includes('android')) {
    return 'android';
  } else if (osName.includes('ios') || osName.includes('mac os')) {
    return 'ios';
  } else if (osName.includes('windows')) {
    return 'windows';
  } else if (osName.includes('linux')) {
    return 'linux';
  }
  return 'other';
};

// Handle redirect
const handleRedirect = async (req, res) => {
  try {
    const { slug } = req.params;
    const userAgent = req.headers['user-agent'] || '';

    // Find QR code
    const qrStmt = db.prepare(
      'SELECT * FROM qr_codes WHERE qr_code_slug = ? AND is_active = TRUE'
    );
    const qrCode = qrStmt.get(slug);

    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    const redirectUrls = JSON.parse(qrCode.redirect_urls);

    // Get device platform
    const platform = getPlatform(userAgent);

    // Determine redirect URL
    let redirectUrl = redirectUrls.default || redirectUrls.web;

    if (platform === 'android' && redirectUrls.android) {
      redirectUrl = redirectUrls.android;
    } else if (platform === 'ios' && redirectUrls.ios) {
      redirectUrl = redirectUrls.ios;
    } else if (redirectUrls[platform]) {
      redirectUrl = redirectUrls[platform];
    }

    // Log the redirect
    const logStmt = db.prepare(
      'INSERT INTO redirect_logs (qr_code_id, user_agent, device_type, platform, redirect_url) VALUES (?, ?, ?, ?, ?)'
    );
    logStmt.run(qrCode.id, userAgent, 'mobile', platform, redirectUrl);

    // Increment scans count
    const updateStmt = db.prepare(
      'UPDATE qr_codes SET scans_count = scans_count + 1 WHERE id = ?'
    );
    updateStmt.run(qrCode.id);

    // Redirect to target URL
    res.redirect(301, redirectUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ message: 'Error processing redirect' });
  }
};

// Get QR code analytics
const getQRAnalytics = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const qrStmt = db.prepare(
      'SELECT id FROM qr_codes WHERE qr_code_slug = ? AND user_id = ?'
    );
    const qrRecord = qrStmt.get(slug, userId);

    if (!qrRecord) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    // Get analytics
    const analyticsStmt = db.prepare(
      `SELECT platform, COUNT(*) as count FROM redirect_logs 
       WHERE qr_code_id = ? GROUP BY platform ORDER BY count DESC`
    );
    const analytics = analyticsStmt.all(qrRecord.id);

    const scansStmt = db.prepare(
      'SELECT scans_count FROM qr_codes WHERE id = ?'
    );
    const scansRecord = scansStmt.get(qrRecord.id);

    res.json({
      message: 'Analytics retrieved successfully',
      totalScans: scansRecord.scans_count || 0,
      platformBreakdown: analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Error retrieving analytics' });
  }
};

module.exports = { handleRedirect, getQRAnalytics };
