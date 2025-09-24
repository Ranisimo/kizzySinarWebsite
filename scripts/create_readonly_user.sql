-- Create a read-only SQL login and user for the 'plants' database
-- Run this in SSMS as an administrator (change the password before running)

-- In master, create the login
CREATE LOGIN web_reader WITH PASSWORD = 'ChangeMe@123!';

-- In the plants database, create the user and give read-only role
USE plants;
CREATE USER web_reader FOR LOGIN web_reader;
ALTER ROLE db_datareader ADD MEMBER web_reader;

-- Optional: test access by connecting as web_reader and running a simple query
-- SELECT TOP 10 ddbidOrig, taxonName, vernacular FROM dbo.plants;

-- IMPORTANT: replace the placeholder password with a strong secret and do not
-- commit secrets into version control. Instead store the connection string in
-- .env.local as described in project README.
