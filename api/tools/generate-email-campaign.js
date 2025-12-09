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

        const lengthGuide = { short: '100-150 words', medium: '150-250 words', long: '250-400 words' };

        const systemPrompt = `You are Alex Hormozi. write a 3-5 email campaign sequence.

STYLE GUIDE (STRICT):
- Write like you talk. 5th-grade reading level.
- Short, punchy sentences.
- High contrast. High value. Zero fluff.
- "Hook-Retain-Reward" structure in every email.
- Use "I" and "You". be direct.
- No corporate jargon. No "We hope this email finds you well."
- Format for readability: One sentence per line often.

OUTPUT SCHEMA (JSON ONLY):
{
  "campaign": [
    {
      "day": 1,
      "subjectLine": "Punchy Subject",
      "preheader": "Hook text",
      "body": "Body content...",
      "callToAction": "Direct CTA"
    },
    ... (3-5 emails total)
  ],
  "strategy": "Brief explanation of the campaign strategy"
}
`;

        const userPrompt = `Generate a ${lengthGuide[length] || 'short'} email sequence (3-5 emails) for:
Subject/Topic: ${subject}
Purpose: ${purpose || 'promotional'}
Target Audience: ${audience || 'General'}
Key Value Points: ${keyPoints || 'Not specified'}
Main CTA: ${cta || 'Action'}
${imageUrl ? 'Product image provided - use visual details as proof/evidence.' : ''}`;

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
            try {
                let cleaned = content.trim();
                if (cleaned.startsWith('```')) {
                    cleaned = cleaned.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
                }
                email = JSON.parse(cleaned);
            } catch {
                email = {
                    campaign: [
                        {
                            day: 1,
                            subjectLine: subject,
                            preheader: 'Quick update',
                            body: content, // Fallback if parsing fails
                            callToAction: cta || 'Click here'
                        }
                    ],
                    strategy: "Manual fallback generation"
                };
            }
        }

        console.log('✅ Email campaign generated');
        return res.status(200).json({ success: true, email });

    } catch (error) {
        console.error('❌ Email generation error:', error.message);
        return res.status(500).json({ error: 'Failed to generate email campaign', success: false });
    }
};
