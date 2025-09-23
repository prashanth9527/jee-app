/**
 * Debug script for question extraction
 */

// Test the question extraction functions
function isQuestionHeader(text) {
  const headerPatterns = [
    /JEE.*EXAMINATION/i,
    /TEST PAPER/i,
    /SECTION/i,
    /TIME.*PM.*TO.*PM/i,
    /HELD ON/i,
    /ALLEN/i
  ];
  
  return headerPatterns.some(pattern => pattern.test(text));
}

function isActualQuestion(text) {
  const questionIndicators = [
    /find/i,
    /calculate/i,
    /determine/i,
    /choose/i,
    /select/i,
    /arrange/i,
    /identify/i,
    /which/i,
    /what/i,
    /how/i,
    /when/i,
    /where/i,
    /if.*then/i,
    /given.*find/i,
    /the value of/i,
    /the number of/i
  ];
  
  return questionIndicators.some(pattern => pattern.test(text));
}

function hasQuestionContent(text) {
  // Must have some question words and not just be options
  const hasQuestionWords = /find|calculate|determine|choose|select|arrange|identify|which|what|how|if|given|value|number/i.test(text);
  const isJustOptions = /^\(\d+\)|^\([A-D]\)/i.test(text.trim());
  
  return hasQuestionWords && !isJustOptions;
}

// Test cases from the actual PDF content
const testCases = [
  {
    name: "Question Header",
    text: "JEE–MAIN EXAMINATION – JANUARY 2025 MATHEMATICS TEST PAPER WITH SOLUTION ALLEN (HELD ON WEDNESDAY 22nd JANUARY 2025) TIME : 3 : 00 PM TO 6 : 00 PM SECTION-A",
    shouldPass: false
  },
  {
    name: "Actual Question 1",
    text: "Let α, β, γ and δ be the coefficients of x7, x5, x3 and x respectively in the expansion of (x5 + x3 − 1)(x5 + x3 − 1), x > 0. If u and v satisfy the equations αu + βv = 18, γu + δv = 20, then u + v equals : (1) 5 (2) 4 (3) 3 (4) 8",
    shouldPass: true
  },
  {
    name: "Actual Question 2", 
    text: "In a group of 3 girls and 4 boys, there are two boys B1 and B2. The number of ways, in which these girls and boys can stand in a queue such that all the girls stand together, all the boys stand together, but B1 and B2 are not adjacent to each other, is : (1) 144 (2) 72 (3) 96 (4) 120",
    shouldPass: true
  },
  {
    name: "Question with 'find'",
    text: "Find the value of x if 2x + 3 = 7. (1) 1 (2) 2 (3) 3 (4) 4",
    shouldPass: true
  },
  {
    name: "Question with 'calculate'",
    text: "Calculate the area of a circle with radius 5. (1) 25π (2) 50π (3) 75π (4) 100π",
    shouldPass: true
  }
];

console.log('🔍 Debugging Question Extraction Logic');
console.log('=====================================\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Text: "${testCase.text.substring(0, 100)}..."`);
  
  const isHeader = isQuestionHeader(testCase.text);
  const isQuestion = isActualQuestion(testCase.text);
  const hasContent = hasQuestionContent(testCase.text);
  
  console.log(`Is Header: ${isHeader ? '✅ YES' : '❌ NO'}`);
  console.log(`Is Question: ${isQuestion ? '✅ YES' : '❌ NO'}`);
  console.log(`Has Content: ${hasContent ? '✅ YES' : '❌ NO'}`);
  
  const shouldExtract = !isHeader && isQuestion && hasContent;
  const expected = testCase.shouldPass;
  
  console.log(`Should Extract: ${shouldExtract ? '✅ YES' : '❌ NO'}`);
  console.log(`Expected: ${expected ? '✅ YES' : '❌ NO'}`);
  console.log(`Result: ${shouldExtract === expected ? '✅ PASS' : '❌ FAIL'}`);
  
  if (shouldExtract !== expected) {
    console.log(`❌ MISMATCH: Expected ${expected ? 'extraction' : 'no extraction'} but got ${shouldExtract ? 'extraction' : 'no extraction'}`);
  }
  
  console.log('---\n');
});

console.log('✅ Question extraction debugging completed!');




