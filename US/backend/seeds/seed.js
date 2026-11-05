'use strict';

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runSeed() {
  console.log('Starting seed...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'us_platform'
  });

  try {
    // 1. All official service categories
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
      const [existing] = await connection.query('SELECT id FROM service_categories WHERE name = ?', [name]);
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO service_categories (name, description, icon, is_active) VALUES (?, ?, ?, TRUE)',
          [name, desc, icon]
        );
      } else {
        await connection.query(
          'UPDATE service_categories SET description = ?, icon = ?, is_active = TRUE WHERE id = ?',
          [desc, icon, existing[0].id]
        );
      }
    }
    console.log('Seeded comprehensive service categories.');

    // 2. Staff accounts
    const staffPassword = await bcrypt.hash('Support@123', 10);
    const staffMembers = [
      ['Support Staff 1', 'support1@us.local', staffPassword, 'support', '9876543210'],
      ['Support Staff 2', 'support2@us.local', staffPassword, 'support', '9876543211']
    ];

    for (const [name, email, pass, role, phone] of staffMembers) {
      await connection.query(
        'INSERT IGNORE INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
        [name, email, pass, role, phone]
      );
    }
    console.log('Seeded support staff accounts.');

    // 3. Technicians in Pune
    const technicians = [
      ['Sachin More', '9822011111', 'Kothrud', 'Pune', '411038', 18.5074, 73.8077, 8, 4.8, 120, 'verified', 'available'],
      ['Nitin Jadhav', '9822022222', 'Baner', 'Pune', '411045', 18.5590, 73.7868, 6, 4.7, 95, 'verified', 'available'],
      ['Pravin Patil', '9822033333', 'Wakad', 'Pune', '411057', 18.5987, 73.7663, 5, 4.6, 80, 'verified', 'available'],
      ['Amit Shinde', '9822044444', 'Hadapsar', 'Pune', '411028', 18.5089, 73.9259, 7, 4.5, 110, 'verified', 'available'],
      ['Ganesh Kadam', '9822055555', 'Viman Nagar', 'Pune', '411014', 18.5679, 73.9143, 4, 4.4, 60, 'verified', 'available']
    ];

    for (const [name, mob, area, city, pin, lat, lng, exp, rating, jobs, vStatus, avail] of technicians) {
      await connection.query(
        `INSERT IGNORE INTO technicians
         (full_name, mobile, area, city, pin_code, latitude, longitude, experience_years, rating, total_jobs, verification_status, availability)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, mob, area, city, pin, lat, lng, exp, rating, jobs, vStatus, avail]
      );
    }

    // 4. Map technician skills to all categories
    const [allCats] = await connection.query('SELECT id, name FROM service_categories WHERE is_active = TRUE');
    const [allTechs] = await connection.query('SELECT id, area, city, pin_code FROM technicians');

    for (const tech of allTechs) {
      for (const cat of allCats) {
        const [hasSkill] = await connection.query(
          'SELECT id FROM technician_skills WHERE technician_id = ? AND service_category_id = ?',
          [tech.id, cat.id]
        );
        if (hasSkill.length === 0) {
          await connection.query(
            'INSERT INTO technician_skills (technician_id, service_category_id, specialization) VALUES (?, ?, ?)',
            [tech.id, cat.id, `${cat.name} Specialist`]
          );
        }
      }

      // Ensure technician coverage area
      const [hasArea] = await connection.query(
        'SELECT id FROM technician_areas WHERE technician_id = ?',
        [tech.id]
      );
      if (hasArea.length === 0) {
        await connection.query(
          'INSERT INTO technician_areas (technician_id, area, city, pin_code) VALUES (?, ?, ?, ?)',
          [tech.id, tech.area, tech.city, tech.pin_code]
        );
      }
    }
    console.log('Mapped skills and coverage areas for all technicians.');

    // 5. Clean up duplicate legacy categories if present
    const [legacyCats] = await connection.query(
      `SELECT id FROM service_categories WHERE name IN (
        'Washing Machine Repair', 'Refrigerator Repair', 'Air Conditioner Service',
        'Microwave Oven Repair', 'Water Purifier (RO) Service'
      )`
    );
    if (legacyCats.length > 0) {
      const legacyIds = legacyCats.map(c => c.id);
      await connection.query(
        `UPDATE service_categories SET is_active = FALSE WHERE id IN (?)`,
        [legacyIds]
      );
      console.log('Deactivated legacy shorter category names in favor of comprehensive titles.');
    }

    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await connection.end();
  }
}

runSeed();
