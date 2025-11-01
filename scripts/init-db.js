const LoyaltyDatabase = require('../db/database');

async function initDatabase() {
    console.log('Initializing database...');
    const db = new LoyaltyDatabase();

    try {
        await db.init();
        console.log('✓ Database connection established');
        
        db.initialize();
        console.log('✓ Database schema created');
        
        db.seed();
        console.log('✓ Sample data seeded');
        
        console.log('\nDatabase initialized successfully!');
        console.log('Location: db/loyalty.db');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

initDatabase();
