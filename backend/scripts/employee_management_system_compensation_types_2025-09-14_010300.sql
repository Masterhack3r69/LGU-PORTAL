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
-- Table structure for table `compensation_types`
--

DROP TABLE IF EXISTS `compensation_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compensation_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_taxable` tinyint(1) DEFAULT '1',
  `calculation_method` enum('Fixed','Percentage','Formula') COLLATE utf8mb4_unicode_ci DEFAULT 'Fixed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `compensation_types` VALUES (1,'Performance-Based Bonus','PBB','Annual performance bonus',1,'Fixed','2025-09-08 20:59:25'),(2,'Mid-Year Bonus','MYB','13th Month Pay',1,'Formula','2025-09-08 20:59:25'),(3,'Year-End Bonus','YEB','14th Month Pay',1,'Formula','2025-09-08 20:59:25'),(4,'RATA','RATA','Representation and Transportation Allowance',1,'Fixed','2025-09-08 20:59:25'),(5,'Clothing Allowance','CA','Annual clothing allowance',1,'Fixed','2025-09-08 20:59:25'),(6,'Medical Allowance','MA','Medical benefits allowance',0,'Fixed','2025-09-08 20:59:25'),(7,'Hazard Allowance','HA','Hazard duty allowance',1,'Fixed','2025-09-08 20:59:25'),(8,'Subsistence & Laundry','SL','Meal and laundry allowance',1,'Fixed','2025-09-08 20:59:25'),(9,'Loyalty Award','LA','Long service award',1,'Fixed','2025-09-08 20:59:25');
