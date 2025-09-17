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
-- Table structure for table `payroll_allowance_types`
--

DROP TABLE IF EXISTS `payroll_allowance_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_allowance_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_monthly` tinyint(1) DEFAULT '1',
  `is_prorated` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll_allowance_types`
--

/*!40000 ALTER TABLE `payroll_allowance_types` DISABLE KEYS */;
INSERT INTO `payroll_allowance_types` VALUES (1,'SALARY','Basic Salary','Monthly basic salary',1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50'),(2,'RATA','Representation & Transportation Allowance','Fixed monthly RATA allowance',1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50'),(3,'CA','Clothing Allowance','Annual clothing allowance (prorated monthly)',1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50'),(4,'MA','Medical Allowance','Monthly medical allowance',1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50'),(5,'SLA','Subsistence & Laundry Allowance','Monthly subsistence and laundry allowance',1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50'),(6,'HA','Hazard Allowance','Monthly hazard pay allowance',1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50'),(7,'PERA','PERA','Public Education Reorganization Act allowance',1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50'),(8,'ACA','Additional Compensation Allowance','Additional compensation allowance',1,1,1,'2025-09-16 22:20:50','2025-09-16 22:20:50');
/*!40000 ALTER TABLE `payroll_allowance_types` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-18  3:00:07
