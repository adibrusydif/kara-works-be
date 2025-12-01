import swaggerJsdoc from 'swagger-jsdoc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kara Works API',
      version: '1.0.0',
      description: 'Complete API documentation for Kara Works Backend',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.karaworks.app',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Bank: {
          type: 'object',
          properties: {
            bank_id: { type: 'string', format: 'uuid' },
            bank_name: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Hotel: {
          type: 'object',
          properties: {
            hotel_id: { type: 'string', format: 'uuid' },
            hotel_email: { type: 'string', format: 'email' },
            hotel_name: { type: 'string' },
            hotel_logo: { type: 'string', format: 'uri', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'string', format: 'uuid' },
            user_phone: { type: 'string' },
            user_name: { type: 'string' },
            user_photo: { type: 'string', format: 'uri', nullable: true },
            user_role: { type: 'string', enum: ['hotel', 'worker'] },
            hotel_id: { type: 'string', format: 'uuid', nullable: true },
            bank_id: { type: 'string', format: 'uuid', nullable: true },
            bank_account_name: { type: 'string', nullable: true },
            bank_account_id: { type: 'string', nullable: true },
            wallet_balance: { type: 'number', format: 'decimal' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            event_id: { type: 'string', format: 'uuid' },
            event_creator_id: { type: 'string', format: 'uuid' },
            event_name: { type: 'string' },
            event_photo: { type: 'string', format: 'uri', nullable: true },
            event_description: { type: 'string', nullable: true },
            event_date: { type: 'string', format: 'date-time' },
            event_salary: { type: 'number', format: 'decimal' },
            event_person_count: { type: 'integer' },
            event_status: { type: 'string', enum: ['pending', 'posted', 'finished'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            application_id: { type: 'string', format: 'uuid' },
            event_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            application_status: { type: 'string' },
            clock_in_qr_data: { type: 'string', nullable: true },
            clock_out_qr_data: { type: 'string', nullable: true },
            clock_in_prove: { type: 'string', nullable: true },
            clock_out_prove: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        WalletTransaction: {
          type: 'object',
          properties: {
            transaction_id: { type: 'string', format: 'uuid' },
            wallet_id: { type: 'string', format: 'uuid' },
            transaction_event_id: { type: 'string', format: 'uuid', nullable: true },
            transaction_wd_id: { type: 'string', format: 'uuid', nullable: true },
            transaction_amount: { type: 'number', format: 'decimal' },
            transaction_date: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Fee: {
          type: 'object',
          properties: {
            id: { type: 'boolean' },
            bank_fee: { type: 'number', format: 'decimal' },
            platform_fee: { type: 'number', format: 'decimal' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        QRCodeResponse: {
          type: 'object',
          properties: {
            payload: {
              type: 'object',
              properties: {
                event_id: { type: 'string', format: 'uuid' },
                creator_id: { type: 'string', format: 'uuid' },
                generated_at: { type: 'string', format: 'date-time' },
                type: { type: 'string', enum: ['clock_in', 'clock_out'] },
              },
            },
            qr: { type: 'string', description: 'Base64 data URL of QR code image' },
          },
        },
      },
    },
    tags: [
      { name: 'Banks', description: 'Bank management endpoints' },
      { name: 'Hotels', description: 'Hotel management endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Events', description: 'Event management endpoints' },
      { name: 'Applications', description: 'Application management endpoints' },
      { name: 'Wallet Transactions', description: 'Wallet transaction endpoints' },
      { name: 'Fee', description: 'Fee configuration endpoints' },
      { name: 'Uploads', description: 'File upload endpoints' },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../routes/*.js'),
    './src/routes/*.ts',
    './src/routes/*.js',
    path.resolve(process.cwd(), 'src/routes/*.ts'),
    path.resolve(process.cwd(), 'src/routes/*.js'),
  ],
}

export const swaggerSpec = swaggerJsdoc(options)