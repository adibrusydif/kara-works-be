export interface Bank {
    bank_id: string
    bank_name: string
    created_at?: string
    updated_at?: string
  }
  
  export interface Hotel {
    hotel_id: string
    hotel_email: string
    hotel_name: string
    hotel_logo?: string | null
    created_at?: string
    updated_at?: string
  }
  
  export interface User {
    user_id: string
    user_phone: string
    user_name: string
    user_photo?: string | null
    user_role: string
    hotel_id?: string | null
    bank_id?: string | null
    bank_account_name?: string | null
    bank_account_id?: string | null
    created_at?: string
    updated_at?: string
  }
  
  export interface Wallet {
    wallet_id: string
    user_id: string
    wallet_balance: number
    created_at?: string
    updated_at?: string
  }
  
  export interface Event {
    event_id: string
    event_creator_id: string
    event_name: string
    event_photo?: string | null
    event_description?: string | null
    event_date: string
    event_salary: number
    event_person_count: number
    event_status: string
    created_at?: string
    updated_at?: string
  }
  
  export interface Withdraw {
    withdraw_id: string
    wallet_reduction: number
    withdraw_amount: number
    withdraw_bank_account_id: string
    withdraw_bank_id?: string | null
    withdraw_bank_account_name: string
    withdraw_status: string
    created_at?: string
    updated_at?: string
  }
  
  export interface WalletTransaction {
    transaction_id: string
    wallet_id: string
    transaction_event_id?: string | null
    transaction_wd_id?: string | null
    transaction_amount: number
    transaction_date: string
    created_at?: string
  }
  
  export interface Application {
    application_id: string
    event_id: string
    user_id: string
    application_status: string
    clock_in_qr_data?: string | null
    clock_out_qr_data?: string | null
    clock_in_prove?: string | null
    clock_out_prove?: string | null
    created_at?: string
    updated_at?: string
  }
  
  export interface MonthlyBill {
    monthly_bill_id: string
    hotel_id: string
    monthly_bill_name: string
    monthly_bill_url?: string | null
    monthly_bill_status: string
    created_at?: string
    updated_at?: string
  }
  
  export interface EventBill {
    event_bill_id: string
    event_id: string
    monthly_bill_id: string
    event_bill_url?: string | null
    created_at?: string
    updated_at?: string
  }

  export interface Fee {
    id: boolean          // always true because table holds a single row
    bank_fee: number     // stored as NUMERIC(12,2) in the database
    platform_fee: number // same as above
    updated_at?: string  // ISO timestamp if you keep the column
  }