ALTER TABLE nia_packages 
ADD COLUMN IF NOT EXISTS learning_mode VARCHAR(20) DEFAULT 'Online';

-- Update all existing packages to 'Online' by default (or you can manually change some to 'Center')
UPDATE nia_packages SET learning_mode = 'Online' WHERE learning_mode IS NULL;
