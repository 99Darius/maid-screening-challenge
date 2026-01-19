import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
    console.log('Initializing database...');

    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        instagram VARCHAR(100),
        expected_salary VARCHAR(100),
        start_date VARCHAR(50),
        video_link TEXT,
        math_score INTEGER,
        house VARCHAR(50),
        personality VARCHAR(100),
        trait_scores JSONB,
        personality_answers JSONB
      )
    `);

        console.log('Database initialized successfully!');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initDatabase();
