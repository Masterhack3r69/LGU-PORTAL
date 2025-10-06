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
-- Table structure for table `deduction_types`
--

DROP TABLE IF EXISTS `deduction_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deduction_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `frequency` enum('Monthly','Annual','Conditional') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Monthly',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deduction_types`
--

/*!40000 ALTER TABLE `deduction_types` DISABLE KEYS */;
INSERT INTO `deduction_types` VALUES (15,'SSS Contribution','SSS','Social Security System monthly contribution',1125.00,'Fixed',NULL,1,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(16,'PhilHealth Contribution','PHILHEALTH','Philippine Health Insurance Corporation monthly contribution',625.00,'Fixed',NULL,1,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(17,'Pag-IBIG Contribution','PAGIBIG','Home Development Mutual Fund monthly contribution',200.00,'Fixed',NULL,1,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(18,'Withholding Tax','WTAX','Monthly withholding tax based on BIR tax table',0.00,'Formula','GrossPay',1,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(19,'SSS Loan','SSS_LOAN','SSS salary loan monthly amortization',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(20,'Pag-IBIG Loan','PAGIBIG_LOAN','Pag-IBIG housing loan monthly amortization',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(21,'Company Loan','COMPANY_LOAN','Company emergency loan monthly deduction',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(22,'GSIS Contribution','GSIS','Government Service Insurance System contribution (for government employees)',0.00,'Percentage','BasicPay',0,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(23,'Union Dues','UNION','Monthly union membership dues',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(24,'Life Insurance','LIFE_INS','Monthly life insurance premium deduction',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(25,'Health Insurance','HEALTH_INS','Monthly health insurance premium deduction',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(26,'Tardiness/Absences','TARDINESS','Deduction for tardiness and unauthorized absences',0.00,'Formula','BasicPay',0,'Conditional',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(27,'Cash Advance','CASH_ADVANCE','Cash advance recovery deduction',0.00,'Fixed',NULL,0,'Conditional',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(28,'Uniform Deduction','UNIFORM','Company uniform cost deduction',0.00,'Fixed',NULL,0,'Conditional',1,'2025-09-27 03:32:51','2025-09-27 03:32:51'),(29,'Canteen','CANTEEN','Employee canteen meal deduction',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:32:51','2025-09-27 03:32:51');
/*!40000 ALTER TABLE `deduction_types` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06 21:59:55
