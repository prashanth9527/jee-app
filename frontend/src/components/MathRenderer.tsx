'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    MathJax: any;
  }
}

export default function MathRenderer() {
  useEffect(() => {
    // Configure MathJax
    if (typeof window !== 'undefined') {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          processEscapes: true,
          processEnvironments: true,
          packages: {
            '[+]': ['ams', 'newcommand', 'configmacros']
          }
        },
        options: {
          ignoreHtmlClass: 'tex2jax_ignore',
          processHtmlClass: 'tex2jax_process|question-content'
        },
        startup: {
          ready: () => {
            console.log('MathJax is loaded and ready');
            window.MathJax.startup.defaultReady();
          }
        }
      };
    }
  }, []);

  return (
    <>
      {/* Load MathJax */}
      <Script
        id="mathjax-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true,
                packages: {
                  '[+]': ['ams', 'newcommand', 'configmacros']
                }
              },
              options: {
                ignoreHtmlClass: 'tex2jax_ignore',
                processHtmlClass: 'tex2jax_process|question-content'
              },
              startup: {
                ready: function() {
                  console.log('MathJax is loaded and ready');
                  MathJax.startup.defaultReady();
                }
              }
            };
          `
        }}
      />
      <Script
        src="https://polyfill.io/v3/polyfill.min.js?features=es6"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('MathJax script loaded');
        }}
      />
    </>
  );
}