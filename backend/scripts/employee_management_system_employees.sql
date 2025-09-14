-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: employee_management_system
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `employee_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `suffix` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sex` enum('Male','Female') COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date NOT NULL,
  `birth_place` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `civil_status` enum('Single','Married','Widowed','Separated','Divorced') COLLATE utf8mb4_unicode_ci DEFAULT 'Single',
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_address` text COLLATE utf8mb4_unicode_ci,
  `permanent_address` text COLLATE utf8mb4_unicode_ci,
  `tin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gsis_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagibig_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `philhealth_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sss_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `plantilla_position` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plantilla_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary_grade` int DEFAULT NULL,
  `step_increment` int DEFAULT '1',
  `current_monthly_salary` decimal(12,2) DEFAULT NULL,
  `current_daily_rate` decimal(10,2) DEFAULT NULL,
  `highest_monthly_salary` decimal(12,2) DEFAULT NULL,
  `highest_daily_rate` decimal(10,2) DEFAULT NULL,
  `employment_status` enum('Active','Resigned','Retired','Terminated','AWOL') COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `separation_date` date DEFAULT NULL,
  `separation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_number` (`employee_number`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_employee_number` (`employee_number`),
  KEY `idx_employment_status` (`employment_status`),
  KEY `idx_appointment_date` (`appointment_date`),
  KEY `idx_employees_deleted_at` (`deleted_at`),
  KEY `idx_employees_active` (`employment_status`,`deleted_at`),
  KEY `idx_employees_search_active` (`first_name`,`last_name`,`deleted_at`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-13  1:50:25
