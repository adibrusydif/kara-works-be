-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bank Table
CREATE TABLE bank (
  bank_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotel Table
CREATE TABLE hotel (
  hotel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_email VARCHAR(255) NOT NULL UNIQUE,
  hotel_name VARCHAR(255) NOT NULL,
  hotel_logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Table
CREATE TABLE "user" (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_phone VARCHAR(20) NOT NULL UNIQUE,
  user_name VARCHAR(255) NOT NULL,
  user_photo TEXT,
  user_role VARCHAR(50) NOT NULL,
  hotel_id UUID REFERENCES hotel(hotel_id) ON DELETE SET NULL,
  bank_id UUID REFERENCES bank(bank_id) ON DELETE SET NULL,
  bank_account_name VARCHAR(255),
  bank_account_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet Table
CREATE TABLE wallet (
  wallet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  wallet_balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Event Table
CREATE TABLE event (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_creator_id UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  event_photo TEXT,
  event_description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_salary DECIMAL(15, 2) NOT NULL,
  event_person_count INTEGER NOT NULL,
  event_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdraw Table
CREATE TABLE withdraw (
  withdraw_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_reduction DECIMAL(15, 2) NOT NULL,
  withdraw_amount DECIMAL(15, 2) NOT NULL,
  withdraw_bank_account_id VARCHAR(255) NOT NULL,
  withdraw_bank_id UUID REFERENCES bank(bank_id) ON DELETE SET NULL,
  withdraw_bank_account_name VARCHAR(255) NOT NULL,
  withdraw_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet Transaction Table
CREATE TABLE wallet_transaction (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallet(wallet_id) ON DELETE CASCADE,
  transaction_event_id UUID REFERENCES event(event_id) ON DELETE SET NULL,
  transaction_wd_id UUID REFERENCES withdraw(withdraw_id) ON DELETE SET NULL,
  transaction_amount DECIMAL(15, 2) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK ((transaction_event_id IS NOT NULL AND transaction_wd_id IS NULL) OR 
         (transaction_event_id IS NULL AND transaction_wd_id IS NOT NULL))
);

-- Application Table
CREATE TABLE application (
  application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  application_status VARCHAR(50) DEFAULT 'pending',
  clock_in_qr_data TEXT,
  clock_out_qr_data TEXT,
  clock_in_prove TEXT,
  clock_out_prove TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Monthly Bill Table
CREATE TABLE monthly_bill (
  monthly_bill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotel(hotel_id) ON DELETE CASCADE,
  monthly_bill_name VARCHAR(255) NOT NULL,
  monthly_bill_url TEXT,
  monthly_bill_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Bill Table
CREATE TABLE event_bill (
  event_bill_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event(event_id) ON DELETE CASCADE,
  monthly_bill_id UUID NOT NULL REFERENCES monthly_bill(monthly_bill_id) ON DELETE CASCADE,
  event_bill_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_user_hotel_id ON "user"(hotel_id);
CREATE INDEX idx_user_bank_id ON "user"(bank_id);
CREATE INDEX idx_wallet_user_id ON wallet(user_id);
CREATE INDEX idx_event_creator_id ON event(event_creator_id);
CREATE INDEX idx_event_status ON event(event_status);
CREATE INDEX idx_event_date ON event(event_date);
CREATE INDEX idx_application_event_id ON application(event_id);
CREATE INDEX idx_application_user_id ON application(user_id);
CREATE INDEX idx_application_status ON application(application_status);
CREATE INDEX idx_wallet_transaction_wallet_id ON wallet_transaction(wallet_id);
CREATE INDEX idx_wallet_transaction_event_id ON wallet_transaction(transaction_event_id);
CREATE INDEX idx_wallet_transaction_wd_id ON wallet_transaction(transaction_wd_id);
CREATE INDEX idx_monthly_bill_hotel_id ON monthly_bill(hotel_id);
CREATE INDEX idx_event_bill_event_id ON event_bill(event_id);
CREATE INDEX idx_event_bill_monthly_bill_id ON event_bill(monthly_bill_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_bank_updated_at BEFORE UPDATE ON bank
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_updated_at BEFORE UPDATE ON hotel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON wallet
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON event
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdraw_updated_at BEFORE UPDATE ON withdraw
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_updated_at BEFORE UPDATE ON application
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_bill_updated_at BEFORE UPDATE ON monthly_bill
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_bill_updated_at BEFORE UPDATE ON event_bill
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();