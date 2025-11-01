const request = require('supertest');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const LoyaltyDatabase = require('../db/database');

// Use a test database
const TEST_DB_PATH = path.join(__dirname, 'test.db');

describe('Loyalty Card API Tests', function() {
    let app;
    let db;

    before(async function() {
        // Set up test database
        process.env.NODE_ENV = 'test';
        
        // Remove existing test database
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }

        // Initialize test database
        db = new LoyaltyDatabase(TEST_DB_PATH);
        await db.init();
        db.initialize();
        db.seed();

        // Require app after database is set up
        // Mock the database module
        const Module = require('module');
        const originalRequire = Module.prototype.require;
        Module.prototype.require = function(id) {
            if (id === '../db/database') {
                return class {
                    constructor() {
                        return db;
                    }
                    async init() {
                        return Promise.resolve();
                    }
                };
            }
            return originalRequire.apply(this, arguments);
        };

        app = require('../server');
    });

    after(function() {
        db.close();
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
    });

    describe('POST /api/scan', function() {
        it('should award points for a valid scan with amount', function(done) {
            request(app)
                .post('/api/scan')
                .send({ card_token: 'ABC123XYZ0', amount: 100 })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('customer_id');
                    expect(res.body).to.have.property('points_awarded');
                    expect(res.body.points_awarded).to.equal(10);
                    expect(res.body).to.have.property('new_points_balance');
                    expect(res.body).to.have.property('rewards_unlocked');
                    done();
                });
        });

        it('should award 1 point when no amount is provided', function(done) {
            request(app)
                .post('/api/scan')
                .send({ card_token: 'JKL012OPQ3' })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body.points_awarded).to.equal(1);
                    done();
                });
        });

        it('should create a new customer for unknown token', function(done) {
            const newToken = 'NEWTOKEN123';
            request(app)
                .post('/api/scan')
                .send({ card_token: newToken, amount: 50 })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('customer_id');
                    expect(res.body.points_awarded).to.equal(5);
                    expect(res.body.new_points_balance).to.equal(5);
                    done();
                });
        });

        it('should return unlocked rewards when threshold is crossed', function(done) {
            // Customer DEF456UVW1 has 150 points, scanning 500 pesos (50 points) should unlock 200-point reward
            request(app)
                .post('/api/scan')
                .send({ card_token: 'DEF456UVW1', amount: 500 })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body.new_points_balance).to.equal(200);
                    expect(res.body.rewards_unlocked).to.be.an('array');
                    expect(res.body.rewards_unlocked.length).to.be.greaterThan(0);
                    done();
                });
        });

        it('should return 400 if card_token is missing', function(done) {
            request(app)
                .post('/api/scan')
                .send({ amount: 100 })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });

        it('should rate limit duplicate scans within 5 seconds', function(done) {
            const token = 'RATELIMIT123';
            
            // First scan
            request(app)
                .post('/api/scan')
                .send({ card_token: token, amount: 100 })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    // Immediate second scan should be rate limited
                    request(app)
                        .post('/api/scan')
                        .send({ card_token: token, amount: 100 })
                        .expect(429)
                        .end((err2, res2) => {
                            if (err2) return done(err2);
                            expect(res2.body).to.have.property('error');
                            expect(res2.body.error).to.equal('Rate limit exceeded');
                            done();
                        });
                });
        });
    });

    describe('GET /api/customer/:token', function() {
        it('should return customer details for valid token', function(done) {
            request(app)
                .get('/api/customer/ABC123XYZ0')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('id');
                    expect(res.body).to.have.property('name');
                    expect(res.body).to.have.property('points');
                    expect(res.body.name).to.equal('Juan Dela Cruz');
                    done();
                });
        });

        it('should return 404 for invalid token', function(done) {
            request(app)
                .get('/api/customer/INVALIDTOKEN')
                .expect(404)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });
    });

    describe('POST /api/redeem', function() {
        it('should fail redemption with insufficient points', function(done) {
            // JKL012OPQ3 has 0 points initially, trying to redeem 100-point reward
            request(app)
                .post('/api/redeem')
                .send({ card_token: 'JKL012OPQ3', reward_id: 1 })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('error');
                    expect(res.body.error).to.equal('Insufficient points');
                    done();
                });
        });

        it('should successfully redeem with sufficient points', function(done) {
            // MNO345LMN4 has 75 points, add more to reach 100
            request(app)
                .post('/api/scan')
                .send({ card_token: 'MNO345LMN4', amount: 250 })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);

                    // Now redeem 100-point reward
                    request(app)
                        .post('/api/redeem')
                        .send({ card_token: 'MNO345LMN4', reward_id: 1 })
                        .expect(200)
                        .end((err2, res2) => {
                            if (err2) return done(err2);
                            expect(res2.body).to.have.property('success');
                            expect(res2.body.success).to.be.true;
                            expect(res2.body).to.have.property('redemption_id');
                            expect(res2.body).to.have.property('new_points_balance');
                            expect(res2.body.points_deducted).to.equal(100);
                            done();
                        });
                });
        });

        it('should return 404 for invalid reward_id', function(done) {
            request(app)
                .post('/api/redeem')
                .send({ card_token: 'GHI789RST2', reward_id: 999 })
                .expect(404)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });

        it('should return 400 if required fields are missing', function(done) {
            request(app)
                .post('/api/redeem')
                .send({ card_token: 'ABC123XYZ0' })
                .expect(400)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('error');
                    done();
                });
        });
    });

    describe('GET /api/generate_qr/:token', function() {
        it('should generate QR code for a token', function(done) {
            request(app)
                .get('/api/generate_qr/ABC123XYZ0')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('token');
                    expect(res.body).to.have.property('qr_url');
                    expect(res.body).to.have.property('qr_image');
                    expect(res.body.qr_image).to.match(/^data:image\/png;base64,/);
                    done();
                });
        });
    });

    describe('GET /api/rewards', function() {
        it('should return list of all rewards', function(done) {
            request(app)
                .get('/api/rewards')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('rewards');
                    expect(res.body.rewards).to.be.an('array');
                    expect(res.body.rewards.length).to.be.greaterThan(0);
                    done();
                });
        });
    });

    describe('Admin Endpoints', function() {
        it('GET /api/admin/customers should return all customers', function(done) {
            request(app)
                .get('/api/admin/customers')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('customers');
                    expect(res.body.customers).to.be.an('array');
                    done();
                });
        });

        it('GET /api/admin/redemptions should return all redemptions', function(done) {
            request(app)
                .get('/api/admin/redemptions')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('redemptions');
                    expect(res.body.redemptions).to.be.an('array');
                    done();
                });
        });

        it('POST /api/admin/generate_card should create new card', function(done) {
            request(app)
                .post('/api/admin/generate_card')
                .send({ name: 'Test Customer', phone: '09123456789' })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('success');
                    expect(res.body).to.have.property('customer');
                    expect(res.body.customer).to.have.property('card_token');
                    done();
                });
        });
    });

    describe('Transaction Logging', function() {
        it('should log transactions for each scan', function(done) {
            const token = 'TRANSLOG123';
            
            request(app)
                .post('/api/scan')
                .send({ card_token: token, amount: 200 })
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    
                    const customerId = res.body.customer_id;
                    
                    // Check transaction was logged
                    request(app)
                        .get(`/api/admin/customer/${customerId}/transactions`)
                        .expect(200)
                        .end((err2, res2) => {
                            if (err2) return done(err2);
                            expect(res2.body).to.have.property('transactions');
                            expect(res2.body.transactions).to.be.an('array');
                            expect(res2.body.transactions.length).to.be.greaterThan(0);
                            
                            const lastTransaction = res2.body.transactions[0];
                            expect(lastTransaction.points_awarded).to.equal(20);
                            expect(lastTransaction.amount).to.equal(200);
                            done();
                        });
                });
        });
    });

    describe('Health Check', function() {
        it('GET /health should return ok status', function(done) {
            request(app)
                .get('/health')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('status');
                    expect(res.body.status).to.equal('ok');
                    done();
                });
        });
    });
});
