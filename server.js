const express = require('express');
const path = require('path');
const QRCode = require('qrcode');
const { customAlphabet } = require('nanoid');
const LoyaltyDatabase = require('./db/database');
const { rateLimitScan } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || 'https://loyalty.example.com';

// Generate opaque tokens (10 chars, base62)
const generateToken = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);

// Initialize database
let db = null;
let dbInitialized = false;

async function initDB() {
    if (!dbInitialized) {
        db = new LoyaltyDatabase();
        await db.init();
        dbInitialized = true;
    }
    return db;
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ============= API ENDPOINTS =============

// POST /api/scan - Award points for a purchase
app.post('/api/scan', rateLimitScan, async (req, res) => {
    try {
        await initDB();
        const { card_token, amount } = req.body;

        if (!card_token) {
            return res.status(400).json({ error: 'card_token is required' });
        }

        // Get or create customer
        let customer = db.getCustomerByToken(card_token);
        if (!customer) {
            customer = db.createCustomer(card_token);
        }

        // Calculate points: 1 point per ₱10, or 1 point if no amount
        const pointsAwarded = amount ? Math.floor(amount / 10) : 1;
        const previousPoints = customer.points;
        const newPoints = previousPoints + pointsAwarded;

        // Update customer points
        db.updateCustomerPoints(customer.id, newPoints);

        // Log transaction
        db.addTransaction(customer.id, pointsAwarded, amount, 'Purchase scan');

        // Check for newly unlocked rewards
        const rewards = db.getRewards();
        const rewardsUnlocked = rewards.filter(reward => 
            previousPoints < reward.points_required && newPoints >= reward.points_required
        );

        res.json({
            customer_id: customer.id,
            customer_name: customer.name,
            points_awarded: pointsAwarded,
            new_points_balance: newPoints,
            rewards_unlocked: rewardsUnlocked.map(r => ({
                id: r.id,
                name: r.name,
                description: r.description
            }))
        });
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ error: 'Failed to process scan', message: error.message });
    }
});

// GET /api/customer/:token - Get customer details
app.get('/api/customer/:token', async (req, res) => {
    try {
        await initDB();
        const { token } = req.params;
        const customer = db.getCustomerByToken(token);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            points: customer.points,
            created_at: customer.created_at
        });
    } catch (error) {
        console.error('Customer lookup error:', error);
        res.status(500).json({ error: 'Failed to fetch customer', message: error.message });
    }
});

// POST /api/redeem - Redeem a reward
app.post('/api/redeem', async (req, res) => {
    try {
        await initDB();
        const { card_token, reward_id } = req.body;

        if (!card_token || !reward_id) {
            return res.status(400).json({ error: 'card_token and reward_id are required' });
        }

        // Get customer
        const customer = db.getCustomerByToken(card_token);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get reward
        const reward = db.getRewardById(reward_id);
        if (!reward) {
            return res.status(404).json({ error: 'Reward not found' });
        }

        // Check if customer has enough points
        if (customer.points < reward.points_required) {
            return res.status(400).json({
                error: 'Insufficient points',
                required: reward.points_required,
                available: customer.points
            });
        }

        // Deduct points
        const newPoints = customer.points - reward.points_required;
        db.updateCustomerPoints(customer.id, newPoints);

        // Create redemption record
        const redemption = db.addRedemption(customer.id, reward_id);

        // Log transaction
        db.addTransaction(customer.id, -reward.points_required, null, `Redeemed: ${reward.name}`);

        res.json({
            success: true,
            redemption_id: redemption.lastInsertRowid,
            reward_name: reward.name,
            points_deducted: reward.points_required,
            new_points_balance: newPoints
        });
    } catch (error) {
        console.error('Redemption error:', error);
        res.status(500).json({ error: 'Failed to process redemption', message: error.message });
    }
});

// GET /api/generate_qr/:token - Generate QR code for a card token
app.get('/api/generate_qr/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const qrUrl = `${BASE_URL}/card/${token}`;
        
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.json({
            token,
            qr_url: qrUrl,
            qr_image: qrDataUrl
        });
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ error: 'Failed to generate QR code', message: error.message });
    }
});

// GET /api/rewards - List all available rewards
app.get('/api/rewards', async (req, res) => {
    try {
        await initDB();
        const rewards = db.getRewards();
        res.json({ rewards });
    } catch (error) {
        console.error('Rewards fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch rewards', message: error.message });
    }
});

// ============= ADMIN ENDPOINTS =============

// GET /api/admin/customers - List all customers
app.get('/api/admin/customers', async (req, res) => {
    try {
        await initDB();
        const customers = db.getAllCustomers();
        res.json({ customers });
    } catch (error) {
        console.error('Admin customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers', message: error.message });
    }
});

// GET /api/admin/redemptions - List all redemptions
app.get('/api/admin/redemptions', async (req, res) => {
    try {
        await initDB();
        const redemptions = db.getAllRedemptions();
        res.json({ redemptions });
    } catch (error) {
        console.error('Admin redemptions error:', error);
        res.status(500).json({ error: 'Failed to fetch redemptions', message: error.message });
    }
});

// GET /api/admin/customer/:id/transactions - Get customer transaction history
app.get('/api/admin/customer/:id/transactions', async (req, res) => {
    try {
        await initDB();
        const { id } = req.params;
        const transactions = db.getCustomerTransactions(parseInt(id));
        res.json({ transactions });
    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions', message: error.message });
    }
});

// POST /api/admin/generate_card - Generate a new card token
app.post('/api/admin/generate_card', async (req, res) => {
    try {
        await initDB();
        const { name, phone } = req.body;
        const token = generateToken();
        const customer = db.createCustomer(token, name, phone);
        
        res.json({
            success: true,
            customer,
            qr_url: `${BASE_URL}/card/${token}`
        });
    } catch (error) {
        console.error('Card generation error:', error);
        res.status(500).json({ error: 'Failed to generate card', message: error.message });
    }
});

// ============= HEALTH CHECK =============

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server (only if not in test mode)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Loyalty Card System running on port ${PORT}`);
        console.log(`📱 Scanner UI: http://localhost:${PORT}/scanner.html`);
        console.log(`🔧 API Base: http://localhost:${PORT}/api`);
    });
}

module.exports = app;
