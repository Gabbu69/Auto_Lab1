# 🛒 Loyalty Card System MVP

A production-lean loyalty card system for grocery stores with QR code scanning, point accrual, and reward redemption.

## Features

- **QR-based loyalty cards** with opaque tokens (no PII in QR codes)
- **Point accrual**: 1 point per ₱10 spent (configurable)
- **Reward system**: Unlock rewards at point thresholds (100 → ₱50, 200 → ₱120)
- **Browser-based QR scanner** using device camera (jsQR)
- **Transaction logging** for audit trail
- **Rate limiting** to prevent duplicate scans (1 scan per 5 seconds per card)
- **Admin endpoints** for customer and redemption management
- **Automated tests** with Mocha, Chai, and Supertest

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (single-file, zero-config)
- **QR Generation**: qrcode library
- **QR Scanning**: jsQR (browser-based)
- **Token Generation**: nanoid (secure, opaque tokens)
- **Testing**: Mocha + Chai + Supertest

## Project Structure

```
loyalty-card-mvp/
├── db/
│   ├── schema.sql          # Database schema
│   ├── seed.sql            # Sample data
│   ├── database.js         # Database wrapper
│   └── loyalty.db          # SQLite database (created on init)
├── middleware/
│   └── rateLimiter.js      # Rate limiting for scans
├── public/
│   └── scanner.html        # Browser QR scanner UI
├── scripts/
│   └── init-db.js          # Database initialization script
├── test/
│   └── api.test.js         # Automated API tests
├── server.js               # Express server & API endpoints
├── package.json            # Dependencies & scripts
└── README.md               # This file
```

## Installation

### Prerequisites

- Node.js 14+ and npm

### Setup Steps

1. **Install dependencies**

```bash
npm install
```

2. **Initialize database**

```bash
npm run init-db
```

This creates `db/loyalty.db` with schema and sample data:
- 5 sample customers with tokens
- 2 rewards (100 pts → ₱50, 200 pts → ₱120)
- Sample transactions and redemptions

## Running the Server

```bash
npm start
```

Server runs on `http://localhost:3000`

**Important**: The scanner UI requires HTTPS or localhost for camera access.

## Usage

### 1. QR Scanner UI

Open `http://localhost:3000/scanner.html` in your browser:

1. Click **"Start Camera"**
2. Point camera at a loyalty card QR code
3. System automatically:
   - Detects QR code
   - Awards points (1 per ₱10 spent)
   - Shows customer name, points awarded, and new balance
   - Displays unlocked rewards if thresholds crossed

**Manual Testing**: Use the manual entry form at the bottom to test with sample tokens:
- `ABC123XYZ0` (Juan Dela Cruz, 50 pts)
- `DEF456UVW1` (Maria Santos, 150 pts)
- `GHI789RST2` (Pedro Reyes, 250 pts)

### 2. API Endpoints

#### Scan a Card (Award Points)

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"card_token": "ABC123XYZ0", "amount": 250}'
```

**Response:**
```json
{
  "customer_id": 1,
  "customer_name": "Juan Dela Cruz",
  "points_awarded": 25,
  "new_points_balance": 75,
  "rewards_unlocked": []
}
```

#### Get Customer Details

```bash
curl http://localhost:3000/api/customer/ABC123XYZ0
```

**Response:**
```json
{
  "id": 1,
  "name": "Juan Dela Cruz",
  "phone": "09171234567",
  "points": 75,
  "created_at": "2025-11-01T12:00:00.000Z"
}
```

#### Redeem a Reward

```bash
curl -X POST http://localhost:3000/api/redeem \
  -H "Content-Type: application/json" \
  -d '{"card_token": "DEF456UVW1", "reward_id": 1}'
```

**Response:**
```json
{
  "success": true,
  "redemption_id": 3,
  "reward_name": "₱50 Discount",
  "points_deducted": 100,
  "new_points_balance": 50
}
```

#### Generate QR Code for a Token

```bash
curl http://localhost:3000/api/generate_qr/ABC123XYZ0
```

**Response:**
```json
{
  "token": "ABC123XYZ0",
  "qr_url": "https://loyalty.example.com/card/ABC123XYZ0",
  "qr_image": "data:image/png;base64,iVBORw0KG..."
}
```

#### List All Rewards

```bash
curl http://localhost:3000/api/rewards
```

#### Admin: List All Customers

```bash
curl http://localhost:3000/api/admin/customers
```

#### Admin: List All Redemptions

```bash
curl http://localhost:3000/api/admin/redemptions
```

#### Admin: Generate New Card

```bash
curl -X POST http://localhost:3000/api/admin/generate_card \
  -H "Content-Type: application/json" \
  -d '{"name": "New Customer", "phone": "09123456789"}'
```

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": 6,
    "card_token": "xY9zAb3CdE",
    "name": "New Customer",
    "phone": "09123456789",
    "points": 0
  },
  "qr_url": "https://loyalty.example.com/card/xY9zAb3CdE"
}
```

## Testing

Run automated tests:

```bash
npm test
```

**Test Coverage:**
- ✓ Scan awards correct points based on amount
- ✓ Scan creates new customer for unknown token
- ✓ Scan returns unlocked rewards when threshold crossed
- ✓ Rate limiting prevents duplicate scans within 5 seconds
- ✓ Customer lookup returns correct data
- ✓ Redemption fails with insufficient points
- ✓ Redemption succeeds and deducts points correctly
- ✓ Transactions are logged for each scan
- ✓ QR code generation works
- ✓ Admin endpoints return data

## Security Features

1. **Opaque Tokens**: 10-character base62 tokens (no PII in QR codes)
2. **Rate Limiting**: 1 scan per 5 seconds per card to prevent duplicates
3. **Transaction Logging**: All scans and redemptions logged with timestamps
4. **Error Handling**: Clear error codes (400, 404, 429, 500) with messages
5. **Input Validation**: All endpoints validate required fields

## Business Logic

### Point Calculation

```javascript
points_awarded = Math.floor(amount / 10)
// Example: ₱250 purchase = 25 points
// If no amount provided: 1 point
```

### Reward Unlocking

When a scan increases points across a reward threshold, the response includes `rewards_unlocked`:

```javascript
// Customer has 90 points, scans ₱200 (20 points)
// New balance: 110 points
// Response includes: [{ id: 1, name: "₱50 Discount", ... }]
```

### Rate Limiting

- Each card token can only be scanned once per 5 seconds
- Prevents accidental double-scans at checkout
- Returns HTTP 429 with retry_after seconds

## Database Schema

### customers
- `id` (INTEGER PRIMARY KEY)
- `card_token` (TEXT UNIQUE) - Opaque token embedded in QR
- `name` (TEXT) - Customer name (optional)
- `phone` (TEXT) - Phone number (optional)
- `points` (INTEGER) - Current point balance
- `created_at` (DATETIME)

### transactions
- `id` (INTEGER PRIMARY KEY)
- `customer_id` (INTEGER FK)
- `points_awarded` (INTEGER) - Can be negative for redemptions
- `amount` (REAL) - Purchase amount in pesos
- `note` (TEXT) - Transaction description
- `created_at` (DATETIME)

### rewards
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT) - Reward name
- `points_required` (INTEGER) - Points needed to unlock
- `description` (TEXT) - Reward description

### redemptions
- `id` (INTEGER PRIMARY KEY)
- `customer_id` (INTEGER FK)
- `reward_id` (INTEGER FK)
- `redeemed_at` (DATETIME)

## Sample Data

The seed script creates:

**Customers:**
- `ABC123XYZ0` - Juan Dela Cruz (50 pts)
- `DEF456UVW1` - Maria Santos (150 pts)
- `GHI789RST2` - Pedro Reyes (250 pts)
- `JKL012OPQ3` - Ana Garcia (0 pts)
- `MNO345LMN4` - Carlos Ramos (75 pts)

**Rewards:**
- ID 1: ₱50 Discount (100 points)
- ID 2: ₱120 Discount (200 points)

## Troubleshooting

### Camera not working in scanner UI

- **HTTPS Required**: Modern browsers require HTTPS for camera access (except localhost)
- **Permissions**: Ensure browser has camera permissions
- **Use Manual Entry**: Test with manual token entry at bottom of scanner page

### Database errors

```bash
# Reset database
rm db/loyalty.db
npm run init-db
```

### Port already in use

```bash
# Change port
PORT=4000 npm start
```

## Production Considerations

For production deployment, consider:

1. **Database**: Migrate to PostgreSQL/MySQL for multi-user concurrency
2. **Authentication**: Add admin authentication for admin endpoints
3. **Rate Limiting**: Use Redis for distributed rate limiting
4. **HTTPS**: Deploy with SSL certificate for camera access
5. **Monitoring**: Add logging service (Winston, Pino) and error tracking
6. **Backup**: Implement database backup strategy
7. **Scaling**: Use PM2 or Docker for process management

## License

MIT

## Support

For issues or questions, please check:
- API logs in console
- Database integrity: `sqlite3 db/loyalty.db "SELECT * FROM customers;"`
- Test suite: `npm test`
