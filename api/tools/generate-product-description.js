/**
 * Product Description Generation API
 * Uses OpenRouter API with google/gemini-2.5-flash for AI generation
 * Supports image analysis for product photos
 *
 * POST /api/tools/generate-product-description
 * Body: { productName, category, features, targetAudience, tone, length, imageUrl, userId }
 * Returns: { success: boolean, description: object }
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
        const {
            productName,
            category,
            features,
            targetAudience,
            tone,
            length,
            imageUrl,
            userId
        } = req.body;

        // Validate required fields
        if (!productName) {
            return res.status(400).json({
                error: 'Missing required field: productName',
                success: false
            });
        }

        console.log('🛍️ Generating product description for:', productName);
        console.log('📷 Image URL:', imageUrl ? 'Yes' : 'No');

        // Get OpenRouter API key from environment
        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
            console.error('❌ OPENROUTER_API_KEY not configured');
            return res.status(500).json({
                error: 'API configuration error',
                success: false
            });
        }

        // Build the prompt with strict JSON output format
        const lengthGuide = {
            short: '50-100 words',
            medium: '100-200 words',
            long: '200-300 words',
            detailed: '300-400 words'
        };

        const systemPrompt = `You are an expert product copywriter. Generate compelling product descriptions that convert browsers into buyers.

CRITICAL: You MUST respond with ONLY valid JSON matching this exact schema. No markdown, no code blocks, just raw JSON:

{
  "headline": "A compelling product headline (max 100 characters)",
  "tagline": "A catchy tagline (max 50 characters)",
  "shortDescription": "1-2 sentence summary of the product",
  "fullDescription": "Main product description (${lengthGuide[length] || '100-200 words'})",
  "keyFeatures": [
    { "title": "Feature Name", "description": "Brief explanation of this feature" }
  ],
  "benefits": ["Benefit statement 1", "Benefit statement 2", "Benefit statement 3"],
  "targetAudience": "Description of who this product is perfect for",
  "callToAction": "A compelling call-to-action phrase",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Rules:
- Write in a ${tone || 'friendly'} tone
- Focus on benefits, not just features
- Use power words that evoke emotion
- Include exactly 3-5 key features
- Include exactly 3-5 benefits
- Include exactly 5 SEO keywords
- Make the CTA action-oriented and urgent`;

        const userPrompt = `Generate a product description for:

Product Name: ${productName}
Category: ${category || 'General'}
Key Features: ${features || 'Not specified'}
Target Audience: ${targetAudience || 'General consumers'}
Tone: ${tone || 'friendly'}
Length: ${length || 'medium'} (${lengthGuide[length] || '100-200 words'})

${imageUrl ? 'An image of the product has been provided. Analyze it to enhance your description with visual details, colors, materials, and design elements you observe.' : ''}

Return ONLY the JSON object, no other text.`;

        // Build messages array
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        // Add user message with or without image
        if (imageUrl) {
            messages.push({
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: userPrompt
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl
                        }
                    }
                ]
            });
        } else {
            messages.push({
                role: 'user',
                content: userPrompt
            });
        }

        console.log('🚀 Calling OpenRouter API with google/gemini-2.5-flash...');

        // Call OpenRouter API
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://cd-ai-auto-site.vercel.app',
                'X-Title': 'Ai-Auto Product Descriptions'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000,
                response_format: { type: 'json_object' }
            })
        });

        if (!openRouterResponse.ok) {
            const errorData = await openRouterResponse.json().catch(() => ({}));
            console.error('❌ OpenRouter API error:', openRouterResponse.status, errorData);
            throw new Error(errorData.error?.message || `OpenRouter API error: ${openRouterResponse.status}`);
        }

        const openRouterData = await openRouterResponse.json();
        console.log('✅ OpenRouter response received');

        // Extract the generated content
        const generatedContent = openRouterData.choices?.[0]?.message?.content;

        if (!generatedContent) {
            console.error('❌ No content in OpenRouter response');
            throw new Error('No content generated');
        }

        console.log('📝 Raw AI response:', generatedContent.substring(0, 200) + '...');

        // Parse the JSON response
        let description;
        try {
            // Clean up the response - remove any markdown code blocks if present
            let cleanedContent = generatedContent.trim();
            if (cleanedContent.startsWith('```json')) {
                cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedContent.startsWith('```')) {
                cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            description = JSON.parse(cleanedContent);
        } catch (parseError) {
            console.error('❌ Failed to parse AI response as JSON:', parseError.message);
            console.error('Raw content:', generatedContent);

            // Fallback: create structured response from raw text
            description = {
                headline: productName,
                tagline: `Premium ${category || 'Product'}`,
                shortDescription: generatedContent.substring(0, 200),
                fullDescription: generatedContent,
                keyFeatures: [{ title: 'Quality', description: 'Premium quality product' }],
                benefits: ['High quality', 'Great value', 'Reliable'],
                targetAudience: targetAudience || 'Everyone',
                callToAction: 'Order Now!',
                seoKeywords: [productName.toLowerCase(), category?.toLowerCase() || 'product']
            };
        }

        // Validate the response structure
        const requiredFields = ['headline', 'tagline', 'shortDescription', 'fullDescription', 'keyFeatures', 'benefits', 'targetAudience', 'callToAction', 'seoKeywords'];
        for (const field of requiredFields) {
            if (!description[field]) {
                console.warn(`⚠️ Missing field in response: ${field}`);
                // Add default values for missing fields
                if (field === 'keyFeatures') description[field] = [];
                else if (field === 'benefits') description[field] = [];
                else if (field === 'seoKeywords') description[field] = [];
                else description[field] = '';
            }
        }

        console.log('✅ Product description generated successfully');

        // Return successful response
        return res.status(200).json({
            success: true,
            description: description
        });

    } catch (error) {
        console.error('❌ Product description generation error:', error.message);
        console.error('❌ Error stack:', error.stack);

        return res.status(500).json({
            error: 'Failed to generate product description. Please try again.',
            success: false
        });
    }
};
