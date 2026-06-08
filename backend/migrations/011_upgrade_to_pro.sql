-- Upgrade all existing users to 'pro' plan for the initial phase
UPDATE users SET plan = 'pro' WHERE plan = 'free';
-- Also update the default value for the plan column
ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'pro';
