# Admin Video Management System - Architectural Plan

## Overview

This document outlines the comprehensive architecture for extending the 3D video carousel system with admin video management capabilities, Supabase integration, and support for YouTube and Vimeo video sources. The system will enable administrators to dynamically manage carousel content through an intuitive admin interface.

## System Architecture

### Core Components

#### 1. Video Management Dashboard Extension
- **Admin Video Management Section**: New section in admin dashboard for carousel video management
- **Video Upload Interface**: Direct video upload with automatic thumbnail generation
- **External Video Integration**: YouTube and Vimeo URL input with metadata extraction
- **Video Ordering System**: Drag-and-drop interface for carousel positioning
- **Video Status Management**: Active/inactive toggle with scheduling capabilities
- **Bulk Operations**: Mass upload, delete, and status changes

#### 2. Enhanced 3D Carousel Integration
- **Dynamic Video Loading**: Real-time carousel updates from Supabase
- **Video Source Abstraction**: Support for MP4, YouTube, and Vimeo sources
- **Adaptive Video Player**: Context-aware player based on video source type
- **Thumbnail Generation**: Automatic thumbnail creation for all video types
- **Performance Optimization**: Smart caching based on video source

#### 3. Supabase Database Schema
- **Videos Table**: Extended schema for video management
- **Video Metadata**: Rich metadata storage for enhanced carousel experience
- **Video Analytics**: Engagement tracking and performance metrics
- **Video Categories**: Tagging and categorization system
- **Video Status**: Scheduling and publication management

## Database Schema Design

### Videos Table
```sql
CREATE TABLE carousel_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_source TEXT NOT NULL CHECK (video_source IN ('upload', 'youtube', 'vimeo')),
  thumbnail_url TEXT,
  duration INTEGER,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'scheduled')),
  position INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- External video specific fields
  external_id TEXT, -- YouTube video ID or Vimeo video ID
  external_data JSONB, -- Cached metadata from external APIs
  
  -- Performance tracking
  play_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Quality and optimization
  video_quality TEXT DEFAULT 'auto',
  auto_generated_thumbnail BOOLEAN DEFAULT false,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
);
```

### Video Categories Table
```sql
CREATE TABLE video_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#2357ff',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE
);
```

### Video Analytics Table
```sql
CREATE TABLE video_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES carousel_videos(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('play', 'click', 'share', 'view', 'error')),
  event_data JSONB,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Architecture

### Video Management API Endpoints

#### Core Video Operations
```javascript
// Video CRUD Operations
POST   /api/admin/videos              // Create new video
GET    /api/admin/videos              // List all videos with pagination
GET    /api/admin/videos/:id          // Get single video
PUT    /api/admin/videos/:id          // Update video
DELETE /api/admin/videos/:id          // Delete video

// Bulk Operations
POST   /api/admin/videos/bulk         // Bulk create/update
DELETE /api/admin/videos/bulk         // Bulk delete
PUT    /api/admin/videos/reorder       // Reorder carousel positions

// External Video Integration
POST   /api/admin/videos/youtube      // Add YouTube video
POST   /api/admin/videos/vimeo        // Add Vimeo video
GET    /api/admin/videos/metadata/:source/:id  // Get external video metadata

// Video Processing
POST   /api/admin/videos/:id/thumbnail // Generate thumbnail
POST   /api/admin/videos/:id/process   // Process uploaded video
GET    /api/admin/videos/:id/status    // Check processing status

// Analytics
GET    /api/admin/videos/analytics     // Get video analytics
POST   /api/admin/videos/:id/track    // Track video event
```

### External API Integration

#### YouTube Data API v3
```javascript
class YouTubeVideoManager {
  async getVideoMetadata(videoId) {
    const API_KEY = process.env.YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos`;
    
    const response = await fetch(`${url}?part=snippet,contentDetails,statistics&id=${videoId}&key=${API_KEY}`);
    const data = await response.json();
    
    if (data.items.length === 0) {
      throw new Error('Video not found');
    }
    
    const video = data.items[0];
    return {
      title: video.snippet.title,
      description: video.snippet.description,
      duration: this.parseDuration(video.contentDetails.duration),
      thumbnail: video.snippet.thumbnails.high.url,
      views: video.statistics.viewCount,
      publishedAt: video.snippet.publishedAt,
      channelId: video.snippet.channelId,
      tags: video.snippet.tags || []
    };
  }
  
  parseDuration(duration) {
    // Convert ISO 8601 duration to seconds
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
}
```

#### Vimeo API v3
```javascript
class VimeoVideoManager {
  async getVideoMetadata(videoId) {
    const ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
    const url = `https://api.vimeo.com/videos/${videoId}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    });
    
    if (!response.ok) {
      throw new Error('Vimeo API error');
    }
    
    const video = await response.json();
    return {
      title: video.name,
      description: video.description,
      duration: video.duration,
      thumbnail: this.getBestThumbnail(video.pictures.sizes),
      views: video.stats.plays,
      publishedAt: video.release_time,
      userId: video.user.uri,
      tags: video.tags || []
    };
  }
  
  getBestThumbnail(sizes) {
    // Return the highest resolution thumbnail
    return sizes.reduce((best, current) => {
      const bestPixels = best.width * best.height;
      const currentPixels = current.width * current.height;
      return currentPixels > bestPixels ? current : best;
    });
  }
}
```

## Frontend Architecture

### Admin Video Management Interface

#### Video Management Dashboard Section
```html
<!-- Video Management Section -->
<section class="video-management-section">
  <div class="section-header">
    <h2 class="section-title">3D Carousel Videos</h2>
    <div class="video-actions">
      <button class="btn" id="addVideoBtn">+ Add Video</button>
      <button class="btn btn-outline" id="bulkActionsBtn">Bulk Actions</button>
    </div>
  </div>
  
  <!-- Video Upload Tabs -->
  <div class="video-upload-tabs">
    <div class="tab-nav">
      <button class="tab-btn active" data-tab="upload">Upload Video</button>
      <button class="tab-btn" data-tab="youtube">YouTube</button>
      <button class="tab-btn" data-tab="vimeo">Vimeo</button>
    </div>
    
    <!-- Upload Tab -->
    <div class="tab-content active" id="uploadTab">
      <form class="video-upload-form" id="uploadForm">
        <div class="form-group">
          <label for="videoTitle">Title *</label>
          <input type="text" id="videoTitle" name="title" required>
        </div>
        
        <div class="form-group">
          <label for="videoDescription">Description</label>
          <textarea id="videoDescription" name="description" rows="4"></textarea>
        </div>
        
        <div class="form-group">
          <label for="videoFile">Video File *</label>
          <input type="file" id="videoFile" name="video" accept="video/*" required>
          <div class="file-info" id="fileInfo"></div>
        </div>
        
        <div class="form-group">
          <label for="videoCategory">Category</label>
          <select id="videoCategory" name="category">
            <option value="">Select Category</option>
            <!-- Categories loaded dynamically -->
          </select>
        </div>
        
        <div class="form-group">
          <label for="videoTags">Tags</label>
          <input type="text" id="videoTags" name="tags" placeholder="Enter tags separated by commas">
        </div>
        
        <div class="form-group">
          <label for="videoPosition">Carousel Position</label>
          <input type="number" id="videoPosition" name="position" min="0" value="0">
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn">Upload Video</button>
          <button type="button" class="btn btn-outline" id="cancelUpload">Cancel</button>
        </div>
      </form>
    </div>
    
    <!-- YouTube Tab -->
    <div class="tab-content" id="youtubeTab">
      <form class="video-url-form" id="youtubeForm">
        <div class="form-group">
          <label for="youtubeUrl">YouTube URL *</label>
          <input type="url" id="youtubeUrl" name="url" placeholder="https://www.youtube.com/watch?v=..." required>
        </div>
        
        <div class="url-preview" id="youtubePreview">
          <div class="preview-placeholder">
            <p>Enter a YouTube URL to preview video metadata</p>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn">Add YouTube Video</button>
          <button type="button" class="btn btn-outline" id="cancelYoutube">Cancel</button>
        </div>
      </form>
    </div>
    
    <!-- Vimeo Tab -->
    <div class="tab-content" id="vimeoTab">
      <form class="video-url-form" id="vimeoForm">
        <div class="form-group">
          <label for="vimeoUrl">Vimeo URL *</label>
          <input type="url" id="vimeoUrl" name="url" placeholder="https://vimeo.com/..." required>
        </div>
        
        <div class="url-preview" id="vimeoPreview">
          <div class="preview-placeholder">
            <p>Enter a Vimeo URL to preview video metadata</p>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn">Add Vimeo Video</button>
          <button type="button" class="btn btn-outline" id="cancelVimeo">Cancel</button>
        </div>
      </form>
    </div>
  </div>
  
  <!-- Video List with Drag-and-Drop -->
  <div class="videos-list-container">
    <div class="list-header">
      <h3>Carousel Videos</h3>
      <div class="list-controls">
        <button class="btn btn-sm" id="selectAllBtn">Select All</button>
        <button class="btn btn-sm btn-outline" id="deselectAllBtn">Deselect All</button>
      </div>
    </div>
    
    <div class="videos-grid" id="videosGrid">
      <!-- Videos loaded dynamically -->
    </div>
  </div>
</section>
```

#### Video Grid Item with Drag-and-Drop
```html
<div class="video-item" data-video-id="uuid" draggable="true">
  <div class="video-thumbnail">
    <img src="thumbnail.jpg" alt="Video thumbnail">
    <div class="video-overlay">
      <div class="video-status status-active">Active</div>
      <div class="video-position">Position: 1</div>
    </div>
  </div>
  
  <div class="video-info">
    <h4 class="video-title">Video Title</h4>
    <p class="video-description">Video description...</p>
    <div class="video-meta">
      <span class="video-source source-youtube">YouTube</span>
      <span class="video-duration">2:45</span>
      <span class="video-views">1.2K views</span>
    </div>
    <div class="video-tags">
      <span class="tag">AI</span>
      <span class="tag">Demo</span>
    </div>
  </div>
  
  <div class="video-actions">
    <button class="action-btn edit" onclick="editVideo('uuid')">Edit</button>
    <button class="action-btn delete" onclick="deleteVideo('uuid')">Delete</button>
    <button class="action-btn preview" onclick="previewVideo('uuid')">Preview</button>
  </div>
</div>
```

## Enhanced 3D Carousel Integration

### Dynamic Video Loading System
```javascript
class CarouselVideoManager {
  constructor() {
    this.supabase = window.supabase;
    this.videos = [];
    this.isLoading = false;
    this.currentSource = 'all';
  }

  async loadVideosFromSupabase() {
    try {
      const { data, error } = await this.supabase
        .from('carousel_videos')
        .select('*')
        .eq('status', 'active')
        .order('position', { ascending: true });

      if (error) throw error;
      
      this.videos = data.map(video => this.transformVideoData(video));
      this.updateCarousel();
    } catch (error) {
      console.error('Error loading videos:', error);
      this.showError('Failed to load carousel videos');
    }
  }

  transformVideoData(video) {
    return {
      id: video.id,
      title: video.title,
      description: video.description,
      src: this.getVideoSource(video),
      poster: video.thumbnail_url,
      duration: this.formatDuration(video.duration),
      views: this.formatViews(video.views),
      source: video.video_source,
      externalId: video.external_id,
      position: video.position,
      category: video.category,
      tags: video.tags || [],
      metadata: video.metadata || {}
    };
  }

  getVideoSource(video) {
    switch (video.video_source) {
      case 'youtube':
        return `https://www.youtube.com/embed/${video.external_id}?autoplay=0&rel=0`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${video.external_id}?autoplay=0`;
      case 'upload':
      default:
        return video.video_url;
    }
  }

  async updateCarousel() {
    if (window.carousel3D) {
      // Update existing carousel with new data
      window.carousel3D.loadVideos(this.videos);
    } else {
      // Initialize new carousel
      window.carousel3D = new VideoCarousel3D('#carousel3D', {
        radius: 350,
        enableParticles: true,
        autoRotate: false
      });
      window.carousel3D.loadVideos(this.videos);
    }
  }
}
```

### Adaptive Video Player System
```javascript
class AdaptiveVideoPlayer {
  constructor(container) {
    this.container = container;
    this.currentVideo = null;
    this.playerType = 'html5';
  }

  async loadVideo(videoData) {
    this.currentVideo = videoData;
    
    switch (videoData.source) {
      case 'youtube':
        await this.loadYouTubeVideo(videoData);
        break;
      case 'vimeo':
        await this.loadVimeoVideo(videoData);
        break;
      case 'upload':
      default:
        await this.loadLocalVideo(videoData);
        break;
    }
  }

  async loadYouTubeVideo(videoData) {
    // Load YouTube iframe player
    this.playerType = 'youtube';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoData.externalId}?enablejsapi=1&origin=${window.location.origin}`;
    iframe.allowFullscreen = true;
    iframe.className = 'video-player youtube-player';
    
    this.container.innerHTML = '';
    this.container.appendChild(iframe);
  }

  async loadVimeoVideo(videoData) {
    // Load Vimeo iframe player
    this.playerType = 'vimeo';
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${videoData.externalId}?api=1&player_id=`;
    iframe.allowFullscreen = true;
    iframe.className = 'video-player vimeo-player';
    
    this.container.innerHTML = '';
    this.container.appendChild(iframe);
  }

  async loadLocalVideo(videoData) {
    // Load HTML5 video player
    this.playerType = 'html5';
    const video = document.createElement('video');
    video.src = videoData.src;
    video.poster = videoData.poster;
    video.controls = true;
    video.className = 'video-player html5-player';
    
    this.container.innerHTML = '';
    this.container.appendChild(video);
  }
}
```

## Performance Optimization

### Smart Caching Strategy
```javascript
class VideoCacheManager {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async cacheVideoMetadata(videoId, source) {
    const cacheKey = `${source}:${videoId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    // Fetch fresh metadata
    let metadata;
    switch (source) {
      case 'youtube':
        metadata = await this.youtubeManager.getVideoMetadata(videoId);
        break;
      case 'vimeo':
        metadata = await this.vimeoManager.getVideoMetadata(videoId);
        break;
    }

    // Cache the result
    this.cache.set(cacheKey, {
      data: metadata,
      timestamp: Date.now()
    });

    // Clean old cache entries
    this.cleanCache();
    
    return metadata;
  }

  cleanCache() {
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 25% of entries
      const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.25));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }
}
```

### Progressive Image Loading
```javascript
class ProgressiveImageLoader {
  constructor() {
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this));
    this.loadedImages = new Set();
  }

  observeImage(img, videoData) {
    if (this.loadedImages.has(videoData.id)) return;
    
    // Use low-quality placeholder first
    img.src = videoData.thumbnail_low || videoData.thumbnail;
    img.dataset.videoId = videoData.id;
    img.dataset.highQuality = videoData.thumbnail;
    
    this.observer.observe(img);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const highQualityUrl = img.dataset.highQuality;
        
        if (highQualityUrl && img.src !== highQualityUrl) {
          // Load high quality image
          img.src = highQualityUrl;
          this.loadedImages.add(img.dataset.videoId);
        }
        
        this.observer.unobserve(img);
      }
    });
  }
}
```

## Security Considerations

### Input Validation and Sanitization
```javascript
class VideoSecurityManager {
  static validateYouTubeUrl(url) {
    const youtubeRegex = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  }

  static validateVimeoUrl(url) {
    const vimeoRegex = /^https?:\/\/(www\.)?vimeo\.com\/(\d+)/;
    const match = url.match(vimeoRegex);
    return match ? match[1] : null;
  }

  static sanitizeVideoMetadata(metadata) {
    return {
      title: this.sanitizeHtml(metadata.title),
      description: this.sanitizeHtml(metadata.description),
      tags: metadata.tags.map(tag => this.sanitizeHtml(tag))
    };
  }

  static sanitizeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
}
```

### Row Level Security (RLS) Policies
```sql
-- Admin-only video management
CREATE POLICY "Admins can manage all videos" ON carousel_videos
FOR ALL USING (auth.uid() = created_by)
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Users can view active videos
CREATE POLICY "Users can view active videos" ON carousel_videos
FOR SELECT USING (auth.uid() IS NOT NULL)
WITH CHECK (status = 'active');

-- Public can read published video metadata
CREATE POLICY "Public videos are readable" ON carousel_videos
FOR SELECT USING (status = 'active')
WITH CHECK (true);
```

## Testing Strategy

### Unit Testing
```javascript
describe('Video Management System', () => {
  test('should upload video successfully', async () => {
    const mockFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    const result = await videoManager.uploadVideo(mockFile);
    expect(result.success).toBe(true);
    expect(result.data.id).toBeDefined();
  });

  test('should extract YouTube metadata', async () => {
    const videoId = 'dQw4w9WgXcQ';
    const metadata = await youtubeManager.getVideoMetadata(videoId);
    expect(metadata.title).toBeDefined();
    expect(metadata.duration).toBeGreaterThan(0);
  });

  test('should handle Vimeo URL validation', () => {
    const validUrl = 'https://vimeo.com/123456789';
    const invalidUrl = 'https://example.com/video';
    
    expect(VideoSecurityManager.validateVimeoUrl(validUrl)).toBe('123456789');
    expect(VideoSecurityManager.validateVimeoUrl(invalidUrl)).toBeNull();
  });
});
```

### Integration Testing
```javascript
describe('Carousel Integration', () => {
  test('should update carousel with new videos', async () => {
    const testVideos = [
      { id: '1', title: 'Test Video 1', video_source: 'upload' },
      { id: '2', title: 'YouTube Video', video_source: 'youtube', external_id: 'dQw4w9WgXcQ' }
    ];

    await carouselManager.loadVideos(testVideos);
    
    expect(carousel3D.videos.length).toBe(2);
    expect(carousel3D.videos[0].source).toBe('upload');
    expect(carousel3D.videos[1].source).toBe('youtube');
  });
});
```

## Deployment Strategy

### Phase 1: Core Infrastructure (Week 1-2)
1. Database schema implementation
2. Basic video upload functionality
3. YouTube/Vimeo API integration
4. Admin interface foundation

### Phase 2: Advanced Features (Week 3-4)
1. Drag-and-drop video ordering
2. Video metadata extraction
3. Thumbnail generation system
4. Bulk operations

### Phase 3: Optimization (Week 5-6)
1. Performance optimization
2. Caching implementation
3. Analytics integration
4. Security hardening

### Phase 4: Launch (Week 7-8)
1. Comprehensive testing
2. Documentation completion
3. Production deployment
4. Monitoring setup

## Success Metrics

### Technical Metrics
- Video upload success rate: >95%
- API response time: <500ms
- Carousel load time: <2s
- Cache hit rate: >80%
- Error rate: <1%

### User Experience Metrics
- Admin task completion time: <30s
- Video metadata accuracy: >90%
- Carousel update latency: <1s
- Mobile responsiveness: 100%
- Accessibility compliance: WCAG 2.1 AA

### Business Metrics
- Video management efficiency: +300%
- Carousel content freshness: +200%
- User engagement with carousel: +150%
- Admin productivity: +250%
- Support ticket reduction: -40%

## Future Enhancements

### Advanced Features
- **Video A/B Testing**: Test different carousel configurations
- **AI-Powered Recommendations**: Suggest videos based on engagement
- **Live Streaming Support**: Add live video capabilities
- **Multi-Language Support**: International video metadata
- **Video Analytics Dashboard**: Comprehensive engagement metrics
- **Video Import/Export**: Bulk video management
- **Video Versioning**: Maintain video update history
- **Collaborative Management**: Multiple admin workflow
- **Automated Quality Checks**: Video quality validation
- **Smart Scheduling**: Time-based video publication

### Integration Opportunities
- **Social Media Platforms**: Direct sharing to social networks
- **Email Marketing**: Video integration with email campaigns
- **Analytics Platforms**: Google Analytics, Mixpanel integration
- **CDN Integration**: Cloudflare, AWS CloudFront
- **Monitoring Services**: Sentry, LogRocket integration
- **Content Delivery**: Multi-region video distribution
- **Search Integration**: Elasticsearch video search
- **Recommendation Engines**: Personalized video suggestions

## Conclusion

This comprehensive admin video management system will transform the 3D carousel from a static showcase into a dynamic, content-rich experience. By integrating with Supabase for data management and supporting YouTube/Vimeo for external content, administrators will have complete control over the carousel experience while maintaining the high-performance, immersive design that users expect.

The modular architecture ensures scalability, security, and maintainability while providing administrators with intuitive tools for managing video content efficiently.