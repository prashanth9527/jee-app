/**
 * Test script for option extraction improvements
 */

// Test the improved option extraction function
function extractOptions(text) {
  const options = [];
  
  // First, try to find all options in sequence using a comprehensive pattern
  const comprehensivePattern = /\(([A-D1-4])\)\s*([^\(]*?)(?=\([A-D1-4]\)|$)/g;
  let match;
  
  while ((match = comprehensivePattern.exec(text)) !== null) {
    const optionLetter = match[1];
    let optionText = match[2].trim();
    
    // Clean up the option text
    optionText = optionText.replace(/\s+/g, ' ').trim();
    
    // Filter out very short options and invalid patterns
    if (optionText.length > 3 && !optionText.match(/^[A-D1-4]\)/)) {
      options.push({
        letter: optionLetter,
        text: optionText
      });
    }
  }
  
  // If no options found with comprehensive pattern, try alternative approaches
  if (options.length === 0) {
    // Try letter format specifically
    const letterPattern = /\(([A-D])\)\s*([^\(]*?)(?=\([A-D]\)|$)/g;
    while ((match = letterPattern.exec(text)) !== null) {
      const optionLetter = match[1];
      let optionText = match[2].trim();
      
      if (optionText.length > 3) {
        options.push({
          letter: optionLetter,
          text: optionText
        });
      }
    }
  }
  
  // If still no options, try number format specifically
  if (options.length === 0) {
    const numberPattern = /\(([1-4])\)\s*([^\(]*?)(?=\([1-4]\)|$)/g;
    while ((match = numberPattern.exec(text)) !== null) {
      const optionNumber = match[1];
      let optionText = match[2].trim();
      
      if (optionText.length > 3) {
        options.push({
          letter: optionNumber,
          text: optionText
        });
      }
    }
  }
  
  // Sort options by letter/number for consistency
  options.sort((a, b) => {
    const aIsNumber = /^\d$/.test(a.letter);
    const bIsNumber = /^\d$/.test(b.letter);
    
    if (aIsNumber && bIsNumber) {
      return parseInt(a.letter) - parseInt(b.letter);
    } else if (!aIsNumber && !bIsNumber) {
      return a.letter.localeCompare(b.letter);
    } else {
      return aIsNumber ? -1 : 1;
    }
  });
  
  return options;
}

// Test cases
const testCases = [
  {
    name: "Question 54 from Chemistry Paper",
    text: "Consider the given figure and choose the correct option : Activated complex E\n1 E\n2 Energy Reaction coordinate Product Reactant (1) Activation energy of backward reaction is E\n1 and product is more stable than reactant. (2) Activation energy of forward reaction is E\n1 + E\n2 and product is more stable than reactant. (3) Activation energy of forward reaction is E\n1 + E\n2 and product is less stable than reactant. (4) Activation energy of both forward and backward reaction is E\n1 + E\n2 and reactant is more stable than product."
  },
  {
    name: "Standard A,B,C,D format",
    text: "What is 2+2? (A) 3 (B) 4 (C) 5 (D) 6"
  },
  {
    name: "Mixed format",
    text: "Which is correct? (1) Option one (2) Option two (A) Option A (B) Option B"
  }
];

console.log('🧪 Testing Option Extraction Improvements');
console.log('==========================================\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('Input text:', testCase.text.substring(0, 100) + '...');
  
  const options = extractOptions(testCase.text);
  console.log(`Extracted ${options.length} options:`);
  
  options.forEach(option => {
    console.log(`  ${option.letter}: ${option.text.substring(0, 50)}${option.text.length > 50 ? '...' : ''}`);
  });
  
  console.log('---\n');
});

console.log('✅ Option extraction testing completed!');
