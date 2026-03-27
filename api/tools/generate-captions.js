/**
 * Social Captions Generation API
 * Uses OpenRouter with x-ai/grok-4.1-fast for AI generation
 *
 * POST /api/tools/generate-captions
 * Body: { topic, platforms, tone, hashtags, length, image, userId, userEmail }
 * Returns: { success: boolean, captions: { [platform]: string } }
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
        const { topic, platforms, tone, hashtags, length, image } = req.body;

        if (!topic || !platforms || !Array.isArray(platforms)) {
            return res.status(400).json({
                error: 'Missing required fields: topic, platforms (array)',
                success: false
            });
        }

        if (platforms.length === 0) {
            return res.status(400).json({
                error: 'At least one platform must be selected',
                success: false
            });
        }

        console.log('📱 Generating captions for:', topic, '| Platforms:', platforms.join(', '));

        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            console.error('❌ OPENROUTER_API_KEY not configured');
            return res.status(500).json({
                error: 'API configuration error',
                success: false
            });
        }

        const lengthGuide = {
            short: 'Keep captions concise (1-3 sentences)',
            medium: 'Medium-length captions (3-5 sentences)',
            long: 'Detailed captions (5-8 sentences)'
        };

        const platformGuides = {
            instagram: 'Instagram: Visual storytelling, use line breaks for readability, emoji-friendly, up to 2200 chars. End with a call to action.',
            facebook: 'Facebook: Conversational and engaging, can be longer, encourage comments/shares, link-friendly.',
            twitter: 'Twitter/X: Punchy and concise, max 280 chars, strong hook in first line, clever and shareable.',
            linkedin: 'LinkedIn: Professional but human, thought-leadership angle, value-driven, encourage discussion.',
            tiktok: 'TikTok: Trendy, casual, hook in first 3 words, use trending language, short and punchy.'
        };

        const selectedGuides = platforms
            .map(p => platformGuides[p])
            .filter(Boolean)
            .join('\n');

        const systemPrompt = `You are a world-class social media copywriter with the voice of Alex Hormozi.

STYLE GUIDE (STRICT):
- Write like you talk. 5th-grade reading level.
- Hook in the first line — pattern interrupt, bold claim, or question.
- Every post should make someone stop scrolling.
- High value. Zero fluff. Be direct.
- Use "I" and "You".
- Match each platform's native style and constraints.
${hashtags ? '- Include 3-5 relevant hashtags at the end of each caption.' : '- Do NOT include hashtags.'}

PLATFORM GUIDELINES:
${selectedGuides}

OUTPUT FORMAT: Return ONLY valid JSON matching this exact schema:
{
  "captions": {
    ${platforms.map(p => `"${p}": "The full caption text for ${p}"`).join(',\n    ')}
  }
}

CRITICAL:
- Each caption value MUST be a plain text string (not an object).
- Only include the platforms listed above.
- Do NOT wrap in markdown code blocks.`;

        const userPrompt = `Generate ${lengthGuide[length] || 'medium-length'} social media captions for:

Topic: ${topic}
Platforms: ${platforms.join(', ')}
Tone: ${tone || 'engaging'}
${image ? 'An image is attached to the post — reference visual elements.' : ''}

Return ONLY the JSON object.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        console.log('🚀 Calling OpenRouter API...');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-auto.ai',
                'X-Title': 'Ai-Auto Social Captions'
            },
            body: JSON.stringify({
                model: 'x-ai/grok-4.1-fast',
                messages,
                temperature: 0.8,
                max_tokens: 2000,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ OpenRouter API error:', response.status, JSON.stringify(errorData));
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) throw new Error('No content generated');

        let parsed;
        try {
            let cleaned = content.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
            }
            parsed = JSON.parse(cleaned);
        } catch {
            // Fallback: use raw content for all platforms
            const fallbackCaptions = {};
            platforms.forEach(p => { fallbackCaptions[p] = content; });
            parsed = { captions: fallbackCaptions };
        }

        // Extract captions — handle both { captions: {...} } and flat { instagram: "...", ... }
        let captions = parsed.captions || {};

        // Check if platforms are at root level (no captions wrapper)
        if (Object.keys(captions).length === 0) {
            platforms.forEach(p => {
                if (parsed[p]) {
                    captions[p] = parsed[p];
                }
            });
        }

        // Ensure all caption values are strings (not objects)
        for (const p of Object.keys(captions)) {
            if (typeof captions[p] === 'object' && captions[p] !== null) {
                captions[p] = captions[p].text || captions[p].caption || JSON.stringify(captions[p]);
            }
        }

        // Verify we have captions for requested platforms
        const missing = platforms.filter(p => !captions[p]);
        if (missing.length === platforms.length) {
            console.error('❌ No captions generated for any platform');
            throw new Error('Failed to parse captions from AI response');
        }

        if (missing.length > 0) {
            console.warn('⚠️ Missing captions for:', missing.join(', '));
        }

        console.log('✅ Captions generated for:', Object.keys(captions).join(', '));

        return res.status(200).json({
            success: true,
            captions
        });

    } catch (error) {
        console.error('❌ Caption generation error:', error.message);
        return res.status(500).json({
            error: 'Failed to generate captions. Please try again.',
            success: false
        });
    }
};
