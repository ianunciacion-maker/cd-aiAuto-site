# Development Guide

This guide covers the development workflow, tools, and best practices for the Ai-Auto project.

## Prerequisites

- Node.js 16+ and npm 8+
- Modern web browser with ES6+ support
- Git for version control
- Code editor (VS Code recommended)

## Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd aiAuto
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

This will start a live server at `http://localhost:8000` with auto-reload.

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with live reload
- `npm run build` - Build production assets
- `npm run watch` - Watch for changes and rebuild
- `npm run test` - Run linting and validation
- `npm run lint-css` - Lint CSS files
- `npm run lint-js` - Lint JavaScript files
- `npm run validate-html` - Validate HTML files

## Code Quality Tools

### ESLint
JavaScript files are linted using ESLint with the configuration in `.eslintrc.json`.

**Key rules:**
- Use `const`/`let` instead of `var`
- Prefer arrow functions
- Single quotes for strings
- 2-space indentation
- Maximum line length of 100 characters

### Stylelint
CSS files are linted using Stylelint with the configuration in `.stylelintrc.json`.

**Key rules:**
- 2-space indentation
- Single quotes for strings
- Kebab-case for custom properties
- Lowercase for selectors

### HTML Validation
HTML files are validated using html-validate to ensure:
- Proper semantic structure
- Accessibility compliance
- Valid markup

## Development Workflow

### 1. Feature Development
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test thoroughly across browsers
4. Run linting: `npm run test`
5. Commit changes: `git commit -m "feat: add new feature"`
6. Push branch: `git push origin feature/your-feature-name`

### 2. Code Review Process
1. Create pull request
2. Ensure all checks pass
3. Address review feedback
4. Merge to main branch

### 3. Testing
- **Manual Testing**: Test all interactive elements
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Responsive Testing**: Mobile, tablet, desktop
- **Accessibility Testing**: Screen readers, keyboard navigation

## File Organization

### CSS Structure
```
css/
├── base/           # Base styles, variables, reset
├── components/      # Reusable UI components
├── layout/          # Layout-specific styles
├── pages/           # Page-specific styles
├── themes/          # Theme variations
└── utilities/       # Utility classes and helpers
```

### JavaScript Structure
```
js/
├── components/      # UI components
├── modules/         # Feature modules
├── utils/           # Utility functions
└── main.js         # Entry point
```

## Coding Standards

### CSS
- Use CSS custom properties (variables) for theming
- Follow BEM-like naming convention
- Mobile-first responsive design
- Use logical properties (margin-inline, etc.)
- Minimize specificity

### JavaScript
- Use ES6+ features
- Modular architecture with imports/exports
- Async/await for asynchronous operations
- Event delegation for dynamic content
- Error handling with try/catch

### HTML
- Semantic HTML5 elements
- Proper heading hierarchy
- Alt text for images
- ARIA labels where needed
- Form labels and validation

## Performance Guidelines

### CSS
- Minimize reflows and repaints
- Use `transform` and `opacity` for animations
- Avoid `!important`
- Optimize selectors
- Use CSS containment where appropriate

### JavaScript
- Lazy load non-critical resources
- Debounce scroll/resize events
- Use Intersection Observer for scroll animations
- Minimize DOM manipulation
- Use requestAnimationFrame for animations

### Images
- Use WebP format with fallbacks
- Implement lazy loading
- Provide responsive image sets
- Optimize file sizes

## Browser Support

- **Modern browsers**: Full feature support
- **IE11**: Basic functionality (no animations)
- **Mobile**: Touch-optimized interactions

## Debugging

### CSS Debugging
- Use browser dev tools
- Check computed styles
- Test with different viewport sizes
- Verify color contrast

### JavaScript Debugging
- Use browser console
- Set breakpoints
- Network tab for API calls
- Performance tab for profiling

## Git Workflow

### Branch Naming
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Urgent fixes
- `docs/update-docs` - Documentation updates

### Commit Messages
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Maintenance tasks

### Example
```bash
feat: add dark mode toggle
fix: resolve mobile menu z-index issue
docs: update development guide
```

## Deployment

### Staging
1. Build assets: `npm run build`
2. Deploy to staging server
3. Run smoke tests
4. Get approval for production

### Production
1. Merge main branch
2. Create release tag
3. Deploy to production
4. Monitor performance

## Troubleshooting

### Common Issues

**Build fails**
- Check for syntax errors
- Verify all dependencies installed
- Clear node_modules and reinstall

**Styles not loading**
- Check file paths
- Verify CSS imports
- Clear browser cache

**JavaScript errors**
- Check browser console
- Verify module imports
- Test in different browsers

**Performance issues**
- Check network tab for large files
- Profile JavaScript execution
- Optimize images and assets

### Getting Help

1. Check existing documentation
2. Search issue tracker
3. Ask in team channels
4. Create detailed bug report

## Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS Tricks](https://css-tricks.com/)
- [JavaScript.info](https://javascript.info/)
- [Web.dev](https://web.dev/)
- [A11y Project](https://www.a11yproject.com/)