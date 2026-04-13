const db = require('../config/db-sqlite');
const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

// Generate unique slug
const generateSlug = () => {
  return crypto.randomBytes(4).toString('hex');
};

// Create QR Code
const createQRCode = async (req, res) => {
  try {
    const { name, redirect_urls } = req.body;
    const userId = req.user.id;

    if (!redirect_urls || typeof redirect_urls !== 'object') {
      return res.status(400).json({ message: 'redirect_urls must be an object' });
    }

        const userStmt = db.prepare('SELECT subscription_plan, subscription_end FROM users WHERE id = ?');
    const user = userStmt.get(userId);
    const now = new Date();
    const hasPremium = user?.subscription_plan === 'premium' && user.subscription_end && new Date(user.subscription_end) > now;

    const countStmt = db.prepare('SELECT COUNT(*) AS count FROM qr_codes WHERE user_id = ?');
    const existingCount = countStmt.get(userId).count;

    if (!hasPremium && existingCount >= 3) {
      return res.status(403).json({ message: 'Ücretsiz hesap için maksimum 3 QR kodu hakkın doldu. Abonelik satın alın.' });
    }

    const slug = generateSlug();

    const stmt = db.prepare(
      'INSERT INTO qr_codes (user_id, qr_code_slug, redirect_urls, name) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(userId, slug, JSON.stringify(redirect_urls), name || `QR-${slug}`);

    const qrUrl = `${process.env.REDIRECT_BASE_URL || 'http://localhost:5000'}/redirect/${slug}`;

    // Generate QR code image
    const qrImage = await QRCode.toDataURL(qrUrl);

    // Create user directory if not exists
    const userDir = path.join(__dirname, '../../user_files', userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Create QR file
    const qrFilePath = path.join(userDir, `${slug}.json`);
    const qrData = {
      id: result.lastInsertRowid,
      slug,
      name: name || `QR-${slug}`,
      qrUrl,
      qrImage,
      redirectUrls: redirect_urls,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(qrFilePath, JSON.stringify(qrData, null, 2));

    // Update Excel file
    await updateExcelRecord(userId, slug, qrUrl, name || `QR-${slug}`, new Date().toISOString());

    res.status(201).json({
      message: 'QR code created successfully',
      qr: qrData
    });
  } catch (error) {
    console.error('Create QR error:', error);
    res.status(500).json({ message: 'Error creating QR code' });
  }
};

// Get user's QR codes
const getUserQRCodes = async (req, res) => {
  try {
    const userId = req.user.id;

    const stmt = db.prepare(
      'SELECT * FROM qr_codes WHERE user_id = ? ORDER BY created_at DESC'
    );
    const qrCodes = stmt.all(userId);

    const formattedQRs = qrCodes.map(qr => ({
      id: qr.id,
      slug: qr.qr_code_slug,
      name: qr.name,
      redirectUrls: JSON.parse(qr.redirect_urls),
      scansCount: qr.scans_count,
      isActive: qr.is_active,
      createdAt: qr.created_at
    }));

    res.json({
      message: 'QR codes retrieved successfully',
      qrCodes: formattedQRs
    });
  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({ message: 'Error retrieving QR codes' });
  }
};

// Delete QR code
const deleteQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const checkStmt = db.prepare(
      'SELECT id FROM qr_codes WHERE id = ? AND user_id = ?'
    );
    const exists = checkStmt.get(id, userId);

    if (!exists) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    const deleteStmt = db.prepare('DELETE FROM qr_codes WHERE id = ?');
    deleteStmt.run(id);

    res.json({ message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Delete QR error:', error);
    res.status(500).json({ message: 'Error deleting QR code' });
  }
};

// Update Excel record
const updateExcelRecord = async (userId, slug, qrUrl, name, createdAt) => {
  const excelPath = path.join(__dirname, '../../user_files/qr_records.xlsx');
  let workbook;

  if (fs.existsSync(excelPath)) {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
  } else {
    workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('QR Records');
    worksheet.columns = [
      { header: 'User ID', key: 'userId', width: 10 },
      { header: 'QR Slug', key: 'slug', width: 15 },
      { header: 'QR Name', key: 'name', width: 20 },
      { header: 'QR URL', key: 'qrUrl', width: 50 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];
  }

  const worksheet = workbook.getWorksheet('QR Records');
  worksheet.addRow({ userId, slug, name, qrUrl, createdAt });
  await workbook.xlsx.writeFile(excelPath);
};

module.exports = { createQRCode, getUserQRCodes, deleteQRCode };
