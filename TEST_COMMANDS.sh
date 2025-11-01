#!/bin/bash
# Test commands for Loyalty Card System MVP
# Run these after starting the server with: npm start

BASE_URL="http://localhost:3000"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          🧪 LOYALTY CARD SYSTEM - TEST COMMANDS                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Health Check
echo "1️⃣  Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl $BASE_URL/health"
echo ""

# Scan a card (award points)
echo "2️⃣  Scan Card - Award Points (₱250 = 25 points)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl -X POST $BASE_URL/api/scan \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"card_token\": \"ABC123XYZ0\", \"amount\": 250}'"
echo ""

# Get customer details
echo "3️⃣  Get Customer Details"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl $BASE_URL/api/customer/ABC123XYZ0"
echo ""

# Scan to unlock reward (customer with 50 pts + 500 pesos = 100 pts total)
echo "4️⃣  Scan to Unlock Reward (₱500 = 50 pts, total 100 pts)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl -X POST $BASE_URL/api/scan \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"card_token\": \"ABC123XYZ0\", \"amount\": 500}'"
echo ""

# List all rewards
echo "5️⃣  List All Rewards"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl $BASE_URL/api/rewards"
echo ""

# Redeem a reward
echo "6️⃣  Redeem Reward (₱50 Discount - 100 points)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl -X POST $BASE_URL/api/redeem \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"card_token\": \"GHI789RST2\", \"reward_id\": 1}'"
echo ""

# Generate QR code
echo "7️⃣  Generate QR Code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl $BASE_URL/api/generate_qr/ABC123XYZ0"
echo ""

# Admin: List all customers
echo "8️⃣  Admin - List All Customers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl $BASE_URL/api/admin/customers"
echo ""

# Admin: List all redemptions
echo "9️⃣  Admin - List All Redemptions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl $BASE_URL/api/admin/redemptions"
echo ""

# Admin: Get customer transactions
echo "🔟 Admin - Get Customer Transactions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl $BASE_URL/api/admin/customer/1/transactions"
echo ""

# Admin: Generate new card
echo "1️⃣1️⃣  Admin - Generate New Card"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl -X POST $BASE_URL/api/admin/generate_card \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\": \"Test Customer\", \"phone\": \"09123456789\"}'"
echo ""

# Test rate limiting
echo "1️⃣2️⃣  Test Rate Limiting (scan same card twice quickly)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "curl -X POST $BASE_URL/api/scan \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"card_token\": \"JKL012OPQ3\", \"amount\": 100}'"
echo ""
echo "# Immediately scan again (should get 429 error):"
echo "curl -X POST $BASE_URL/api/scan \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"card_token\": \"JKL012OPQ3\", \"amount\": 100}'"
echo ""

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  💡 TIP: Copy and paste these commands to test the API          ║"
echo "║  📱 Or open http://localhost:3000/scanner.html for UI testing   ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
