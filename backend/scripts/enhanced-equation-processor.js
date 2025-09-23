/**
 * Enhanced Equation Processor for JEE Content
 * 
 * Targeted fixes for mathematical equation processing issues
 */

/**
 * Enhanced mathematical expression processor
 */
function enhancedMathToLaTeX(text) {
  if (!text) return '';
  
  let latex = text;
  
  // Step 1: Clean OCR artifacts that break mathematical notation
  latex = cleanOCRArtifacts(latex);
  
  // Step 2: Handle mathematical patterns in order of complexity
  latex = handleComplexFractions(latex);
  latex = handleSuperscriptsAndSubscripts(latex);
  latex = handleMatrixNotation(latex);
  latex = handleBinomialCoefficients(latex);
  latex = handleGreekLetters(latex);
  latex = handleMathematicalSymbols(latex);
  latex = handleFunctions(latex);
  latex = handleEquationStructures(latex);
  
  // Step 3: Wrap in LaTeX delimiters if not already wrapped
  if (!latex.includes('\\(') && !latex.includes('\\[')) {
    if (isMathematicalExpression(latex)) {
      latex = `\\(${latex}\\)`;
    }
  }
  
  return latex;
}

/**
 * Clean common OCR artifacts that break mathematical notation
 */
function cleanOCRArtifacts(text) {
  return text
    // Fix common OCR spacing issues in mathematical expressions
    .replace(/(\d+)\s*C\s*(\d+)/g, '\\binom{$1}{$2}')  // nCr notation
    .replace(/(\d+)\s*P\s*(\d+)/g, '{}^{$1}P_{$2}')  // nPr notation
    .replace(/x\s*\n\s*(\d+)/g, 'x^{$1}')            // x^n across lines
    .replace(/(\w+)\s*\n\s*(\d+)/g, '$1^{$2}')       // variable^power across lines
    .replace(/\n\s*(\d+)\s*\n/g, '^{$1}')            // isolated superscripts
    .replace(/(\d+)\s*\n\s*(\d+)/g, '$1^{$2}')       // number^power across lines
    // Fix fraction notation
    .replace(/(\d+)\s*\n\s*(\d+)\s*\n/g, '\\frac{$1}{$2}')  // fractions across lines
    .replace(/(\w+)\s*\n\s*(\w+)\s*\n/g, '\\frac{$1}{$2}')  // variable fractions
    // Fix mathematical operators
    .replace(/\s*\n\s*\+/g, ' + ')
    .replace(/\s*\n\s*\-/g, ' - ')
    .replace(/\s*\n\s*\=/g, ' = ')
    .replace(/\s*\n\s*\*/g, ' \\cdot ')
    // Clean up excessive whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Handle complex fractions including nested ones
 */
function handleComplexFractions(text) {
  let result = text;
  
  // Simple fractions: a/b
  result = result.replace(/(\w+|\d+)\/(\w+|\d+)/g, '\\frac{$1}{$2}');
  
  // Complex fractions with parentheses: (a+b)/(c+d)
  result = result.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');
  
  // Mixed fractions: a/(b+c)
  result = result.replace(/(\w+|\d+)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');
  
  // Fractions with powers: x^2/y^3
  result = result.replace(/(\w+\^?\{?\w*\}?)\/(\w+\^?\{?\w*\}?)/g, '\\frac{$1}{$2}');
  
  return result;
}

/**
 * Handle superscripts and subscripts properly
 */
function handleSuperscriptsAndSubscripts(text) {
  let result = text;
  
  // Powers: x^2, x^{2}, etc.
  result = result.replace(/(\w+)\^(\d+)/g, '$1^{$2}');
  result = result.replace(/(\w+)\^([a-zA-Z]+)/g, '$1^{$2}');
  
  // Subscripts: x_2, H_2O, etc.
  result = result.replace(/(\w+)_(\d+)/g, '$1_{$2}');
  result = result.replace(/(\w+)_([a-zA-Z]+)/g, '$1_{$2}');
  
  // Chemical formulas: H2O -> H_2O
  result = result.replace(/([A-Z][a-z]?)(\d+)(?![}])/g, '$1_{$2}');
  
  // Matrix inverses: A^-1, (AB)^-1
  result = result.replace(/(\w+)\^-1/g, '$1^{-1}');
  result = result.replace(/\(([^)]+)\)\^-1/g, '($1)^{-1}');
  
  return result;
}

/**
 * Handle matrix notation
 */
function handleMatrixNotation(text) {
  let result = text;
  
  // Determinant notation: |A|
  result = result.replace(/\|([A-Z])\|/g, '\\det($1)');
  
  // Trace notation: tr(A)
  result = result.replace(/\btr\(([^)]+)\)/g, '\\text{tr}($1)');
  result = result.replace(/\btrace\(([^)]+)\)/g, '\\text{trace}($1)');
  
  // Adjoint notation: adj(A)
  result = result.replace(/\badj\(([^)]+)\)/g, '\\text{adj}($1)');
  
  return result;
}

/**
 * Handle binomial coefficients and combinatorics
 */
function handleBinomialCoefficients(text) {
  let result = text;
  
  // Binomial coefficients: nCr, (n choose r)
  result = result.replace(/(\d+)C(\d+)/g, '\\binom{$1}{$2}');
  result = result.replace(/\{(\d+)\\choose\s+(\d+)\}/g, '\\binom{$1}{$2}');
  
  // Permutation notation: nPr
  result = result.replace(/(\d+)P(\d+)/g, '{}^{$1}P_{$2}');
  
  return result;
}

/**
 * Handle Greek letters and mathematical symbols
 */
function handleGreekLetters(text) {
  let result = text;
  
  // Handle Greek letter symbols
  result = result
    .replace(/α/g, '\\alpha').replace(/β/g, '\\beta').replace(/γ/g, '\\gamma')
    .replace(/δ/g, '\\delta').replace(/ε/g, '\\epsilon').replace(/ζ/g, '\\zeta')
    .replace(/η/g, '\\eta').replace(/θ/g, '\\theta').replace(/ι/g, '\\iota')
    .replace(/κ/g, '\\kappa').replace(/λ/g, '\\lambda').replace(/μ/g, '\\mu')
    .replace(/ν/g, '\\nu').replace(/ξ/g, '\\xi').replace(/ο/g, '\\omicron')
    .replace(/π/g, '\\pi').replace(/ρ/g, '\\rho').replace(/σ/g, '\\sigma')
    .replace(/τ/g, '\\tau').replace(/υ/g, '\\upsilon').replace(/φ/g, '\\phi')
    .replace(/χ/g, '\\chi').replace(/ψ/g, '\\psi').replace(/ω/g, '\\omega');
  
  // Handle Greek letter names
  const greekLetters = {
    'alpha': '\\alpha', 'Alpha': '\\Alpha',
    'beta': '\\beta', 'Beta': '\\Beta',
    'gamma': '\\gamma', 'Gamma': '\\Gamma',
    'delta': '\\delta', 'Delta': '\\Delta',
    'epsilon': '\\epsilon', 'Epsilon': '\\Epsilon',
    'theta': '\\theta', 'Theta': '\\Theta',
    'lambda': '\\lambda', 'Lambda': '\\Lambda',
    'mu': '\\mu', 'Mu': '\\Mu',
    'pi': '\\pi', 'Pi': '\\Pi',
    'sigma': '\\sigma', 'Sigma': '\\Sigma',
    'tau': '\\tau', 'Tau': '\\Tau',
    'phi': '\\phi', 'Phi': '\\Phi',
    'omega': '\\omega', 'Omega': '\\Omega'
  };
  
  Object.entries(greekLetters).forEach(([name, symbol]) => {
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    result = result.replace(regex, symbol);
  });
  
  return result;
}

/**
 * Handle mathematical symbols and operators
 */
function handleMathematicalSymbols(text) {
  return text
    // Basic operations
    .replace(/×/g, '\\times')
    .replace(/÷/g, '\\div')
    .replace(/±/g, '\\pm')
    .replace(/∓/g, '\\mp')
    
    // Inequalities
    .replace(/≤/g, '\\leq')
    .replace(/≥/g, '\\geq')
    .replace(/≠/g, '\\neq')
    .replace(/≡/g, '\\equiv')
    .replace(/≈/g, '\\approx')
    .replace(/∝/g, '\\propto')
    
    // Set theory
    .replace(/∈/g, '\\in')
    .replace(/∉/g, '\\notin')
    .replace(/⊆/g, '\\subseteq')
    .replace(/⊇/g, '\\supseteq')
    .replace(/∪/g, '\\cup')
    .replace(/∩/g, '\\cap')
    .replace(/∅/g, '\\emptyset')
    
    // Calculus
    .replace(/∫/g, '\\int')
    .replace(/∮/g, '\\oint')
    .replace(/∂/g, '\\partial')
    .replace(/∇/g, '\\nabla')
    .replace(/∞/g, '\\infty')
    
    // Logic
    .replace(/∧/g, '\\land')
    .replace(/∨/g, '\\lor')
    .replace(/¬/g, '\\neg')
    .replace(/→/g, '\\rightarrow')
    .replace(/←/g, '\\leftarrow')
    .replace(/↔/g, '\\leftrightarrow')
    .replace(/⇒/g, '\\Rightarrow')
    .replace(/⇐/g, '\\Leftarrow')
    .replace(/⇔/g, '\\Leftrightarrow')
    
    // Other symbols
    .replace(/√/g, '\\sqrt')
    .replace(/∑/g, '\\sum')
    .replace(/∏/g, '\\prod')
    .replace(/°/g, '^\\circ')
    .replace(/′/g, "'")
    .replace(/″/g, "''");
}

/**
 * Handle mathematical functions
 */
function handleFunctions(text) {
  return text
    // Trigonometric functions
    .replace(/\bsin\b/g, '\\sin')
    .replace(/\bcos\b/g, '\\cos')
    .replace(/\btan\b/g, '\\tan')
    .replace(/\bcot\b/g, '\\cot')
    .replace(/\bsec\b/g, '\\sec')
    .replace(/\bcsc\b/g, '\\csc')
    
    // Inverse trigonometric functions
    .replace(/\barcsin\b/g, '\\arcsin')
    .replace(/\barccos\b/g, '\\arccos')
    .replace(/\barctan\b/g, '\\arctan')
    .replace(/\bsin\^-1\b/g, '\\sin^{-1}')
    .replace(/\bcos\^-1\b/g, '\\cos^{-1}')
    .replace(/\btan\^-1\b/g, '\\tan^{-1}')
    
    // Logarithmic functions
    .replace(/\blog\b/g, '\\log')
    .replace(/\bln\b/g, '\\ln')
    .replace(/\blg\b/g, '\\lg')
    
    // Other functions
    .replace(/\bexp\b/g, '\\exp')
    .replace(/\bmax\b/g, '\\max')
    .replace(/\bmin\b/g, '\\min')
    .replace(/\bgcd\b/g, '\\gcd')
    .replace(/\blcm\b/g, '\\text{lcm}')
    .replace(/\bmod\b/g, '\\bmod');
}

/**
 * Handle equation structures
 */
function handleEquationStructures(text) {
  let result = text;
  
  // Handle square roots
  result = result.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  result = result.replace(/√([a-zA-Z0-9]+)/g, '\\sqrt{$1}');
  
  // Handle absolute values
  result = result.replace(/\|([^|]+)\|/g, '\\left|$1\\right|');
  
  // Handle floor and ceiling functions
  result = result.replace(/⌊([^⌋]+)⌋/g, '\\lfloor $1 \\rfloor');
  result = result.replace(/⌈([^⌉]+)⌉/g, '\\lceil $1 \\rceil');
  
  return result;
}

/**
 * Check if text contains mathematical expressions
 */
function isMathematicalExpression(text) {
  const mathIndicators = [
    /\^/, /\_/, /\\frac/, /\\sqrt/, /\\sum/, /\\int/, /\\log/, /\\sin/, /\\cos/, /\\tan/,
    /\+/, /\-/, /\*/, /\//, /\=/, /\</, /\>/, /≤/, /≥/, /≠/, /∈/, /∉/,
    /[αβγδεζηθικλμνξοπρστυφχψω]/, /\\[a-zA-Z]+/,
    /\([^)]*[+\-*/=^_][^)]*\)/, /\d+\/\d+/, /\d+\^\d+/
  ];
  
  return mathIndicators.some(pattern => pattern.test(text));
}

/**
 * Enhanced format for rich text editor with proper LaTeX
 */
function enhancedFormatForRichTextEditor(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // Process mathematical expressions first
  formatted = enhancedMathToLaTeX(formatted);
  
  // Convert line breaks to <br> but preserve LaTeX structures
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Don't escape characters inside LaTeX expressions
  const latexRegex = /\\?\([^)]*\\?\)/g;
  const latexExpressions = [];
  let index = 0;
  
  // Extract LaTeX expressions
  formatted = formatted.replace(latexRegex, (match) => {
    const placeholder = `__LATEX_${index}__`;
    latexExpressions[index] = match;
    index++;
    return placeholder;
  });
  
  // Escape HTML in non-LaTeX content
  formatted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Restore LaTeX expressions
  latexExpressions.forEach((expr, i) => {
    formatted = formatted.replace(`__LATEX_${i}__`, expr);
  });
  
  return formatted;
}

module.exports = {
  enhancedMathToLaTeX,
  enhancedFormatForRichTextEditor,
  cleanOCRArtifacts,
  handleComplexFractions,
  handleSuperscriptsAndSubscripts,
  handleMatrixNotation,
  handleBinomialCoefficients,
  handleGreekLetters,
  handleMathematicalSymbols,
  handleFunctions,
  handleEquationStructures,
  isMathematicalExpression
};
