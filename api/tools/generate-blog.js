/**
 * Blog Generator API Proxy
 * Proxies requests to n8n webhook to keep URL secure
 *
 * POST /api/tools/generate-blog
 * Body: { topic, length, tone, keywords, userId, userEmail }
 * Returns: { success: boolean, content: object }
 */

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const payload = req.body;

        // Validate required fields
        if (!payload.topic) {
            return res.status(400).json({
                error: 'Missing required field: topic',
                success: false
            });
        }

        console.log('📝 Proxying blog generation request...');

        // Get n8n webhook URL from environment variable
        const webhookUrl = process.env.N8N_BLOG_GENERATOR_WEBHOOK;
        if (!webhookUrl) {
            console.error('❌ N8N_BLOG_GENERATOR_WEBHOOK not configured');
            return res.status(500).json({
                error: 'Webhook configuration error',
                success: false
            });
        }

        const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(60000) // 60 second timeout for blog generation
        });

        if (!webhookResponse.ok) {
            console.error('❌ Webhook HTTP error:', webhookResponse.status);
            throw new Error(`Webhook returned ${webhookResponse.status}`);
        }

        console.log('✅ Webhook response received');

        // Parse response
        const responseData = await webhookResponse.json();

        // Helper function to recursively parse nested JSON strings
        const deepParse = (data) => {
            if (typeof data === 'string') {
                try {
                    return deepParse(JSON.parse(data));
                } catch (e) {
                    return data;
                }
            }
            if (Array.isArray(data) && data.length > 0) {
                return deepParse(data[0]);
            }
            return data;
        };

        const result = deepParse(responseData);
        console.log('📡 Parsed response type:', typeof result);

        // Extract blog data
        const extractBlogData = (obj) => {
            if (obj.blogTitle && obj.blogContent) {
                return {
                    title: obj.blogTitle,
                    content: obj.blogContent,
                    isHtml: true
                };
            }

            if (obj.output) {
                const outputData = deepParse(obj.output);
                if (outputData.blogTitle && outputData.blogContent) {
                    return {
                        title: outputData.blogTitle,
                        content: outputData.blogContent,
                        isHtml: true
                    };
                }
            }

            if (obj.content) {
                const contentData = deepParse(obj.content);
                if (contentData.blogTitle && contentData.blogContent) {
                    return {
                        title: contentData.blogTitle,
                        content: contentData.blogContent,
                        isHtml: true
                    };
                }
                return { content: obj.content, isHtml: false };
            }

            return null;
        };

        const blogData = extractBlogData(result);

        if (blogData) {
            return res.status(200).json({
                success: true,
                ...blogData
            });
        }

        // Fallback
        console.warn('⚠️ Could not parse blog data from response');
        return res.status(200).json({
            success: true,
            content: JSON.stringify(result, null, 2),
            isHtml: false
        });

    } catch (error) {
        console.error('❌ Blog generation error:', error.message);

        return res.status(500).json({
            error: 'Failed to generate blog. Please try again.',
            success: false
        });
    }
};
