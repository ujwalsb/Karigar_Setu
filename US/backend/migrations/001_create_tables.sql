CREATE DATABASE IF NOT EXISTS us_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE us_platform;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'support') DEFAULT 'support',
  phone VARCHAR(20) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  icon VARCHAR(50) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  alternate_mobile VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  photo_url VARCHAR(255) NULL,
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
);

CREATE TABLE IF NOT EXISTS technicians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
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
  INDEX idx_tech_pin (pin_code),
  INDEX idx_tech_area (area),
  INDEX idx_tech_status (status)
);

CREATE TABLE IF NOT EXISTS technician_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  technician_id INT NOT NULL,
  service_category_id INT NOT NULL,
  specialization VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ts_tech (technician_id),
  INDEX idx_ts_cat (service_category_id)
);

CREATE TABLE IF NOT EXISTS technician_areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  technician_id INT NOT NULL,
  area VARCHAR(100) NOT NULL,
  city VARCHAR(100) DEFAULT 'Pune',
  pin_code VARCHAR(10) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ta_tech (technician_id),
  INDEX idx_ta_pin (pin_code)
);

CREATE TABLE IF NOT EXISTS technician_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  technician_id INT NOT NULL,
  doc_type VARCHAR(50) NOT NULL,
  document_type VARCHAR(50) NULL,
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
);

CREATE TABLE IF NOT EXISTS customer_calls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  call_id VARCHAR(50) UNIQUE NOT NULL,
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
);

CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE NOT NULL,
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
  INDEX idx_sr_customer (customer_id),
  INDEX idx_sr_tech (assigned_technician_id),
  INDEX idx_sr_status (status)
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS service_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_request_id INT NOT NULL,
  old_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NULL,
  notes TEXT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ssh_sr (service_request_id)
);

