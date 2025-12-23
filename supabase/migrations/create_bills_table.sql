-- Bills Table for Bill Reminders Feature
-- Run this migration in Supabase SQL Editor

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date TEXT NOT NULL, -- Day of month (1-31) or specific date for one-time bills
    category TEXT NOT NULL,
    is_recurring BOOLEAN DEFAULT true,
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'one-time')),
    reminder_days INTEGER DEFAULT 3, -- Days before due date to send reminder
    is_paid BOOLEAN DEFAULT false,
    last_paid_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS bills_user_id_idx ON bills(user_id);
CREATE INDEX IF NOT EXISTS bills_due_date_idx ON bills(due_date);
CREATE INDEX IF NOT EXISTS bills_is_paid_idx ON bills(is_paid);

-- Enable Row Level Security
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bills"
    ON bills FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
    ON bills FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
    ON bills FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
    ON bills FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER bills_updated_at_trigger
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_bills_updated_at();

-- Insert sample bills for testing (optional)
-- Uncomment to add sample data
/*
INSERT INTO bills (user_id, name, amount, due_date, category, frequency, reminder_days)
VALUES 
    (auth.uid(), 'Electricity Bill', 1500.00, '15', 'Utilities', 'monthly', 5),
    (auth.uid(), 'Internet Bill', 2000.00, '1', 'Utilities', 'monthly', 3),
    (auth.uid(), 'Rent', 25000.00, '1', 'Housing', 'monthly', 7),
    (auth.uid(), 'Car Insurance', 8000.00, '10', 'Insurance', 'quarterly', 10);
*/
