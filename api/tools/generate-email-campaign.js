/**
 * Email Campaign Generation API
 * Uses OpenRouter with google/gemini-2.5-flash
 * Optional image support for product images
 */

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { subject, purpose, audience, tone, keyPoints, cta, length, imageUrl } = req.body;

        if (!subject) {
            return res.status(400).json({ error: 'Subject line is required', success: false });
        }

        console.log('📧 Generating email campaign:', subject);

        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            return res.status(500).json({ error: 'API configuration error', success: false });
        }

        const lengthGuide = { short: '100-150 words', medium: '200-300 words', long: '400-500 words' };

        const systemPrompt = `You are an expert email marketing copywriter. Generate compelling email campaigns.

RESPOND WITH ONLY VALID JSON (no markdown):
{
  "subjectLine": "Primary subject line",
  "preheader": "Preview text (50-90 chars)",
  "greeting": "Personalized greeting",
  "body": "Main email body (${lengthGuide[length] || '200-300 words'})",
  "bulletPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "callToAction": "CTA button text",
  "closing": "Sign-off text",
  "alternateSubjects": ["Alt subject 1", "Alt subject 2"]
}

Tone: ${tone || 'friendly'}. Make it engaging and conversion-focused.`;

        const userPrompt = `Generate email campaign:
Subject: ${subject}
Purpose: ${purpose || 'promotional'}
Audience: ${audience || 'General'}
Key Points: ${keyPoints || 'Not specified'}
CTA: ${cta || 'Learn More'}
${imageUrl ? 'Product image provided - incorporate visual elements you observe.' : ''}`;

        const messages = [{ role: 'system', content: systemPrompt }];

        if (imageUrl) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: userPrompt },
                    { type: 'image_url', image_url: { url: imageUrl } }
                ]
            });
        } else {
            messages.push({ role: 'user', content: userPrompt });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://cd-ai-auto-site.vercel.app',
                'X-Title': 'Ai-Auto Email Campaigns'
            },
            body: JSON.stringify({
                model: 'x-ai/grok-4.1-fast',
                messages,
                temperature: 0.7,
                max_tokens: 1500,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error('No content generated');

        let email;
        try {
            let cleaned = content.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
            }
            email = JSON.parse(cleaned);
        } catch {
            email = {
                subjectLine: subject,
                preheader: 'Check out our latest update',
                greeting: 'Hello!',
                body: content,
                bulletPoints: [],
                callToAction: cta || 'Learn More',
                closing: 'Best regards',
                alternateSubjects: []
            };
        }

        console.log('✅ Email campaign generated');
        return res.status(200).json({ success: true, email });

    } catch (error) {
        console.error('❌ Email generation error:', error.message);
        return res.status(500).json({ error: 'Failed to generate email campaign', success: false });
    }
};
