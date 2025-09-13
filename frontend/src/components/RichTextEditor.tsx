'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your content here...",
  height = 400,
  disabled = false,
  className = ""
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* @ts-expect-error TinyMCE Editor component has TypeScript definition issues */}
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}    
        onInit={(evt: any, editor: any) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        disabled={disabled}
        init={{
          height: height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
            'math', 'katex', 'asciimath', 'tex', 'latex'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic underline strikethrough | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | math | katex | asciimath | tex | latex | ' +
            'link image media table | code fullscreen preview | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.6; }',
          
          // Math configuration
          math_type_latex: true,
          math_type_tex: true,
          math_type_mml: true,
          math_type_asciimath: true,
          math_type_mathml: true,
          math_type_svg: true,
          math_type_png: true,
          math_type_gif: true,
          math_type_webp: true,
          math_type_mathjax: true,
          math_type_katex: true,
          math_type_mathquill: true,
          math_type_mathlive: true,
          
          // Math plugin settings
          math_tex: true,
          math_latex: true,
          math_asciimath: true,
          math_mathml: true,
          math_katex: true,
          math_mathjax: true,
          
          // Math toolbar
          math_toolbar: 'math | katex | asciimath | tex | latex',
          
          // Math dialog settings
          math_dialog: true,
          math_dialog_title: 'Insert Math Equation',
          math_dialog_width: 600,
          math_dialog_height: 400,
          
          // Math preview
          math_preview: true,
          math_preview_width: 200,
          math_preview_height: 100,
          
          // Math rendering
          math_render: 'katex',
          math_render_katex: true,
          math_render_mathjax: true,
          math_render_asciimath: true,
          math_render_tex: true,
          math_render_latex: true,
          math_render_mathml: true,
          
          // Math input methods
          math_input: 'katex',
          math_input_katex: true,
          math_input_mathjax: true,
          math_input_asciimath: true,
          math_input_tex: true,
          math_input_latex: true,
          math_input_mathml: true,
          
          // Math output formats
          math_output: 'html',
          math_output_html: true,
          math_output_svg: true,
          math_output_png: true,
          math_output_gif: true,
          math_output_webp: true,
          
          // Math settings
          math_settings: {
            katex: {
              throwOnError: false,
              errorColor: '#cc0000',
              macros: {
                "\\f": "#1f(#2)"
              }
            },
            mathjax: {
              tex2jax: {
                inlineMath: [['$','$'], ['\\(','\\)']],
                displayMath: [['$$','$$'], ['\\[','\\]']]
              }
            },
            asciimath: {
              delimiters: [['`','`']]
            }
          },
          
          // Placeholder
          placeholder: placeholder,
          
          // Other settings
          branding: false,
          promotion: false,
          resize: true,
          elementpath: false,
          statusbar: true,
          
          // Image settings
          images_upload_handler: async (blobInfo: any) => {
            // You can implement image upload here
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve(reader.result as string);
              };
              reader.readAsDataURL(blobInfo.blob());
            });
          },
          
          // Table settings
          table_default_attributes: {
            border: '1'
          },
          table_default_styles: {
            'border-collapse': 'collapse',
            'width': '100%'
          },
          
          // Link settings
          link_default_target: '_blank',
          link_default_protocol: 'https',
          
          // Media settings
          media_live_embeds: true,
          
          // Code settings
          codesample_languages: [
            { text: 'HTML/XML', value: 'markup' },
            { text: 'JavaScript', value: 'javascript' },
            { text: 'CSS', value: 'css' },
            { text: 'PHP', value: 'php' },
            { text: 'Python', value: 'python' },
            { text: 'Java', value: 'java' },
            { text: 'C++', value: 'cpp' },
            { text: 'C#', value: 'csharp' },
            { text: 'SQL', value: 'sql' },
            { text: 'LaTeX', value: 'latex' }
          ],
          
          // Accessibility
          accessibility_focus: true,
          accessibility_warnings: true,
          
          // Mobile
          mobile: {
            theme: 'mobile',
            plugins: ['autosave', 'lists', 'autolink'],
            toolbar: ['undo', 'bold', 'italic', 'styleselect']
          }
        }}
      />
    </div>
  );
}
