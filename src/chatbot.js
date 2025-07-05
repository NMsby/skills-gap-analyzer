const axios = require('axios');

class MistralChat {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.mistral.ai/v1/chat/completions';
  }

  async askAgent(message) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'mistral-medium', 
          messages: [
            {
              role: 'system',
              content: 'You are SkillBot, a helpful AI assistant that helps users understand their skill gaps and gives career advice based on their CV and job market needs.',
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Mistral agent error:', error.response?.data || error.message);
      throw new Error('Failed to get a response from the AI agent.');
    }
  }
}

module.exports = MistralChat;
