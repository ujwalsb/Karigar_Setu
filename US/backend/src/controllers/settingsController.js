'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { logActivity } = require('../middleware/auth');
const { BRANDING_UPLOAD_DIR } = require('../config/logoMulter');
const { DEFAULT_BRAND_NAME, resolveCompanyName } = require('../utils/branding');

const PUBLIC_SETTING_KEYS = [
  'theme',
  'primary_color',
  'compact_mode',
  'sidebar_style',
  'platform_name',
  'tagline',
  'company_name',
  'company_logo_url',
  'support_phone',
  'support_email',
  'business_address',
  'currency_symbol'
];

const DEFAULT_SETTINGS = {
  // Appearance & Theme
  theme: 'light',
  primary_color: 'indigo',
  compact_mode: 'false',
  sidebar_style: 'dark',

  // Platform & Company Branding
  platform_name: 'Karigar Setu',
  tagline: 'Connecting Skills & Needs - Appliance Service Platform',
  company_name: 'Karigar Setu',
  company_logo_url: '',
  support_phone: '+91 8805224580',
  support_email: 'support@karigarsetu.local',
  business_address: 'Pune, Maharashtra 411001',
  default_city: 'Pune',
  default_state: 'Maharashtra',
  currency_symbol: '₹',

  // Service & Dispatch Defaults
  default_warranty_days: '30',
  standard_inspection_fee: '199',
  auto_dispatch_radius_km: '15',
  require_kyc_for_dispatch: 'true',

  // Communication & Notifications
  whatsapp_notifications_enabled: 'true',
  sms_notifications_enabled: 'true',
  email_notifications_enabled: 'false',
  dispatch_whatsapp_template: `🔧 *{{platform_name}} - NEW JOB DISPATCH* 🔧
━━━━━━━━━━━━━━━━━━━━
{{urgency_emoji}} *Job ID:* #{{job_id}}
🛠️ *Category:* {{service_category}}
⚡ *Urgency:* {{urgency}}
{{preferred_slot}}
👤 *CUSTOMER DETAILS:*
• *Name:* {{customer_name}}
• *Mobile:* {{customer_phone}}

📍 *CUSTOMER LOCATION / ADDRESS:*
{{customer_address}}
🗺️ *Google Maps:* {{maps_url}}

📝 *CUSTOMER REQUIREMENT / ISSUE:*
{{requirement}}

━━━━━━━━━━━━━━━━━━━━
⚠️ *Technician Instructions:*
1. Call the customer immediately to confirm your visit & ETA.
2. Carry your {{platform_name}} ID card and safety gear.
3. Update service status once inspection is complete.`,
  report_link_whatsapp_template: `🛠️ *{{platform_name}} - WORK COMPLETION REPORT* 🛠️
━━━━━━━━━━━━━━━━━━━━
Hi *{{technician_name}}*,
Please submit your job completion report for *#{{job_id}}*:

👤 *Customer:* {{customer_name}}
🔧 *Category:* {{service_category}}

👉 *Click here to submit charges, parts & machine photo:*
{{report_link}}

📌 *Required Information:*
{{required_items}}

Please submit this immediately after completing the service. Thank you!`,
  default_whatsapp_tech_template:
    'Hello {{technician_name}}, you have been assigned to Call #{{request_id}} for {{customer_name}} at {{area}}. Customer Mobile: {{customer_mobile}}.',
  default_whatsapp_customer_template:
    'Dear {{customer_name}}, technician {{technician_name}} (Phone: {{technician_mobile}}) has been assigned for your {{service_name}} service.',

  // Security
  session_timeout_hours: '8',
  allow_staff_delete_records: 'false'
};

async function getAllSettingsMap() {
  const [rows] = await db.query('SELECT setting_key, setting_value FROM platform_settings');
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value;
  }
  return settings;
}

async function upsertSetting(key, value, category = 'general') {
  const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  await db.query(
    `INSERT INTO platform_settings (setting_key, setting_value, category)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
    [key, stringVal, category]
  );
}

function removeLocalLogoFile(logoUrl) {
  if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.startsWith('/uploads/branding/')) {
    return;
  }
  const safeFileName = path.basename(logoUrl);
  const fullPath = path.join(BRANDING_UPLOAD_DIR, safeFileName);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (unlinkErr) {
      console.warn('Could not delete old company logo:', unlinkErr.message);
    }
  }
}

async function getPublicSettings(req, res, next) {
  try {
    const allSettings = await getAllSettingsMap();
    const publicSettings = {};
    for (const key of PUBLIC_SETTING_KEYS) {
      if (allSettings[key] !== undefined) {
        publicSettings[key] = allSettings[key];
      }
    }
    publicSettings.resolved_company_name = resolveCompanyName(allSettings);
    return res.json({
      success: true,
      data: publicSettings
    });
  } catch (err) {
    next(err);
  }
}

async function getSettings(req, res, next) {
  try {
    const settings = await getAllSettingsMap();
    return res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const updates = { ...(req.body || {}) };
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings payload.' });
    }

    const entries = Object.entries(updates);
    if (entries.length === 0) {
      return res.status(400).json({ success: false, message: 'No settings provided to update.' });
    }

    const currentSettings = await getAllSettingsMap();
    if (updates.company_name !== undefined) {
      const nextCompany = String(updates.company_name || '').trim();
      const prevCompany = String(currentSettings.company_name || '').trim();
      const prevPlatform = String(currentSettings.platform_name || '').trim();
      const sentPlatform = updates.platform_name !== undefined ? String(updates.platform_name || '').trim() : prevPlatform;
      if (
        nextCompany &&
        (sentPlatform === '' ||
          sentPlatform === DEFAULT_BRAND_NAME ||
          (sentPlatform === prevPlatform && (prevPlatform === prevCompany || prevPlatform === DEFAULT_BRAND_NAME)))
      ) {
        updates.platform_name = nextCompany;
      }
    }

    for (const [key, val] of Object.entries(updates)) {
      await upsertSetting(key, val);
    }

    if (req.user) {
      await logActivity(
        req.user.id,
        'UPDATE_SETTINGS',
        'system',
        null,
        { updatedKeys: Object.keys(updates) },
        req.ip
      );
    }

    const allSettings = await getAllSettingsMap();

    return res.json({
      success: true,
      message: 'Settings updated successfully.',
      data: allSettings
    });
  } catch (err) {
    next(err);
  }
}

async function uploadLogo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please choose a company logo image file.' });
    }

    const currentSettings = await getAllSettingsMap();
    const previousLogoUrl = currentSettings.company_logo_url;
    const relativeUrl = `/uploads/branding/${req.file.filename}`;

    await upsertSetting('company_logo_url', relativeUrl, 'branding');

    if (previousLogoUrl && previousLogoUrl !== relativeUrl) {
      removeLocalLogoFile(previousLogoUrl);
    }

    if (req.user) {
      await logActivity(
        req.user.id,
        'UPLOAD_COMPANY_LOGO',
        'system',
        null,
        { company_logo_url: relativeUrl, fileName: req.file.originalname },
        req.ip
      );
    }

    const allSettings = await getAllSettingsMap();
    return res.status(201).json({
      success: true,
      message: 'Company logo uploaded successfully.',
      data: {
        company_logo_url: relativeUrl,
        settings: allSettings
      }
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
}

async function deleteLogo(req, res, next) {
  try {
    const currentSettings = await getAllSettingsMap();
    removeLocalLogoFile(currentSettings.company_logo_url);
    await upsertSetting('company_logo_url', '', 'branding');

    if (req.user) {
      await logActivity(
        req.user.id,
        'DELETE_COMPANY_LOGO',
        'system',
        null,
        {},
        req.ip
      );
    }

    const allSettings = await getAllSettingsMap();
    return res.json({
      success: true,
      message: 'Company logo removed.',
      data: {
        company_logo_url: '',
        settings: allSettings
      }
    });
  } catch (err) {
    next(err);
  }
}

async function resetSettings(req, res, next) {
  try {
    const currentSettings = await getAllSettingsMap();
    removeLocalLogoFile(currentSettings.company_logo_url);
    await db.query('DELETE FROM platform_settings');

    if (req.user) {
      await logActivity(
        req.user.id,
        'RESET_SETTINGS',
        'system',
        null,
        { defaultReset: true },
        req.ip
      );
    }

    return res.json({
      success: true,
      message: 'All settings have been reset to factory defaults.',
      data: DEFAULT_SETTINGS
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPublicSettings,
  getSettings,
  updateSettings,
  uploadLogo,
  deleteLogo,
  resetSettings
};

