// Global variables
let currentCV = null;
let userSkills = null;
let jobMarketData = null;
let skillsGapAnalysis = null;

// DOM elements
const cvUpload = document.getElementById('cv-upload');
const selectFileBtn = document.getElementById('select-file-btn');
const dropZone = document.getElementById('drop-zone');
const uploadStatus = document.getElementById('upload-status');
const uploadMessage = document.getElementById('upload-message');
const analysisSection = document.getElementById('analysis-section');
const resultsSection = document.getElementById('results-section');
const loadingOverlay = document.getElementById('loading-overlay');

// Step indicators
const step1Indicator = document.getElementById('step-1-indicator');
const step2Indicator = document.getElementById('step-2-indicator');
const step3Indicator = document.getElementById('step-3-indicator');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeScrollAnimations();
});

function initializeEventListeners() {
    // File selection
    selectFileBtn.addEventListener('click', () => cvUpload.click());
    cvUpload.addEventListener('change', handleFileSelect);

    // Drag and drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => cvUpload.click());

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
}

function initializeScrollAnimations() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Navigation functions
function scrollToDemo() {
    document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
}

function scrollToFeatures() {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
}
// function toggleMobileMenu() {
//     // Mobile menu implementation
//     console.log('Mobile menu toggle');
// }

// File handling functions
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('border-blue-500', 'bg-blue-100');
    dropZone.classList.remove('border-blue-300', 'bg-blue-50/50');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-100');
    dropZone.classList.add('border-blue-300', 'bg-blue-50/50');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500', 'bg-blue-100');
    dropZone.classList.add('border-blue-300', 'bg-blue-50/50');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!validateFile(file)) return;

    try {
        showLoadingOverlay();
        updateStepIndicator(1, 'completed');

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
        updateStepIndicator(1, 'error');
    } finally {
        hideLoadingOverlay();
    }
}

function validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'];

    if (file.size > maxSize) {
        showError('File size too large. Maximum size is 5MB.');
        return false;
    }

    if (!allowedTypes.includes(file.type)) {
        showError('Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.');
        return false;
    }

    return true;
}

function showUploadSuccess(fileName) {
    uploadMessage.textContent = `Successfully uploaded: ${fileName}`;
    uploadStatus.classList.remove('hidden');

    // Add success animation
    uploadStatus.style.opacity = '0';
    uploadStatus.style.transform = 'translateY(20px)';
    setTimeout(() => {
        uploadStatus.style.transition = 'all 0.5s ease';
        uploadStatus.style.opacity = '1';
        uploadStatus.style.transform = 'translateY(0)';
    }, 100);
}

async function startAnalysis() {
    updateStepIndicator(2, 'active');
    analysisSection.classList.remove('hidden');

    // Scroll to analysis section
    setTimeout(() => {
        analysisSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);

    try {
        // Step 1: Extract skills from CV
        await extractSkills();

        // Step 2: Scan job market
        await scanJobMarket();

        // Step 3: Analyze skills gaps
        await analyzeSkillsGaps();

        // Show results
        updateStepIndicator(2, 'completed');
        updateStepIndicator(3, 'active');
        await displayResults();

    } catch (error) {
        showError('Analysis failed: ' + error.message);
        updateStepIndicator(2, 'error');
    }
}

async function extractSkills() {
    updateAnalysisStatus('extract', 'Extracting skills from CV using Mistral AI...', 'loading');

    try {
        const response = await fetch('/api/analyze-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: currentCV })
        });

        const result = await response.json();

        if (response.ok) {
            userSkills = result.skills || getSampleSkills();
            updateAnalysisStatus('extract', 'Skills extracted successfully!', 'success');
            await delay(1000); // Show success state
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        updateAnalysisStatus('extract', 'Using sample skills profile (Demo mode)', 'warning');
        userSkills = getSampleSkills();
        await delay(1000);
    }
}

async function scanJobMarket() {
    updateAnalysisStatus('scan', 'Scanning Kenya job market and remote opportunities...', 'loading');

    try {
        const response = await fetch('/api/scan-jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills: userSkills })
        });

        const result = await response.json();

        if (response.ok) {
            jobMarketData = result.jobs || getSampleJobs();
            updateAnalysisStatus('scan', 'Job market analysis completed!', 'success');
            await delay(1000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        updateAnalysisStatus('scan', 'Using sample job market data (Demo mode)', 'warning');
        jobMarketData = getSampleJobs();
        await delay(1000);
    }
}

async function analyzeSkillsGaps() {
    updateAnalysisStatus('gap', 'Analyzing skills gaps and generating recommendations...', 'loading');

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
            updateAnalysisStatus('gap', 'Skills gap analysis completed!', 'success');
            await delay(1000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        updateAnalysisStatus('gap', 'Using sample gap analysis (Demo mode)', 'warning');
        skillsGapAnalysis = getSampleGapAnalysis();
        await delay(1000);
    }
}

function updateAnalysisStatus(step, message, status) {
    const statusElement = document.getElementById(`${step}-status`);
    const loaderElement = document.getElementById(`${step}-loader`);
    const checkElement = document.getElementById(`${step}-check`);
    const containerElement = statusElement.closest('.flex');

    statusElement.textContent = message;

    if (status === 'loading') {
        containerElement.classList.remove('opacity-50');
        containerElement.classList.add('bg-blue-50', 'border-2', 'border-blue-200');
        loaderElement.classList.remove('hidden');
        checkElement.classList.add('hidden');
    } else if (status === 'success') {
        containerElement.classList.add('bg-green-50', 'border-2', 'border-green-200');
        containerElement.classList.remove('bg-blue-50', 'border-blue-200');
        loaderElement.classList.add('hidden');
        checkElement.classList.remove('hidden');
    } else if (status === 'warning') {
        containerElement.classList.add('bg-yellow-50', 'border-2', 'border-yellow-200');
        containerElement.classList.remove('bg-blue-50', 'border-blue-200');
        loaderElement.classList.add('hidden');
        checkElement.classList.remove('hidden');
    }
}

function updateStepIndicator(step, status) {
    const indicator = document.getElementById(`step-${step}-indicator`);
    const circle = indicator.querySelector('.rounded-full');
    const text = indicator.querySelector('span');

    // Reset classes
    circle.className = 'w-10 h-10 rounded-full flex items-center justify-center font-bold';
    text.className = 'ml-2 font-medium';

    if (status === 'active') {
        circle.classList.add('bg-blue-600', 'text-white');
        text.classList.add('text-blue-600');
    } else if (status === 'completed') {
        circle.classList.add('bg-green-600', 'text-white');
        text.classList.add('text-green-600');
        circle.innerHTML = '<i class="fas fa-check"></i>';
    } else if (status === 'error') {
        circle.classList.add('bg-red-600', 'text-white');
        text.classList.add('text-red-600');
        circle.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        circle.classList.add('bg-gray-300', 'text-gray-600');
        text.classList.add('text-gray-400');
    }
}

async function displayResults() {
    resultsSection.classList.remove('hidden');

    // Add entrance animation
    resultsSection.style.opacity = '0';
    resultsSection.style.transform = 'translateY(30px)';

    // Display components
    displaySkillsProfile();
    displaySkillsGapChart();
    displayLearningRecommendations();
    displaySuccessMetrics();

    // Animate entrance
    setTimeout(() => {
        resultsSection.style.transition = 'all 0.8s ease';
        resultsSection.style.opacity = '1';
        resultsSection.style.transform = 'translateY(0)';
    }, 200);

    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateStepIndicator(3, 'completed');
    }, 1000);
}

function displaySkillsProfile() {
    const profileContainer = document.getElementById('skills-profile');

    const technicalSkills = userSkills.technical_skills || [];
    const softSkills = userSkills.soft_skills || [];
    const certifications = userSkills.certifications || [];

    profileContainer.innerHTML = `
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <div class="flex items-center mb-4">
                <div class="bg-blue-600 p-2 rounded-lg mr-3">
                    <i class="fas fa-code text-white"></i>
                </div>
                <h4 class="text-lg font-bold text-blue-800">Technical Skills</h4>
            </div>
            <div class="flex flex-wrap gap-2">
                ${technicalSkills.map(skill =>
        `<span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">${skill}</span>`
    ).join('')}
            </div>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
            <div class="flex items-center mb-4">
                <div class="bg-green-600 p-2 rounded-lg mr-3">
                    <i class="fas fa-users text-white"></i>
                </div>
                <h4 class="text-lg font-bold text-green-800">Soft Skills</h4>
            </div>
            <div class="flex flex-wrap gap-2">
                ${softSkills.map(skill =>
        `<span class="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">${skill}</span>`
    ).join('')}
            </div>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
            <div class="flex items-center mb-4">
                <div class="bg-purple-600 p-2 rounded-lg mr-3">
                    <i class="fas fa-certificate text-white"></i>
                </div>
                <h4 class="text-lg font-bold text-purple-800">Certifications</h4>
            </div>
            <div class="flex flex-wrap gap-2">
                ${certifications.length > 0 ? certifications.map(cert =>
        `<span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">${cert}</span>`
    ).join('') : '<span class="text-purple-600 text-sm">No certifications found</span>'}
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
                label: 'Market Demand Level',
                data: demandData,
                borderColor: 'rgb(37, 99, 235)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: 'rgb(37, 99, 235)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 3,
                    ticks: {
                        stepSize: 1,
                        display: false
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });

    // Display gap details
    const gapDetails = document.getElementById('gap-details');
    gapDetails.innerHTML = `
        <div class="space-y-4">
            <h4 class="text-xl font-bold text-gray-800 mb-4">Priority Skills to Develop</h4>
            ${gapData.slice(0, 5).map((gap, index) => `
                <div class="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <h5 class="font-bold text-gray-800">${gap.skill}</h5>
                        <span class="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                            ${gap.priority.toUpperCase()} PRIORITY
                        </span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">Market Demand:</span>
                            <span class="font-semibold ml-1 capitalize">${gap.market_demand}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">Learning Time:</span>
                            <span class="font-semibold ml-1">${gap.learning_time_weeks} weeks</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function displayLearningRecommendations() {
    const recommendationsContainer = document.getElementById('learning-recommendations');
    const recommendations = skillsGapAnalysis.recommendations || [];

    recommendationsContainer.innerHTML = `
        <div class="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-2xl mb-8 border border-green-200">
            <div class="text-center">
                <div class="bg-gradient-to-r from-green-600 to-blue-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <i class="fas fa-chart-line text-white text-2xl"></i>
                </div>
                <h4 class="text-2xl font-bold text-gray-800 mb-2">Potential Career Impact</h4>
                <div class="text-4xl font-bold text-green-600 mb-2">${skillsGapAnalysis.salary_impact || '+35%'}</div>
                <p class="text-gray-600">Potential salary increase after completing recommended learning path</p>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${recommendations.map((rec, index) => `
                <div class="bg-white border border-gray-200 rounded-2xl p-6 card-hover">
                    <div class="flex items-start justify-between mb-4">
                        <div class="bg-blue-100 p-3 rounded-lg">
                            <i class="fas fa-graduation-cap text-blue-600 text-xl"></i>
                        </div>
                        <span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold">
                            ${rec.priority || 'High'} Priority
                        </span>
                    </div>
                    <h5 class="text-lg font-bold text-gray-800 mb-3">${rec.title || `Learning Path ${index + 1}`}</h5>
                    <p class="text-gray-600 mb-4 leading-relaxed">${rec.description || rec}</p>
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center text-gray-500">
                            <i class="fas fa-clock mr-2"></i>
                            <span>${rec.duration || '4-6 weeks'}</span>
                        </div>
                        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                            Start Learning
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Sample data functions (same as before but with enhanced structure)
function getSampleSkills() {
    return {
        technical_skills: ['JavaScript', 'Python', 'HTML', 'CSS', 'SQL', 'Git'],
        soft_skills: ['Communication', 'Problem-solving', 'Teamwork', 'Leadership'],
        certifications: ['Google Analytics Certified'],
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
            skills_required: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
            salary_range: 'KES 120,000 - 180,000',
            experience_required: '3-5 years'
        },
        {
            title: 'Full Stack Developer',
            company: 'Equity Bank',
            location: 'Nairobi, Kenya',
            skills_required: ['Python', 'Django', 'PostgreSQL', 'React', 'Git', 'Linux'],
            salary_range: 'KES 100,000 - 150,000',
            experience_required: '2-4 years'
        },
        {
            title: 'Frontend Developer',
            company: 'Jumia',
            location: 'Remote/Nairobi',
            skills_required: ['React', 'TypeScript', 'Redux', 'Webpack', 'Jest', 'CSS'],
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
                title: 'Master React Development',
                description: 'Learn React.js fundamentals, hooks, and modern patterns. Build portfolio projects and get job-ready skills.',
                priority: 'High',
                duration: '6 weeks'
            },
            {
                title: 'Backend Development with Node.js',
                description: 'Master server-side JavaScript, APIs, and database integration to become a full-stack developer.',
                priority: 'High',
                duration: '8 weeks'
            },
            {
                title: 'Cloud Computing Fundamentals',
                description: 'Get AWS certified and learn cloud deployment, scaling, and modern DevOps practices.',
                priority: 'High',
                duration: '12 weeks'
            },
            {
                title: 'Database Management',
                description: 'Learn MongoDB and NoSQL database design for modern web applications.',
                priority: 'Medium',
                duration: '4 weeks'
            }
        ],
        salary_impact: '+35%'
    };
}

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoadingOverlay() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
    loadingOverlay.classList.add('hidden');
}

function showError(message) {
    // Create a better error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-3"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(errorDiv);

    // Animate in
    setTimeout(() => {
        errorDiv.classList.remove('translate-x-full');
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        errorDiv.classList.add('translate-x-full');
        setTimeout(() => errorDiv.remove(), 300);
    }, 5000);

    console.error(message);
}

// Enhanced mobile menu functionality
function toggleMobileMenu() {
    const nav = document.querySelector('nav');
    let mobileMenu = document.getElementById('mobile-menu');

    if (!mobileMenu) {
        // Create mobile menu
        mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobile-menu';
        mobileMenu.className = 'md:hidden bg-white border-t border-gray-200 absolute top-full left-0 right-0 shadow-lg transform -translate-y-full opacity-0 transition-all duration-300';
        mobileMenu.innerHTML = `
            <div class="px-4 py-6 space-y-4">
                <a href="#home" class="block text-gray-600 hover:text-blue-600 transition-colors py-2">Home</a>
                <a href="#features" class="block text-gray-600 hover:text-blue-600 transition-colors py-2">Features</a>
                <a href="#how-it-works" class="block text-gray-600 hover:text-blue-600 transition-colors py-2">How It Works</a>
                <a href="#demo" class="block bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center">Try Demo</a>
            </div>
        `;
        nav.appendChild(mobileMenu);
    }

    // Toggle menu
    if (mobileMenu.classList.contains('-translate-y-full')) {
        mobileMenu.classList.remove('-translate-y-full', 'opacity-0');
        mobileMenu.classList.add('translate-y-0', 'opacity-100');
    } else {
        mobileMenu.classList.add('-translate-y-full', 'opacity-0');
        mobileMenu.classList.remove('translate-y-0', 'opacity-100');
    }
}

// Close mobile menu when clicking on links
document.addEventListener('click', function(e) {
    if (e.target.matches('#mobile-menu a')) {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('-translate-y-full', 'opacity-0');
            mobileMenu.classList.remove('translate-y-0', 'opacity-100');
        }
    }
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-in-up');
        }
    });
}, observerOptions);

// Observe sections for animations
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });
});

// Smooth scrolling performance optimization
let ticking = false;

function updateScrollEffects() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.gradient-bg');

    if (parallax) {
        const speed = scrolled * 0.5;
        parallax.style.transform = `translateY(${speed}px)`;
    }

    ticking = false;
}

function requestScrollUpdate() {
    if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
    }
}

window.addEventListener('scroll', requestScrollUpdate);

// Add loading animations to cards
function addLoadingAnimations() {
    const cards = document.querySelectorAll('.card-hover');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-fade-in-scale');
    });
}

// Call animation function when DOM is loaded
document.addEventListener('DOMContentLoaded', addLoadingAnimations);

// Enhanced error handling with retry functionality
function showErrorWithRetry(message, retryCallback) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300 max-w-md';
    errorDiv.innerHTML = `
        <div class="flex items-start">
            <i class="fas fa-exclamation-triangle mr-3 mt-1"></i>
            <div class="flex-1">
                <div class="font-semibold mb-1">Error</div>
                <div class="text-sm opacity-90 mb-3">${message}</div>
                <div class="flex space-x-2">
                    ${retryCallback ? '<button onclick="retryLastAction()" class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs transition-colors">Retry</button>' : ''}
                    <button onclick="this.closest('.fixed').remove()" class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs transition-colors">Dismiss</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(errorDiv);

    // Store retry callback
    if (retryCallback) {
        window.retryLastAction = retryCallback;
    }

    // Animate in
    setTimeout(() => {
        errorDiv.classList.remove('translate-x-full');
    }, 100);

    // Auto remove after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.classList.add('translate-x-full');
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, 10000);
}

// Performance monitoring
let performanceMetrics = {
    uploadTime: 0,
    analysisTime: 0,
    totalTime: 0
};

function trackPerformance(action, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    performanceMetrics[action] = duration;

    console.log(`${action} completed in ${duration}ms`);

    // Send to analytics if needed
    // analytics.track(action, { duration });
}

// Demo presentation mode
let presentationMode = false;

function togglePresentationMode() {
    presentationMode = !presentationMode;

    if (presentationMode) {
        document.body.classList.add('presentation-mode');
        // Automatically run demo with sample data
        simulateDemo();
    } else {
        document.body.classList.remove('presentation-mode');
    }
}

async function simulateDemo() {
    // Simulate file upload
    showUploadSuccess('sample-cv.pdf');
    updateStepIndicator(1, 'completed');
    await delay(1000);

    // Start analysis
    updateStepIndicator(2, 'active');
    analysisSection.classList.remove('hidden');
    analysisSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Simulate each step with realistic timing
    await extractSkills();
    await scanJobMarket();
    await analyzeSkillsGaps();

    // Show results
    updateStepIndicator(2, 'completed');
    updateStepIndicator(3, 'active');
    await displayResults();
}

// Add keyboard shortcuts for demo
document.addEventListener('keydown', function(e) {
    // Press 'D' to start demo
    if (e.key.toLowerCase() === 'd' && e.ctrlKey) {
        e.preventDefault();
        simulateDemo();
    }

    // Press 'P' to toggle presentation mode
    if (e.key.toLowerCase() === 'p' && e.ctrlKey) {
        e.preventDefault();
        togglePresentationMode();
    }
});

// Add this to your sample data or results section
function displaySuccessMetrics() {
    const metricsHtml = `
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-3xl p-8 mb-8">
            <h3 class="text-2xl font-bold mb-6 text-center">Impact Metrics</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                    <div class="text-3xl font-bold mb-2">95%</div>
                    <div class="text-purple-100">Skill Match Accuracy</div>
                </div>
                <div>
                    <div class="text-3xl font-bold mb-2">500+</div>
                    <div class="text-purple-100">Jobs Analyzed Daily</div>
                </div>
                <div>
                    <div class="text-3xl font-bold mb-2">35%</div>
                    <div class="text-purple-100">Avg Salary Increase</div>
                </div>
                <div>
                    <div class="text-3xl font-bold mb-2">2.5M</div>
                    <div class="text-purple-100">Youth in Kenya Needing Skills</div>
                </div>
            </div>
        </div>
    `;

    // Insert before learning recommendations
    const recommendationsContainer = document.getElementById('learning-recommendations');
    recommendationsContainer.insertAdjacentHTML('beforebegin', metricsHtml);
}