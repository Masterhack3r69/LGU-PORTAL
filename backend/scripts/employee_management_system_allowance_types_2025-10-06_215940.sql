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
-- Table structure for table `allowance_types`
--

DROP TABLE IF EXISTS `allowance_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allowance_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `default_amount` decimal(12,2) DEFAULT NULL,
  `calculation_type` enum('Fixed','Percentage','Formula') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Fixed',
  `percentage_base` enum('BasicPay','MonthlySalary','GrossPay') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_taxable` tinyint(1) NOT NULL DEFAULT '0',
  `frequency` enum('Monthly','Annual','Conditional') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Monthly',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allowance_types`
--

/*!40000 ALTER TABLE `allowance_types` DISABLE KEYS */;
INSERT INTO `allowance_types` VALUES (16,'RATA (Representation Allowance & Transportation Allowance)','RATA','Monthly representation and transportation allowance for employees',0.00,'Fixed',NULL,1,'Monthly',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(17,'Clothing Allowance','CLOTHING','Annual clothing allowance for uniform and work attire',0.00,'Fixed',NULL,1,'Annual',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(18,'Medical Allowance','MEDICAL','Monthly medical allowance for healthcare expenses',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(19,'Subsistence & Laundry','SUBSISTENCE','Monthly subsistence and laundry allowance',0.00,'Fixed',NULL,1,'Monthly',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(20,'Hazard Pay','HAZARD','Additional compensation for hazardous work conditions',0.00,'Fixed',NULL,1,'Monthly',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(21,'Rice Allowance','RICE','Monthly rice subsidy allowance',0.00,'Fixed',NULL,0,'Monthly',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(22,'Communication Allowance','COMM','Monthly communication/internet allowance',0.00,'Fixed',NULL,1,'Monthly',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(23,'Overtime Allowance','OVERTIME','Overtime compensation based on hourly rate',0.00,'Formula','BasicPay',1,'Conditional',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(24,'Night Differential','NIGHT_DIFF','Night shift differential pay',0.00,'Percentage','BasicPay',1,'Conditional',1,'2025-09-27 03:33:10','2025-09-27 03:33:10'),(25,'Holiday Pay','HOLIDAY','Additional pay for holiday work',0.00,'Percentage','BasicPay',1,'Conditional',1,'2025-09-27 03:33:10','2025-09-27 03:33:10');
/*!40000 ALTER TABLE `allowance_types` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06 21:59:43
