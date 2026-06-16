-- ============================================================
-- School Management System - Database Schema
-- Database: school_db
-- Matches design from: https://shools.lovable.app
-- ============================================================

CREATE DATABASE IF NOT EXISTS `school_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `school_db`;

-- =====================================================
-- TABLE: users (for login)
-- =====================================================
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'teacher', 'staff') NOT NULL DEFAULT 'staff',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: user_permissions (per-user staff access control)
-- =====================================================
CREATE TABLE IF NOT EXISTS `user_permissions` (
  `perm_id`       INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`       INT NOT NULL UNIQUE,
  `dashboard`     ENUM('full','readonly','limited','none') DEFAULT 'readonly',
  `students`      ENUM('full','readonly','limited','none') DEFAULT 'none',
  `staff`         ENUM('full','readonly','limited','none') DEFAULT 'none',
  `classes`       ENUM('full','readonly','limited','none') DEFAULT 'none',
  `attendance`    ENUM('full','readonly','limited','none') DEFAULT 'none',
  `assessments`   ENUM('full','readonly','limited','none') DEFAULT 'none',
  `scores`        ENUM('full','readonly','limited','none') DEFAULT 'none',
  `finance`       ENUM('full','readonly','limited','none') DEFAULT 'none',
  `transport`     ENUM('full','readonly','limited','none') DEFAULT 'none',
  `meals`         ENUM('full','readonly','limited','none') DEFAULT 'none',
  `health`        ENUM('full','readonly','limited','none') DEFAULT 'none',
  `communication` ENUM('full','readonly','limited','none') DEFAULT 'none',
  `calendar`      ENUM('full','readonly','limited','none') DEFAULT 'none',
  `schedule`      ENUM('full','readonly','limited','none') DEFAULT 'none',
  `inventory`     ENUM('full','readonly','limited','none') DEFAULT 'none',
  `reports`       ENUM('full','readonly','limited','none') DEFAULT 'none',
  `settings`      ENUM('full','readonly','limited','none') DEFAULT 'none',
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLE: classes (classrooms)
-- =====================================================
CREATE TABLE IF NOT EXISTS `classes` (
  `class_id` INT AUTO_INCREMENT PRIMARY KEY,
  `class_name` VARCHAR(100) NOT NULL,
  `level` VARCHAR(50) NOT NULL COMMENT 'e.g. Nursery, K1, K2, K3, P1, P2...',
  `capacity` INT DEFAULT 30,
  `room_number` VARCHAR(20),
  `mentor_teacher_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `schedule_entries` (
  `schedule_id` INT AUTO_INCREMENT PRIMARY KEY,
  `class_id` INT NULL,
  `teacher_id` INT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `day_of_week` ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL DEFAULT 'Monday',
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `room` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_schedule_day` (`day_of_week`, `start_time`),
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`class_id`) ON DELETE SET NULL,
  FOREIGN KEY (`teacher_id`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLE: staff (teachers and staff)
-- =====================================================
CREATE TABLE IF NOT EXISTS `staff` (
  `staff_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `full_name_lao` VARCHAR(200) NOT NULL,
  `full_name_eng` VARCHAR(200),
  `role` VARCHAR(100) NOT NULL COMMENT 'e.g. ຄູສອນ, ຜູ້ອຳນວຍການ, ພະນັກງານ',
  `department` VARCHAR(100),
  `phone` VARCHAR(30),
  `email` VARCHAR(100),
  `gender` ENUM('ຊາຍ','ຍິງ','ອື່ນໆ') DEFAULT 'ຊາຍ',
  `date_of_birth` DATE NULL,
  `hire_date` DATE,
  `profile_picture` VARCHAR(255) DEFAULT '',
  `status` ENUM('active','inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE `classes` ADD CONSTRAINT `fk_mentor_teacher` FOREIGN KEY (`mentor_teacher_id`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL;



-- =====================================================
-- TABLE: students
-- =====================================================
CREATE TABLE IF NOT EXISTS `students` (
  `student_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_code` VARCHAR(20) NOT NULL UNIQUE,
  `full_name_lao` VARCHAR(200) NOT NULL,
  `full_name_eng` VARCHAR(200),
  `gender` ENUM('ຊາຍ','ຍິງ') NOT NULL,
  `date_of_birth` DATE,
  `class_id` INT NULL,
  `parent_name` VARCHAR(200),
  `parent_phone` VARCHAR(30),
  `address` TEXT,
  `profile_picture` VARCHAR(255) DEFAULT '',
  `enrollment_date` DATE,
  `status` ENUM('ກຳລັງຮຽນ','ພັກການຮຽນ','ຮຽນຈົບ') DEFAULT 'ກຳລັງຮຽນ',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`class_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: attendance
-- =====================================================
CREATE TABLE IF NOT EXISTS `attendance` (
  `att_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `att_date` DATE NOT NULL,
  `status` ENUM('ມາຮຽນ','ຂາດຮຽນ','ມາຊ້າ','ປ່ວຍ','ລາ') NOT NULL DEFAULT 'ມາຮຽນ',
  `notes` TEXT,
  `recorded_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_student_date` (`student_id`, `att_date`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE,
  FOREIGN KEY (`recorded_by`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: assessments
-- =====================================================
CREATE TABLE IF NOT EXISTS `assessments` (
  `assess_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `term` VARCHAR(50) NOT NULL COMMENT 'e.g. Term 1 2024',
  `category` VARCHAR(100) NOT NULL COMMENT 'e.g. Physical, Social, Academic',
  `skill_name` VARCHAR(200) NOT NULL,
  `rating` TINYINT NOT NULL DEFAULT 3 COMMENT '1=ຕ້ອງປັບປຸງ, 2=ພໍໃຊ້, 3=ດີ, 4=ດີຫຼາຍ, 5=ດີເລີດ',
  `notes` TEXT,
  `assessed_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE,
  FOREIGN KEY (`assessed_by`) REFERENCES `staff`(`staff_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: student_scores (exam/check scores)
-- =====================================================
CREATE TABLE IF NOT EXISTS `student_scores` (
  `score_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `class_id` INT NULL,
  `academic_year` VARCHAR(20) NOT NULL COMMENT 'e.g. 2025-2026',
  `term` VARCHAR(50) NOT NULL COMMENT 'e.g. ເທີມ 1',
  `exam_type` VARCHAR(100) NOT NULL COMMENT 'e.g. ກວດກາຍ່ອຍ, ສອບເສັງກາງເທີມ',
  `subject` VARCHAR(150) NOT NULL,
  `score` DECIMAL(6,2) NOT NULL DEFAULT 0,
  `max_score` DECIMAL(6,2) NOT NULL DEFAULT 100,
  `score_date` DATE NULL,
  `notes` TEXT,
  `recorded_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_student_score_context` (`student_id`, `academic_year`, `term`, `exam_type`, `subject`),
  INDEX `idx_scores_context` (`academic_year`, `term`, `exam_type`, `subject`),
  INDEX `idx_scores_class` (`class_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`class_id`) ON DELETE SET NULL,
  FOREIGN KEY (`recorded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================
-- TABLE: finance_categories
-- =====================================================
CREATE TABLE IF NOT EXISTS `finance_categories` (
  `cat_id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('income','expense') NOT NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: finance_transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS `finance_transactions` (
  `tx_id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NULL,
  `category_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `type` ENUM('income','expense') NOT NULL,
  `status` ENUM('paid','pending','overdue') DEFAULT 'pending',
  `due_date` DATE NULL,
  `tx_date` DATE NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE SET NULL,
  FOREIGN KEY (`category_id`) REFERENCES `finance_categories`(`cat_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: transport_vehicles
-- =====================================================
CREATE TABLE IF NOT EXISTS `transport_vehicles` (
  `vehicle_id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicle_name` VARCHAR(100) NOT NULL,
  `plate_number` VARCHAR(30) NOT NULL,
  `type` ENUM('ລົດຕູ້','ລົດບັດ','ອື່ນໆ') DEFAULT 'ລົດຕູ້',
  `capacity` INT DEFAULT 15,
  `driver_name` VARCHAR(200),
  `driver_phone` VARCHAR(30),
  `route_name` VARCHAR(200),
  `status` ENUM('active','inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: transport_students (linking table)
-- =====================================================
CREATE TABLE IF NOT EXISTS `transport_students` (
  `ts_id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicle_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  UNIQUE KEY `unique_transport` (`vehicle_id`, `student_id`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `transport_vehicles`(`vehicle_id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: meals
-- =====================================================
CREATE TABLE IF NOT EXISTS `meals` (
  `meal_id` INT AUTO_INCREMENT PRIMARY KEY,
  `day_of_week` ENUM('ຈັນ','ອັງຄານ','ພຸດ','ພະຫັດ','ສຸກ') NOT NULL,
  `meal_time` ENUM('ອາຫານເຊົ້າ','ອາຫານວ່າງເຊົ້າ','ອາຫານທ່ຽງ','ອາຫານວ່າງບ່າຍ') NOT NULL,
  `menu_description` TEXT NOT NULL,
  `week_date` DATE NULL COMMENT 'The Monday of the week this applies',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- TABLE: calendar_events
-- =====================================================
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `event_id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `event_date` DATE NOT NULL,
  `color` CHAR(7) NOT NULL DEFAULT '#22c55e',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_event_date` (`event_date`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: admin123)
INSERT IGNORE INTO `users` (`username`, `password_hash`, `role`) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Classes
INSERT IGNORE INTO `classes` (`class_name`, `level`, `capacity`, `room_number`) VALUES
('ອະນຸບານ Nursery A', 'Nursery', 20, 'N-01'),
('ອະນຸບານ K1 A', 'K1', 25, 'K1-01'),
('ອະນຸບານ K1 B', 'K1', 25, 'K1-02'),
('ອະນຸບານ K2 A', 'K2', 25, 'K2-01'),
('ອະນຸບານ K2 B', 'K2', 25, 'K2-02'),
('ອະນຸບານ K3 A', 'K3', 25, 'K3-01'),
('ປະຖົມ ປ.1 A', 'P1', 30, 'P1-01'),
('ປະຖົມ ປ.2 A', 'P2', 30, 'P2-01'),
('ປະຖົມ ປ.3 A', 'P3', 30, 'P3-01'),
('ປະຖົມ ປ.4 A', 'P4', 30, 'P4-01'),
('ປະຖົມ ປ.5 A', 'P5', 30, 'P5-01');

INSERT IGNORE INTO `classes` (`class_name`, `level`, `capacity`, `room_number`) VALUES
('ມໍຕົ້ນ ມ.1 A', 'M1', 50, 'M1-01'),
('ມໍຕົ້ນ ມ.2 A', 'M2', 50, 'M2-01'),
('ມໍຕົ້ນ ມ.3 A', 'M3', 50, 'M3-01'),
('ມໍຕົ້ນ ມ.4 A', 'M4', 50, 'M4-01'),
('ມໍປາຍ ມ.5 A', 'M5', 30, 'M5-01'),
('ມໍປາຍ ມ.6 A', 'M6', 30, 'M6-01'),
('ມໍປາຍ ມ.7 A', 'M7', 30, 'M7-01');
-- Staff
INSERT IGNORE INTO `staff` (`full_name_lao`, `full_name_eng`, `role`, `department`, `phone`, `gender`, `hire_date`, `status`) VALUES
('ທ່ານ ນາງ ດາ ສຸລິຍະວົງ', 'Mrs. Da Souriyavong', 'ຜູ້ອຳນວຍການ', 'ບໍລິຫານ', '020 55 100 001', 'ຍິງ', '2015-01-01', 'active'),
('ທ່ານ ນາງ ນ້ຳຝົນ ພົມມາ', 'Mrs. Namfon Phomma', 'ຄູສອນ', 'ອະນຸບານ', '020 55 100 002', 'ຍິງ', '2018-06-01', 'active'),
('ທ່ານ ນາງ ມາລາ ສີວິໄລ', 'Mrs. Mala Sivilai', 'ຄູສອນ', 'ອະນຸບານ', '020 55 100 003', 'ຍິງ', '2019-08-01', 'active'),
('ທ່ານ ສົມໄຊ ໄຊຍະວົງ', 'Mr. Somsai Xaiyavong', 'ຄູສອນ', 'ປະຖົມ', '020 55 100 004', 'ຊາຍ', '2017-01-01', 'active'),
('ທ່ານ ນາງ ອ່ອນ ດວງທິບ', 'Mrs. On Duangthip', 'ຄູສອນ', 'ປະຖົມ', '020 55 100 005', 'ຍິງ', '2020-01-01', 'active'),
('ທ່ານ ວິໄລ ເພັດດາລາ', 'Mr. Vilai Phetdala', 'ພະນັກງານ', 'ທົ່ວໄປ', '020 55 100 006', 'ຊາຍ', '2021-03-01', 'active');

-- Sample Students
INSERT IGNORE INTO `students` (`student_code`, `full_name_lao`, `full_name_eng`, `gender`, `date_of_birth`, `class_id`, `parent_name`, `parent_phone`, `enrollment_date`, `status`) VALUES
('STD-2024-001', 'ດາວ ສຸລິຍະ', 'Dao Souriya', 'ຍິງ', '2019-05-10', 1, 'ທ່ານ ນາງ ສາ ສຸລິຍະ', '020 77 100 001', '2024-06-01', 'ກຳລັງຮຽນ'),
('STD-2024-002', 'ດວງ ພົມມາ', 'Duang Phomma', 'ຊາຍ', '2018-11-20', 2, 'ທ່ານ ນາງ ໜ້ອຍ ພົມມາ', '020 77 100 002', '2024-06-01', 'ກຳລັງຮຽນ'),
('STD-2024-003', 'ນ້ຳ ສີວິໄລ', 'Nam Sivilai', 'ຍິງ', '2017-03-15', 4, 'ທ່ານ ສົມ ສີວິໄລ', '020 77 100 003', '2024-06-01', 'ກຳລັງຮຽນ'),
('STD-2024-004', 'ກ້ອງ ໄຊຍະ', 'Gong Xaiya', 'ຊາຍ', '2016-09-05', 7, 'ທ່ານ ນາງ ຄຳ ໄຊຍະ', '020 77 100 004', '2024-06-01', 'ກຳລັງຮຽນ'),
('STD-2024-005', 'ຝົນ ເພັດດາລາ', 'Fon Phetdala', 'ຍິງ', '2015-07-22', 8, 'ທ່ານ ວ ເພັດດາລາ', '020 77 100 005', '2024-06-01', 'ກຳລັງຮຽນ'),
('STD-2024-006', 'ບຸນ ດວງທິບ', 'Boun Duangthip', 'ຊາຍ', '2015-12-01', 9, 'ທ່ານ ນາງ ອ ດວງທິບ', '020 77 100 006', '2024-06-01', 'ກຳລັງຮຽນ');

-- Finance categories
INSERT IGNORE INTO `finance_categories` (`name`, `type`) VALUES
('ຄ່າຮຽນ', 'income'),
('ຄ່າລົດ', 'income'),
('ຄ່າອາຫານ', 'income'),
('ຄ່າເງິນເດືອນ', 'expense'),
('ຄ່າບໍາລຸງ', 'expense'),
('ຄ່ານ້ຳ-ໄຟ', 'expense');

-- Sample finance transactions
INSERT IGNORE INTO `finance_transactions` (`student_id`, `category_id`, `title`, `amount`, `type`, `status`, `due_date`, `tx_date`) VALUES
(1, 1, 'ຄ່າຮຽນ ເດືອນ ມີນາ - ດາວ ສຸລິຍະ', 850000, 'income', 'paid', '2026-03-05', '2026-03-03'),
(2, 1, 'ຄ່າຮຽນ ເດືອນ ມີນາ - ດວງ ພົມມາ', 850000, 'income', 'pending', '2026-03-05', NULL),
(3, 1, 'ຄ່າຮຽນ ເດືອນ ມີນາ - ນ້ຳ ສີວິໄລ', 850000, 'income', 'overdue', '2026-03-01', NULL),
(NULL, 4, 'ຄ່າເງິນເດືອນພະນັກງານ ມີນາ', 15000000, 'expense', 'paid', '2026-03-25', '2026-03-25'),
(NULL, 6, 'ຄ່ານ້ຳ-ໄຟ ເດືອນ ກຸມພາ', 800000, 'expense', 'paid', '2026-03-10', '2026-03-09');

-- Transport vehicles
INSERT IGNORE INTO `transport_vehicles` (`vehicle_name`, `plate_number`, `type`, `capacity`, `driver_name`, `driver_phone`, `route_name`, `status`) VALUES
('ລົດຕູ້ 01', 'GN-1234', 'ລົດຕູ້', 15, 'ທ່ານ ໄຊ ສີດາ', '020 99 001 001', 'ສາຍ A - ທ່ານ ເຕ-ໂພນສາ', 'active'),
('ລົດຕູ້ 02', 'GN-5678', 'ລົດຕູ້', 15, 'ທ່ານ ສຸ ດາວ', '020 99 001 002', 'ສາຍ B - ໂພນທັນ-ດົງໂດກ', 'active'),
('ລົດບັດ 01', 'GN-9012', 'ລົດບັດ', 30, 'ທ່ານ ຄຳ ສີ', '020 99 001 003', 'ສາຍ C - ສີສັດຕະນາກ', 'active');

-- Meals (current week)
INSERT IGNORE INTO `meals` (`day_of_week`, `meal_time`, `menu_description`, `week_date`) VALUES
('ຈັນ', 'ອາຫານເຊົ້າ', 'ເຂົ້າຈີ່ + ນົມ + ໄຂ່ຕົ້ມ', '2026-03-16'),
('ຈັນ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ກ້ວຍ, ໝາກຂາມ', '2026-03-16'),
('ຈັນ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບໄກ່ + ຜັກຕົ້ມ', '2026-03-16'),
('ຈັນ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້ + ເຂົ້າໜົມ', '2026-03-16'),
('ອັງຄານ', 'ອາຫານເຊົ້າ', 'ຂະໜົມຈີນ + ນ້ຳຍາ', '2026-03-16'),
('ອັງຄານ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກພ້າວ', '2026-03-16'),
('ອັງຄານ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ປາທອດ + ຜັກ', '2026-03-16'),
('ອັງຄານ', 'ອາຫານວ່າງບ່າຍ', 'ນົມ + ເຂົ້າໜົມ', '2026-03-16'),
('ພຸດ', 'ອາຫານເຊົ້າ', 'ເຂົ້າໜຽວ + ໄກ່ຢ່າງ', '2026-03-16'),
('ພຸດ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກຫຸ່ງ', '2026-03-16'),
('ພຸດ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບຜັກ + ຊີ້ນໝູ', '2026-03-16'),
('ພຸດ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້', '2026-03-16'),
('ພະຫັດ', 'ອາຫານເຊົ້າ', 'ໂຈ໋ + ໄຂ່ + ຜັກ', '2026-03-16'),
('ພະຫັດ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກຊ', '2026-03-16'),
('ພະຫັດ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ໄກ່ຜັດ + ຜັກ', '2026-03-16'),
('ພະຫັດ', 'ອາຫານວ່າງບ່າຍ', 'ນົມ + ຫມາກໄມ້', '2026-03-16'),
('ສຸກ', 'ອາຫານເຊົ້າ', 'ບ່ວຍ + ຂະໜົມ', '2026-03-16'),
('ສຸກ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກນາວ', '2026-03-16'),
('ສຸກ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບໄກ່ + ເຂົ້າໜົມ', '2026-03-16'),
('ສຸກ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້ + ໝາກໄມ້ສົດ', '2026-03-16');

-- Calendar events
INSERT IGNORE INTO `calendar_events` (`event_id`, `title`, `event_date`, `color`, `created_by`) VALUES
(1, 'ງານກິລາໂຮງຮຽນ', '2026-03-20', '#22c55e', 1),
(2, 'ການສອບເສັງ ຄັ້ງ 1', '2026-03-22', '#3b82f6', 1),
(3, 'ຊຳລະຄ່າຮຽນ', '2026-03-28', '#f97316', 1),
(4, 'ວັນປີໃໝ່ລາວ', '2026-04-14', '#ec4899', 1);
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(50) PRIMARY KEY,
  `setting_value` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES
('school_name_lo', 'ໂຮງຮຽນອະນຸບານ ແລະ ປະຖົມ ນາໆຊາດ'),
('school_name_en', 'International Kindergarten & Primary School'),
('license', 'EDU-2024-0123'),
('principal', 'ທ່ານ ນາງ ດາ ສຸລິຍະວົງ'),
('phone', '021 XXX XXX'),
('email', 'info@school.la'),
('address', 'ນະຄອນຫຼວງວຽງຈັນ, ລາວ'),
('vision', 'ສ້າງເດັກທີ່ມີຄຸນນະທຳ, ຄວາມຮູ້ ແລະ ທັກສະ ສຳລັບຊັດຕະວັດທີ 21'),
('academic_year', '2024-2025'),
('academic_status', 'active'),
('term_start', '2024-06-01'),
('term_end', '2025-04-30');
