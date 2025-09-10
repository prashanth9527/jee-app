# LearnEazy Frontend - Quill.js Rich Text Editor Demo

This is a Next.js application featuring a fully functional Quill.js rich text editor demo.

## Features

- **Rich Text Editor**: Full-featured WYSIWYG editor with Quill.js
- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Preview**: See your content as HTML and rendered preview
- **Sample Content**: Load sample content to see the editor in action

## Editor Features

- Text formatting (bold, italic, underline, strikethrough)
- Headers (H1-H6) and text sizes
- Text and background colors
- Lists (ordered and unordered)
- Text alignment and indentation
- Links, images, and videos
- Code blocks and blockquotes
- Subscript and superscript
- Right-to-left text direction

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
frontend/
├── app/
│   ├── globals.css      # Global styles and Quill editor styles
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Main page with Quill editor
├── types/
│   └── react-quill.d.ts # TypeScript declarations for react-quill
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── next.config.js       # Next.js configuration
```

## Usage

1. **Load Sample Content**: Click the "Load Sample Content" button to see the editor with example content
2. **Edit Text**: Use the toolbar to format your text with various options
3. **Save Content**: Click "Save Content" to see the HTML output in the console
4. **Clear Editor**: Click "Clear Editor" to start fresh
5. **Preview**: See both the HTML source and rendered preview in the bottom panels

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Quill.js** - Rich text editor
- **React Quill** - React wrapper for Quill.js
- **Radix UI** - UI components (available in dependencies)

## Browser Support

The editor works in all modern browsers including:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
