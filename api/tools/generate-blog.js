/**
 * Blog Generator API
 * Uses OpenRouter with x-ai/grok-4.1-fast for AI generation
 *
 * POST /api/tools/generate-blog
 * Body: { topic, length, tone, keywords, userId, userEmail }
 * Returns: { success: boolean, title: string, content: string, isHtml: boolean }
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
        const { topic, length, tone, keywords } = req.body;

        if (!topic) {
            return res.status(400).json({
                error: 'Missing required field: topic',
                success: false
            });
        }

        console.log('📝 Generating blog post:', topic);

        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            console.error('❌ OPENROUTER_API_KEY not configured');
            return res.status(500).json({
                error: 'API configuration error',
                success: false
            });
        }

        const lengthGuide = {
            short: '400-600 words',
            medium: '600-1000 words',
            long: '1000-1500 words',
            detailed: '1500-2500 words'
        };

        const systemPrompt = `You are Alex Hormozi writing blog posts.

STYLE GUIDE (STRICT):
- Write at a 5th-grade reading level. Short sentences. Punchy.
- "Hook-Retain-Reward" structure: hook in the first line, keep them reading, deliver massive value.
- Use "I" and "You". Be direct. Talk like a real person.
- High contrast: "Old way" vs "New way" framing.
- No corporate jargon. No filler. Every sentence earns its place.
- Use subheadings, bullet points, and bold text for scanners.
- Open with a pattern interrupt — a bold claim, stat, or question.
- Close with a clear takeaway and call to action.

OUTPUT FORMAT: Return ONLY valid JSON matching this exact schema:
{
  "blogTitle": "Compelling, benefit-driven title",
  "blogContent": "<h2>Subheading</h2><p>Paragraph text...</p>..."
}

CRITICAL RULES:
- blogContent MUST be valid HTML using <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags.
- Do NOT use <h1> (the title is displayed separately).
- Do NOT wrap in markdown code blocks.
- Tone: ${tone || 'Professional and direct'}`;

        const userPrompt = `Write a ${lengthGuide[length] || '600-1000 words'} blog post about:

Topic: ${topic}
${keywords ? `Keywords to naturally include: ${keywords}` : ''}
Tone: ${tone || 'professional'}

Return ONLY the JSON object. No markdown, no explanation.`;

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
                'X-Title': 'Ai-Auto Blog Generator'
            },
            body: JSON.stringify({
                model: 'x-ai/grok-4.1-fast',
                messages,
                temperature: 0.7,
                max_tokens: 4000,
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

        let blog;
        try {
            let cleaned = content.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```json?\s*/, '').replace(/\s*```$/, '');
            }
            blog = JSON.parse(cleaned);
        } catch {
            // Fallback: treat raw content as the blog body
            blog = {
                blogTitle: topic,
                blogContent: `<p>${content}</p>`
            };
        }

        console.log('✅ Blog post generated:', blog.blogTitle);

        return res.status(200).json({
            success: true,
            title: blog.blogTitle || topic,
            content: blog.blogContent || content,
            isHtml: true
        });

    } catch (error) {
        console.error('❌ Blog generation error:', error.message);
        return res.status(500).json({
            error: 'Failed to generate blog. Please try again.',
            success: false
        });
    }
};
