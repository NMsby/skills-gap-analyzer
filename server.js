const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const MistralClient = require('./src/mistral-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Mistral client
const mistralClient = new MistralClient(process.env.MISTRAL_API_KEY);

// landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));



// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, and image files are allowed!'));
        }
    }
});

// Routes
app.post('/api/upload-cv', upload.single('cv'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        path: req.file.path
    });
});

app.post('/api/analyze-cv', async (req, res) => {
    try {
        const { filename } = req.body;
        const filePath = path.join('public/uploads', filename);

        // Extract text from CV using Mistral OCR
        const cvText = await mistralClient.extractTextFromCV(filePath);

        // Extract skills from CV text
        const skills = await mistralClient.extractSkills(cvText);

        res.json({
            success: true,
            skills: skills,
            message: 'CV analyzed successfully'
        });
    } catch (error) {
        console.error('CV analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze CV',
            details: error.message
        });
    }
});

app.post('/api/scan-jobs', async (req, res) => {
    try {
        const { skills } = req.body;

        // Scan job market using Mistral web search
        const jobs = await mistralClient.scanJobMarket(skills);

        res.json({
            success: true,
            jobs: jobs,
            message: 'Job market scanned successfully'
        });
    } catch (error) {
        console.error('Job scanning error:', error);
        res.status(500).json({
            error: 'Failed to scan job market',
            details: error.message
        });
    }
});

app.post('/api/analyze-gaps', async (req, res) => {
    try {
        const { userSkills, jobMarketData } = req.body;

        // Analyze skills gaps using Mistral AI
        const analysis = await mistralClient.analyzeSkillsGap(userSkills, jobMarketData);

        res.json({
            success: true,
            analysis: analysis,
            message: 'Skills gap analysis completed'
        });
    } catch (error) {
        console.error('Gap analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze skills gap',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to view the application`);
});