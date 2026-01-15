-- Migration to add timezone support to datetime columns
-- Run this SQL script against your PostgreSQL database

-- Tournament table
ALTER TABLE tournament
    ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE,
    ALTER COLUMN end_date TYPE TIMESTAMP WITH TIME ZONE,
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- Agent table
ALTER TABLE agent
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE;

-- AgentState table
ALTER TABLE agent_state
    ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;

-- Trade table
ALTER TABLE trade
    ALTER COLUMN timestamp TYPE TIMESTAMP WITH TIME ZONE;

-- Bet table
ALTER TABLE bet
    ALTER COLUMN placed_at TYPE TIMESTAMP WITH TIME ZONE;
