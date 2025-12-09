-- Bank Statements and Transactions Migration for PDF Analyzer
-- Run this in Supabase SQL Editor to enable PDF bank statement imports

-- Create bank_statements table (stores imported statement metadata)
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    bank_name VARCHAR(255),
    statement_period VARCHAR(100),
    transaction_count INTEGER DEFAULT 0,
    total_income DECIMAL(12, 2) DEFAULT 0,
    total_expenses DECIMAL(12, 2) DEFAULT 0,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add source and confidence columns to transactions if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'source') THEN
        ALTER TABLE transactions ADD COLUMN source VARCHAR(50) DEFAULT 'manual';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'confidence') THEN
        ALTER TABLE transactions ADD COLUMN confidence DECIMAL(3, 2) DEFAULT 1.0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'statement_id') THEN
        ALTER TABLE transactions ADD COLUMN statement_id UUID REFERENCES bank_statements(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS on bank_statements
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_statements
CREATE POLICY "Users can view own statements" ON bank_statements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statements" ON bank_statements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statements" ON bank_statements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own statements" ON bank_statements
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bank_statements_user_id ON bank_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);
CREATE INDEX IF NOT EXISTS idx_transactions_statement_id ON transactions(statement_id);

-- Grant permissions
GRANT ALL ON bank_statements TO authenticated;
