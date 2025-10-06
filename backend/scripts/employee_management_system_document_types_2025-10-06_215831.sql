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
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_required` tinyint(1) DEFAULT '0',
  `max_file_size` int DEFAULT '5242880',
  `allowed_extensions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (9,'Birth Certificate','Official birth certificate',1,5242880,'[\"pdf\", \"jpg\", \"jpeg\", \"png\"]','2025-09-23 10:18:41'),(10,'Resume/CV','Curriculum Vitae or Resume',1,5242880,'[\"pdf\", \"doc\", \"docx\"]','2025-09-23 10:18:41'),(11,'Medical Certificate','Medical fitness certificate',0,5242880,'[\"pdf\", \"jpg\", \"jpeg\", \"png\"]','2025-09-23 10:18:41'),(12,'Original Approved Appointment','Employee original appointment document',1,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(13,'PSA Birth Certificate','Birth certificate issued by PSA',1,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(14,'Marriage Contract','Marriage contract document',0,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(15,'NOSI (Notice of Step Increment)','Notice of Step Increment document',0,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(16,'NOSA (Notice of Salary Adjustment)','Notice of Salary Adjustment document',0,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(17,'Promotion if applicable / Appointment','Promotion or appointment document if applicable',0,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(18,'Designations','Designation documents related to employee roles',0,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(19,'CAV / TOR','Certificate of Authentication and Validation / Transcript of Records',0,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(20,'SALN (Statement of Assets & Liabilities Net Worth)','Employee SALN document',1,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(21,'PDS (Personal Data Sheet)','Employee Personal Data Sheet',1,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(22,'Income Tax Return','Latest Income Tax Return',0,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(23,'Reprimand Letter / Show Cause Order if any','Disciplinary documents if any',0,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(24,'Service Record','Official service record of the employee',1,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31'),(25,'Updated Valid ID Licensed (photocopy)','Photocopy of updated valid ID with license',1,5242880,'[\"pdf\", \"jpg\", \"png\"]','2025-09-27 03:31:31');
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06 21:58:33
