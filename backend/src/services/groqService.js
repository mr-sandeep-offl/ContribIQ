const Groq = require('groq-sdk');

/**
 * Reusable function to generate Groq chat completions response.
 * @param {object} params
 * @param {string} params.message - Current user query
 * @param {array} params.history - List of previous messages { role: 'user' | 'assistant', content: string }
 * @param {string} params.projectContext - Formatted text context containing project/workspace data
 * @returns {Promise<string>}
 */
const generateGroqResponse = async ({ message, history, projectContext }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in backend environment');
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const groq = new Groq({ apiKey });

  // System instructions as required
  const systemPrompt = `You are SyncScore AI Assistant, a project intelligence assistant.

Use the supplied project and workspace context when answering project-related questions.

Be clear, concise, practical and accurate.

Never invent project names, tasks, contributors, deadlines, scores or statistics.

If information is unavailable, clearly say so.

When identifying a risk, explain its reason and suggest one or two practical next actions.

Use clean plain text and short bullet points where helpful.

Never expose database IDs, tokens, API keys, secrets or backend implementation details.`;

  // Prepare messages payload, limiting history length to keep within context limits (e.g., last 10 messages)
  const maxHistoryLength = 10;
  const recentHistory = (history || []).slice(-maxHistoryLength);

  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  if (projectContext) {
    messages.push({
      role: 'system',
      content: `[CONTEXT DATA]\n${projectContext}\n[END CONTEXT DATA]\nAlways answer based on the context data above. If a question is unrelated to the context, answer politely that you are a project assistant.`
    });
  }

  // Add history
  recentHistory.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({ role: msg.role, content: msg.content });
    }
  });

  // Add current message
  messages.push({ role: 'user', content: message });

  try {
    // Call the Groq SDK with timeout handling (using AbortController or standard promise race)
    const completionPromise = groq.chat.completions.create({
      messages,
      model,
      max_tokens: 1024,
      temperature: 0.2,
    });

    // 15 seconds timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 15000)
    );

    const response = await Promise.race([completionPromise, timeoutPromise]);

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error('Empty response from Groq API');
    }

    return response.choices[0].message.content || 'No reply generated.';
  } catch (error) {
    // Handle specific errors cleanly (never logging the API key)
    console.error('Groq service error:', error.message || error);
    
    // Categorize error for calling controller to know when to fallback
    if (error.status === 401 || error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('API key')) {
      throw new Error('Invalid Groq API key.');
    }
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
      throw new Error('Groq rate limit exceeded.');
    }
    if (error.status === 404 || error.message?.includes('404') || error.message?.includes('model_not_found') || error.message?.includes('model')) {
      throw new Error('Selected Groq model is unavailable or deprecated.');
    }
    
    throw new Error(error.message || 'Groq connection failed.');
  }
};

module.exports = {
  generateGroqResponse,
};
