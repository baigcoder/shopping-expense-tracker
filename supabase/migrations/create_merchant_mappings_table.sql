-- Merchant Mappings Table for Auto-Categorization
-- Run this migration in Supabase SQL Editor

-- Create merchant_mappings table
CREATE TABLE IF NOT EXISTS merchant_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence DECIMAL(3, 2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, merchant_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS merchant_mappings_user_id_idx ON merchant_mappings(user_id);
CREATE INDEX IF NOT EXISTS merchant_mappings_merchant_name_idx ON merchant_mappings(merchant_name);

-- Enable Row Level Security
ALTER TABLE merchant_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own merchant mappings"
    ON merchant_mappings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchant mappings"
    ON merchant_mappings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant mappings"
    ON merchant_mappings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merchant mappings"
    ON merchant_mappings FOR DELETE
    USING (auth.uid() = user_id);
