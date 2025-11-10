'use client';

import { useEffect, useRef } from 'react';
import parse from 'html-react-parser';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cleanLatex } from '@/utils/textCleaner';

interface LatexContentDisplayProps {
  content: string;
  className?: string;
}

export default function LatexContentDisplay({ content, className = '' }: LatexContentDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse LaTeX blocks from content
  const parseLatexBlocks = (content: string) => {
    const blocks: Array<{ id: string; latex: string; start: number; end: number; type: 'inline' | 'display' }> = [];
    
    // Support multiple LaTeX delimiters (order matters - check display math before inline):
    // 1. \[ ... \] for display math
    // 2. \( ... \) for inline math
    // 3. $$ ... $$ for display math
    // 4. $ ... $ for inline math
    
    const patterns = [
      { regex: /\\\[([^\]]+)\\\]/g, type: 'display' as const },    // \[ ... \]
      { regex: /\\\((.+?)\\\)/g, type: 'inline' as const },        // \( ... \)
      { regex: /\$\$(.+?)\$\$/g, type: 'display' as const },       // $$ ... $$
      { regex: /\$(.+?)\$/g, type: 'inline' as const },            // $ ... $
    ];
    
    patterns.forEach(({ regex, type }) => {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);
      
      while ((match = regexCopy.exec(content)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;
        
        // Check if this range overlaps with existing blocks
        const overlaps = blocks.some(block => 
          (start >= block.start && start < block.end) ||
          (end > block.start && end <= block.end) ||
          (start <= block.start && end >= block.end)
        );
        
        if (!overlaps) {
          // Unescape LaTeX content (convert \\ to \)
          const unescapedLatex = match[1].replace(/\\\\/g, '\\');
          blocks.push({
            id: `${type}-${match.index}`,
            latex: unescapedLatex,
            start,
            end,
            type
          });
        }
      }
    });
    
    return blocks.sort((a, b) => a.start - b.start);
  };

  // Render LaTeX content to HTML
  const renderLatexContent = (content: string): string => {
    const blocks = parseLatexBlocks(content);
    let html = content;
    let offset = 0;
    
    blocks.forEach(block => {
      // Clean the LaTeX content before rendering
      const cleanedLatex = cleanLatex(block.latex);
      
      try {
        const rendered = katex.renderToString(cleanedLatex, {
          throwOnError: false,
          displayMode: block.type === 'display',
          strict: false,
          trust: true,
          macros: {
            "\\xrightarrow": "\\stackrel{#1}{\\rightarrow}",
            "\\xleftarrow": "\\stackrel{#1}{\\leftarrow}",
            "\\xleftrightarrow": "\\stackrel{#1}{\\leftrightarrow}",
            "\\xRightarrow": "\\stackrel{#1}{\\Rightarrow}",
            "\\xLeftarrow": "\\stackrel{#1}{\\Leftarrow}",
            "\\xLeftrightarrow": "\\stackrel{#1}{\\Leftrightarrow}",
            "\\xhookrightarrow": "\\stackrel{#1}{\\hookrightarrow}",
            "\\xhookleftarrow": "\\stackrel{#1}{\\hookleftarrow}",
            "\\xrightharpoonup": "\\stackrel{#1}{\\rightharpoonup}",
            "\\xrightharpoondown": "\\stackrel{#1}{\\rightharpoondown}",
            "\\xleftharpoonup": "\\stackrel{#1}{\\leftharpoonup}",
            "\\xleftharpoondown": "\\stackrel{#1}{\\leftharpoondown}",
            "\\xrightleftharpoons": "\\stackrel{#1}{\\rightleftharpoons}",
            "\\xleftrightharpoons": "\\stackrel{#1}{\\leftrightharpoons}",
            "\\xmapsto": "\\stackrel{#1}{\\mapsto}",
            "\\xlongequal": "\\stackrel{#1}{=}",
            "\\xlongleftarrow": "\\stackrel{#1}{\\longleftarrow}",
            "\\xlongrightarrow": "\\stackrel{#1}{\\longrightarrow}",
            "\\xlongleftrightarrow": "\\stackrel{#1}{\\longleftrightarrow}",
            "\\xLongleftarrow": "\\stackrel{#1}{\\Longleftarrow}",
            "\\xLongrightarrow": "\\stackrel{#1}{\\Longrightarrow}",
            "\\xLongleftrightarrow": "\\stackrel{#1}{\\Longleftrightarrow}",
            "\\xlongmapsto": "\\stackrel{#1}{\\longmapsto}",
            "\\substack": "\\begin{array}{c}#1\\end{array}",
            "\\underset": "\\mathop{#2}\\limits_{#1}",
            "\\overset": "\\mathop{#2}\\limits^{#1}",
            
            // Common LaTeX fixes
            "\\rac": "\\frac",
            "\\R": "\\mathbb{R}",
            "\\N": "\\mathbb{N}",
            "\\Z": "\\mathbb{Z}",
            "\\Q": "\\mathbb{Q}",
            "\\C": "\\mathbb{C}"
          }
        });
        
        const before = html.substring(0, block.start + offset);
        const after = html.substring(block.end + offset);
        const replacement = `<span class="math-${block.type}" data-latex="${block.latex}">${rendered}</span>`;
        
        html = before + replacement + after;
        offset += replacement.length - (block.end - block.start);
      } catch (error) {
        console.warn('LaTeX rendering error for:', block.latex, 'Cleaned:', cleanedLatex, error);
        // Keep original LaTeX if rendering fails
      }
    });
    
    return html;
  };

  // Convert LaTeX environments to HTML
  const convertLatexEnvironments = (content: string): string => {
    let processed = content;
    
    // Handle \begin{center}...\end{center}
    processed = processed.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (match, innerContent) => {
      // Process inner content (handle newlines and LaTeX)
      const processedInner = innerContent
        .replace(/\\n/g, '\n')
        .replace(/\n/g, '<br><div class="line-spacer"></div>');
      return `<div style="text-align: center; margin: 1rem 0;">${processedInner}</div>`;
    });
    
    // Handle \begin{tabular}...\end{tabular}
    processed = processed.replace(/\\begin\{tabular\}\{([^}]+)\}([\s\S]*?)\\end\{tabular\}/g, (match, columnSpec, tableContent) => {
      // Parse column specification to determine if borders are needed
      const hasBorders = columnSpec.includes('|');
      const numColumns = (columnSpec.match(/\|/g) || []).length + 1;
      
      // Parse table content - handle \hline, \multicolumn, and split by \\ (row separator)
      let cleanContent = tableContent.trim();
      
      // Convert literal \n to actual newlines first
      cleanContent = cleanContent.replace(/\\n/g, '\n');
      
      // Parse rows - split by \\ but preserve \hline information
      // Strategy: first identify hline positions, then parse rows
      const rowsWithHlines: Array<{ content: string; hasHlineBefore: boolean; hasHlineAfter: boolean }> = [];
      
      // First, identify all hline positions by splitting content
      // Split by \\ to get potential rows, including standalone \hline
      const parts = cleanContent.split(/\\\\/);
      
      parts.forEach((part: string, partIndex: number) => {
        const trimmedPart = part.trim();
        
        // Skip empty parts
        if (!trimmedPart) return;
        
        // Check if this part is just \hline (standalone)
        if (trimmedPart === '\\hline' || trimmedPart.match(/^\\hline\s*$/)) {
          // This is a standalone hline - mark previous row as having hline after
          if (rowsWithHlines.length > 0) {
            rowsWithHlines[rowsWithHlines.length - 1].hasHlineAfter = true;
          }
          // Mark next row as having hline before (will be set when we process next part)
          return;
        }
        
        // This is a regular row - check for hline before/after
        let hasHlineBefore = false;
        let hasHlineAfter = false;
        let rowContent = trimmedPart;
        
        // Check if previous part was just \hline
        if (partIndex > 0) {
          const prevPart = parts[partIndex - 1].trim();
          if (prevPart === '\\hline' || prevPart.match(/^\\hline\s*$/)) {
            hasHlineBefore = true;
          }
        }
        
        // Check if row starts with \hline
        if (rowContent.startsWith('\\hline')) {
          hasHlineBefore = true;
          rowContent = rowContent.replace(/^\\hline\s*/, '');
        }
        
        // Check if row ends with \hline
        if (rowContent.endsWith('\\hline')) {
          hasHlineAfter = true;
          rowContent = rowContent.replace(/\s*\\hline$/, '');
        }
        
        // Check if next part is just \hline
        if (partIndex < parts.length - 1) {
          const nextPart = parts[partIndex + 1].trim();
          if (nextPart === '\\hline' || nextPart.match(/^\\hline\s*$/)) {
            hasHlineAfter = true;
          }
        }
        
        // Remove any remaining \hline commands from the content
        rowContent = rowContent.replace(/\\hline/g, '').trim();
        
        if (rowContent.length > 0) {
          rowsWithHlines.push({
            content: rowContent,
            hasHlineBefore,
            hasHlineAfter
          });
        }
      });
      
      // If no rows found, try simpler parsing
      if (rowsWithHlines.length === 0) {
        const simpleRows = cleanContent.split(/\\\\/).map((r: string) => r.trim()).filter((r: string) => r.length > 0);
        simpleRows.forEach((row: string) => {
          const cleanRow = row.replace(/\\hline/g, '').trim();
          if (cleanRow.length > 0) {
            rowsWithHlines.push({
              content: cleanRow,
              hasHlineBefore: false,
              hasHlineAfter: false
            });
          }
        });
      }
      
      // Parse each row to handle \multicolumn and regular cells
      interface Cell {
        content: string;
        colspan: number;
        align?: string;
      }
      
      const parsedRows: Array<{ cells: Cell[]; hasHlineBefore: boolean; hasHlineAfter: boolean }> = [];
      
      rowsWithHlines.forEach((rowData) => {
        const cells: Cell[] = [];
        let remainingRow = rowData.content;
        
        // Replace multicolumn commands with placeholders, then parse normally
        const multicolPlaceholders: Map<string, { content: string; colspan: number; align: string }> = new Map();
        let placeholderIndex = 0;
        
        // Find all multicolumn commands first (collect all matches)
        const multicolRegex = /\\multicolumn\{(\d+)\}\{([^}]+)\}\{([^}]+)\}/g;
        const multicolMatches: Array<{ match: RegExpMatchArray; placeholder: string; data: { content: string; colspan: number; align: string } }> = [];
        
        let regexMatch;
        while ((regexMatch = multicolRegex.exec(remainingRow)) !== null) {
          const placeholder = `__MULTICOL_PLACEHOLDER_${placeholderIndex}__`;
          const colspan = parseInt(regexMatch[1]);
          const align = regexMatch[2].includes('c') ? 'center' : 
                       regexMatch[2].includes('r') ? 'right' : 'left';
          const content = regexMatch[3].trim().replace(/\s+/g, ' ');
          
          multicolMatches.push({
            match: regexMatch,
            placeholder: placeholder,
            data: { content, colspan, align }
          });
          
          multicolPlaceholders.set(placeholder, { content, colspan, align });
          placeholderIndex++;
        }
        
        // Replace matches in reverse order (from end to start) to preserve indices
        multicolMatches.reverse().forEach(({ match, placeholder }) => {
          remainingRow = remainingRow.substring(0, match.index!) + 
                        placeholder + 
                        remainingRow.substring(match.index! + match[0].length);
        });
        
        // Now split by & to get cells
        const cellStrings = remainingRow.split('&').map(c => c.trim().replace(/\s+/g, ' '));
        
        // Process each cell string
        cellStrings.forEach(cellStr => {
          if (!cellStr) return;
          
          // Check if this is a multicolumn placeholder
          if (cellStr.startsWith('__MULTICOL_PLACEHOLDER_') && cellStr.endsWith('__')) {
            const multicolData = multicolPlaceholders.get(cellStr);
            if (multicolData) {
              cells.push({
                content: multicolData.content,
                colspan: multicolData.colspan,
                align: multicolData.align
              });
            }
          } else {
            // Regular cell
            cells.push({
              content: cellStr,
              colspan: 1
            });
          }
        });
        
        if (cells.length > 0) {
          parsedRows.push({
            cells,
            hasHlineBefore: rowData.hasHlineBefore,
            hasHlineAfter: rowData.hasHlineAfter
          });
        }
      });
      
      // Build HTML table with proper styling
      const borderStyle = hasBorders ? 'border-collapse: collapse; border: 1px solid #000;' : '';
      const cellBorderStyle = hasBorders ? 'border: 1px solid #000; padding: 8px;' : 'padding: 8px;';
      
      let tableHtml = `<table class="latex-table" style="${borderStyle} margin: 1rem 0;">`;
      
      parsedRows.forEach((row, rowIndex) => {
        // Add top border if hline before
        const topBorder = row.hasHlineBefore ? 'border-top: 2px solid #000;' : '';
        const bottomBorder = row.hasHlineAfter ? 'border-bottom: 2px solid #000;' : '';
        
        tableHtml += `<tr style="${topBorder} ${bottomBorder}">`;
        
        row.cells.forEach((cell, cellIndex) => {
          const alignStyle = cell.align ? `text-align: ${cell.align};` : '';
          const cellStyle = `${cellBorderStyle} ${alignStyle}`;
          const cellTag = cell.colspan > 1 ? `<td colspan="${cell.colspan}" style="${cellStyle}">` : `<td style="${cellStyle}">`;
          tableHtml += `${cellTag}${cell.content}</td>`;
        });
        
        tableHtml += '</tr>';
      });
      
      tableHtml += '</table>';
      
      return tableHtml;
    });
    
    return processed;
  };

  // Process content to handle both HTML and LaTeX
  const processContent = (content: string) => {
    // First convert LaTeX environments to HTML (before processing newlines)
    let processed = convertLatexEnvironments(content);
    
    // Then convert literal \n strings (backslash followed by n) to actual newlines
    // But only outside of already processed HTML blocks
    // We need to be careful not to break HTML we just created
    processed = processed.replace(/\\n/g, '\n');
    
    // Convert newlines to <br> tags with spacing divs, but skip if already inside HTML tags
    // Use a more careful approach: only replace newlines that are not inside HTML tags or table cells
    processed = processed.replace(/\n/g, (match, offset, string) => {
      // Check if we're inside an HTML tag
      const before = string.substring(0, offset);
      const after = string.substring(offset);
      
      // Check if we're inside a table cell (<td> or <th>)
      const lastTdOpen = before.lastIndexOf('<td');
      const lastTdClose = before.lastIndexOf('</td>');
      const lastThOpen = before.lastIndexOf('<th');
      const lastThClose = before.lastIndexOf('</th>');
      
      // If we're inside a table cell, don't replace
      if ((lastTdOpen > lastTdClose) || (lastThOpen > lastThClose)) {
        return match;
      }
      
      // Check if we're inside any other HTML tag
      const openTags = (before.match(/<[^>]*>/g) || []).length;
      const closeTags = (before.match(/<\/[^>]*>/g) || []).length;
      
      // If we're inside an HTML tag, don't replace
      if (openTags > closeTags) {
        return match;
      }
      
      return '<br><div class="line-spacer"></div>';
    });
    
    // Then render LaTeX expressions
    const latexRendered = renderLatexContent(processed);
    
    // Then process any remaining HTML
    return latexRendered;
  };

  // Ensure content is a string
  const contentString = typeof content === 'string' ? content : String(content || '');
  
  // Parse HTML content and render it safely
  const parsedContent = parse(processContent(contentString), {
    replace: (domNode: any) => {
      // Handle any special cases if needed
      return domNode;
    }
  });

  return (
    <div 
      ref={containerRef}
      className={`latex-content-display ${className}`}
    >
      {parsedContent}
    </div>
  );
}

// Helper component for displaying question stem
export function LatexQuestionStem({ stem, className = '' }: { stem: string; className?: string }) {
  return (
    <LatexContentDisplay 
      content={stem} 
      className={`text-lg text-gray-900 leading-relaxed mb-4 ${className}`}
    />
  );
}

// Helper component for displaying explanations
export function LatexQuestionExplanation({ explanation, className = '' }: { explanation: string; className?: string }) {
  return (
    <LatexContentDisplay 
      content={explanation} 
      className={`text-sm text-green-700 leading-relaxed ${className}`}
    />
  );
}

// Helper component for displaying tips and formulas
export function LatexQuestionTips({ tipFormula, className = '' }: { tipFormula: string; className?: string }) {
  return (
    <LatexContentDisplay 
      content={tipFormula} 
      className={`text-sm text-yellow-700 leading-relaxed ${className}`}
    />
  );
}

// Helper component for displaying options with LaTeX support
export function LatexQuestionOption({ 
  option, 
  index, 
  showCorrect = false,
  className = '' 
}: { 
  option: { text: string; isCorrect: boolean; order?: number };
  index: number;
  showCorrect?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-start ${className}`}>
      <span className={`w-6 h-6 border rounded mr-3 flex items-center justify-center text-sm flex-shrink-0 mt-1 ${
        showCorrect && option.isCorrect 
          ? 'border-green-500 bg-green-100 text-green-700 font-medium' 
          : 'border-gray-300'
      }`}>
        {String.fromCharCode(65 + (option.order || index))}
      </span>
      <div className={`flex-1 ${
        showCorrect && option.isCorrect 
          ? 'text-green-600 font-medium' 
          : 'text-gray-700'
      }`}>
        <LatexContentDisplay content={option.text} />
      </div>
    </div>
  );
}



