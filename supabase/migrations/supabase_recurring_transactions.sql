-- Recurring Transactions Table
-- Run this in your Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT DEFAULT 'Other',
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'monthly',
    next_due_date DATE NOT NULL,
    last_processed_date DATE,
    is_active BOOLEAN DEFAULT true,
    auto_add BOOLEAN DEFAULT false,
    reminder_days INTEGER DEFAULT 3,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own recurring transactions
CREATE POLICY "Users can manage their own recurring transactions"
ON recurring_transactions
FOR ALL
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_recurring_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_next_due ON recurring_transactions(next_due_date);
CREATE INDEX idx_recurring_active ON recurring_transactions(is_active);

-- Optional: Add some sample data for testing (update user_id with a real one)
-- INSERT INTO recurring_transactions (user_id, name, amount, category, frequency, next_due_date, is_active, auto_add, reminder_days)
-- VALUES 
--     ('YOUR-USER-ID-HERE', 'Rent', 1500.00, 'Rent', 'monthly', CURRENT_DATE + INTERVAL '5 days', true, false, 5),
--     ('YOUR-USER-ID-HERE', 'Internet', 79.99, 'Utilities', 'monthly', CURRENT_DATE + INTERVAL '10 days', true, true, 3),
--     ('YOUR-USER-ID-HERE', 'Gym Membership', 49.99, 'Gym', 'monthly', CURRENT_DATE + INTERVAL '15 days', true, true, 3);
