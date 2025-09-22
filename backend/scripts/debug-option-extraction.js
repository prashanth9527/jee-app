/**
 * Debug script for option extraction
 */

// Test the option extraction function
function extractOptions(text) {
  const options = [];
  
  // Stop extracting options when we hit answer patterns
  const stopPatterns = [
    /Ans\.\s*\(/i,
    /Answer:\s*/i,
    /Sol\.\s*/i,
    /Solution:\s*/i
  ];
  
  // Find where to stop extracting options
  let stopIndex = text.length;
  stopPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match && match.index < stopIndex) {
      stopIndex = match.index;
    }
  });
  
  // Only extract options before the answer/solution
  const optionText = text.substring(0, stopIndex);
  
  console.log(`Original text: "${text}"`);
  console.log(`Option text (before stop): "${optionText}"`);
  console.log(`Stop index: ${stopIndex}, Text length: ${text.length}`);
  
  // First, try to find all options in sequence using a comprehensive pattern
  const comprehensivePattern = /\(([A-D1-4])\)\s*([^\(]*?)(?=\([A-D1-4]\)|$)/g;
  let match;
  
  while ((match = comprehensivePattern.exec(optionText)) !== null) {
    const optionLetter = match[1];
    let optionTextContent = match[2].trim();
    
    console.log(`Found option: ${optionLetter} - "${optionTextContent}"`);
    
    // Clean up the option text
    optionTextContent = optionTextContent.replace(/\s+/g, ' ').trim();
    
    // Filter out very short options and invalid patterns
    if (optionTextContent.length > 3 && !optionTextContent.match(/^[A-D1-4]\)/)) {
      options.push({
        letter: optionLetter,
        text: optionTextContent
      });
      console.log(`Added option: ${optionLetter} - "${optionTextContent}"`);
    } else {
      console.log(`Rejected option: ${optionLetter} - "${optionTextContent}" (too short or invalid)`);
    }
  }
  
  console.log(`Final options:`, options);
  return options;
}

// Test cases
const testCases = [
  {
    name: "Question 1",
    text: "If u and v satisfy the equations αu + βv = 18, γu + δv = 20, then u + v equals : (1) 5 (2) 4 (3) 3 (4) 8"
  },
  {
    name: "Question 3", 
    text: "If B = adj(adj(2A)), then the value of |B| + trace (B) equals: (1) 56 (2) 132 (3) 174 (4) 280"
  },
  {
    name: "Question with Answer",
    text: "Find x: (1) 1 (2) 2 (3) 3 (4) 4 Ans. (1)"
  },
  {
    name: "Question with Solution",
    text: "Calculate area: (1) 10 (2) 20 (3) 30 (4) 40 Sol. Using formula..."
  }
];

console.log('🔍 Debugging Option Extraction');
console.log('==============================\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('---');
  const options = extractOptions(testCase.text);
  console.log(`Result: ${options.length} options extracted\n`);
});

console.log('✅ Option extraction debugging completed!');


