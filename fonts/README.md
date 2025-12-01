# Fonts Directory

This directory contains local font files for the Ai-Auto project.

## Current Fonts

The project currently uses Google Fonts:
- **Playfair Display** - Headings (serif)
- **Inter** - Body text (sans-serif)

## Future Considerations

If self-hosting is needed:
- Download WOFF2 format for best compression
- Provide WOFF fallback for older browsers
- Include font-display: swap for performance
- Consider font subsetting to reduce file size

## File Organization

```
fonts/
├── playfair-display/
│   ├── playfair-display-regular.woff2
│   ├── playfair-display-bold.woff2
│   └── playfair-display-black.woff2
└── inter/
    ├── inter-regular.woff2
    ├── inter-medium.woff2
    ├── inter-semibold.woff2
    └── inter-bold.woff2
```

## Performance

- Use font-display: swap
- Preload critical fonts
- Consider font subsetting for reduced file size