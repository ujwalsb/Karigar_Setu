'use strict';

const db = require('./database');
const bcrypt = require('bcryptjs');

/**
 * Automatically creates all tables and initial seed data if the database is fresh.
 * Runs on backend startup so deployment on cloud databases (like Hostinger MySQL)
 * is 100% plug-and-play with zero manual SQL imports needed.
 */
async function initDatabase() {
  console.log('[Database Init] Checking database schema...');

  try {
    // 1. Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'support') DEFAULT 'support',
        phone VARCHAR(20) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Service Categories
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        icon VARCHAR(50) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Customers
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NOT NULL UNIQUE,
        alternate_mobile VARCHAR(20) NULL,
        email VARCHAR(100) NULL,
        address TEXT NULL,
        area VARCHAR(100) NOT NULL,
        city VARCHAR(100) DEFAULT 'Pune',
        state VARCHAR(100) DEFAULT 'Maharashtra',
        pin_code VARCHAR(10) NULL,
        landmark VARCHAR(255) NULL,
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_customer_mobile (mobile),
        INDEX idx_customer_area (area)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Technicians
    await db.query(`
      CREATE TABLE IF NOT EXISTS technicians (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NOT NULL UNIQUE,
        alternate_mobile VARCHAR(20) NULL,
        email VARCHAR(100) NULL,
        photo_url VARCHAR(255) NULL,
        address TEXT NULL,
        area VARCHAR(100) NOT NULL,
        city VARCHAR(100) DEFAULT 'Pune',
        state VARCHAR(100) DEFAULT 'Maharashtra',
        pin_code VARCHAR(10) NULL,
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        experience_years INT DEFAULT 0,
        rating DECIMAL(3, 2) DEFAULT 4.50,
        total_jobs INT DEFAULT 0,
        verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        availability ENUM('available', 'busy', 'offline') DEFAULT 'available',
        status ENUM('active', 'inactive') DEFAULT 'active',
        consent_given BOOLEAN DEFAULT TRUE,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        plan_type ENUM('commission', 'monthly') DEFAULT 'commission',
        commission_rate_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
        commission_rate DECIMAL(10, 2) DEFAULT 10.00,
        monthly_fee DECIMAL(10, 2) DEFAULT 999.00,
        subscription_status ENUM('active', 'expired', 'trial', 'pending') DEFAULT 'active',
        subscription_start_date DATE NULL,
        subscription_end_date DATE NULL,
        INDEX idx_tech_pin (pin_code),
        INDEX idx_tech_area (area),
        INDEX idx_tech_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Technician Skills
    await db.query(`
      CREATE TABLE IF NOT EXISTS technician_skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        technician_id INT NOT NULL,
        service_category_id INT NOT NULL,
        specialization VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ts_tech (technician_id),
        INDEX idx_ts_cat (service_category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Technician Areas
    await db.query(`
      CREATE TABLE IF NOT EXISTS technician_areas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        technician_id INT NOT NULL,
        area VARCHAR(100) NOT NULL,
        city VARCHAR(100) DEFAULT 'Pune',
        pin_code VARCHAR(10) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ta_tech (technician_id),
        INDEX idx_ta_pin (pin_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Technician Documents
    await db.query(`
      CREATE TABLE IF NOT EXISTS technician_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        technician_id INT NOT NULL,
        doc_type VARCHAR(50) NULL,
        document_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        document_number VARCHAR(100) NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size INT NULL,
        mime_type VARCHAR(100) NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verified_by INT NULL,
        verified_at TIMESTAMP NULL,
        consent_given BOOLEAN DEFAULT TRUE,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Customer Calls
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_calls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        call_id VARCHAR(50) NOT NULL UNIQUE,
        customer_id INT NOT NULL,
        service_category_id INT NULL,
        requirement VARCHAR(255) NULL,
        problem_description TEXT NULL,
        urgency ENUM('normal', 'urgent', 'emergency') DEFAULT 'normal',
        call_source VARCHAR(50) DEFAULT 'phone',
        status VARCHAR(50) DEFAULT 'new_call',
        preferred_date DATE NULL,
        preferred_time VARCHAR(50) NULL,
        support_user_id INT NOT NULL,
        internal_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_call_customer (customer_id),
        INDEX idx_call_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Service Requests
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_id VARCHAR(50) NOT NULL UNIQUE,
        customer_call_id INT NULL,
        customer_id INT NOT NULL,
        assigned_technician_id INT NULL,
        support_user_id INT NOT NULL,
        service_category_id INT NULL,
        status VARCHAR(50) DEFAULT 'new_call',
        scheduled_date DATE NULL,
        scheduled_time VARCHAR(50) NULL,
        internal_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        work_description TEXT NULL,
        parts_replaced VARCHAR(255) NULL,
        labor_charge DECIMAL(10, 2) DEFAULT 0.00,
        parts_charge DECIMAL(10, 2) DEFAULT 0.00,
        final_amount DECIMAL(10, 2) DEFAULT 0.00,
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_mode VARCHAR(50) DEFAULT 'cash',
        completed_at DATETIME NULL,
        submission_token VARCHAR(64) NULL UNIQUE,
        machine_photo_url VARCHAR(255) NULL,
        technician_remarks TEXT NULL,
        INDEX idx_sr_customer (customer_id),
        INDEX idx_sr_tech (assigned_technician_id),
        INDEX idx_sr_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Activity Logs
    await db.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NULL,
        details JSON NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_act_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Notifications
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'system',
        is_read BOOLEAN DEFAULT FALSE,
        entity_type VARCHAR(50) NULL,
        entity_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. Technician Assignments
    await db.query(`
      CREATE TABLE IF NOT EXISTS technician_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_request_id INT NOT NULL,
        technician_id INT NOT NULL,
        assigned_by INT NULL,
        contacted BOOLEAN DEFAULT FALSE,
        accepted BOOLEAN DEFAULT FALSE,
        rejection_reason VARCHAR(255) NULL,
        customer_informed BOOLEAN DEFAULT FALSE,
        visit_confirmed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ta_sr (service_request_id),
        INDEX idx_ta_tech (technician_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. Service Status History
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_request_id INT NOT NULL,
        old_status VARCHAR(50) NULL,
        new_status VARCHAR(50) NOT NULL,
        changed_by INT NULL,
        notes TEXT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ssh_sr (service_request_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 14. Platform Settings
    await db.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 15. Technician Plan Transactions
    await db.query(`
      CREATE TABLE IF NOT EXISTS technician_plan_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        technician_id INT NOT NULL,
        plan_type ENUM('commission', 'monthly') NOT NULL,
        service_request_id INT NULL,
        transaction_type ENUM('commission_due', 'monthly_subscription', 'payment_collected', 'settlement') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_status ENUM('paid', 'pending', 'waived') DEFAULT 'paid',
        payment_mode VARCHAR(50) DEFAULT 'cash',
        reference_note TEXT NULL,
        recorded_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tech_id (technician_id),
        INDEX idx_sr_id (service_request_id),
        INDEX idx_type (transaction_type),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[Database Init] All 15 database tables verified.');

    // 16. Seed Default Platform Settings
    const defaultSettings = [
      ['company_name', 'Karigar Setu', 'general'],
      ['support_phone', '9876543210', 'general'],
      ['support_email', 'support@karigarsetu.com', 'general'],
      ['theme', 'indigo', 'appearance'],
      ['report_link_message', 'Karigar Setu - Job Completion Report: Please review and submit your service summary here:', 'notifications']
    ];

    for (const [key, val, cat] of defaultSettings) {
      await db.query(
        `INSERT IGNORE INTO platform_settings (setting_key, setting_value, category) VALUES (?, ?, ?)`,
        [key, val, cat]
      );
    }

    // 17. Seed Initial Administrator Account (if no admin exists)
    const [adminRows] = await db.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    if (adminRows.length === 0) {
      const defaultPasswordHash = await bcrypt.hash('Admin@123', 10);
      await db.query(
        `INSERT INTO users (name, email, password_hash, role, phone, is_active)
         VALUES ('System Administrator', 'admin@karigarsetu.com', ?, 'admin', '9876543210', TRUE)
         ON DUPLICATE KEY UPDATE is_active = TRUE`,
        [defaultPasswordHash]
      );
      // Also add fallback admin@us.local for convenience
      await db.query(
        `INSERT INTO users (name, email, password_hash, role, phone, is_active)
         VALUES ('System Administrator', 'admin@us.local', ?, 'admin', '9876543210', TRUE)
         ON DUPLICATE KEY UPDATE is_active = TRUE`,
        [defaultPasswordHash]
      );
      console.log('[Database Init] Initial Admin account created: admin@karigarsetu.com / Admin@123');
    }

    // 18. Seed Service Categories (if none exist)
    const [catRows] = await db.query(`SELECT id FROM service_categories LIMIT 1`);
    if (catRows.length === 0) {
      const categories = [
        ['Air Conditioner (AC) Repair & Service', 'Split & Window AC repair, deep jet pump servicing, gas leak refilling, cooling coil & inverter PCB repair', 'air-conditioner'],
        ['Refrigerator (Fridge) & Freezer Repair', 'Single door, double door, frost-free & deep freezer cooling repair, compressor & gas charging', 'refrigerator'],
        ['Washing Machine & Dryer Repair', 'Front load, top load, semi-automatic drum motor issues, spin cycle, drainage & PCB repair', 'washing-machine'],
        ['Normal / General Home Repair & Handyman', 'Daily general household fixes, door locks, fixtures, drill & hang, furniture assembly, minor carpentry', 'home-repair'],
        ['Television (TV) & LED / Smart TV Repair', 'Smart TV, LED/LCD, OLED display backlight repair, sound problems, motherboard & HDMI issues', 'tv'],
        ['Geyser & Water Heater Repair', 'Instant & storage geysers, heating coil change, thermostat repair, water leakage & electrical tripping', 'water-heater'],
        ['Kitchen Chimney & Hob Repair', 'Chimney deep degreasing, suction blower motor repair, gas hob auto-ignition & burner fixing', 'chimney'],
        ['Water Purifier (RO / UV) Service', 'RO membrane replacement, sediment/carbon filter changes, TDS balancing & booster pump repair', 'water-purifier'],
        ['Microwave Oven & OTG Repair', 'Solo, grill, convection microwave oven repair, magnetron, turntable motor & touch panel fix', 'microwave'],
        ['Electrical Wiring & Repair', 'Short circuit repair, switchboard replacement, ceiling fan repair, MCB tripping & house wiring', 'electrical'],
        ['Plumbing Services & Leakage Repair', 'Pipe leakage, tap & mixer repair, bathroom fittings, flush tank, drainage clearing & water pump', 'plumbing'],
        ['Inverter & Battery UPS Repair', 'Inverter charging problems, battery electrolyte check, PCB card repair & backup troubleshooting', 'inverter'],
        ['Dishwasher Service & Repair', 'Spray arm blockage, drainage pump error, heating element & detergent dispenser repairs', 'dishwasher'],
        ['Air Cooler Repair & Maintenance', 'Cooler motor replacement, submersible water pump, honeycomb cooling pad fitting & noise repair', 'air-cooler']
      ];

      for (const [name, desc, icon] of categories) {
        await db.query(
          `INSERT INTO service_categories (name, description, icon, is_active) VALUES (?, ?, ?, TRUE)`,
          [name, desc, icon]
        );
      }
      console.log('[Database Init] 14 Official Service Categories seeded.');
    }

    console.log('[Database Init] Database ready and operational.');
  } catch (err) {
    console.error('[Database Init Error]', err.message);
  }
}

module.exports = { initDatabase };
