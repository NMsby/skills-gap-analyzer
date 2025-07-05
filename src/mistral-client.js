const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class MistralClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.mistral.ai/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    // OCR for CV text extraction
    async extractTextFromCV(filePath) {
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('model', 'mistral-ocr-2503');

            const response = await axios.post(`${this.baseURL}/ocr`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            return response.data.text || response.data.content;
        } catch (error) {
            console.error('OCR Error:', error.response?.data || error.message);
            throw new Error('Failed to extract text from CV');
        }
    }

    // Skills extraction using Mistral Medium
    async extractSkills(cvText) {
        try {
            const prompt = `
        Analyze this CV text and extract all skills, technologies, and competencies. 
        Return a JSON object with the following structure:
        {
          "technical_skills": ["skill1", "skill2", ...],
          "soft_skills": ["skill1", "skill2", ...],
          "certifications": ["cert1", "cert2", ...],
          "experience_years": number,
          "education_level": "string",
          "job_titles": ["title1", "title2", ...]
        }

        CV Text: ${cvText}
      `;

            const response = await this.client.post('/chat/completions', {
                model: 'mistral-medium-2505',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 1000
            });

            const content = response.data.choices[0].message.content;
            // Try to parse JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Could not parse skills from response');
        } catch (error) {
            console.error('Skills extraction error:', error.response?.data || error.message);
            throw new Error('Failed to extract skills from CV');
        }
    }

    // Job market scanning using web search
    async scanJobMarket(skillsProfile, location = 'Kenya') {
        try {
            const jobTitles = skillsProfile.job_titles || ['Software Developer'];
            const searchQueries = jobTitles.map(title =>
                `${title} jobs ${location} 2025 requirements skills`
            );

            const jobData = [];
            for (const query of searchQueries.slice(0, 3)) { // Limit to 3 searches
                try {
                    const response = await this.client.post('/agents/completions', {
                        model: 'mistral-medium-2505',
                        messages: [{
                            role: 'user',
                            content: `Search for current job postings: "${query}". Extract job requirements, skills needed, and salary ranges. Return structured data.`
                        }],
                        tools: [{ type: 'web_search' }],
                        temperature: 0.1
                    });

                    const jobInfo = this.parseJobSearchResults(response.data.choices[0].message.content);
                    jobData.push(...jobInfo);
                } catch (searchError) {
                    console.warn('Search query failed:', query, searchError.message);
                }
            }

            return jobData;
        } catch (error) {
            console.error('Job market scan error:', error.response?.data || error.message);
            // Return fallback data if web search fails
            return this.getFallbackJobData();
        }
    }

    // Parse job search results
    parseJobSearchResults(searchResults) {
        // This would parse the web search results
        // For now, return sample structure
        return [{
            title: 'Software Developer',
            company: 'Tech Company',
            location: 'Nairobi, Kenya',
            skills_required: ['JavaScript', 'React', 'Node.js'],
            salary_range: 'KES 80,000 - 120,000',
            experience_required: '2-4 years'
        }];
    }

    // Analyze skills gaps
    async analyzeSkillsGap(userSkills, marketDemand) {
        try {
            const prompt = `
        Analyze the skills gap between a user's current skills and market demand.
        
        User Skills: ${JSON.stringify(userSkills)}
        Market Demand: ${JSON.stringify(marketDemand)}
        
        Return a JSON object with:
        {
          "missing_skills": ["skill1", "skill2", ...],
          "skill_gaps": [
            {
              "skill": "skill_name",
              "user_level": "beginner/intermediate/advanced/none",
              "market_demand": "high/medium/low",
              "priority": "high/medium/low",
              "learning_time_weeks": number
            }
          ],
          "recommendations": ["recommendation1", "recommendation2", ...],
          "salary_impact": "potential salary increase percentage"
        }
      `;

            const response = await this.client.post('/chat/completions', {
                model: 'mistral-medium-2505',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 1500
            });

            const content = response.data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Could not parse gap analysis');
        } catch (error) {
            console.error('Gap analysis error:', error.response?.data || error.message);
            throw new Error('Failed to analyze skills gap');
        }
    }

    // Fallback job data for demo
    getFallbackJobData() {
        return [
            {
                title: 'Software Developer',
                company: 'Safaricom',
                location: 'Nairobi, Kenya',
                skills_required: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                salary_range: 'KES 80,000 - 120,000',
                experience_required: '2-4 years'
            },
            {
                title: 'Data Analyst',
                company: 'Equity Bank',
                location: 'Nairobi, Kenya',
                skills_required: ['Python', 'SQL', 'Excel', 'Power BI'],
                salary_range: 'KES 60,000 - 90,000',
                experience_required: '1-3 years'
            },
            {
                title: 'Digital Marketing Manager',
                company: 'Jumia',
                location: 'Nairobi, Kenya',
                skills_required: ['Google Analytics', 'SEO', 'Social Media', 'Content Marketing'],
                salary_range: 'KES 70,000 - 110,000',
                experience_required: '3-5 years'
            }
        ];
    }
}

module.exports = MistralClient;