const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'loyalty.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let SQL = null;

class LoyaltyDatabase {
    constructor(dbPath = DB_PATH) {
        this.dbPath = dbPath;
        this.db = null;
        this.initialized = false;
    }

    async init() {
        if (!SQL) {
            SQL = await initSqlJs();
        }

        if (fs.existsSync(this.dbPath)) {
            const buffer = fs.readFileSync(this.dbPath);
            this.db = new SQL.Database(buffer);
        } else {
            this.db = new SQL.Database();
        }
        this.initialized = true;
    }

    save() {
        if (this.db) {
            const data = this.db.export();
            const buffer = Buffer.from(data);
            fs.writeFileSync(this.dbPath, buffer);
        }
    }

    initialize() {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        this.db.run(schema);
        this.save();
    }

    seed() {
        const seedData = fs.readFileSync(SEED_PATH, 'utf8');
        this.db.run(seedData);
        this.save();
    }

    getCustomerByToken(token) {
        const stmt = this.db.prepare('SELECT * FROM customers WHERE card_token = ?');
        stmt.bind([token]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
        }
        stmt.free();
        return null;
    }

    createCustomer(token, name = null, phone = null) {
        this.db.run(
            'INSERT INTO customers (card_token, name, phone) VALUES (?, ?, ?)',
            [token, name, phone]
        );
        this.save();
        return this.getCustomerByToken(token);
    }

    updateCustomerPoints(customerId, points) {
        this.db.run(
            'UPDATE customers SET points = ? WHERE id = ?',
            [points, customerId]
        );
        this.save();
    }

    addTransaction(customerId, pointsAwarded, amount = null, note = null) {
        this.db.run(
            'INSERT INTO transactions (customer_id, points_awarded, amount, note) VALUES (?, ?, ?, ?)',
            [customerId, pointsAwarded, amount, note]
        );
        this.save();
        return { lastInsertRowid: this.db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
    }

    getRewards() {
        const result = this.db.exec('SELECT * FROM rewards ORDER BY points_required ASC');
        if (result.length === 0) return [];
        return this._rowsToObjects(result[0]);
    }

    getRewardById(rewardId) {
        const stmt = this.db.prepare('SELECT * FROM rewards WHERE id = ?');
        stmt.bind([rewardId]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
        }
        stmt.free();
        return null;
    }

    addRedemption(customerId, rewardId) {
        this.db.run(
            'INSERT INTO redemptions (customer_id, reward_id) VALUES (?, ?)',
            [customerId, rewardId]
        );
        this.save();
        return { lastInsertRowid: this.db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
    }

    getAllCustomers() {
        const result = this.db.exec('SELECT * FROM customers ORDER BY created_at DESC');
        if (result.length === 0) return [];
        return this._rowsToObjects(result[0]);
    }

    getAllRedemptions() {
        const result = this.db.exec(`
            SELECT r.id, r.redeemed_at, c.name as customer_name, c.card_token, 
                   rw.name as reward_name, rw.points_required
            FROM redemptions r
            JOIN customers c ON r.customer_id = c.id
            JOIN rewards rw ON r.reward_id = rw.id
            ORDER BY r.redeemed_at DESC
        `);
        if (result.length === 0) return [];
        return this._rowsToObjects(result[0]);
    }

    getCustomerTransactions(customerId) {
        const result = this.db.exec(
            'SELECT * FROM transactions WHERE customer_id = ? ORDER BY created_at DESC',
            [customerId]
        );
        if (result.length === 0) return [];
        return this._rowsToObjects(result[0]);
    }

    _rowsToObjects(result) {
        const { columns, values } = result;
        return values.map(row => {
            const obj = {};
            columns.forEach((col, i) => {
                obj[col] = row[i];
            });
            return obj;
        });
    }

    close() {
        if (this.db) {
            this.save();
            this.db.close();
        }
    }
}

module.exports = LoyaltyDatabase;
