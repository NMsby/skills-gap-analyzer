// src/role-detector.js
const axios = require("axios");

async function detectCareerRole(cvText) {
  const prompt = `
You are an AI career classifier.

Based on the following resume, identify the most likely profession or career path. 
Return only a short, specific label like:
- Software Engineer
- Mechanical Engineer
- Civil Engineer
- Accountant
- Data Analyst
- Customer Support Agent
- Project Manager
- HR Specialist
- UI/UX Designer
- Doctor
- Lawyer

Resume text:
---
${cvText}
---
  `;

  const response = await axios.post(
    `${process.env.MISTRAL_BASE_URL}/chat/completions`,
    {
      model: "mistral-medium-2505",
      messages: [{ role: "user", content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
      }
    }
  );

  const result = response.data.choices[0].message.content.trim();
  return result;
}

module.exports = { detectCareerRole };
