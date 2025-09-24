-- Migration: move dbo.plants from master to a dedicated database plantsdb
-- Run this in SSMS as an admin. Review and backup before running on production.

-- 1) Create the new database if it doesn't exist
IF DB_ID('plantsdb') IS NULL
BEGIN
    PRINT 'Creating database plantsdb...'
    CREATE DATABASE plantsdb;
END
GO

-- 2) Create the target table in plantsdb with same schema as master.dbo.plants
USE plantsdb;
GO

IF OBJECT_ID('dbo.plants', 'U') IS NULL
BEGIN
    PRINT 'Creating dbo.plants in plantsdb...'
    CREATE TABLE dbo.plants (
        ddbidOrig varchar(14) NOT NULL PRIMARY KEY,
        taxonName varchar(82) NOT NULL,
        vernacular varchar(37) NOT NULL
    );
END
GO

-- 3) Copy data from master.dbo.plants into plantsdb.dbo.plants
-- (This uses a simple INSERT ... SELECT; adjust for large datasets or identity columns)
SET XACT_ABORT ON;
BEGIN TRANSACTION;
    INSERT INTO plantsdb.dbo.plants (ddbidOrig, taxonName, vernacular)
    SELECT p.ddbidOrig, p.taxonName, p.vernacular
    FROM master.dbo.plants p
    WHERE NOT EXISTS (SELECT 1 FROM plantsdb.dbo.plants t WHERE t.ddbidOrig = p.ddbidOrig);
COMMIT TRANSACTION;
GO

-- 4) Map web_reader to the new database and grant read access
USE plantsdb;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'web_reader')
    CREATE USER [web_reader] FOR LOGIN [web_reader];
GO
ALTER ROLE db_datareader ADD MEMBER [web_reader];
GO

-- 5) Optional: after verifying the copy, you can drop the original table from master
-- DROP TABLE master.dbo.plants;

-- Notes:
-- - Backup master database before dropping anything.
-- - For very large tables consider using BCP or SSIS for the migration.
-- - Review constraints, indexes and permissions and recreate them in plantsdb as needed.
