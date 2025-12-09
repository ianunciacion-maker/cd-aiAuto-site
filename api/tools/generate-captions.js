/**
 * Social Captions Generation Proxy Endpoint
 * Proxies requests to n8n webhook to bypass CORS restrictions
 *
 * POST /api/tools/generate-captions
 * Body: { topic, platforms, tone, hashtags, length, image, userId, userEmail }
 * Returns: { success: boolean, captions: object }
 */

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers to allow frontend to access this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const webhookPayload = req.body;

    // Validate required fields
    if (!webhookPayload.topic || !webhookPayload.platforms || !Array.isArray(webhookPayload.platforms)) {
      return res.status(400).json({
        error: 'Missing required fields: topic, platforms (array)'
      });
    }

    if (webhookPayload.platforms.length === 0) {
      return res.status(400).json({
        error: 'At least one platform must be selected'
      });
    }

    console.log('📤 Proxying request to n8n webhook...');
    console.log('Payload size:', JSON.stringify(webhookPayload).length, 'characters');

    // Get n8n webhook URL from environment variable
    const webhookUrl = process.env.N8N_SOCIAL_CAPTIONS_WEBHOOK;
    if (!webhookUrl) {
      console.error('❌ N8N_SOCIAL_CAPTIONS_WEBHOOK not configured');
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
      body: JSON.stringify(webhookPayload),
      // 30 second timeout for AI generation
      signal: AbortSignal.timeout(30000)
    });

    if (!webhookResponse.ok) {
      console.error('❌ Webhook HTTP error:', webhookResponse.status, webhookResponse.statusText);
      throw new Error(`Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`);
    }

    console.log('✅ Webhook response received, status:', webhookResponse.status);

    // Parse response
    const responseData = await webhookResponse.json();
    console.log('📡 Webhook response type:', typeof responseData);
    console.log('📡 Webhook response is array:', Array.isArray(responseData));

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

    // Deep parse result to handle nested JSON strings
    const result = deepParse(responseData);
    console.log('📡 Parsed webhook response:', result);

    // Extract captions from response
    const extractCaptions = (obj) => {
      console.log('🔍 Extracting captions from response object');

      // n8n returns array with object: [{ captions: {...} }]
      if (obj.captions && typeof obj.captions === 'object') {
        console.log('✅ Found captions in obj.captions');
        return obj.captions;
      }

      // Check for pinData structure
      if (obj.pinData && obj.pinData['Social Media Captions'] && obj.pinData['Social Media Captions'].json) {
        const pinDataContent = obj.pinData['Social Media Captions'].json;
        if (pinDataContent.captions) {
          console.log('✅ Found captions in pinData.json.captions');
          return pinDataContent.captions;
        }
      }

      // Check for json wrapper
      if (obj.json && obj.json.captions) {
        console.log('✅ Found captions in obj.json.captions');
        return obj.json.captions;
      }

      // Check if platforms are at root level
      const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
      const rootLevelCaptions = {};
      let hasRootLevelCaptions = false;

      platforms.forEach(platform => {
        if (obj[platform]) {
          rootLevelCaptions[platform] = obj[platform];
          hasRootLevelCaptions = true;
        }
      });

      if (hasRootLevelCaptions) {
        console.log('✅ Found captions at root level');
        return rootLevelCaptions;
      }

      console.log('❌ No captions found in response structure');
      return null;
    };

    const captions = extractCaptions(result);

    if (!captions) {
      console.warn('⚠️ Could not parse captions from webhook response');
      console.warn('Response was:', result);
      return res.status(500).json({
        error: 'Invalid response structure from AI service',
        success: false
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      captions: captions
    });

  } catch (error) {
    console.error('❌ Caption generation error:', error.message);
    console.error('❌ Error stack:', error.stack);

    // Return error response
    return res.status(500).json({
      error: 'Failed to generate captions. Please try again.',
      success: false
    });
  }
};
