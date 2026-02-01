-- Bank Transaction Import & Matching Feature
-- This migration creates tables for storing bank transactions and import batches

-- Create transaction_imports table (must be created first due to FK reference)
CREATE TABLE transaction_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  row_count integer,
  matched_count integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed'))
);

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  reference text,
  balance numeric(10,2),

  -- Matching
  user_id uuid REFERENCES profiles(id),
  match_confidence text CHECK (match_confidence IN ('auto', 'manual', 'unmatched')),
  matched_by uuid REFERENCES profiles(id),
  matched_at timestamptz,

  -- Import tracking
  import_batch_id uuid NOT NULL REFERENCES transaction_imports(id) ON DELETE CASCADE,
  raw_data jsonb,

  created_at timestamptz DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_import_batch_id ON transactions(import_batch_id);
CREATE INDEX idx_transactions_match_confidence ON transactions(match_confidence);

-- Enable RLS on both tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_imports (admin only)
CREATE POLICY "Admins can view all transaction imports"
  ON transaction_imports
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert transaction imports"
  ON transaction_imports
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update transaction imports"
  ON transaction_imports
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete transaction imports"
  ON transaction_imports
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- RLS Policies for transactions
-- Admins can do everything
CREATE POLICY "Admins can view all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete transactions"
  ON transactions
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Regular members can view their own matched transactions
CREATE POLICY "Members can view own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
