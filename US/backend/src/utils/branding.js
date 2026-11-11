'use strict';

const DEFAULT_BRAND_NAME = 'Karigar Setu';

function resolveCompanyName(settings) {
  if (!settings || typeof settings !== 'object') {
    return DEFAULT_BRAND_NAME;
  }
  const company = String(settings.company_name ?? settings.companyName ?? '').trim();
  const platform = String(settings.platform_name ?? settings.platformName ?? '').trim();

  if (company && company !== DEFAULT_BRAND_NAME) {
    return company;
  }
  if (platform && platform !== DEFAULT_BRAND_NAME) {
    return platform;
  }
  return company || platform || DEFAULT_BRAND_NAME;
}

async function getBrandingFromDb(db) {
  const map = {
    company_name: DEFAULT_BRAND_NAME,
    platform_name: DEFAULT_BRAND_NAME,
    tagline: 'Connecting Skills & Needs - Appliance Service Platform',
    company_logo_url: '',
    support_phone: '+91 8805224580',
    support_email: 'support@karigarsetu.local',
    business_address: 'Pune, Maharashtra 411001',
    currency_symbol: '₹'
  };

  try {
    const [rows] = await db.query(
      `SELECT setting_key, setting_value
       FROM platform_settings
       WHERE setting_key IN (
         'company_name', 'platform_name', 'tagline', 'company_logo_url',
         'support_phone', 'support_email', 'business_address', 'currency_symbol'
       )`
    );
    for (const row of rows) {
      if (row.setting_value !== undefined && row.setting_value !== null) {
        map[row.setting_key] = row.setting_value;
      }
    }
  } catch {
    // Fallback to defaults if DB is unreachable or not yet initialized
  }

  return {
    ...map,
    companyName: resolveCompanyName(map)
  };
}

module.exports = {
  DEFAULT_BRAND_NAME,
  resolveCompanyName,
  getBrandingFromDb
};

