-- Create application user
CREATE USER maponomy_user WITH PASSWORD 'maponomy_pass';

-- Create databases
CREATE DATABASE maponomypoultry_dev OWNER maponomy_user;
CREATE DATABASE maponomypoultry_prod OWNER maponomy_user;

-- Optional: restrict permissions (good practice)
REVOKE ALL ON DATABASE maponomypoultry_dev FROM PUBLIC;
REVOKE ALL ON DATABASE maponomypoultry_prod FROM PUBLIC;
