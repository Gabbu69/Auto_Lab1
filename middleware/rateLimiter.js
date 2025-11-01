const scanTimestamps = new Map();
const RATE_LIMIT_WINDOW = 5000; // 5 seconds

function rateLimitScan(req, res, next) {
    const { card_token } = req.body;
    
    if (!card_token) {
        return next();
    }

    const now = Date.now();
    const lastScan = scanTimestamps.get(card_token);

    if (lastScan && (now - lastScan) < RATE_LIMIT_WINDOW) {
        const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastScan)) / 1000);
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: `Please wait ${remainingTime} seconds before scanning again`,
            retry_after: remainingTime
        });
    }

    scanTimestamps.set(card_token, now);
    
    // Clean up old entries (older than 1 minute)
    if (scanTimestamps.size > 1000) {
        const cutoff = now - 60000;
        for (const [token, timestamp] of scanTimestamps.entries()) {
            if (timestamp < cutoff) {
                scanTimestamps.delete(token);
            }
        }
    }

    next();
}

module.exports = { rateLimitScan };
