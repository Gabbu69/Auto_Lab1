-- Seed data for loyalty card system

-- Insert sample rewards
INSERT INTO rewards (name, points_required, description) VALUES
    ('₱50 Discount', 100, 'Get ₱50 off your next purchase'),
    ('₱120 Discount', 200, 'Get ₱120 off your next purchase');

-- Insert sample customers with opaque tokens
INSERT INTO customers (card_token, name, phone, points) VALUES
    ('ABC123XYZ0', 'Juan Dela Cruz', '09171234567', 50),
    ('DEF456UVW1', 'Maria Santos', '09187654321', 150),
    ('GHI789RST2', 'Pedro Reyes', '09191112233', 250),
    ('JKL012OPQ3', 'Ana Garcia', NULL, 0),
    ('MNO345LMN4', 'Carlos Ramos', '09201234567', 75);

-- Insert sample transactions
INSERT INTO transactions (customer_id, points_awarded, amount, note) VALUES
    (1, 10, 100.00, 'Initial purchase'),
    (1, 20, 200.00, 'Grocery shopping'),
    (1, 20, 200.00, 'Weekly groceries'),
    (2, 50, 500.00, 'Bulk purchase'),
    (2, 100, 1000.00, 'Monthly shopping'),
    (3, 150, 1500.00, 'Large order'),
    (3, 100, 1000.00, 'Regular shopping'),
    (5, 75, 750.00, 'First purchase');

-- Insert sample redemptions
INSERT INTO redemptions (customer_id, reward_id) VALUES
    (2, 1),
    (3, 2);
