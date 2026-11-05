'use strict';

const db = require('../config/database');
const { logActivity } = require('../middleware/auth');

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

async function getSettings(req, res, next) {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value, category, updated_at FROM platform_settings');
    const settings = { ...DEFAULT_SETTINGS };

    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }

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
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings payload.' });
    }

    const entries = Object.entries(updates);
    if (entries.length === 0) {
      return res.status(400).json({ success: false, message: 'No settings provided to update.' });
    }

    for (const [key, val] of entries) {
      const stringVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
      await db.query(
        `INSERT INTO platform_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, stringVal]
      );
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

    // Return the updated settings map
    const [rows] = await db.query('SELECT setting_key, setting_value FROM platform_settings');
    const allSettings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      allSettings[row.setting_key] = row.setting_value;
    }

    return res.json({
      success: true,
      message: 'Settings updated successfully.',
      data: allSettings
    });
  } catch (err) {
    next(err);
  }
}

async function resetSettings(req, res, next) {
  try {
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
  getSettings,
  updateSettings,
  resetSettings
};

