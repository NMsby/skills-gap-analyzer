// Global variables
let currentCV = null;
let userSkills = null;
let jobMarketData = null;
let skillsGapAnalysis = null;

// DOM elements
const cvUpload = document.getElementById('cv-upload');
const selectFileBtn = document.getElementById('select-file-btn');
const uploadStatus = document.getElementById('upload-status');
const uploadMessage = document.getElementById('upload-message');
const analysisSection = document.getElementById('analysis-section');
const resultsSection = document.getElementById('results-section');
const loadingOverlay = document.getElementById('loading-overlay');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // File selection
    selectFileBtn.addEventListener('click', () => cvUpload.click());
    cvUpload.addEventListener('change', handleFileSelect);

    // Drag and drop
    const dropZone = selectFileBtn.parentElement;
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showLoadingOverlay();

        // Upload file
        const formData = new FormData();
        formData.append('cv', file);

        const uploadResponse = await fetch('/api/upload-cv', {
            method: 'POST',
            body: formData
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResponse.ok) {
            currentCV = uploadResult.filename;
            showUploadSuccess(file.name);
            await startAnalysis();
        } else {
            throw new Error(uploadResult.error || 'Upload failed');
        }
    } catch (error) {
        showError('Upload failed: ' + error.message);
    } finally {
        hideLoadingOverlay();
    }
}

function showUploadSuccess(fileName) {
    uploadMessage.textContent = `Successfully uploaded: ${fileName}`;
    uploadStatus.classList.remove('hidden');
}

async function startAnalysis() {
    analysisSection.classList.remove('hidden');

    try {
        // Step 1: Extract skills from CV
        await extractSkills();

        // Step 2: Scan job market
        await scanJobMarket();

        // Step 3: Analyze skills gaps
        await analyzeSkillsGaps();

        // Show results
        displayResults();

    } catch (error) {
        showError('Analysis failed: ' + error.message);
    }
}

async function extractSkills() {
    updateAnalysisStatus('extract', 'Extracting skills from CV...', 'loading');

    try {
        const response = await fetch('/api/analyze-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: currentCV })
        });

        const result = await response.json();

        if (response.ok) {
            userSkills = result.skills || getSampleSkills();
            updateAnalysisStatus('extract', 'Skills extracted successfully', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        updateAnalysisStatus('extract', 'Using sample skills profile', 'warning');
        userSkills = getSampleSkills();
    }
}

async function scanJobMarket() {
    updateAnalysisStatus('scan', 'Scanning job market...', 'loading');

    try {
        const response = await fetch('/api/scan-jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills: userSkills })
        });

        const result = await response.json();

        if (response.ok) {
            jobMarketData = result.jobs || getSampleJobs();
            updateAnalysisStatus('scan', 'Job market scanned successfully', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        updateAnalysisStatus('scan', 'Using sample job market data', 'warning');
        jobMarketData = getSampleJobs();
    }
}

async function analyzeSkillsGaps() {
    updateAnalysisStatus('gap', 'Analyzing skills gaps...', 'loading');

    try {
        const response = await fetch('/api/analyze-gaps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userSkills: userSkills,
                jobMarketData: jobMarketData
            })
        });

        const result = await response.json();

        if (response.ok) {
            skillsGapAnalysis = result.analysis || getSampleGapAnalysis();
            updateAnalysisStatus('gap', 'Skills gap analysis completed', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        updateAnalysisStatus('gap', 'Using sample gap analysis', 'warning');
        skillsGapAnalysis = getSampleGapAnalysis();
    }
}

function updateAnalysisStatus(step, message, status) {
    const statusElement = document.getElementById(`${step}-status`);
    const loaderElement = document.getElementById(`${step}-loader`);

    statusElement.textContent = message;

    if (status === 'loading') {
        statusElement.classList.remove('text-gray-400', 'text-green-600', 'text-yellow-600');
        statusElement.classList.add('text-blue-600');
        loaderElement.classList.remove('hidden');
    } else if (status === 'success') {
        statusElement.classList.remove('text-gray-400', 'text-blue-600', 'text-yellow-600');
        statusElement.classList.add('text-green-600');
        loaderElement.classList.add('hidden');
    } else if (status === 'warning') {
        statusElement.classList.remove('text-gray-400', 'text-blue-600', 'text-green-600');
        statusElement.classList.add('text-yellow-600');
        loaderElement.classList.add('hidden');
    }
}

function displayResults() {
    resultsSection.classList.remove('hidden');

    // Display skills profile
    displaySkillsProfile();

    // Display skills gap chart
    displaySkillsGapChart();

    // Display learning recommendations
    displayLearningRecommendations();

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displaySkillsProfile() {
    const profileContainer = document.getElementById('skills-profile');

    const technicalSkills = userSkills.technical_skills || [];
    const softSkills = userSkills.soft_skills || [];
    const certifications = userSkills.certifications || [];

    profileContainer.innerHTML = `
        <div class="bg-blue-50 p-4 rounded-lg">
            <h3 class="font-semibold text-blue-800 mb-2">Technical Skills</h3>
            <div class="flex flex-wrap gap-2">
                ${technicalSkills.map(skill =>
        `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">${skill}</span>`
    ).join('')}
            </div>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
            <h3 class="font-semibold text-green-800 mb-2">Soft Skills</h3>
            <div class="flex flex-wrap gap-2">
                ${softSkills.map(skill =>
        `<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">${skill}</span>`
    ).join('')}
            </div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
            <h3 class="font-semibold text-purple-800 mb-2">Certifications</h3>
            <div class="flex flex-wrap gap-2">
                ${certifications.map(cert =>
        `<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">${cert}</span>`
    ).join('')}
            </div>
        </div>
    `;
}

function displaySkillsGapChart() {
    const ctx = document.getElementById('skills-gap-chart').getContext('2d');

    const gapData = skillsGapAnalysis.skill_gaps || [];
    const labels = gapData.map(gap => gap.skill);
    const demandData = gapData.map(gap => {
        const demandMap = { 'high': 3, 'medium': 2, 'low': 1 };
        return demandMap[gap.market_demand] || 0;
    });

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Market Demand',
                data: demandData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 3,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Display gap details
    const gapDetails = document.getElementById('gap-details');
    gapDetails.innerHTML = `
        <h3 class="font-semibold mb-4">Priority Skills to Develop</h3>
        <div class="space-y-3">
            ${gapData.slice(0, 5).map(gap => `
                <div class="border-l-4 border-red-400 pl-4">
                    <h4 class="font-medium">${gap.skill}</h4>
                    <p class="text-sm text-gray-600">Market demand: ${gap.market_demand}</p>
                    <p class="text-sm text-gray-600">Learning time: ${gap.learning_time_weeks} weeks</p>
                    <span class="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs mt-1">
                        ${gap.priority} priority
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

function displayLearningRecommendations() {
    const recommendationsContainer = document.getElementById('learning-recommendations');
    const recommendations = skillsGapAnalysis.recommendations || [];

    recommendationsContainer.innerHTML = `
        <div class="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-4">
            <h3 class="font-semibold text-lg mb-2">Potential Impact</h3>
            <p class="text-2xl font-bold text-green-600">${skillsGapAnalysis.salary_impact || '+25%'}</p>
            <p class="text-sm text-gray-600">Potential salary increase after completing recommended learning</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${recommendations.map((rec, index) => `
                <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-medium">${rec.title || `Recommendation ${index + 1}`}</h4>
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            ${rec.priority || 'High'} Priority
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">${rec.description || rec}</p>
                    <div class="flex items-center text-xs text-gray-500">
                        <i class="fas fa-clock mr-1"></i>
                        <span>${rec.duration || '4-6 weeks'}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Sample data functions for demo
function getSampleSkills() {
    return {
        technical_skills: ['JavaScript', 'Python', 'HTML', 'CSS', 'SQL'],
        soft_skills: ['Communication', 'Problem-solving', 'Teamwork'],
        certifications: ['Google Analytics'],
        experience_years: 2,
        education_level: 'Bachelor\'s Degree',
        job_titles: ['Software Developer', 'Web Developer']
    };
}

function getSampleJobs() {
    return [
        {
            title: 'Senior Software Developer',
            company: 'Safaricom',
            location: 'Nairobi, Kenya',
            skills_required: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
            salary_range: 'KES 120,000 - 180,000',
            experience_required: '3-5 years'
        },
        {
            title: 'Full Stack Developer',
            company: 'Equity Bank',
            location: 'Nairobi, Kenya',
            skills_required: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Git'],
            salary_range: 'KES 100,000 - 150,000',
            experience_required: '2-4 years'
        },
        {
            title: 'Frontend Developer',
            company: 'Jumia',
            location: 'Nairobi, Kenya',
            skills_required: ['React', 'TypeScript', 'Redux', 'Webpack', 'Jest'],
            salary_range: 'KES 80,000 - 120,000',
            experience_required: '1-3 years'
        }
    ];
}

function getSampleGapAnalysis() {
    return {
        missing_skills: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
        skill_gaps: [
            {
                skill: 'React',
                user_level: 'none',
                market_demand: 'high',
                priority: 'high',
                learning_time_weeks: 6
            },
            {
                skill: 'Node.js',
                user_level: 'none',
                market_demand: 'high',
                priority: 'high',
                learning_time_weeks: 8
            },
            {
                skill: 'MongoDB',
                user_level: 'none',
                market_demand: 'medium',
                priority: 'medium',
                learning_time_weeks: 4
            },
            {
                skill: 'AWS',
                user_level: 'none',
                market_demand: 'high',
                priority: 'high',
                learning_time_weeks: 12
            },
            {
                skill: 'Docker',
                user_level: 'none',
                market_demand: 'medium',
                priority: 'medium',
                learning_time_weeks: 3
            }
        ],
        recommendations: [
            {
                title: 'Learn React Fundamentals',
                description: 'Master React.js to build modern user interfaces. High demand skill in Kenya market.',
                priority: 'High',
                duration: '6 weeks'
            },
            {
                title: 'Backend Development with Node.js',
                description: 'Learn server-side JavaScript development to become a full-stack developer.',
                priority: 'High',
                duration: '8 weeks'
            },
            {
                title: 'Database Management with MongoDB',
                description: 'Learn NoSQL database management for modern web applications.',
                priority: 'Medium',
                duration: '4 weeks'
            },
            {
                title: 'Cloud Computing with AWS',
                description: 'Get AWS certified to work with cloud infrastructure and deployment.',
                priority: 'High',
                duration: '12 weeks'
            }
        ],
        salary_impact: '+35%'
    };
}

// Utility functions
function showLoadingOverlay() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    loadingOverlay.classList.add('hidden');
}

function showError(message) {
    alert('Error: ' + message);
    console.error(message);
}