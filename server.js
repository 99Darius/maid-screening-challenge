import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// API Routes

// Get all submissions (for admin dashboard)
app.get('/api/submissions', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM submissions ORDER BY timestamp DESC'
        );

        const submissions = result.rows.map(row => ({
            Timestamp: row.timestamp,
            Name: row.name,
            Phone: row.phone,
            Instagram: row.instagram,
            Salary: row.expected_salary,
            'Start Date': row.start_date,
            Video: row.video_link,
            'Math Score': row.math_score,
            House: row.house,
            Personality: row.personality,
            'Trait Scores': row.trait_scores,
            Answers: row.personality_answers
        }));

        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Save a new submission
app.post('/api/submissions', async (req, res) => {
    try {
        const {
            name,
            phone,
            instagram,
            expectedSalary,
            startDate,
            videoLink,
            mathScore,
            house,
            personality,
            traitScores,
            personalityAnswers
        } = req.body;

        await pool.query(
            `INSERT INTO submissions 
       (name, phone, instagram, expected_salary, start_date, video_link, math_score, house, personality, trait_scores, personality_answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                name,
                phone,
                instagram || 'Not provided',
                expectedSalary,
                startDate,
                videoLink,
                mathScore,
                house,
                personality,
                JSON.stringify(traitScores),
                JSON.stringify(personalityAnswers)
            ]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving submission:', error);
        res.status(500).json({ error: 'Failed to save submission' });
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
