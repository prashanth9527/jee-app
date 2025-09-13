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

export default function SummernoteEditor({ 
  value, 
  onChange, 
  placeholder = "Enter your content here...",
  height = 400,
  disabled = false,
  className = ""
}: SummernoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load required scripts
  useEffect(() => {
    const loadScripts = async () => {
      try {
        console.log('Starting to load Summernote scripts...');
        
        // Load jQuery if not already loaded
        if (!window.$) {
          console.log('Loading jQuery...');
          await loadScript('https://code.jquery.com/jquery-3.6.0.min.js');
          console.log('jQuery loaded successfully');
        } else {
          console.log('jQuery already loaded');
        }

        // Load Summernote CSS
        if (!document.querySelector('link[href*="summernote"]')) {
          console.log('Loading Summernote CSS...');
          const summernoteCSS = document.createElement('link');
          summernoteCSS.rel = 'stylesheet';
          summernoteCSS.href = 'https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.css';
          document.head.appendChild(summernoteCSS);
          console.log('Summernote CSS loaded');
        } else {
          console.log('Summernote CSS already loaded');
        }

        // Load Summernote JS
        if (!window.$?.fn?.summernote) {
          console.log('Loading Summernote JS...');
          await loadScript('https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.js');
          console.log('Summernote JS loaded successfully');
        } else {
          console.log('Summernote JS already loaded');
        }

        // Load KaTeX for math rendering
        if (!window.katex) {
          console.log('Loading KaTeX...');
          await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js');
          const katexCSS = document.createElement('link');
          katexCSS.rel = 'stylesheet';
          katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
          document.head.appendChild(katexCSS);
          console.log('KaTeX loaded successfully');
        } else {
          console.log('KaTeX already loaded');
        }

        // Verify all required libraries are loaded
        if (window.$ && window.$.fn && window.$.fn.summernote) {
          console.log('All scripts loaded successfully, setting isLoaded to true');
          setIsLoaded(true);
        } else {
          console.error('Failed to load required libraries');
          throw new Error('Required libraries not loaded');
        }
      } catch (error) {
        console.error('Error loading Summernote scripts:', error);
        // Still try to set loaded to true after a delay to show error state
        setTimeout(() => {
          setIsLoaded(true);
        }, 3000);
      }
    };

    loadScripts();
  }, []);

  // Initialize Summernote editor
  useEffect(() => {
    if (isLoaded && editorRef.current && !isInitialized) {
      try {
        console.log('Initializing Summernote editor...');
        const $ = window.$;
        
        if (!$ || !$.fn || !$.fn.summernote) {
          console.error('jQuery or Summernote not available');
          return;
        }

        // Configure MathJax
        if (window.MathJax) {
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\(', '\\)']],
              displayMath: [['$$', '$$'], ['\\[', '\\]']],
              processEscapes: true,
              processEnvironments: true
            },
            options: {
              skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            }
          };
        }

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
          popover: {
            image: [
              ['image', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
              ['float', ['floatLeft', 'floatRight', 'floatNone']],
              ['remove', ['removeMedia']]
            ],
            link: [
              ['link', ['linkDialogShow', 'unlink']]
            ],
            table: [
              ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
              ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
            ],
            air: [
              ['color', ['color']],
              ['font', ['bold', 'underline', 'clear']]
            ]
          },
          callbacks: {
            onChange: (contents: string) => {
              onChange(contents);
            },
            onInit: () => {
              console.log('Summernote initialized successfully');
              // Add custom math button
              addMathButton();
              setIsInitialized(true);
            }
          }
        });

        // Set initial value
        if (value) {
          $(editorRef.current).summernote('code', value);
        }

      } catch (error) {
        console.error('Error initializing Summernote:', error);
        // Set initialized to true even on error to prevent infinite loading
        setIsInitialized(true);
      }
    }
  }, [isLoaded, height, placeholder, disabled, value]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (isInitialized && editorRef.current && value !== undefined) {
      const $ = window.$;
      const currentContent = $(editorRef.current).summernote('code');
      if (currentContent !== value) {
        $(editorRef.current).summernote('code', value);
      }
    }
  }, [value, isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized && editorRef.current) {
        try {
          const $ = window.$;
          $(editorRef.current).summernote('destroy');
        } catch (error) {
          console.error('Error destroying Summernote:', error);
        }
      }
    };
  }, [isInitialized]);

  const addMathButton = () => {
    if (!editorRef.current) return;

    const $ = window.$;
    const editor = $(editorRef.current);
    
    // Add custom math button to toolbar
    const mathButton = $(`
      <button type="button" class="btn btn-default btn-sm" data-toggle="tooltip" title="Insert Math Equation">
        <i class="fa fa-calculator"></i> Math
      </button>
    `);

    mathButton.on('click', () => {
      showMathDialog();
    });

    // Insert math button into toolbar
    const toolbar = editor.siblings('.note-toolbar');
    const mathGroup = $('<div class="note-btn-group"></div>').append(mathButton);
    toolbar.find('.note-btn-group').last().after(mathGroup);
  };

  const showMathDialog = () => {
    const $ = window.$;
    
    // Create math dialog
    const mathDialog = $(`
      <div class="modal fade" id="mathDialog" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
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
                  <button type="button" class="btn btn-outline-secondary btn-sm" data-math="\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1">Limit</button>
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

    // Remove existing dialog if any
    $('#mathDialog').remove();
    $('body').append(mathDialog);

    // Update preview function
    const updateMathPreview = () => {
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
          } else if (window.MathJax) {
            preview.html(`$$${mathInput}$$`);
            window.MathJax.typesetPromise([preview[0]]);
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

    // Show dialog
    $('#mathDialog').modal('show');

    // Handle quick insert buttons
    $('#mathDialog').on('click', '[data-math]', function(this: HTMLElement) {
      const math = $(this).data('math');
      $('#mathInput').val(math);
      updateMathPreview();
    });

    // Handle input changes
    $('#mathInput').on('input', updateMathPreview);

    // Handle insert button
    $('#insertMath').on('click', () => {
      const mathInput = $('#mathInput').val() as string;
      if (mathInput.trim()) {
        insertMathEquation(mathInput);
        $('#mathDialog').modal('hide');
      }
    });

    // Initial preview update
    updateMathPreview();
  };

  const insertMathEquation = (latex: string) => {
    if (!editorRef.current) return;

    const $ = window.$;
    const editor = $(editorRef.current);
    
    // Create math element
    const mathElement = $(`<span class="math-equation" data-latex="${latex}">$$${latex}$$</span>`);
    
    // Insert into editor
    editor.summernote('insertNode', mathElement[0]);
    
    // Trigger change event
    editor.summernote('triggerChange');
  };

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  if (!isLoaded) {
    return (
      <div className={`summernote-editor-loading ${className}`}>
        <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading Summernote Editor...</p>
            <p className="text-sm text-gray-500 mt-1">Loading jQuery, Summernote, and math libraries</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoaded && !isInitialized) {
    return (
      <div className={`summernote-editor-initializing ${className}`}>
        <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Initializing Editor...</p>
            <p className="text-sm text-gray-500 mt-1">Setting up Summernote with math support</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`summernote-editor ${className}`}>
      <div ref={editorRef}></div>
      
      {/* Custom styles for math equations */}
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
        
        .note-editor .math-equation {
          background-color: #e3f2fd;
          border-color: #2196f3;
        }
        
        .note-editor .math-equation:hover {
          background-color: #bbdefb;
        }
        
        /* Summernote customizations */
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
        
        /* Math preview styles */
        .math-preview {
          min-height: 60px;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 1rem;
          background-color: #f9fafb;
        }
        
        /* Modal styles */
        .modal-content {
          border-radius: 0.5rem;
          border: none;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
          border-radius: 0.5rem 0.5rem 0 0;
        }
        
        .modal-footer {
          border-top: 1px solid #e5e7eb;
          background-color: #f9fafb;
          border-radius: 0 0 0.5rem 0.5rem;
        }
      `}</style>
    </div>
  );
}
