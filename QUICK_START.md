# 🚀 Quick Start Guide

## Installation (3 commands)

```bash
npm install
npm run init-db
npm start
```

## Test the System

### 1. Run Automated Tests
```bash
npm test
```

### 2. Test API with curl

**Scan a card (award points):**
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"card_token": "ABC123XYZ0", "amount": 250}'
```

**Get customer info:**
```bash
curl http://localhost:3000/api/customer/ABC123XYZ0
```

**Redeem a reward:**
```bash
curl -X POST http://localhost:3000/api/redeem \
  -H "Content-Type: application/json" \
  -d '{"card_token": "GHI789RST2", "reward_id": 1}'
```

**Generate QR code:**
```bash
curl http://localhost:3000/api/generate_qr/ABC123XYZ0
```

### 3. Use the Scanner UI

1. Start server: `npm start`
2. Open: `http://localhost:3000/scanner.html`
3. Click "Start Camera" or use manual entry
4. Test tokens:
   - `ABC123XYZ0` (Juan, 50 pts)
   - `DEF456UVW1` (Maria, 150 pts)
   - `GHI789RST2` (Pedro, 250 pts)

## Sample Data

**Customers:**
| Token | Name | Points |
|-------|------|--------|
| ABC123XYZ0 | Juan Dela Cruz | 50 |
| DEF456UVW1 | Maria Santos | 150 |
| GHI789RST2 | Pedro Reyes | 250 |
| JKL012OPQ3 | Ana Garcia | 0 |
| MNO345LMN4 | Carlos Ramos | 75 |

**Rewards:**
| ID | Name | Points Required |
|----|------|-----------------|
| 1 | ₱50 Discount | 100 |
| 2 | ₱120 Discount | 200 |

## Key Features

✅ **Point Accrual**: 1 point per ₱10 spent  
✅ **Rate Limiting**: 1 scan per 5 seconds per card  
✅ **Reward Unlocking**: Automatic detection when thresholds crossed  
✅ **Transaction Logging**: All scans and redemptions logged  
✅ **QR Generation**: PNG data URLs for printing cards  
✅ **Browser Scanner**: Camera-based QR scanning with jsQR  

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Award points for purchase |
| GET | `/api/customer/:token` | Get customer details |
| POST | `/api/redeem` | Redeem a reward |
| GET | `/api/generate_qr/:token` | Generate QR code |
| GET | `/api/rewards` | List all rewards |
| GET | `/api/admin/customers` | List all customers |
| GET | `/api/admin/redemptions` | List all redemptions |
| POST | `/api/admin/generate_card` | Create new card |

## Troubleshooting

**Reset database:**
```bash
rm db/loyalty.db
npm run init-db
```

**Change port:**
```bash
PORT=4000 npm start
```

**View logs:**
All API calls are logged to console with timestamps.

## Next Steps

See `LOYALTY_README.md` for:
- Detailed API documentation
- Security features
- Production deployment guide
- Database schema details
