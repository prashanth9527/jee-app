'use client';

import { useEffect, useRef, useState } from 'react';

interface SummernoteEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    $: any;
    jQuery: any;
    katex: any;
    MathJax: any;
  }
}

export default function SummernoteEditorSimple({ 
  value, 
  onChange, 
  placeholder = "Enter your content here...",
  height = 400,
  disabled = false,
  className = ""
}: SummernoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeEditor = async () => {
      try {
        // Check if scripts are already loaded
        if (window.$ && window.$.fn && window.$.fn.summernote) {
          console.log('Summernote already available');
          if (mounted) setIsReady(true);
          return;
        }

        // Load scripts sequentially
        await loadScript('https://code.jquery.com/jquery-3.6.0.min.js');
        console.log('jQuery loaded');

        // Load CSS
        if (!document.querySelector('link[href*="summernote"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.css';
          document.head.appendChild(link);
        }

        // Load Summernote
        await loadScript('https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.js');
        console.log('Summernote loaded');

        // Load KaTeX
        if (!window.katex) {
          await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js');
          const katexCSS = document.createElement('link');
          katexCSS.rel = 'stylesheet';
          katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
          document.head.appendChild(katexCSS);
        }

        if (mounted) {
          setIsReady(true);
          console.log('All scripts loaded successfully');
        }
      } catch (err) {
        console.error('Failed to load scripts:', err);
        if (mounted) {
          setError('Failed to load editor. Please refresh the page.');
        }
      }
    };

    initializeEditor();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isReady && editorRef.current) {
      try {
        const $ = window.$;
        
        // Initialize Summernote
        $(editorRef.current).summernote({
          height: height,
          placeholder: placeholder,
          disabled: disabled,
          toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['fullscreen', 'codeview', 'help']],
            ['math', ['math']]
          ],
          callbacks: {
            onChange: (contents: string) => {
              onChange(contents);
            },
            onInit: () => {
              console.log('Summernote initialized');
              addMathButton();
            }
          }
        });

        // Set initial value
        if (value) {
          $(editorRef.current).summernote('code', value);
        }

      } catch (err) {
        console.error('Failed to initialize Summernote:', err);
        setError('Failed to initialize editor');
      }
    }
  }, [isReady, height, placeholder, disabled, value]);

  const addMathButton = () => {
    if (!editorRef.current) return;

    const $ = window.$;
    const editor = $(editorRef.current);
    
    // Wait a bit for toolbar to be fully rendered
    setTimeout(() => {
      // Add math button to toolbar
      const mathButton = $(`
        <button type="button" class="btn btn-default btn-sm" title="Insert Math Equation" style="margin-left: 5px;">
          <i class="fa fa-calculator"></i> Math
        </button>
      `);

      mathButton.on('click', (e: any) => {
        e.preventDefault();
        showMathDialog();
      });

      // Insert into toolbar - try multiple selectors
      const toolbar = editor.siblings('.note-toolbar');
      if (toolbar.length > 0) {
        const mathGroup = $('<div class="note-btn-group"></div>').append(mathButton);
        const lastGroup = toolbar.find('.note-btn-group').last();
        if (lastGroup.length > 0) {
          lastGroup.after(mathGroup);
        } else {
          toolbar.append(mathGroup);
        }
        console.log('Math button added to toolbar');
      } else {
        console.log('Toolbar not found, trying alternative approach');
        // Alternative: add to the editor container
        const container = editor.parent();
        const customToolbar = $('<div class="custom-math-toolbar" style="padding: 5px; border-bottom: 1px solid #ddd;"></div>');
        customToolbar.append(mathButton);
        container.prepend(customToolbar);
      }
    }, 100);
  };

  const showMathDialog = () => {
    const $ = window.$;
    
    const mathDialog = $(`
      <div class="modal fade" id="mathDialog" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Insert Math Equation</h5>
              <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>LaTeX Equation:</label>
                <textarea id="mathInput" class="form-control" rows="4" placeholder="Enter LaTeX equation (e.g., \\frac{a}{b} = c)"></textarea>
              </div>
              <div class="form-group">
                <label>Preview:</label>
                <div id="mathPreview" class="border p-3 bg-light" style="min-height: 60px;"></div>
              </div>
              <div class="form-group">
                <label>Quick Insert:</label>
                <div class="btn-group-vertical w-100">
                  <button type="button" class="btn btn-outline-secondary btn-sm" data-math="\\frac{a}{b}">Fraction</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" data-math="x^2 + y^2 = r^2">Circle Equation</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" data-math="\\int_0^1 x^2 dx">Integral</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" data-math="\\sum_{i=1}^n x_i">Summation</button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="insertMath">Insert Math</button>
            </div>
          </div>
        </div>
      </div>
    `);

    // Define updatePreview function first
    const updatePreview = () => {
      const mathInput = $('#mathInput').val() as string;
      const preview = $('#mathPreview');
      
      if (mathInput.trim()) {
        try {
          if (window.katex) {
            const html = window.katex.renderToString(mathInput, {
              throwOnError: false,
              displayMode: true
            });
            preview.html(html);
          } else {
            preview.html(`<code>$$${mathInput}$$</code>`);
          }
        } catch (error) {
          preview.html('<span class="text-danger">Invalid LaTeX syntax</span>');
        }
      } else {
        preview.html('<span class="text-muted">Preview will appear here</span>');
      }
    };

    $('#mathDialog').remove();
    $('body').append(mathDialog);
    $('#mathDialog').modal('show');

    // Handle quick insert
    $('#mathDialog').on('click', '[data-math]', function(this: HTMLElement) {
      const math = $(this).data('math');
      $('#mathInput').val(math);
      updatePreview();
    });

    // Handle input
    $('#mathInput').on('input', updatePreview);

    // Handle insert
    $('#insertMath').on('click', () => {
      const mathInput = $('#mathInput').val() as string;
      if (mathInput.trim()) {
        insertMath(mathInput);
        $('#mathDialog').modal('hide');
      }
    });

    // Initial preview update
    updatePreview();
  };

  const insertMath = (latex: string) => {
    if (!editorRef.current) return;

    const $ = window.$;
    const editor = $(editorRef.current);
    
    const mathElement = $(`<span class="math-equation" data-latex="${latex}">$$${latex}$$</span>`);
    editor.summernote('insertNode', mathElement[0]);
    editor.summernote('triggerChange');
  };

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(script);
    });
  };

  if (error) {
    return (
      <div className={`summernote-editor-error ${className}`}>
        <div className="flex items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50">
          <div className="text-center">
            <div className="text-red-600 mb-2">⚠️</div>
            <p className="text-red-800 font-medium">Editor Error</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className={`summernote-editor-loading ${className}`}>
        <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading Summernote Editor...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we load the editor</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`summernote-editor ${className}`}>
      <div ref={editorRef}></div>
      
      <style jsx global>{`
        .math-equation {
          display: inline-block;
          margin: 0 2px;
          padding: 2px 4px;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 3px;
          font-family: 'Times New Roman', serif;
        }
        
        .note-editor {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }
        
        .note-toolbar {
          background-color: #f9fafb;
          border-bottom: 1px solid #d1d5db;
          border-radius: 0.375rem 0.375rem 0 0;
        }
        
        .note-editable {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
