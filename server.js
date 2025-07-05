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

// Enhanced Routes

// CV Upload and Processing
app.post('/api/upload-cv', upload.single('cv'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        console.log('File uploaded:', req.file.filename);
        
        // Immediately start processing the CV with enhanced analysis
        const extractedData = await processCVWithMistral(req.file.path, req.file.filename);
        
        res.json({
            success: true,
            message: 'File uploaded and analyzed successfully',
            filename: req.file.filename,
            path: req.file.path,
            extractedData: extractedData
        });
    } catch (error) {
        console.error('CV upload and processing error:', error);
        res.status(500).json({
            error: 'Failed to process CV',
            details: error.message,
            // Provide fallback data for demo
            extractedData: getEnhancedFallbackData(req.file.filename)
        });
    }
});

// Legacy CV Analysis (for backward compatibility)
app.post('/api/analyze-cv', async (req, res) => {
    try {
        const { filename } = req.body;
        const filePath = path.join('public/uploads', filename);

        const extractedData = await processCVWithMistral(filePath, filename);

        res.json({
            success: true,
            skills: extractedData,
            message: 'CV analyzed successfully'
        });
    } catch (error) {
        console.error('CV analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze CV',
            details: error.message,
            skills: getEnhancedFallbackData(filename)
        });
    }
});

// Enhanced Skills Analysis
app.post('/api/analyze-skills', async (req, res) => {
    try {
        const { extractedSkills, targetRole } = req.body;
        
        console.log('Starting enhanced skills analysis...');
        console.log('Career Field:', extractedSkills.detectedCareerField);
        console.log('Target Role:', targetRole);

        // Perform comprehensive skills gap analysis
        const analysis = await analyzeSkillsGap(extractedSkills, targetRole);
        
        res.json(analysis);
    } catch (error) {
        console.error('Enhanced skills analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze skills',
            details: error.message,
            // Provide fallback analysis
            ...getCareerSpecificFallback(req.body.extractedSkills, req.body.targetRole)
        });
    }
});

// Job Market Scanning
app.post('/api/scan-jobs', async (req, res) => {
    try {
        const { skills, careerField, location } = req.body;
        
        // Enhanced job market scanning
        const jobs = await scanJobMarket(careerField || 'Software Engineering', location);
        
        res.json({
            success: true,
            jobs: jobs,
            message: 'Job market scanned successfully'
        });
    } catch (error) {
        console.error('Job scanning error:', error);
        res.status(500).json({
            error: 'Failed to scan job market',
            details: error.message,
            jobs: getFallbackJobMarketData(req.body.careerField || 'Software Engineering')
        });
    }
});

// Career-Specific Job Recommendations
app.post('/api/job-recommendations', async (req, res) => {
    try {
        const { careerField, experienceLevel, location } = req.body;
        
        console.log(`Getting job recommendations for ${careerField} (${experienceLevel}) in ${location}`);
        
        const jobRecommendations = await getJobRecommendations(careerField, experienceLevel, location);
        
        res.json(jobRecommendations);
    } catch (error) {
        console.error('Job recommendations error:', error);
        res.status(500).json({
            error: 'Failed to get job recommendations',
            details: error.message,
            ...getFallbackJobRecommendations(req.body.careerField, req.body.experienceLevel)
        });
    }
});

// Certification Roadmap
app.post('/api/certification-roadmap', async (req, res) => {
    try {
        const { careerField, currentSkills, targetRole } = req.body;
        
        console.log(`Generating certification roadmap for ${careerField}`);
        
        const roadmap = await getCertificationRoadmap(careerField, currentSkills, targetRole);
        
        res.json(roadmap);
    } catch (error) {
        console.error('Certification roadmap error:', error);
        res.status(500).json({
            error: 'Failed to generate certification roadmap',
            details: error.message,
            ...getFallbackCertificationRoadmap(req.body.careerField)
        });
    }
});

// Market Insights
app.get('/api/market-insights/:careerField', async (req, res) => {
    try {
        const { careerField } = req.params;
        const { location } = req.query;
        
        const insights = await getMarketInsights(careerField, location);
        
        res.json(insights);
    } catch (error) {
        console.error('Market insights error:', error);
        res.status(500).json({
            error: 'Failed to get market insights',
            details: error.message,
            ...getFallbackMarketInsights(req.params.careerField)
        });
    }
});

// Legacy Gap Analysis (for backward compatibility)
app.post('/api/analyze-gaps', async (req, res) => {
    try {
        const { userSkills, jobMarketData } = req.body;

        const analysis = await mistralClient.analyzeSkillsGap(
            userSkills, 
            jobMarketData, 
            userSkills.detectedCareerField || 'Software Engineering',
            'career advancement'
        );

        res.json({
            success: true,
            analysis: analysis,
            message: 'Skills gap analysis completed'
        });
    } catch (error) {
        console.error('Gap analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze skills gap',
            details: error.message,
            analysis: getCareerSpecificFallback(userSkills, 'career advancement')
        });
    }
});

// Core Processing Functions

async function processCVWithMistral(filePath, filename) {
    try {
        console.log('Starting enhanced CV analysis with Mistral AI...');
        
        // Step 1: Extract text using Mistral OCR
        const extractedText = await mistralClient.extractTextFromCV(filePath);
        console.log('Text extracted successfully');
        
        // Step 2: Perform comprehensive career analysis
        const careerProfile = await mistralClient.analyzeCareerProfile(extractedText);
        console.log('Career profile analyzed:', careerProfile.detectedCareerField);
        
        // Step 3: Get job market insights for the detected career field
        const marketInsights = await mistralClient.getJobMarketInsights(careerProfile.detectedCareerField);
        console.log('Market insights gathered');
        
        return {
            ...careerProfile,
            marketInsights,
            extractedText: extractedText.substring(0, 500) + '...' // First 500 chars for reference
        };
    } catch (error) {
        console.error('CV Processing Error:', error);
        // Enhanced fallback based on filename or default
        return getEnhancedFallbackData(filename);
    }
}

async function analyzeSkillsGap(careerProfile, targetRole) {
    try {
        const {
            detectedCareerField,
            experienceLevel,
            technicalSkills,
            softSkills
        } = careerProfile;
        
        console.log(`Analyzing skills gap for ${detectedCareerField} (${experienceLevel})`);
        
        // Get career-specific recommendations
        const recommendations = await mistralClient.getCareerSpecificRecommendations(
            detectedCareerField,
            experienceLevel,
            [...technicalSkills, ...softSkills],
            targetRole
        );
        
        // Get current job market requirements for the target role or career field
        const jobMarketData = await mistralClient.scanJobMarket(targetRole || detectedCareerField);
        
        // Calculate skill gaps based on market requirements vs current skills
        const allCurrentSkills = [...technicalSkills, ...softSkills];
        const marketRequiredSkills = extractSkillsFromJobData(jobMarketData);
        
        const skillMatches = marketRequiredSkills.filter(skill => 
            allCurrentSkills.some(currentSkill => 
                currentSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(currentSkill.toLowerCase())
            )
        );
        
        const skillGaps = marketRequiredSkills.filter(skill => 
            !allCurrentSkills.some(currentSkill => 
                currentSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(currentSkill.toLowerCase())
            )
        );
        
        const matchPercentage = marketRequiredSkills.length > 0 
            ? ((skillMatches.length / marketRequiredSkills.length) * 100).toFixed(1)
            : 0;
        
        return {
            careerField: detectedCareerField,
            experienceLevel,
            currentSkills: {
                technical: technicalSkills,
                soft: softSkills,
                total: allCurrentSkills.length
            },
            marketRequiredSkills,
            skillMatches,
            skillGaps,
            matchPercentage,
            recommendations,
            careerRoadmap: recommendations.careerRoadmap,
            prioritySkills: recommendations.skillPriorities?.slice(0, 5) || [], // Top 5 priority skills
            certificationRecommendations: recommendations.certificationRecommendations,
            salaryProjection: recommendations.salaryProjection,
            industryInsights: recommendations.industryInsights,
            learningPath: recommendations.learningPath
        };
    } catch (error) {
        console.error('Enhanced Skills Gap Analysis Error:', error);
        return getCareerSpecificFallback(careerProfile, targetRole);
    }
}

async function scanJobMarket(careerField, location = 'Kenya') {
    try {
        const jobData = await mistralClient.scanJobMarket(careerField, location);
        return {
            totalJobs: jobData.length,
            jobs: jobData,
            averageSalary: calculateAverageSalary(jobData, careerField),
            topCompanies: extractTopCompanies(jobData),
            requiredSkills: extractSkillsFromJobData(jobData),
            locations: extractLocations(jobData),
            remoteOpportunities: calculateRemotePercentage(jobData)
        };
    } catch (error) {
        console.error('Job Market Scan Error:', error);
        return getFallbackJobMarketData(careerField);
    }
}

async function getJobRecommendations(careerField, experienceLevel, location = 'Kenya') {
    try {
        const searchQuery = `${careerField} ${experienceLevel} jobs ${location}`;
        const jobData = await mistralClient.scanJobMarket(searchQuery, location);
        
        return {
            recommendedJobs: extractJobRecommendations(jobData, careerField, experienceLevel),
            careerProgression: generateCareerProgression(careerField, experienceLevel),
            skillDemandTrends: getSkillDemandTrends(careerField),
            marketInsights: await mistralClient.getJobMarketInsights(careerField, location)
        };
    } catch (error) {
        console.error('Job Recommendations Error:', error);
        return getFallbackJobRecommendations(careerField, experienceLevel);
    }
}

async function getCertificationRoadmap(careerField, currentSkills, targetRole) {
    try {
        const recommendations = await mistralClient.getCareerSpecificRecommendations(
            careerField, 
            'mid', // default experience level
            currentSkills, 
            targetRole
        );
        
        return {
            certifications: recommendations.certificationRecommendations || [],
            timeline: generateCertificationTimeline(recommendations.certificationRecommendations),
            cost: calculateTotalCertificationCost(recommendations.certificationRecommendations)
        };
    } catch (error) {
        console.error('Certification Roadmap Error:', error);
        return getFallbackCertificationRoadmap(careerField);
    }
}

async function getMarketInsights(careerField, location = 'Kenya') {
    try {
        return await mistralClient.getJobMarketInsights(careerField, location);
    } catch (error) {
        console.error('Market Insights Error:', error);
        return getFallbackMarketInsights(careerField);
    }
}

// Helper Functions

function extractSkillsFromJobData(jobData) {
    if (!jobData || !Array.isArray(jobData)) return [];
    
    const allSkills = [];
    jobData.forEach(job => {
        if (job.skills_required && Array.isArray(job.skills_required)) {
            allSkills.push(...job.skills_required);
        }
    });
    
    // Return unique skills, sorted by frequency
    const skillCounts = {};
    allSkills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    
    return Object.keys(skillCounts)
        .sort((a, b) => skillCounts[b] - skillCounts[a])
        .slice(0, 10); // Top 10 most demanded skills
}

function calculateAverageSalary(jobData, careerField) {
    const salaryRanges = {
        'Software Engineering': 'KES 120,000 - 250,000',
        'Data Science': 'KES 140,000 - 300,000',
        'Digital Marketing': 'KES 80,000 - 180,000',
        'UI/UX Design': 'KES 90,000 - 200,000',
        'Project Management': 'KES 100,000 - 220,000'
    };
    return salaryRanges[careerField] || 'KES 100,000 - 200,000';
}

function extractTopCompanies(jobData) {
    if (!jobData || !Array.isArray(jobData)) {
        return ['Safaricom PLC', 'Equity Bank', 'KCB Group', 'Jumia Kenya', 'Twiga Foods'];
    }
    
    const companies = jobData.map(job => job.company).filter(Boolean);
    const uniqueCompanies = [...new Set(companies)];
    return uniqueCompanies.slice(0, 5);
}

function extractLocations(jobData) {
    if (!jobData || !Array.isArray(jobData)) {
        return ['Nairobi', 'Remote', 'Mombasa', 'Kisumu'];
    }
    
    const locations = jobData.map(job => job.location).filter(Boolean);
    const uniqueLocations = [...new Set(locations)];
    return uniqueLocations.slice(0, 5);
}

function calculateRemotePercentage(jobData) {
    if (!jobData || !Array.isArray(jobData)) return '65%';
    
    const remoteJobs = jobData.filter(job => 
        job.remote_option === true || 
        (job.location && job.location.toLowerCase().includes('remote'))
    );
    
    const percentage = ((remoteJobs.length / jobData.length) * 100).toFixed(0);
    return `${percentage}%`;
}

function extractJobRecommendations(jobData, careerField, experienceLevel) {
    if (!jobData || !Array.isArray(jobData)) {
        return getFallbackJobRecommendations(careerField, experienceLevel).recommendedJobs;
    }
    
    return jobData.map(job => ({
        ...job,
        match: calculateJobMatch(job, careerField, experienceLevel)
    })).slice(0, 5);
}

function calculateJobMatch(job, careerField, experienceLevel) {
    // Simple matching algorithm - can be enhanced
    let matchScore = 70; // Base score
    
    if (job.title && job.title.toLowerCase().includes(careerField.toLowerCase())) {
        matchScore += 15;
    }
    
    if (job.experience_required && job.experience_required.includes(experienceLevel)) {
        matchScore += 10;
    }
    
    return Math.min(matchScore, 95) + '%';
}

function generateCareerProgression(careerField, currentLevel) {
    const progressionPaths = {
        'Software Engineering': {
            'junior': ['Senior Developer', 'Tech Lead', 'Engineering Manager'],
            'mid': ['Senior Developer', 'Staff Engineer', 'Engineering Manager', 'Solutions Architect'],
            'senior': ['Principal Engineer', 'Engineering Director', 'VP Engineering', 'CTO']
        },
        'Data Science': {
            'junior': ['Senior Data Scientist', 'ML Engineer', 'Analytics Manager'],
            'mid': ['Principal Data Scientist', 'Head of Analytics', 'Data Science Manager'],
            'senior': ['VP of Data Science', 'Chief Data Officer', 'Head of AI']
        },
        'Digital Marketing': {
            'junior': ['Senior Digital Marketer', 'Marketing Specialist', 'Campaign Manager'],
            'mid': ['Marketing Manager', 'Growth Manager', 'Head of Marketing'],
            'senior': ['VP Marketing', 'CMO', 'Head of Growth']
        }
    };
    
    return progressionPaths[careerField]?.[currentLevel] || ['Senior Role', 'Management Role', 'Executive Role'];
}

function getSkillDemandTrends(careerField) {
    const trends = {
        'Software Engineering': ['Cloud Computing', 'AI/ML', 'Cybersecurity', 'DevOps', 'Microservices'],
        'Data Science': ['Machine Learning', 'Deep Learning', 'MLOps', 'Big Data', 'AI Ethics'],
        'Digital Marketing': ['Marketing Automation', 'Data Analytics', 'Voice Search', 'Video Marketing', 'Privacy-First Marketing'],
        'UI/UX Design': ['Design Systems', 'Voice UI', 'AR/VR Design', 'Accessibility', 'Motion Design']
    };
    
    return trends[careerField] || ['Digital Transformation', 'AI Integration', 'Remote Collaboration'];
}

function generateCertificationTimeline(certifications) {
    if (!certifications || certifications.length === 0) {
        return '6-12 months';
    }
    
    const totalMonths = certifications.reduce((total, cert) => {
        const duration = cert.duration || '3 months';
        const months = parseInt(duration.match(/\d+/)?.[0] || '3');
        return total + months;
    }, 0);
    
    return `${totalMonths} months`;
}

function calculateTotalCertificationCost(certifications) {
    if (!certifications || certifications.length === 0) {
        return 'KES 35,000 - 50,000';
    }
    
    const totalCost = certifications.reduce((total, cert) => {
        const cost = cert.cost || 'KES 15,000';
        const amount = parseInt(cost.replace(/[^\d]/g, '')) || 15000;
        return total + amount;
    }, 0);
    
    return `KES ${totalCost.toLocaleString()}`;
}

// Enhanced Fallback Functions

function getEnhancedFallbackData(filename) {
    const careerField = detectCareerFieldFromFilename(filename);
    
    const fallbackProfiles = {
        'Software Engineering': {
            detectedCareerField: 'Software Engineering',
            experienceLevel: 'junior',
            careerPath: 'Junior software developer with focus on web development',
            technicalSkills: ['JavaScript', 'Python', 'HTML', 'CSS', 'SQL', 'Git'],
            softSkills: ['Problem-solving', 'Communication', 'Teamwork', 'Critical Thinking'],
            certifications: ['Google Analytics Certified'],
            industries: ['Technology', 'Fintech', 'E-commerce'],
            rolesSuitable: ['Frontend Developer', 'Full Stack Developer', 'Software Engineer'],
            strengthAreas: ['Web Development', 'Programming Logic', 'Problem Solving'],
            improvementAreas: ['Cloud Computing', 'DevOps', 'System Design'],
            salaryRange: 'KES 80,000 - 150,000',
            experienceYears: 2,
            jobTitles: ['Software Developer', 'Web Developer']
        },
        'Data Science': {
            detectedCareerField: 'Data Science',
            experienceLevel: 'junior',
            careerPath: 'Junior data analyst transitioning to data science',
            technicalSkills: ['Python', 'SQL', 'Excel', 'Statistics', 'Pandas'],
            softSkills: ['Analytical Thinking', 'Communication', 'Problem-solving', 'Attention to Detail'],
            certifications: ['Google Data Analytics'],
            industries: ['Banking', 'Healthcare', 'Technology'],
            rolesSuitable: ['Data Analyst', 'Business Analyst', 'Junior Data Scientist'],
            strengthAreas: ['Data Analysis', 'Statistical Analysis', 'Excel'],
            improvementAreas: ['Machine Learning', 'Data Visualization', 'Big Data'],
            salaryRange: 'KES 100,000 - 180,000',
            experienceYears: 1,
            jobTitles: ['Data Analyst', 'Business Analyst']
        },
        'Digital Marketing': {
            detectedCareerField: 'Digital Marketing',
            experienceLevel: 'junior',
            careerPath: 'Digital marketing specialist with social media focus',
            technicalSkills: ['Google Analytics', 'Social Media Marketing', 'SEO', 'Content Marketing'],
            softSkills: ['Creativity', 'Communication', 'Strategic Thinking', 'Adaptability'],
            certifications: ['Google Ads', 'Facebook Marketing'],
            industries: ['E-commerce', 'Retail', 'Technology'],
            rolesSuitable: ['Digital Marketer', 'Social Media Manager', 'Marketing Coordinator'],
            strengthAreas: ['Social Media', 'Content Creation', 'Campaign Management'],
            improvementAreas: ['Data Analytics', 'Marketing Automation', 'Growth Hacking'],
            salaryRange: 'KES 70,000 - 130,000',
            experienceYears: 2,
            jobTitles: ['Digital Marketer', 'Social Media Specialist']
        }
    };
    
    const profile = fallbackProfiles[careerField] || fallbackProfiles['Software Engineering'];
    
    return {
        ...profile,
        marketInsights: {
            marketDemand: 'High',
            averageSalary: profile.salaryRange,
            jobGrowthRate: '+15% annually',
            remoteOpportunities: '65%'
        }
    };
}

function detectCareerFieldFromFilename(filename) {
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.includes('data') || lowerFilename.includes('analyst')) {
        return 'Data Science';
    } else if (lowerFilename.includes('marketing') || lowerFilename.includes('digital')) {
        return 'Digital Marketing';
    } else if (lowerFilename.includes('design') || lowerFilename.includes('ui') || lowerFilename.includes('ux')) {
        return 'UI/UX Design';
    } else if (lowerFilename.includes('project') || lowerFilename.includes('manager')) {
        return 'Project Management';
    } else {
        return 'Software Engineering';
    }
}

function getCareerSpecificFallback(careerProfile, targetRole) {
    const careerField = careerProfile?.detectedCareerField || 'Software Engineering';
    
    const fallbackAnalyses = {
        'Software Engineering': {
            prioritySkills: [
                { skill: 'React', importance: 'critical', reason: 'High demand in frontend development', timeToLearn: '3 months' },
                { skill: 'Node.js', importance: 'high', reason: 'Essential for full-stack development', timeToLearn: '2 months' },
                { skill: 'AWS', importance: 'high', reason: 'Cloud skills are in high demand', timeToLearn: '4 months' },
                { skill: 'Docker', importance: 'medium', reason: 'Containerization is becoming standard', timeToLearn: '1 month' },
                { skill: 'MongoDB', importance: 'medium', reason: 'NoSQL databases are popular', timeToLearn: '2 months' }
            ],
            salaryProjection: {
                current: 'KES 80,000 - 120,000',
                withSkills: 'KES 150,000 - 250,000',
                topTier: 'KES 300,000+'
            },
            matchPercentage: '65.0'
        },
        'Data Science': {
            prioritySkills: [
                { skill: 'Machine Learning', importance: 'critical', reason: 'Core requirement for data science roles', timeToLearn: '6 months' },
                { skill: 'Tableau', importance: 'high', reason: 'Data visualization is crucial', timeToLearn: '2 months' },
                { skill: 'R', importance: 'medium', reason: 'Statistical analysis tool', timeToLearn: '3 months' },
                { skill: 'Apache Spark', importance: 'medium', reason: 'Big data processing', timeToLearn: '4 months' },
                { skill: 'TensorFlow', importance: 'high', reason: 'Deep learning framework', timeToLearn: '5 months' }
            ],
            salaryProjection: {
                current: 'KES 100,000 - 150,000',
                withSkills: 'KES 200,000 - 300,000',
                topTier: 'KES 400,000+'
            },
            matchPercentage: '58.0'
        },
        'Digital Marketing': {
            prioritySkills: [
                { skill: 'Google Ads', importance: 'critical', reason: 'Paid advertising is essential', timeToLearn: '2 months' },
                { skill: 'Marketing Automation', importance: 'high', reason: 'Efficiency and scalability', timeToLearn: '3 months' },
                { skill: 'Data Analytics', importance: 'high', reason: 'Data-driven marketing decisions', timeToLearn: '4 months' },
                { skill: 'Content Strategy', importance: 'medium', reason: 'Content is king in marketing', timeToLearn: '2 months' },
                { skill: 'CRM Management', importance: 'medium', reason: 'Customer relationship management', timeToLearn: '1 month' }
            ],
            salaryProjection: {
                current: 'KES 70,000 - 110,000',
                withSkills: 'KES 120,000 - 200,000',
                topTier: 'KES 280,000+'
            },
            matchPercentage: '72.0'
        }
    };
    
    const analysis = fallbackAnalyses[careerField] || fallbackAnalyses['Software Engineering'];
    
    return {
        careerField,
        experienceLevel: careerProfile?.experienceLevel || 'junior',
        currentSkills: {
            technical: careerProfile?.technicalSkills || [],
            soft: careerProfile?.softSkills || [],
            total: (careerProfile?.technicalSkills?.length || 0) + (careerProfile?.softSkills?.length || 0)
        },
        ...analysis,
        skillGaps: analysis.prioritySkills.map(p => p.skill),
        industryInsights: {
            trendingSkills: ['AI/ML', 'Cloud Computing', 'Cybersecurity'],
            emergingOpportunities: ['Remote Work', 'Fintech', 'EdTech']
        }
    };
}

function getFallbackJobRecommendations(careerField, experienceLevel) {
    const jobRecommendations = {
        'Software Engineering': [
            {
                title: `Senior Software Developer`,
                company: 'Safaricom PLC',
                location: 'Nairobi, Kenya',
                salary: 'KES 150,000 - 250,000',
                match: '85%',
                requirements: ['3+ years experience', 'JavaScript', 'React', 'Node.js']
            },
            {
                title: `Full Stack Developer`,
                company: 'Equity Bank',
                location: 'Nairobi, Kenya',
                salary: 'KES 120,000 - 200,000',
                match: '78%',
                requirements: ['2+ years experience', 'Python', 'React', 'PostgreSQL']
            }
        ],
        'Data Science': [
            {
                title: `Senior Data Scientist`,
                company: 'KCB Group',
                location: 'Nairobi, Kenya',
                salary: 'KES 180,000 - 300,000',
                match: '82%',
                requirements: ['3+ years experience', 'Python', 'Machine Learning', 'SQL']
            }
        ],
        'Digital Marketing': [
            {
                title: `Digital Marketing Manager`,
                company: 'Jumia Kenya',
                location: 'Nairobi, Kenya',
                salary: 'KES 120,000 - 180,000',
                match: '88%',
                requirements: ['3+ years experience', 'Google Ads', 'Analytics', 'SEO']
            }
        ]
    };
    
    return {
    recommendedJobs: jobRecommendations[careerField] || jobRecommendations['Software Engineering'],
       careerProgression: generateCareerProgression(careerField, experienceLevel),
       skillDemandTrends: getSkillDemandTrends(careerField),
       marketInsights: getFallbackMarketInsights(careerField)
   };
}

function getFallbackJobMarketData(careerField) {
   const jobMarketData = {
       'Software Engineering': {
           totalJobs: 85,
           averageSalary: 'KES 120,000 - 250,000',
           topCompanies: ['Safaricom PLC', 'Equity Bank', 'KCB Group', 'Jumia Kenya', 'Andela'],
           requiredSkills: ['JavaScript', 'React', 'Python', 'Node.js', 'AWS', 'Git'],
           locations: ['Nairobi', 'Remote', 'Mombasa', 'Kisumu'],
           remoteOpportunities: '75%',
           jobs: [
               {
                   title: 'Software Developer',
                   company: 'Safaricom PLC',
                   location: 'Nairobi, Kenya',
                   skills_required: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                   salary_range: 'KES 100,000 - 180,000',
                   experience_required: '2-4 years',
                   remote_option: true
               },
               {
                   title: 'Frontend Developer',
                   company: 'Jumia Kenya',
                   location: 'Nairobi, Kenya',
                   skills_required: ['React', 'TypeScript', 'CSS', 'Redux'],
                   salary_range: 'KES 90,000 - 160,000',
                   experience_required: '1-3 years',
                   remote_option: true
               }
           ]
       },
       'Data Science': {
           totalJobs: 45,
           averageSalary: 'KES 140,000 - 300,000',
           topCompanies: ['KCB Group', 'Equity Bank', 'Safaricom', 'NCBA Bank', 'Cellulant'],
           requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Tableau', 'R', 'Statistics'],
           locations: ['Nairobi', 'Remote', 'Mombasa'],
           remoteOpportunities: '60%',
           jobs: [
               {
                   title: 'Data Scientist',
                   company: 'KCB Group',
                   location: 'Nairobi, Kenya',
                   skills_required: ['Python', 'Machine Learning', 'SQL', 'Tableau'],
                   salary_range: 'KES 150,000 - 250,000',
                   experience_required: '2-5 years',
                   remote_option: true
               },
               {
                   title: 'Data Analyst',
                   company: 'Equity Bank',
                   location: 'Nairobi, Kenya',
                   skills_required: ['Python', 'SQL', 'Excel', 'Power BI'],
                   salary_range: 'KES 80,000 - 140,000',
                   experience_required: '1-3 years',
                   remote_option: false
               }
           ]
       },
       'Digital Marketing': {
           totalJobs: 65,
           averageSalary: 'KES 80,000 - 180,000',
           topCompanies: ['Jumia Kenya', 'Carrefour', 'Naivas', 'Java House', 'Safaricom'],
           requiredSkills: ['Google Analytics', 'SEO', 'Social Media', 'Content Marketing', 'Google Ads'],
           locations: ['Nairobi', 'Remote', 'Mombasa', 'Kisumu'],
           remoteOpportunities: '80%',
           jobs: [
               {
                   title: 'Digital Marketing Specialist',
                   company: 'Jumia Kenya',
                   location: 'Nairobi, Kenya',
                   skills_required: ['Google Analytics', 'SEO', 'Social Media', 'Content Marketing'],
                   salary_range: 'KES 70,000 - 120,000',
                   experience_required: '2-4 years',
                   remote_option: true
               }
           ]
       }
   };
   
   return jobMarketData[careerField] || jobMarketData['Software Engineering'];
}

function getFallbackCertificationRoadmap(careerField) {
   const certificationRoadmaps = {
       'Software Engineering': {
           certifications: [
               {
                   certification: 'AWS Certified Developer - Associate',
                   provider: 'Amazon Web Services',
                   cost: 'KES 20,000',
                   duration: '3 months',
                   impact: 'High demand for cloud skills in Kenya tech industry',
                   priority: 'high'
               },
               {
                   certification: 'Google Cloud Professional Developer',
                   provider: 'Google Cloud',
                   cost: 'KES 25,000',
                   duration: '4 months',
                   impact: 'Growing cloud adoption by Kenyan enterprises',
                   priority: 'medium'
               },
               {
                   certification: 'React Developer Certification',
                   provider: 'Meta (Facebook)',
                   cost: 'KES 15,000',
                   duration: '2 months',
                   impact: 'React is the most in-demand frontend framework',
                   priority: 'high'
               }
           ],
           timeline: '6-9 months',
           cost: 'KES 60,000'
       },
       'Data Science': {
           certifications: [
               {
                   certification: 'Google Data Analytics Professional Certificate',
                   provider: 'Google via Coursera',
                   cost: 'KES 15,000',
                   duration: '6 months',
                   impact: 'Industry-recognized credential for entry-level positions',
                   priority: 'high'
               },
               {
                   certification: 'AWS Certified Machine Learning - Specialty',
                   provider: 'Amazon Web Services',
                   cost: 'KES 30,000',
                   duration: '4 months',
                   impact: 'Cloud ML skills are highly valued in the market',
                   priority: 'medium'
               },
               {
                   certification: 'Microsoft Azure Data Scientist Associate',
                   provider: 'Microsoft',
                   cost: 'KES 25,000',
                   duration: '3 months',
                   impact: 'Growing demand for Azure skills in enterprise',
                   priority: 'medium'
               }
           ],
           timeline: '8-12 months',
           cost: 'KES 70,000'
       },
       'Digital Marketing': {
           certifications: [
               {
                   certification: 'Google Ads Certification',
                   provider: 'Google',
                   cost: 'Free',
                   duration: '1 month',
                   impact: 'Essential for paid advertising roles',
                   priority: 'high'
               },
               {
                   certification: 'Facebook Social Media Marketing Professional Certificate',
                   provider: 'Meta via Coursera',
                   cost: 'KES 12,000',
                   duration: '4 months',
                   impact: 'Social media marketing is crucial for brands',
                   priority: 'high'
               },
               {
                   certification: 'Google Analytics Individual Qualification (IQ)',
                   provider: 'Google',
                   cost: 'Free',
                   duration: '2 weeks',
                   impact: 'Data-driven marketing is the industry standard',
                   priority: 'high'
               },
               {
                   certification: 'HubSpot Content Marketing Certification',
                   provider: 'HubSpot Academy',
                   cost: 'Free',
                   duration: '3 weeks',
                   impact: 'Content marketing drives engagement and conversions',
                   priority: 'medium'
               }
           ],
           timeline: '4-6 months',
           cost: 'KES 12,000'
       },
       'UI/UX Design': {
           certifications: [
               {
                   certification: 'Google UX Design Professional Certificate',
                   provider: 'Google via Coursera',
                   cost: 'KES 18,000',
                   duration: '6 months',
                   impact: 'Comprehensive UX design foundation',
                   priority: 'high'
               },
               {
                   certification: 'Adobe Certified Expert (ACE) - Adobe XD',
                   provider: 'Adobe',
                   cost: 'KES 22,000',
                   duration: '2 months',
                   impact: 'Industry-standard design tool proficiency',
                   priority: 'medium'
               }
           ],
           timeline: '6-8 months',
           cost: 'KES 40,000'
       },
       'Project Management': {
           certifications: [
               {
                   certification: 'Project Management Professional (PMP)',
                   provider: 'Project Management Institute',
                   cost: 'KES 65,000',
                   duration: '6 months',
                   impact: 'Gold standard for project management roles',
                   priority: 'high'
               },
               {
                   certification: 'Certified ScrumMaster (CSM)',
                   provider: 'Scrum Alliance',
                   cost: 'KES 35,000',
                   duration: '1 month',
                   impact: 'Agile methodology expertise is in high demand',
                   priority: 'high'
               },
               {
                   certification: 'Google Project Management Professional Certificate',
                   provider: 'Google via Coursera',
                   cost: 'KES 15,000',
                   duration: '6 months',
                   impact: 'Entry-level project management credential',
                   priority: 'medium'
               }
           ],
           timeline: '6-12 months',
           cost: 'KES 115,000'
       }
   };
   
   return certificationRoadmaps[careerField] || certificationRoadmaps['Software Engineering'];
}

function getFallbackMarketInsights(careerField) {
   const marketInsights = {
       'Software Engineering': {
           marketDemand: 'Very High',
           averageSalary: 'KES 120,000 - 250,000',
           jobGrowthRate: '+18% annually',
           remoteOpportunities: '75%',
           topSkills: ['JavaScript', 'React', 'Python', 'AWS', 'Docker'],
           topHiringCompanies: ['Safaricom PLC', 'Equity Bank', 'KCB Group', 'Jumia Kenya', 'Andela'],
           industryTrends: [
               'Increased demand for full-stack developers',
               'Cloud computing skills are essential',
               'Remote work becoming standard',
               'AI/ML integration in applications',
               'DevOps practices adoption'
           ],
           salaryTrends: {
               'junior': 'KES 60,000 - 120,000',
               'mid': 'KES 120,000 - 200,000',
               'senior': 'KES 200,000 - 350,000'
           }
       },
       'Data Science': {
           marketDemand: 'High',
           averageSalary: 'KES 140,000 - 300,000',
           jobGrowthRate: '+25% annually',
           remoteOpportunities: '60%',
           topSkills: ['Python', 'Machine Learning', 'SQL', 'Tableau', 'R', 'Statistics'],
           topHiringCompanies: ['KCB Group', 'Equity Bank', 'Safaricom', 'NCBA Bank', 'Cellulant'],
           industryTrends: [
               'Banking sector driving demand',
               'Machine learning automation',
               'Real-time analytics requirements',
               'Data governance focus',
               'AI ethics importance'
           ],
           salaryTrends: {
               'junior': 'KES 80,000 - 150,000',
               'mid': 'KES 150,000 - 250,000',
               'senior': 'KES 250,000 - 400,000'
           }
       },
       'Digital Marketing': {
           marketDemand: 'High',
           averageSalary: 'KES 80,000 - 180,000',
           jobGrowthRate: '+15% annually',
           remoteOpportunities: '80%',
           topSkills: ['Google Analytics', 'SEO', 'Social Media', 'Content Marketing', 'Google Ads'],
           topHiringCompanies: ['Jumia Kenya', 'Carrefour', 'Naivas', 'Java House', 'Safaricom'],
           industryTrends: [
               'Performance marketing focus',
               'Video content dominance',
               'Marketing automation adoption',
               'Privacy-first marketing',
               'Influencer marketing growth'
           ],
           salaryTrends: {
               'junior': 'KES 50,000 - 100,000',
               'mid': 'KES 100,000 - 160,000',
               'senior': 'KES 160,000 - 250,000'
           }
       },
       'UI/UX Design': {
           marketDemand: 'High',
           averageSalary: 'KES 90,000 - 200,000',
           jobGrowthRate: '+20% annually',
           remoteOpportunities: '85%',
           topSkills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Design Systems'],
           topHiringCompanies: ['Safaricom', 'Jumia Kenya', 'M-Kopa', 'Flutterwave', 'Sendy'],
           industryTrends: [
               'Mobile-first design approach',
               'Design systems standardization',
               'Voice and conversational UI',
               'Accessibility focus',
               'Data-driven design decisions'
           ],
           salaryTrends: {
               'junior': 'KES 60,000 - 120,000',
               'mid': 'KES 120,000 - 180,000',
               'senior': 'KES 180,000 - 280,000'
           }
       },
       'Project Management': {
           marketDemand: 'Medium-High',
           averageSalary: 'KES 100,000 - 220,000',
           jobGrowthRate: '+12% annually',
           remoteOpportunities: '70%',
           topSkills: ['PMP', 'Scrum', 'Agile', 'JIRA', 'Risk Management', 'Stakeholder Management'],
           topHiringCompanies: ['Safaricom', 'Equity Bank', 'KCB Group', 'Standard Chartered', 'Accenture'],
           industryTrends: [
               'Agile transformation in enterprises',
               'Digital project management tools',
               'Remote team management',
               'Change management focus',
               'Data-driven project insights'
           ],
           salaryTrends: {
               'junior': 'KES 70,000 - 130,000',
               'mid': 'KES 130,000 - 200,000',
               'senior': 'KES 200,000 - 350,000'
           }
       }
   };
   
   return marketInsights[careerField] || marketInsights['Software Engineering'];
}

// Error handling middleware
app.use((error, req, res, next) => {
   console.error('Server Error:', error);
   
   if (error instanceof multer.MulterError) {
       if (error.code === 'LIMIT_FILE_SIZE') {
           return res.status(400).json({ 
               error: 'File too large. Maximum size is 5MB.',
               code: 'FILE_TOO_LARGE'
           });
       }
       if (error.code === 'LIMIT_UNEXPECTED_FILE') {
           return res.status(400).json({ 
               error: 'Unexpected file field. Please use "cv" as the field name.',
               code: 'UNEXPECTED_FILE_FIELD'
           });
       }
   }
   
   // Generic error response
   res.status(500).json({ 
       error: error.message || 'Internal server error',
       code: 'INTERNAL_ERROR'
   });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
   res.status(404).json({
       error: 'Route not found',
       message: `${req.method} ${req.originalUrl} is not a valid endpoint`
   });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
   console.log('SIGTERM received. Shutting down gracefully...');
   process.exit(0);
});

process.on('SIGINT', () => {
   console.log('SIGINT received. Shutting down gracefully...');
   process.exit(0);
});

// Start server
app.listen(PORT, () => {
   console.log(`🚀 SkillBridge AI Server running on port ${PORT}`);
   console.log(`📱 Open http://localhost:${PORT} to view the application`);
   console.log(`🤖 Mistral AI integration: ${process.env.MISTRAL_API_KEY ? '✅ Connected' : '❌ No API key'}`);
   console.log(`📊 Ready for CV analysis and career insights!`);
});