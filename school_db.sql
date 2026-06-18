-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 18, 2026 at 03:05 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `school_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `att_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `att_date` date NOT NULL,
  `status` enum('ມາຮຽນ','ຂາດຮຽນ','ມາຊ້າ','ປ່ວຍ','ລາ') NOT NULL DEFAULT 'ມາຮຽນ',
  `notes` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `calendar_events`
--

CREATE TABLE `calendar_events` (
  `event_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `event_date` date NOT NULL,
  `color` char(7) NOT NULL DEFAULT '#22c55e',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `calendar_events`
--

INSERT INTO `calendar_events` (`event_id`, `title`, `event_date`, `color`, `created_by`, `created_at`) VALUES
(3, 'ພັກບຸນປິໄຫມ', '2026-05-29', '#213cc4', 1, '2026-05-29 02:21:57'),
(4, 'ວັນເດັກນ້ອຍ ສາກົນ', '2026-06-01', '#2158c4', 1, '2026-06-01 10:13:54');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `class_id` int(11) NOT NULL,
  `class_name` varchar(100) NOT NULL,
  `level` varchar(50) NOT NULL COMMENT 'e.g. Nursery, K1, K2, K3, P1, P2...',
  `capacity` int(11) DEFAULT 30,
  `room_number` varchar(20) DEFAULT NULL,
  `mentor_teacher_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`class_id`, `class_name`, `level`, `capacity`, `room_number`, `mentor_teacher_id`, `created_at`) VALUES
(1, 'ອະນຸບານ Nursery A', 'Nursery', 20, 'N-01', 12, '2026-03-14 08:58:54'),
(2, 'ອະນຸບານ K1 A', 'K1', 25, 'K1-01', 11, '2026-03-14 08:58:54'),
(3, 'ອະນຸບານ K1 B', 'K1', 25, 'K1-02', 10, '2026-03-14 08:58:54'),
(4, 'ອະນຸບານ K2 A', 'K2', 25, 'K2-01', 9, '2026-03-14 08:58:54'),
(5, 'ອະນຸບານ K2 B', 'K2', 25, 'K2-02', 8, '2026-03-14 08:58:54'),
(6, 'ອະນຸບານ K3 A', 'K3', 25, 'K3-01', 7, '2026-03-14 08:58:54'),
(7, 'ປະຖົມ ປ.1 A', 'P1', 30, 'P1-01', 6, '2026-03-14 08:58:54'),
(8, 'ປະຖົມ ປ.2 A', 'P2', 30, 'P2-01', 5, '2026-03-14 08:58:54'),
(9, 'ປະຖົມ ປ.3 A', 'P3', 30, 'P3-01', 4, '2026-03-14 08:58:54'),
(10, 'ປະຖົມ ປ.4 A', 'P4', 30, 'P4-01', NULL, '2026-03-14 08:58:54'),
(11, 'ປະຖົມ ປ.5 A', 'P5', 30, 'P5-01', NULL, '2026-03-14 08:58:54');

-- --------------------------------------------------------

--
-- Table structure for table `finance_categories`
--

CREATE TABLE `finance_categories` (
  `cat_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('income','expense') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `finance_categories`
--

INSERT INTO `finance_categories` (`cat_id`, `name`, `type`) VALUES
(1, 'ຄ່າຮຽນ', 'income'),
(2, 'ຄ່າລົດ', 'income'),
(3, 'ຄ່າອາຫານ', 'income'),
(4, 'ຄ່າເງິນເດືອນ', 'expense'),
(5, 'ຄ່າບໍາລຸງ', 'expense'),
(6, 'ຄ່ານ້ຳ-ໄຟ', 'expense');

-- --------------------------------------------------------

--
-- Table structure for table `finance_transactions`
--

CREATE TABLE `finance_transactions` (
  `tx_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `status` enum('paid','pending','overdue') DEFAULT 'pending',
  `due_date` date DEFAULT NULL,
  `tx_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `finance_transactions`
--

INSERT INTO `finance_transactions` (`tx_id`, `student_id`, `category_id`, `title`, `amount`, `type`, `status`, `due_date`, `tx_date`, `notes`, `created_at`) VALUES
(45, 136, 1, 'ຄ່າເທີມນັກຮຽນ', 7000000.00, 'income', 'paid', NULL, '2026-06-18', '', '2026-06-18 13:02:26'),
(46, NULL, 6, 'ຄ່າ ນ້ຳ ເເລະ ໄຟຟ້າ', 1000000.00, 'expense', 'paid', '2026-06-18', '2026-06-18', '', '2026-06-18 13:04:03');

-- --------------------------------------------------------

--
-- Table structure for table `health_alerts`
--

CREATE TABLE `health_alerts` (
  `alert_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `allergy` varchar(100) DEFAULT NULL,
  `symptoms` varchar(255) DEFAULT NULL,
  `advice` varchar(255) DEFAULT NULL,
  `severity` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `health_records`
--

CREATE TABLE `health_records` (
  `record_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `visit_date` date DEFAULT NULL,
  `symptoms` varchar(255) DEFAULT NULL,
  `diagnosis` varchar(255) DEFAULT NULL,
  `treatment` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_logs`
--

CREATE TABLE `login_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT '',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `logged_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_logs`
--

INSERT INTO `login_logs` (`log_id`, `user_id`, `username`, `role`, `ip_address`, `user_agent`, `logged_at`) VALUES
(1, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-15 21:24:55'),
(2, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-15 22:03:29'),
(3, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-15 22:06:50'),
(4, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-15 22:27:09'),
(5, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0', '2026-06-15 22:29:16'),
(6, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-16 17:56:19'),
(7, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-17 10:11:43'),
(8, 14, 'TT', 'teacher', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-17 10:14:30'),
(9, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-17 10:18:46'),
(10, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-18 08:31:58'),
(11, 1, 'admin', 'admin', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', '2026-06-18 19:35:53');

-- --------------------------------------------------------

--
-- Table structure for table `meals`
--

CREATE TABLE `meals` (
  `meal_id` int(11) NOT NULL,
  `day_of_week` enum('ຈັນ','ອັງຄານ','ພຸດ','ພະຫັດ','ສຸກ') NOT NULL,
  `meal_time` enum('ອາຫານເຊົ້າ','ອາຫານວ່າງເຊົ້າ','ອາຫານທ່ຽງ','ອາຫານວ່າງບ່າຍ') NOT NULL,
  `menu_description` text NOT NULL,
  `week_date` date DEFAULT NULL COMMENT 'The Monday of the week this applies',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `meals`
--

INSERT INTO `meals` (`meal_id`, `day_of_week`, `meal_time`, `menu_description`, `week_date`, `created_at`) VALUES
(1, 'ຈັນ', 'ອາຫານເຊົ້າ', 'ເຂົ້າຈີ່ + ນົມ + ໄຂ່ຕົ້ມ', '2026-03-16', '2026-03-14 08:58:54'),
(2, 'ຈັນ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ກ້ວຍ, ໝາກຂາມ', '2026-03-16', '2026-03-14 08:58:54'),
(3, 'ຈັນ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບໄກ່ + ຜັກຕົ້ມ', '2026-03-16', '2026-03-14 08:58:54'),
(4, 'ຈັນ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້ + ເຂົ້າໜົມ', '2026-03-16', '2026-03-14 08:58:54'),
(5, 'ອັງຄານ', 'ອາຫານເຊົ້າ', 'ຂະໜົມຈີນ + ນ້ຳຍາ', '2026-03-16', '2026-03-14 08:58:54'),
(6, 'ອັງຄານ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກພ້າວ', '2026-03-16', '2026-03-14 08:58:54'),
(7, 'ອັງຄານ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ປາທອດ + ຜັກ', '2026-03-16', '2026-03-14 08:58:54'),
(8, 'ອັງຄານ', 'ອາຫານວ່າງບ່າຍ', 'ນົມ + ເຂົ້າໜົມ', '2026-03-16', '2026-03-14 08:58:54'),
(9, 'ພຸດ', 'ອາຫານເຊົ້າ', 'ເຂົ້າໜຽວ + ໄກ່ຢ່າງ', '2026-03-16', '2026-03-14 08:58:54'),
(10, 'ພຸດ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກຫຸ່ງ', '2026-03-16', '2026-03-14 08:58:54'),
(11, 'ພຸດ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບຜັກ + ຊີ້ນໝູ', '2026-03-16', '2026-03-14 08:58:54'),
(12, 'ພຸດ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້', '2026-03-16', '2026-03-14 08:58:54'),
(13, 'ພະຫັດ', 'ອາຫານເຊົ້າ', 'ໂຈ໋ + ໄຂ່ + ຜັກ', '2026-03-16', '2026-03-14 08:58:54'),
(14, 'ພະຫັດ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກຊ', '2026-03-16', '2026-03-14 08:58:54'),
(15, 'ພະຫັດ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ໄກ່ຜັດ + ຜັກ', '2026-03-16', '2026-03-14 08:58:54'),
(16, 'ພະຫັດ', 'ອາຫານວ່າງບ່າຍ', 'ນົມ + ຫມາກໄມ້', '2026-03-16', '2026-03-14 08:58:54'),
(17, 'ສຸກ', 'ອາຫານເຊົ້າ', 'ບ່ວຍ + ຂະໜົມ', '2026-03-16', '2026-03-14 08:58:54'),
(18, 'ສຸກ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກນາວ', '2026-03-16', '2026-03-14 08:58:54'),
(19, 'ສຸກ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບໄກ່ + ເຂົ້າໜົມ', '2026-03-16', '2026-03-14 08:58:54'),
(20, 'ສຸກ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້ + ໝາກໄມ້ສົດ', '2026-03-16', '2026-03-14 08:58:54'),
(22, 'ຈັນ', 'ອາຫານເຊົ້າ', 'ເຂົ້າຈີ່ + ນົມ + ໄຂ່ຕົ້ມ', '2026-03-16', '2026-03-14 10:41:04'),
(23, 'ຈັນ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ກ້ວຍ, ໝາກຂາມ', '2026-03-16', '2026-03-14 10:41:04'),
(24, 'ຈັນ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບໄກ່ + ຜັກຕົ້ມ', '2026-03-16', '2026-03-14 10:41:04'),
(25, 'ຈັນ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້ + ເຂົ້າໜົມ', '2026-03-16', '2026-03-14 10:41:04'),
(26, 'ອັງຄານ', 'ອາຫານເຊົ້າ', 'ຂະໜົມຈີນ + ນ້ຳຍາ', '2026-03-16', '2026-03-14 10:41:04'),
(27, 'ອັງຄານ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກພ້າວ', '2026-03-16', '2026-03-14 10:41:04'),
(28, 'ອັງຄານ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ປາທອດ + ຜັກ', '2026-03-16', '2026-03-14 10:41:04'),
(29, 'ອັງຄານ', 'ອາຫານວ່າງບ່າຍ', 'ນົມ + ເຂົ້າໜົມ', '2026-03-16', '2026-03-14 10:41:04'),
(30, 'ພຸດ', 'ອາຫານເຊົ້າ', 'ເຂົ້າໜຽວ + ໄກ່ຢ່າງ', '2026-03-16', '2026-03-14 10:41:04'),
(31, 'ພຸດ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກຫຸ່ງ', '2026-03-16', '2026-03-14 10:41:04'),
(32, 'ພຸດ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບຜັກ + ຊີ້ນໝູ', '2026-03-16', '2026-03-14 10:41:04'),
(33, 'ພຸດ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້', '2026-03-16', '2026-03-14 10:41:04'),
(34, 'ພະຫັດ', 'ອາຫານເຊົ້າ', 'ໂຈ໋ + ໄຂ່ + ຜັກ', '2026-03-16', '2026-03-14 10:41:04'),
(35, 'ພະຫັດ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກຊ', '2026-03-16', '2026-03-14 10:41:04'),
(36, 'ພະຫັດ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ໄກ່ຜັດ + ຜັກ', '2026-03-16', '2026-03-14 10:41:04'),
(37, 'ພະຫັດ', 'ອາຫານວ່າງບ່າຍ', 'ນົມ + ຫມາກໄມ້', '2026-03-16', '2026-03-14 10:41:04'),
(38, 'ສຸກ', 'ອາຫານເຊົ້າ', 'ບ່ວຍ + ຂະໜົມ', '2026-03-16', '2026-03-14 10:41:04'),
(39, 'ສຸກ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ - ໝາກນາວ', '2026-03-16', '2026-03-14 10:41:04'),
(40, 'ສຸກ', 'ອາຫານທ່ຽງ', 'ເຂົ້າ + ຊຸບໄກ່ + ເຂົ້າໜົມ', '2026-03-16', '2026-03-14 10:41:04'),
(41, 'ສຸກ', 'ອາຫານວ່າງບ່າຍ', 'ນ້ຳໝາກໄມ້ + ໝາກໄມ້ສົດ', '2026-03-16', '2026-03-14 10:41:04'),
(45, 'ຈັນ', 'ອາຫານເຊົ້າ', 'ແກງຈືດສາລ່າຍ + ຂົ້ວຜັກລວມມິດ', '2026-06-08', '2026-06-08 14:48:01'),
(46, 'ຈັນ', 'ອາຫານວ່າງເຊົ້າ', 'ໝາກໄມ້ 3 ຢ່າງ  + ນົມ', '2026-06-08', '2026-06-08 14:49:00');

-- --------------------------------------------------------

--
-- Table structure for table `schedule_entries`
--

CREATE TABLE `schedule_entries` (
  `schedule_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `subject` varchar(150) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL DEFAULT 'Monday',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schedule_entries`
--

INSERT INTO `schedule_entries` (`schedule_id`, `class_id`, `teacher_id`, `subject`, `day_of_week`, `start_time`, `end_time`, `room`, `notes`, `created_at`) VALUES
(21, NULL, 11, 'ຫັດອ່ານ+ຫັດກ່າຍ', 'Monday', '08:30:00', '10:00:00', '', NULL, '2026-06-08 09:47:42'),
(22, NULL, 4, 'ພະລະ', 'Monday', '10:30:00', '11:30:00', '', NULL, '2026-06-08 09:47:42'),
(23, NULL, 10, 'E', 'Monday', '13:00:00', '15:30:00', '', NULL, '2026-06-08 09:47:42'),
(24, NULL, 4, 'ຄະນິດສາດ', 'Tuesday', '08:30:00', '10:00:00', '', NULL, '2026-06-08 09:47:42'),
(25, NULL, 5, 'ສິລະປະກຳ', 'Tuesday', '10:30:00', '11:30:00', '', NULL, '2026-06-08 09:47:42'),
(26, NULL, 10, 'E', 'Tuesday', '13:00:00', '15:30:00', '', NULL, '2026-06-08 09:47:42'),
(27, NULL, 4, 'ຫັດອ່ານ+ຫັດແຕ່ງ', 'Wednesday', '08:30:00', '10:00:00', '', NULL, '2026-06-08 09:47:42'),
(28, NULL, 5, 'ຄຸນສົມບັດ', 'Wednesday', '10:30:00', '11:30:00', '', NULL, '2026-06-08 09:47:42'),
(29, NULL, 10, 'E', 'Wednesday', '13:00:00', '15:30:00', '', NULL, '2026-06-08 09:47:42'),
(30, NULL, 4, 'ຄະນິດສາດ', 'Thursday', '08:30:00', '10:00:00', '', NULL, '2026-06-08 09:47:42'),
(31, NULL, 11, 'ວິທະຍາສາດ', 'Thursday', '10:30:00', '11:30:00', '', NULL, '2026-06-08 09:47:42'),
(32, NULL, 10, 'E', 'Thursday', '13:00:00', '15:30:00', '', NULL, '2026-06-08 09:47:42'),
(33, NULL, 11, 'ຫັດອ່ານ+ຮຽນທວາຍ', 'Friday', '08:30:00', '10:00:00', '', NULL, '2026-06-08 09:47:42'),
(34, NULL, 4, 'ຄະນິດສາດ', 'Friday', '10:30:00', '11:30:00', '', NULL, '2026-06-08 09:47:42'),
(35, NULL, 10, 'E', 'Friday', '13:00:00', '15:30:00', '', NULL, '2026-06-08 09:47:42'),
(148, 1, NULL, 'Student\'s book', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(149, 1, NULL, 'Student\'s book', 'Monday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(150, 1, NULL, 'Student\'s book', 'Monday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(151, 1, NULL, 'Student\'s book', 'Monday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(152, 1, NULL, 'Activity book', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(153, 1, NULL, 'Activity book', 'Tuesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(154, 1, NULL, 'Activity book', 'Tuesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(155, 1, NULL, 'Activity book', 'Tuesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(156, 1, NULL, 'Phonics', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(157, 1, NULL, 'Phonics', 'Wednesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(158, 1, NULL, 'Phonics', 'Wednesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(159, 1, NULL, 'Phonics', 'Wednesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(160, 1, NULL, 'Numeracy', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(161, 1, NULL, 'Numeracy', 'Thursday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(162, 1, NULL, 'Numeracy', 'Thursday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(163, 1, NULL, 'Numeracy', 'Thursday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(164, 1, NULL, 'Activity', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(165, 1, NULL, 'Activity', 'Friday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(166, 1, NULL, 'Activity', 'Friday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(167, 1, NULL, 'Activity', 'Friday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(168, 2, NULL, 'Student\'s book', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(169, 2, NULL, 'Student\'s book', 'Monday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(170, 2, NULL, 'Student\'s book', 'Monday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(171, 2, NULL, 'Student\'s book', 'Monday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(172, 2, NULL, 'Activity book', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(173, 2, NULL, 'Activity book', 'Tuesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(174, 2, NULL, 'Activity book', 'Tuesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(175, 2, NULL, 'Activity book', 'Tuesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(176, 2, NULL, 'Phonics', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(177, 2, NULL, 'Phonics', 'Wednesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(178, 2, NULL, 'Phonics', 'Wednesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(179, 2, NULL, 'Phonics', 'Wednesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(180, 2, NULL, 'Numeracy', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(181, 2, NULL, 'Numeracy', 'Thursday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(182, 2, NULL, 'Numeracy', 'Thursday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(183, 2, NULL, 'Numeracy', 'Thursday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(184, 2, NULL, 'Activity', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(185, 2, NULL, 'Activity', 'Friday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(186, 2, NULL, 'Activity', 'Friday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(187, 2, NULL, 'Activity', 'Friday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(188, 3, NULL, 'Student\'s book', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(189, 3, NULL, 'Student\'s book', 'Monday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(190, 3, NULL, 'Student\'s book', 'Monday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(191, 3, NULL, 'Student\'s book', 'Monday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(192, 3, NULL, 'Activity book', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(193, 3, NULL, 'Activity book', 'Tuesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(194, 3, NULL, 'Activity book', 'Tuesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(195, 3, NULL, 'Activity book', 'Tuesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(196, 3, NULL, 'Phonics', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(197, 3, NULL, 'Phonics', 'Wednesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(198, 3, NULL, 'Phonics', 'Wednesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(199, 3, NULL, 'Phonics', 'Wednesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(200, 3, NULL, 'Numeracy', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(201, 3, NULL, 'Numeracy', 'Thursday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(202, 3, NULL, 'Numeracy', 'Thursday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(203, 3, NULL, 'Numeracy', 'Thursday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(204, 3, NULL, 'Activity', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(205, 3, NULL, 'Activity', 'Friday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(206, 3, NULL, 'Activity', 'Friday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(207, 3, NULL, 'Activity', 'Friday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(208, 4, NULL, 'Student\'s book', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(209, 4, NULL, 'Student\'s book', 'Monday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(210, 4, NULL, 'Student\'s book', 'Monday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(211, 4, NULL, 'Student\'s book', 'Monday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(212, 4, NULL, 'Activity book', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(213, 4, NULL, 'Activity book', 'Tuesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(214, 4, NULL, 'Activity book', 'Tuesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(215, 4, NULL, 'Activity book', 'Tuesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(216, 4, NULL, 'Phonics', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(217, 4, NULL, 'Phonics', 'Wednesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(218, 4, NULL, 'Phonics', 'Wednesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(219, 4, NULL, 'Phonics', 'Wednesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(220, 4, NULL, 'Numeracy', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(221, 4, NULL, 'Numeracy', 'Thursday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(222, 4, NULL, 'Numeracy', 'Thursday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(223, 4, NULL, 'Numeracy', 'Thursday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(224, 4, NULL, 'Activity', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(225, 4, NULL, 'Activity', 'Friday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(226, 4, NULL, 'Activity', 'Friday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(227, 4, NULL, 'Activity', 'Friday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(228, 5, NULL, 'Student\'s book', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(229, 5, NULL, 'Student\'s book', 'Monday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(230, 5, NULL, 'Student\'s book', 'Monday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(231, 5, NULL, 'Student\'s book', 'Monday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(232, 5, NULL, 'Activity book', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(233, 5, NULL, 'Activity book', 'Tuesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(234, 5, NULL, 'Activity book', 'Tuesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(235, 5, NULL, 'Activity book', 'Tuesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(236, 5, NULL, 'Phonics', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(237, 5, NULL, 'Phonics', 'Wednesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(238, 5, NULL, 'Phonics', 'Wednesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(239, 5, NULL, 'Phonics', 'Wednesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(240, 5, NULL, 'Numeracy', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(241, 5, NULL, 'Numeracy', 'Thursday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(242, 5, NULL, 'Numeracy', 'Thursday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(243, 5, NULL, 'Numeracy', 'Thursday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(244, 5, NULL, 'Activity', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(245, 5, NULL, 'Activity', 'Friday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(246, 5, NULL, 'Activity', 'Friday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(247, 5, NULL, 'Activity', 'Friday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(248, 6, NULL, 'Student\'s book', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(249, 6, NULL, 'Student\'s book', 'Monday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:42'),
(250, 6, NULL, 'Student\'s book', 'Monday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:42'),
(251, 6, NULL, 'Student\'s book', 'Monday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(252, 6, NULL, 'Activity book', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:42'),
(253, 6, NULL, 'Activity book', 'Tuesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:43'),
(254, 6, NULL, 'Activity book', 'Tuesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:43'),
(255, 6, NULL, 'Activity book', 'Tuesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:43'),
(256, 6, NULL, 'Phonics', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:43'),
(257, 6, NULL, 'Phonics', 'Wednesday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:43'),
(258, 6, NULL, 'Phonics', 'Wednesday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:43'),
(259, 6, NULL, 'Phonics', 'Wednesday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:43'),
(260, 6, NULL, 'Numeracy', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:43'),
(261, 6, NULL, 'Numeracy', 'Thursday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:43'),
(262, 6, NULL, 'Numeracy', 'Thursday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:43'),
(263, 6, NULL, 'Numeracy', 'Thursday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:43'),
(264, 6, NULL, 'Activity', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:43:43'),
(265, 6, NULL, 'Activity', 'Friday', '10:00:00', '11:30:00', NULL, NULL, '2026-06-10 09:43:43'),
(266, 6, NULL, 'Activity', 'Friday', '13:30:00', '14:45:00', NULL, NULL, '2026-06-10 09:43:43'),
(267, 6, NULL, 'Activity', 'Friday', '14:45:00', '16:00:00', NULL, NULL, '2026-06-10 09:43:43'),
(290, 7, NULL, 'ຫັດອ່ານ+ຫັດກ່າຍ', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:18'),
(291, 7, NULL, 'ພະລະ', 'Monday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:18'),
(292, 7, NULL, 'E', 'Monday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:18'),
(293, 7, NULL, 'E', 'Monday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:18'),
(294, 7, NULL, 'ຄະນິດສາດ', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:18'),
(295, 7, NULL, 'ສິລະປະກຳ', 'Tuesday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:18'),
(296, 7, NULL, 'E', 'Tuesday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:18'),
(297, 7, NULL, 'E', 'Tuesday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:18'),
(298, 7, NULL, 'ຫັດອ່ານ+ຫັດແຕ່ງ', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:18'),
(299, 7, NULL, 'ຄຸນສົມບັດ', 'Wednesday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:18'),
(300, 7, NULL, 'E', 'Wednesday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:18'),
(301, 7, NULL, 'E', 'Wednesday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:18'),
(302, 7, NULL, 'ຄະນິດສາດ', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:18'),
(303, 7, NULL, 'ວິທະຍາສາດ', 'Thursday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:18'),
(304, 7, NULL, 'E', 'Thursday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:18'),
(305, 7, NULL, 'E', 'Thursday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:18'),
(306, 7, NULL, 'ຫັດອ່ານ+ຮຽນທວາຍ', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(307, 7, NULL, 'ຄະນິດສາດ', 'Friday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(308, 7, NULL, 'E', 'Friday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(309, 7, NULL, 'E', 'Friday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(310, 8, NULL, 'ຫັດອ່ານ+ຫັດກ່າຍ', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(311, 8, NULL, 'ສິລະປະກຳ', 'Monday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(312, 8, NULL, 'E', 'Monday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(313, 8, NULL, 'E', 'Monday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(314, 8, NULL, 'ຄະນິດສາດ', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(315, 8, NULL, 'ພະລະ', 'Tuesday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(316, 8, NULL, 'E', 'Tuesday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(317, 8, NULL, 'E', 'Tuesday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(318, 8, NULL, 'ຫັດອ່ານ+ຫັດແຕ່ງ', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(319, 8, NULL, 'ວິທະຍາສາດ', 'Wednesday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(320, 8, NULL, 'E', 'Wednesday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(321, 8, NULL, 'E', 'Wednesday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(322, 8, NULL, 'ຄະນິດສາດ', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(323, 8, NULL, 'ຄຸນສົມບັດ', 'Thursday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(324, 8, NULL, 'E', 'Thursday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(325, 8, NULL, 'E', 'Thursday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(326, 8, NULL, 'ຫັດອ່ານ+ຮຽນທວາຍ', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(327, 8, NULL, 'ຄະນິດສາດ', 'Friday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(328, 8, NULL, 'E', 'Friday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(329, 8, NULL, 'E', 'Friday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(330, 9, NULL, 'ຫັດອ່ານ+ຫັດກ່າຍ', 'Monday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(331, 9, NULL, 'ວິທະຍາສາດ', 'Monday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(332, 9, NULL, 'E', 'Monday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(333, 9, NULL, 'E', 'Monday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(334, 9, NULL, 'ຄະນິດສາດ', 'Tuesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(335, 9, NULL, 'ຄຸນສົມບັດ', 'Tuesday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(336, 9, NULL, 'E', 'Tuesday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(337, 9, NULL, 'E', 'Tuesday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(338, 9, NULL, 'ຫັດອ່ານ+ຫັດແຕ່ງ', 'Wednesday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(339, 9, NULL, 'ພະລະ', 'Wednesday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(340, 9, NULL, 'E', 'Wednesday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(341, 9, NULL, 'E', 'Wednesday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(342, 9, NULL, 'ຄະນິດສາດ', 'Thursday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(343, 9, NULL, 'ສິລະປະກຳ', 'Thursday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(344, 9, NULL, 'E', 'Thursday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(345, 9, NULL, 'E', 'Thursday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(346, 9, NULL, 'ຫັດອ່ານ+ຮຽນທວາຍ', 'Friday', '08:30:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(347, 9, NULL, 'ຄະນິດສາດ', 'Friday', '10:30:00', '11:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(348, 9, NULL, 'E', 'Friday', '13:00:00', '14:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(349, 9, NULL, 'E', 'Friday', '15:00:00', '15:30:00', NULL, NULL, '2026-06-10 09:51:19'),
(350, 10, NULL, 'ຫັດອ່ານ', 'Monday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(351, 10, NULL, 'ຫັດກ່າຍ', 'Monday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(352, 10, NULL, 'ວິທະຍາສາດ', 'Monday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(353, 10, NULL, 'ໄວຍາກອນ', 'Monday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(354, 10, NULL, 'E', 'Monday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(355, 10, NULL, 'E', 'Monday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(356, 10, NULL, 'ຄະນິດສາດ', 'Tuesday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(357, 10, NULL, 'ຄະນິດສາດ', 'Tuesday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(358, 10, NULL, 'ພະລະ', 'Tuesday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(359, 10, NULL, 'ຄຸນສົມບັດ', 'Tuesday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(360, 10, NULL, 'E', 'Tuesday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(361, 10, NULL, 'E', 'Tuesday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(362, 10, NULL, 'ຫັດກ່າຍ', 'Wednesday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(363, 10, NULL, 'ຮຽນທວາຍ', 'Wednesday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(364, 10, NULL, 'ຄະນິດສາດ', 'Wednesday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(365, 10, NULL, 'ສິລະປະກຳ', 'Wednesday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(366, 10, NULL, 'E', 'Wednesday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(367, 10, NULL, 'E', 'Wednesday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(368, 10, NULL, 'ຄະນິດສາດ', 'Thursday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(369, 10, NULL, 'ຄະນິດສາດ', 'Thursday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(370, 10, NULL, 'ຮຽນທວາຍ', 'Thursday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(371, 10, NULL, 'ໄວຍາກອນ', 'Thursday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(372, 10, NULL, 'E', 'Thursday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(373, 10, NULL, 'E', 'Thursday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(374, 10, NULL, 'ຫັດແຕ່ງ', 'Friday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(375, 10, NULL, 'ຫັດແຕ່ງ', 'Friday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(376, 10, NULL, 'ວິທະຍາສາດ', 'Friday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(377, 10, NULL, 'ສຳຫຼວດ', 'Friday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(378, 10, NULL, 'E', 'Friday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(379, 10, NULL, 'E', 'Friday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(380, 11, NULL, 'ຫັດອ່ານ', 'Monday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(381, 11, NULL, 'ຫັດກ່າຍ', 'Monday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(382, 11, NULL, 'ວິທະຍາສາດ', 'Monday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(383, 11, NULL, 'ໄວຍາກອນ', 'Monday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(384, 11, NULL, 'E', 'Monday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(385, 11, NULL, 'E', 'Monday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(386, 11, NULL, 'ຄະນິດສາດ', 'Tuesday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(387, 11, NULL, 'ຄະນິດສາດ', 'Tuesday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(388, 11, NULL, 'ຄຸນສົມບັດ', 'Tuesday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(389, 11, NULL, 'ພະລະ', 'Tuesday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(390, 11, NULL, 'E', 'Tuesday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(391, 11, NULL, 'E', 'Tuesday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(392, 11, NULL, 'ຫັດກ່າຍ', 'Wednesday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(393, 11, NULL, 'ຮຽນທວາຍ', 'Wednesday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(394, 11, NULL, 'ຄະນິດສາດ', 'Wednesday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(395, 11, NULL, 'ສິລະປະກຳ', 'Wednesday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(396, 11, NULL, 'E', 'Wednesday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(397, 11, NULL, 'E', 'Wednesday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(398, 11, NULL, 'ຄະນິດສາດ', 'Thursday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(399, 11, NULL, 'ຄະນິດສາດ', 'Thursday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(400, 11, NULL, 'ໄວຍາກອນ', 'Thursday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(401, 11, NULL, 'ຮຽນທວາຍ', 'Thursday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(402, 11, NULL, 'E', 'Thursday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(403, 11, NULL, 'E', 'Thursday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(404, 11, NULL, 'ຫັດແຕ່ງ', 'Friday', '08:30:00', '09:15:00', NULL, NULL, '2026-06-10 09:51:19'),
(405, 11, NULL, 'ຫັດແຕ່ງ', 'Friday', '09:15:00', '10:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(406, 11, NULL, 'ວິທະຍາສາດ', 'Friday', '10:15:00', '11:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(407, 11, NULL, 'ສຳຫຼວດ', 'Friday', '11:00:00', '11:45:00', NULL, NULL, '2026-06-10 09:51:19'),
(408, 11, NULL, 'E', 'Friday', '13:00:00', '14:00:00', NULL, NULL, '2026-06-10 09:51:19'),
(409, 11, NULL, 'E', 'Friday', '14:15:00', '16:00:00', NULL, NULL, '2026-06-10 09:51:19');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('academic_status', 'active'),
('academic_year', '2025-2026'),
('address', 'ບ້ານ ໂພນຕ້ອງ ເມືອງ ໄຊທານີ ນະຄອນຫຼວງວຽງຈັນ, ລາວ'),
('email', 'sikamphattana@school.la'),
('license', 'EDU-2024-0120'),
('phone', '020 54561177'),
('principal', 'ທ່ານ ນາງ ພອນສີດາ'),
('school_name_en', 'SIKHAM PHATTHANA SCHOOL'),
('school_name_lo', 'ໂຮງຮຽນ ສີຄຳ ພັດທະນາ'),
('term_end', '2050-06-29'),
('term_start', '2020-06-01'),
('test', 'val'),
('vision', 'ສ້າງເດັກທີ່ມີຄຸນນະພາບ, ມີຄວາມຮູ້ ແລະ ມີທັກສະ ທີ່ຈະພັດທະນາປະເທດຊາດໄປພ້ອມກັນ');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `full_name_lao` varchar(200) NOT NULL,
  `full_name_eng` varchar(200) DEFAULT NULL,
  `role` varchar(100) NOT NULL COMMENT 'e.g. ຄູສອນ, ຜູ້ອຳນວຍການ, ພະນັກງານ',
  `department` varchar(100) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `gender` enum('ຊາຍ','ຍິງ','ອື່ນໆ') DEFAULT 'ຊາຍ',
  `date_of_birth` date DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT '',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`staff_id`, `user_id`, `full_name_lao`, `full_name_eng`, `role`, `department`, `phone`, `email`, `gender`, `date_of_birth`, `hire_date`, `profile_picture`, `status`, `created_at`) VALUES
(1, NULL, 'ທ່ານ ນາງ ດາ ສຸລິຍະວົງ', 'Mrs. Da Souriyavong', 'ຫ້ອງອຳນວຍການ', 'ບໍລິຫານ', '020 55 100 001', '', 'ຊາຍ', NULL, '2015-01-01', '', 'active', '2026-03-14 08:58:54'),
(2, NULL, 'ທ່ານ ນາງ ນ້ຳຝົນ ພົມມາ', 'Mrs. Namfon Phomma', 'ຄູສອນ', 'ອະນຸບານ', '020 55 100 002', NULL, 'ຍິງ', NULL, '2018-06-01', '', 'active', '2026-03-14 08:58:54'),
(3, NULL, 'ທ່ານ ນາງ ມາລາ ສີວິໄລ', 'Mrs. Mala Sivilai', 'ຄູສອນ', 'ອະນຸບານ', '020 55 100 003', NULL, 'ຍິງ', NULL, '2019-08-01', '', 'active', '2026-03-14 08:58:54'),
(4, NULL, 'ທ່ານ ສົມໄຊ ໄຊຍະວົງ', 'Mr. Somsai Xaiyavong', 'ຄູສອນ', 'ປະຖົມ', '020 55 100 004', NULL, 'ຊາຍ', NULL, '2017-01-01', '', 'active', '2026-03-14 08:58:54'),
(5, NULL, 'ທ່ານ ນາງ ອ່ອນ ດວງທິບ', 'Mrs. On Duangthip', 'ຄູສອນ', 'ປະຖົມ', '020 55 100 005', NULL, 'ຍິງ', NULL, '2020-01-01', '', 'active', '2026-03-14 08:58:54'),
(6, NULL, 'ທ່ານ ວິໄລ ເພັດດາລາ', 'Mr. Vilai Phetdala', 'ພະນັກງານ', 'ທົ່ວໄປ', '020 55 100 006', NULL, 'ຊາຍ', NULL, '2021-03-01', '', 'active', '2026-03-14 08:58:54'),
(7, NULL, 'ທ່ານ ນາງ ດາ ສຸລິຍະວົງ', 'Mrs. Da Souriyavong', 'ຜູ້ອຳນວຍການ', 'ບໍລິຫານ', '020 55 100 001', NULL, 'ຍິງ', NULL, '2015-01-01', '', 'active', '2026-03-14 10:41:04'),
(8, NULL, 'ທ່ານ ນາງ ນ້ຳຝົນ ພົມມາ', 'Mrs. Namfon Phomma', 'ຄູສອນ', 'ອະນຸບານ', '020 55 100 002', NULL, 'ຍິງ', NULL, '2018-06-01', '', 'active', '2026-03-14 10:41:04'),
(9, NULL, 'ທ່ານ ນາງ ມາລາ ສີວິໄລ', 'Mrs. Mala Sivilai', 'ຄູສອນ', 'ອະນຸບານ', '020 55 100 003', '', 'ຍິງ', NULL, '2019-08-01', 'assets/uploads/staff/staff_c1232077cff0b665.png', 'active', '2026-03-14 10:41:04'),
(10, NULL, 'ທ່ານ ສົມໄຊ ໄຊຍະວົງ', 'Mr. Somsai Xaiyavong', 'ຄູສອນ', 'ປະຖົມ', '020 55 100 004', '', 'ຊາຍ', NULL, '2017-01-01', 'assets/uploads/staff/staff_7c870b5063090449.png', 'active', '2026-03-14 10:41:04'),
(11, NULL, 'ທ່ານ ນາງ ອ່ອນ ດວງທິບ', 'Mrs. On Duangthip', 'ຄູສອນ', 'ປະຖົມ', '020 55 100 005', '', 'ຍິງ', NULL, '2020-01-01', 'assets/uploads/staff/staff_adc0e9ccdc73d19b.jpg', 'active', '2026-03-14 10:41:04'),
(12, NULL, 'ທ່ານ ວິໄລ ເພັດດາລາ', 'Mr. Vilai Phetdala', 'ພະນັກງານ', 'ທົ່ວໄປ', '020 55 100 006', '', 'ຊາຍ', NULL, '2021-03-01', 'assets/uploads/staff/staff_9a77bb458f842a52.jpg', 'active', '2026-03-14 10:41:04');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(11) NOT NULL,
  `student_code` varchar(20) NOT NULL,
  `full_name_lao` varchar(200) NOT NULL,
  `full_name_eng` varchar(200) DEFAULT NULL,
  `gender` enum('ຊາຍ','ຍິງ') NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `parent_name` varchar(200) DEFAULT NULL,
  `parent_phone` varchar(30) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT '',
  `enrollment_date` date DEFAULT NULL,
  `status` enum('ກຳລັງຮຽນ','ພັກການຮຽນ','ຮຽນຈົບ') DEFAULT 'ກຳລັງຮຽນ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `student_code`, `full_name_lao`, `full_name_eng`, `gender`, `date_of_birth`, `class_id`, `parent_name`, `parent_phone`, `address`, `profile_picture`, `enrollment_date`, `status`, `created_at`) VALUES
(136, 'ST-0001', 'ທ. ຄອນເເສງຈັນ ທອງອີນ', 'Mr khonsengchan thongin', 'ຊາຍ', '2004-05-05', 7, 'ທ. ຊຽງລຽນທອງ ທອງອີນ', '020 55 100 005', 'ບ້ານຊຳເໜືອ ເມືອງ ຊຳເໜືອ ເເຂວງ ຫົວພັນ', 'assets/uploads/students/student_3acf37bcc0df3ddf.png', '2026-06-18', 'ກຳລັງຮຽນ', '2026-06-18 12:46:02'),
(137, 'ST-0137', 'ນາງ ບຸນມີ ເເສງພະຈັນ', 'Miss Bounmee sengphachan', 'ຍິງ', '2004-08-23', 8, 'ທ.ເເສງພະຈັນ', '020 77 100 003', 'ບ້ານ ຄຳເກິດ ເມືອງບໍລິຄຳໄຊ ເເຂວງບໍລິຄຳໄຊ', 'assets/uploads/students/student_0c16dc2821983602.png', '2026-06-18', 'ກຳລັງຮຽນ', '2026-06-18 12:51:53');

-- --------------------------------------------------------

--
-- Table structure for table `student_scores`
--

CREATE TABLE `student_scores` (
  `score_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `academic_year` varchar(20) NOT NULL COMMENT 'e.g. 2025-2026',
  `term` varchar(50) NOT NULL COMMENT 'e.g. ເທີມ 1',
  `exam_type` varchar(100) NOT NULL COMMENT 'e.g. ກວດກາຍ່ອຍ, ສອບເສັງກາງເທີມ',
  `subject` varchar(150) NOT NULL,
  `score` decimal(6,2) NOT NULL DEFAULT 0.00,
  `max_score` decimal(6,2) NOT NULL DEFAULT 100.00,
  `score_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_scores`
--

INSERT INTO `student_scores` (`score_id`, `student_id`, `class_id`, `academic_year`, `term`, `exam_type`, `subject`, `score`, `max_score`, `score_date`, `notes`, `recorded_by`, `created_at`, `updated_at`) VALUES
(498, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'E', 8.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:53:56', '2026-06-18 12:53:56'),
(499, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຄະນິດສາດ', 9.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:54:02', '2026-06-18 12:54:02'),
(500, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຄຸນສົມບັດ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:54:06', '2026-06-18 12:54:06'),
(501, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ພະລະ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:54:11', '2026-06-18 12:54:11'),
(502, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ວິທະຍາສາດ', 9.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:54:16', '2026-06-18 12:54:16'),
(503, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ສິລະປະກຳ', 7.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:54:20', '2026-06-18 12:54:20'),
(504, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຫັດອ່ານ+ຫັດກ່າຍ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:54:27', '2026-06-18 12:54:27'),
(505, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຫັດອ່ານ+ຫັດແຕ່ງ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:54:36', '2026-06-18 12:54:36'),
(506, 136, 7, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຫັດອ່ານ+ຮຽນທວາຍ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:54:42', '2026-06-18 12:54:42'),
(507, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'E', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:03', '2026-06-18 12:55:03'),
(508, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຄະນິດສາດ', 9.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:08', '2026-06-18 12:55:08'),
(509, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຄຸນສົມບັດ', 8.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:16', '2026-06-18 12:55:16'),
(510, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ພະລະ', 8.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:19', '2026-06-18 12:55:19'),
(511, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ວິທະຍາສາດ', 9.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:23', '2026-06-18 12:55:23'),
(512, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ສິລະປະກຳ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:29', '2026-06-18 12:55:29'),
(513, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຫັດອ່ານ+ຫັດກ່າຍ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:34', '2026-06-18 12:55:34'),
(514, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຫັດອ່ານ+ຫັດແຕ່ງ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:38', '2026-06-18 12:55:38'),
(515, 137, 8, '2026-2027', 'ເທີມ 1', 'ປະຈຳເດືອນ 9', 'ຫັດອ່ານ+ຮຽນທວາຍ', 10.00, 10.00, '2026-06-18', '', 1, '2026-06-18 12:55:41', '2026-06-18 12:55:41');

-- --------------------------------------------------------

--
-- Table structure for table `transport_students`
--

CREATE TABLE `transport_students` (
  `ts_id` int(11) NOT NULL,
  `vehicle_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transport_vehicles`
--

CREATE TABLE `transport_vehicles` (
  `vehicle_id` int(11) NOT NULL,
  `vehicle_name` varchar(100) NOT NULL,
  `plate_number` varchar(30) NOT NULL,
  `type` enum('ລົດຕູ້','ລົດບັດ','ອື່ນໆ') DEFAULT 'ລົດຕູ້',
  `capacity` int(11) DEFAULT 15,
  `driver_name` varchar(200) DEFAULT NULL,
  `driver_phone` varchar(30) DEFAULT NULL,
  `route_name` varchar(200) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transport_vehicles`
--

INSERT INTO `transport_vehicles` (`vehicle_id`, `vehicle_name`, `plate_number`, `type`, `capacity`, `driver_name`, `driver_phone`, `route_name`, `status`, `created_at`) VALUES
(1, 'ລົດຕູ້ 01', 'GN-1234', 'ລົດຕູ້', 15, 'ທ່ານ ໄຊ ສີດາ', '020 99 001 001', 'ສາຍ A - ທ່ານ ເຕ-ໂພນສາ', 'active', '2026-03-14 08:58:54'),
(2, 'ລົດຕູ້ 02', 'GN-5678', 'ລົດຕູ້', 15, 'ທ່ານ ສຸ ດາວ', '020 99 001 002', 'ສາຍ B - ໂພນທັນ-ດົງໂດກ', 'active', '2026-03-14 08:58:54'),
(3, 'ລົດບັດ 01', 'GN-9012', 'ລົດບັດ', 30, 'ທ່ານ ຄຳ ສີ', '020 99 001 003', 'ສາຍ C - ສີສັດຕະນາກ', 'active', '2026-03-14 08:58:54'),
(4, 'ລົດຕູ້ 01', 'GN-1234', 'ລົດຕູ້', 15, 'ທ່ານ ໄຊ ສີດາ', '020 99 001 001', 'ສາຍ A - ທ່ານ ເຕ-ໂພນສາ', 'active', '2026-03-14 10:41:04'),
(5, 'ລົດຕູ້ 02', 'GN-5678', 'ລົດຕູ້', 15, 'ທ່ານ ສຸ ດາວ', '020 99 001 002', 'ສາຍ B - ໂພນທັນ-ດົງໂດກ', 'active', '2026-03-14 10:41:04'),
(6, 'ລົດບັດ 01', 'GN-9012', 'ລົດບັດ', 30, 'ທ່ານ ຄຳ ສີ', '020 99 001 003', 'ສາຍ C - ສີສັດຕະນາກ', 'active', '2026-03-14 10:41:04');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','teacher','staff') NOT NULL DEFAULT 'staff',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `role`, `is_active`, `created_at`) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 1, '2026-03-14 08:58:54'),
(14, 'TT', '$2y$10$5T1J/bb7QQkOOHIrh6/jSOzNgv1Gyzy4g3aXH8ql62/mWAQbCfcye', 'teacher', 1, '2026-06-06 07:47:08'),
(16, 'ນ.ອອນດີ', '$2y$10$WBWX5Q6873t3HhytjaVBw.fqu3.FyfPNHsjSvB8n/ZHpGmldYbPSq', 'teacher', 1, '2026-06-13 03:24:06');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `perm_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `dashboard` enum('full','readonly','limited','none') DEFAULT 'readonly',
  `students` enum('full','readonly','limited','none') DEFAULT 'none',
  `staff` enum('full','readonly','limited','none') DEFAULT 'none',
  `classes` enum('full','readonly','limited','none') DEFAULT 'none',
  `attendance` enum('full','readonly','limited','none') DEFAULT 'none',
  `assessments` enum('full','readonly','limited','none') DEFAULT 'none',
  `scores` enum('full','readonly','limited','none') DEFAULT 'none',
  `finance` enum('full','readonly','limited','none') DEFAULT 'none',
  `transport` enum('full','readonly','limited','none') DEFAULT 'none',
  `meals` enum('full','readonly','limited','none') DEFAULT 'none',
  `health` enum('full','readonly','limited','none') DEFAULT 'none',
  `communication` enum('full','readonly','limited','none') DEFAULT 'none',
  `calendar` enum('full','readonly','limited','none') DEFAULT 'none',
  `inventory` enum('full','readonly','limited','none') DEFAULT 'none',
  `reports` enum('full','readonly','limited','none') DEFAULT 'none',
  `settings` enum('full','readonly','limited','none') DEFAULT 'none',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`att_id`),
  ADD UNIQUE KEY `unique_student_date` (`student_id`,`att_date`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `idx_event_date` (`event_date`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`),
  ADD KEY `fk_mentor_teacher` (`mentor_teacher_id`);

--
-- Indexes for table `finance_categories`
--
ALTER TABLE `finance_categories`
  ADD PRIMARY KEY (`cat_id`);

--
-- Indexes for table `finance_transactions`
--
ALTER TABLE `finance_transactions`
  ADD PRIMARY KEY (`tx_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `health_alerts`
--
ALTER TABLE `health_alerts`
  ADD PRIMARY KEY (`alert_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `health_records`
--
ALTER TABLE `health_records`
  ADD PRIMARY KEY (`record_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `login_logs`
--
ALTER TABLE `login_logs`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `meals`
--
ALTER TABLE `meals`
  ADD PRIMARY KEY (`meal_id`);

--
-- Indexes for table `schedule_entries`
--
ALTER TABLE `schedule_entries`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `idx_schedule_day` (`day_of_week`,`start_time`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `teacher_id` (`teacher_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `student_code` (`student_code`),
  ADD KEY `class_id` (`class_id`);

--
-- Indexes for table `student_scores`
--
ALTER TABLE `student_scores`
  ADD PRIMARY KEY (`score_id`),
  ADD UNIQUE KEY `unique_student_score_context` (`student_id`,`academic_year`,`term`,`exam_type`,`subject`),
  ADD KEY `idx_scores_context` (`academic_year`,`term`,`exam_type`,`subject`),
  ADD KEY `idx_scores_class` (`class_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `transport_students`
--
ALTER TABLE `transport_students`
  ADD PRIMARY KEY (`ts_id`),
  ADD UNIQUE KEY `unique_transport` (`vehicle_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `transport_vehicles`
--
ALTER TABLE `transport_vehicles`
  ADD PRIMARY KEY (`vehicle_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`perm_id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `att_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=553;

--
-- AUTO_INCREMENT for table `calendar_events`
--
ALTER TABLE `calendar_events`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `finance_categories`
--
ALTER TABLE `finance_categories`
  MODIFY `cat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `finance_transactions`
--
ALTER TABLE `finance_transactions`
  MODIFY `tx_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `health_alerts`
--
ALTER TABLE `health_alerts`
  MODIFY `alert_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `health_records`
--
ALTER TABLE `health_records`
  MODIFY `record_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `login_logs`
--
ALTER TABLE `login_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `meals`
--
ALTER TABLE `meals`
  MODIFY `meal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `schedule_entries`
--
ALTER TABLE `schedule_entries`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=410;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=138;

--
-- AUTO_INCREMENT for table `student_scores`
--
ALTER TABLE `student_scores`
  MODIFY `score_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=516;

--
-- AUTO_INCREMENT for table `transport_students`
--
ALTER TABLE `transport_students`
  MODIFY `ts_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transport_vehicles`
--
ALTER TABLE `transport_vehicles`
  MODIFY `vehicle_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `perm_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;

--
-- Constraints for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD CONSTRAINT `calendar_events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `fk_mentor_teacher` FOREIGN KEY (`mentor_teacher_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;

--
-- Constraints for table `finance_transactions`
--
ALTER TABLE `finance_transactions`
  ADD CONSTRAINT `finance_transactions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `finance_transactions_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `finance_categories` (`cat_id`) ON DELETE SET NULL;

--
-- Constraints for table `health_alerts`
--
ALTER TABLE `health_alerts`
  ADD CONSTRAINT `health_alerts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `health_records`
--
ALTER TABLE `health_records`
  ADD CONSTRAINT `health_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `schedule_entries`
--
ALTER TABLE `schedule_entries`
  ADD CONSTRAINT `schedule_entries_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `schedule_entries_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `staff` (`staff_id`) ON DELETE SET NULL;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE SET NULL;

--
-- Constraints for table `student_scores`
--
ALTER TABLE `student_scores`
  ADD CONSTRAINT `student_scores_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_scores_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_scores_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `transport_students`
--
ALTER TABLE `transport_students`
  ADD CONSTRAINT `transport_students_ibfk_1` FOREIGN KEY (`vehicle_id`) REFERENCES `transport_vehicles` (`vehicle_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transport_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
