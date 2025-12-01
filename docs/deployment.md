# Deployment Guide

This guide covers deployment strategies and configurations for the Ai-Auto project.

## Deployment Overview

Ai-Auto is a static site that can be deployed to any static hosting service. The build process optimizes CSS and JavaScript for production.

## Build Process

### Prerequisites
- Node.js 16+ and npm 8+
- Git repository access

### Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Run tests before building
npm run test
```

### Build Output
The build process creates:
- `dist/css/main.min.css` - Minified CSS
- `dist/js/main.min.js` - Minified JavaScript
- Optimized HTML files (if configured)

## Deployment Options

### 1. Netlify (Recommended)

**Setup:**
1. Connect your Git repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

**Features:**
- Automatic deployments on Git push
- CDN integration
- Form handling
- A/B testing support
- Edge functions for server-side logic

**Configuration file (`netlify.toml`):**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/old-path"
  to = "/new-path"
  status = 301

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

### 2. Vercel

**Setup:**
1. Import your Git repository
2. Configure build settings
3. Set environment variables

**Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "functionsDirectory": "api"
}
```

### 3. GitHub Pages

**Setup:**
1. Enable GitHub Pages in repository settings
2. Choose source: `gh-pages` branch
3. Configure custom domain if needed

**Deployment Script:**
```bash
#!/bin/bash
set -e

npm run build
git checkout gh-pages
git add dist/
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
git checkout main
```

### 4. AWS S3 + CloudFront

**Setup:**
1. Create S3 bucket
2. Configure CloudFront distribution
3. Set up IAM permissions
4. Configure deployment pipeline

**Deployment Script:**
```bash
#!/bin/bash
set -e

# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 5. Firebase Hosting

**Setup:**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize: `firebase init hosting`
3. Configure settings in `firebase.json`

**Configuration:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(css|js)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

## Environment Variables

### Required Variables
- `NODE_ENV` - Set to 'production'
- `API_URL` - Backend API endpoint
- `ANALYTICS_ID` - Google Analytics ID

### Optional Variables
- `SENTRY_DSN` - Error tracking
- `FEATURE_FLAGS` - Feature toggle configuration

## Performance Optimization

### Caching Strategy
- CSS: Cache for 1 year with versioning
- JavaScript: Cache for 1 year with versioning
- Images: Cache for 6 months
- HTML: Cache for 1 hour or less

### Compression
- Gzip compression enabled
- Brotli compression where supported
- Minified assets
- Optimized images

### CDN Configuration
```javascript
// CDN fallback for fonts
const fontConfig = {
  families: [
    'Inter:wght@400;500;600;700;900',
    'Playfair+Display:wght@500;600;700;900'
  ],
  display: 'swap',
  preload: true
};
```

## Security Headers

### Recommended Headers
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
```

## SSL/HTTPS

### Certificate Management
- Use Let's Encrypt for free certificates
- Auto-renewal configuration
- Force HTTPS redirects
- HSTS headers

### Redirect Configuration
```apache
# Apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring and Analytics

### Performance Monitoring
- Core Web Vitals tracking
- Real User Monitoring (RUM)
- Error tracking with Sentry
- Uptime monitoring

### Analytics Setup
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Build process successful
- [ ] Environment variables configured
- [ ] SSL certificate valid
- [ ] Backup of current deployment
- [ ] Rollback plan prepared

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Analytics tracking working
- [ ] Performance metrics within thresholds
- [ ] Error rates below 1%
- [ ] Mobile responsiveness verified
- [ ] Accessibility compliance checked

## Rollback Procedures

### Emergency Rollback
1. Switch to previous stable version
2. Verify critical functionality
3. Monitor error rates
4. Communicate with stakeholders
5. Investigate root cause

### Automated Rollback
```bash
#!/bin/bash
# Rollback to previous version
git checkout HEAD~1
npm run build
npm run deploy
```

## Troubleshooting

### Common Issues

**Build failures**
- Check Node.js version compatibility
- Verify all dependencies installed
- Clear npm cache: `npm cache clean --force`
- Check for syntax errors in source files

**Deployment failures**
- Verify build output directory
- Check file permissions
- Validate configuration files
- Review deployment logs

**Performance issues**
- Check Core Web Vitals
- Analyze bundle size
- Verify CDN caching
- Test with different network conditions

**SSL issues**
- Verify certificate chain
- Check certificate expiration
- Validate configuration
- Test with SSL labs

## CI/CD Integration

### GitHub Actions
```yaml
name: Deploy to Production
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run test
    - run: npm run build
    - name: Deploy to Netlify
      uses: netlify/actions/cli@master
      with:
        args: deploy --prod --dir=dist
```

### GitLab CI
```yaml
deploy_production:
  stage: deploy
  script:
    - npm ci
    - npm run test
    - npm run build
    - echo "Deploying to production..."
  only:
    - main
```

## Maintenance

### Regular Tasks
- Monthly security updates
- Quarterly performance reviews
- Annual certificate renewal
- Continuous dependency updates
- Regular backup verification

### Monitoring Alerts
- Set up alerting for:
  - Uptime < 99.9%
  - Error rate > 1%
  - Response time > 3 seconds
  - SSL certificate expiration
  - Storage usage > 80%

## Resources

- [Netlify Docs](https://docs.netlify.com/)
- [Vercel Docs](https://vercel.com/docs)
- [AWS Deployment Guide](https://docs.aws.amazon.com/deployment/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Web.dev Deployment](https://web.dev/deploy)