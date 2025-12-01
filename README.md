# Ai-Auto – Set Your Own Salary with AI

A modern web platform that helps users automate their work and scale their productivity using AI-powered tools. Built with a focus on user experience, accessibility, and performance.

## 🚀 Project Overview

Ai-Auto is a comprehensive suite of AI tools designed to help freelancers, entrepreneurs, creators, and developers automate repetitive tasks and focus on high-value work. The platform offers content generation, social media management, email marketing automation, and more.

### Key Features

- **AI Content Creation Suite**: Generate blog posts, social media captions, email campaigns, and product descriptions
- **Brand Voice Training**: AI learns your unique style and tone
- **24/7 Automation**: Tools that work while you sleep
- **Responsive Design**: Works seamlessly across all devices
- **Dark Mode Support**: Eye-friendly interface for late-night work sessions
- **Modern Neobrutalist Design**: Bold, accessible, and engaging UI

## 🏗️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with CSS Variables for theming
- **Fonts**: 
  - Headings: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display)
  - Body: [Inter](https://fonts.google.com/specimen/Inter)
- **Build Tools**: Vanilla (no external dependencies)
- **Version Control**: Git

## 📁 Project Structure

```
aiAuto/
├── README.md                 # Project documentation
├── .gitignore               # Git ignore rules
├── .gitattributes           # Git attributes
├── index.html               # Homepage
├── about.html               # About page
├── tools.html               # Tools catalog page
├── specifications.md        # Technical specifications
├── design_system.md         # Design system guidelines
├── Assets/                  # Static assets (images, icons, etc.)
├── css/                     # Stylesheets (to be organized)
├── js/                      # JavaScript files (to be organized)
└── docs/                    # Additional documentation
```

## 🎨 Design System

The project uses a comprehensive design system with:

- **Color Palette**: Neobrutalist design with bold colors
- **Typography**: Serif headings (Playfair Display) and sans-serif body (Inter)
- **Spacing**: Consistent spacing scale using CSS variables
- **Components**: Reusable UI components with consistent styling
- **Dark Mode**: Complete theme support with CSS variables

### Key Design Tokens

```css
:root {
  --bg-paper: #f2f0e9;
  --bg-white: #ffffff;
  --ink: #121212;
  --blue: #2357ff;
  --gold: #ffcc00;
  --coral: #ff6b58;
  --lavender: #dcd6f7;
  --green: #00d084;
  --pink: #ff4d9e;
}
```

## 🌐 Pages

### Homepage (`index.html`)
- Hero section with value proposition
- Target audience showcase
- Core tools presentation
- Pricing information
- Call-to-action sections

### About Page (`about.html`)
- Company mission and values
- Founder profile (Clint Day)
- Company journey timeline
- Team information

### Tools Page (`tools.html`)
- Comprehensive tool catalog
- Feature comparisons
- Pricing information
- Key benefits showcase

## 🚀 Getting Started

### Prerequisites
- Modern web browser
- Local web server (optional, for development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aiAuto
```

2. Open the project in your favorite code editor

3. For local development, use a simple web server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if installed)
npx serve .

# Using PHP
php -S localhost:8000
```

4. Open `http://localhost:8000` in your browser

## 📱 Responsive Design

The website is fully responsive with breakpoints at:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🌙 Dark Mode

Dark mode is implemented using CSS variables and can be toggled through the navigation menu. The preference is saved to localStorage and persists across sessions.

## ♿ Accessibility

The project follows WCAG 2.1 guidelines:
- Semantic HTML5 structure
- Proper heading hierarchy
- Keyboard navigation support
- ARIA labels where needed
- Sufficient color contrast
- Focus indicators

## 🔧 Development

### Code Style
- Use semantic HTML5 elements
- Follow BEM-like naming convention for CSS classes
- Write clean, maintainable JavaScript
- Use CSS variables for theming

### Testing
- Test across multiple browsers
- Verify responsive design
- Check accessibility with screen readers
- Validate HTML and CSS

## 📈 Performance

- Optimized images and assets
- Minimal external dependencies
- Efficient CSS with variables
- Lazy loading for images (future enhancement)

## 🚀 Deployment

### Static Hosting
The project can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Firebase Hosting

### Build Process
Currently, the project uses vanilla HTML/CSS/JS with no build step. Future enhancements may include:
- CSS minification
- JavaScript bundling
- Image optimization
- Critical CSS inlining

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary and all rights are reserved.

## 📞 Contact

- Website: [Ai-Auto](https://ai-auto.com)
- Email: contact@ai-auto.com

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Basic website structure
- [x] Responsive design
- [x] Dark mode support
- [x] Core content pages

### Phase 2 (In Progress)
- [ ] CSS architecture improvements
- [ ] JavaScript functionality enhancements
- [ ] Accessibility improvements
- [ ] Performance optimizations

### Phase 3 (Future)
- [ ] User authentication system
- [ ] Tool integration
- [ ] Payment processing
- [ ] Analytics dashboard
- [ ] API development

## 📊 Analytics

Future implementation will include:
- User behavior tracking
- Tool usage analytics
- Performance monitoring
- Conversion tracking

---

**Built with ❤️ by the Ai-Auto team**