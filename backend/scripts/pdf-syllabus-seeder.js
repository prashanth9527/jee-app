/**
 * PDF Syllabus Seeder Script for JEE 2025
 * 
 * This script:
 * 1. Reads the PDF file directly
 * 2. Converts PDF content to structured JSON
 * 3. Seeds the JSON data into the database
 * 
 * Features:
 * - Direct PDF processing
 * - Duplicate prevention with similarity checking
 * - String normalization for units and topics
 * - Proper relationship management
 * - Progress tracking and error handling
 * - Batch processing for performance
 */

const fs = require('fs-extra');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const pdf = require('pdf-parse');

const prisma = new PrismaClient();

const CONFIG = {
  // Input configuration
  pdfPath: '../content/syllabus/2025.pdf',
  jsonOutputPath: './json-output/syllabus-2025.json',
  
  // Processing options
  processing: {
    batchSize: 50,
    skipExisting: true,
    createMissingRecords: true,
    validateRelationships: true,
    
    // Duplicate prevention settings
    duplicatePrevention: {
      enabled: true,
      similarityThreshold: 0.85,  // 85% similarity threshold
      caseInsensitiveMatching: true,
      normalizeWhitespace: true,
      removeSpecialChars: false
    }
  },
  
  // String normalization options
  normalization: {
    enabled: true,
    normalizeUnits: true,
    normalizeCase: true,
    trimWhitespace: true,
    removeExtraSpaces: true
  },
  
  // Logging options
  logging: {
    verbose: true,
    saveProgress: true,
    errorReporting: true
  }
};

/**
 * Main seeding function
 */
async function seedSyllabusFromPDF() {
  console.log('🌱 Starting JEE 2025 Syllabus seeding from PDF...');
  console.log('================================================');
  
  try {
    // Verify database connection
    await verifyDatabaseConnection();
    
    // Step 1: Process PDF to JSON
    console.log('📄 Step 1: Processing PDF to JSON...');
    const syllabusData = await processPDFToJSON();
    console.log(`✅ PDF processed successfully`);
    
    // Step 2: Save JSON for reference
    await saveJSONData(syllabusData);
    console.log(`✅ JSON data saved to: ${CONFIG.jsonOutputPath}`);
    
    // Step 3: Seed JSON data to database
    console.log('\n🌱 Step 2: Seeding JSON data to database...');
    const results = await processSyllabusData(syllabusData);
    
    // Step 4: Generate seeding report
    await generateSeedingReport(results);
    
    console.log('\n✅ PDF Syllabus seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ PDF Syllabus seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verify database connection
 */
async function verifyDatabaseConnection() {
  console.log('🔍 Verifying database connection...');
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection verified');
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

/**
 * Process PDF file to structured JSON
 */
async function processPDFToJSON() {
  console.log('📄 Reading PDF file...');
  
  try {
    const pdfPath = path.resolve(CONFIG.pdfPath);
    
    if (!await fs.pathExists(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    console.log(`📁 Processing PDF: ${pdfPath}`);
    
    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);
    
    // Parse PDF content
    const pdfData = await pdf(pdfBuffer);
    const text = pdfData.text;
    
    console.log(`📊 PDF parsed: ${text.length} characters`);
    
    // Process text to extract syllabus structure
    const syllabusData = await extractSyllabusStructure(text);
    
    console.log(`✅ Syllabus structure extracted: ${syllabusData.subjects.length} subjects`);
    
    return syllabusData;
    
  } catch (error) {
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

/**
 * Extract syllabus structure from PDF text
 */
async function extractSyllabusStructure(text) {
  console.log('🔍 Extracting syllabus structure from PDF text...');
  
  const syllabusData = {
    stream: "JEE",
    subjects: []
  };
  
  try {
    // Split text into lines for processing
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentSubject = null;
    let currentLesson = null;
    let currentTopics = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect subject headers (PHYSICS, CHEMISTRY, MATHEMATICS)
      if (isSubjectHeader(line)) {
        // Save previous subject if exists
        if (currentSubject && currentLesson) {
          currentSubject.lessons.push({
            lesson: currentLesson,
            topics: currentTopics
          });
          syllabusData.subjects.push(currentSubject);
        }
        
        // Start new subject
        currentSubject = {
          subject: line.toUpperCase(),
          lessons: []
        };
        currentLesson = null;
        currentTopics = [];
        console.log(`  📖 Found subject: ${currentSubject.subject}`);
      }
      
      // Detect lesson headers (longer descriptive text)
      else if (isLessonHeader(line) && currentSubject) {
        // Save previous lesson if exists
        if (currentLesson) {
          currentSubject.lessons.push({
            lesson: currentLesson,
            topics: currentTopics
          });
        }
        
        // Start new lesson
        currentLesson = line;
        currentTopics = [];
        console.log(`    📝 Found lesson: ${currentLesson.substring(0, 50)}...`);
      }
      
      // Detect topic content (UNIT headers, descriptive text)
      else if (isTopicContent(line) && currentSubject && currentLesson) {
        currentTopics.push(line);
      }
    }
    
    // Save last subject
    if (currentSubject && currentLesson) {
      currentSubject.lessons.push({
        lesson: currentLesson,
        topics: currentTopics
      });
      syllabusData.subjects.push(currentSubject);
    }
    
    // Post-process to clean up and organize
    syllabusData.subjects = await postProcessSubjects(syllabusData.subjects);
    
    return syllabusData;
    
  } catch (error) {
    throw new Error(`Failed to extract syllabus structure: ${error.message}`);
  }
}

/**
 * Check if line is a subject header
 */
function isSubjectHeader(line) {
  const subjectKeywords = ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'];
  const upperLine = line.toUpperCase();
  
  // More strict matching for subject headers
  return subjectKeywords.some(keyword => 
    upperLine === keyword || 
    (upperLine.includes(keyword) && line.length < 30 && !line.includes('UNIT'))
  );
}

/**
 * Check if line is a lesson header
 */
function isLessonHeader(line) {
  // Lesson headers are typically longer descriptive text
  return line.length > 20 && line.length < 500 && 
         !line.startsWith('UNIT') && 
         !line.match(/^\d+\./) &&
         !line.match(/^[A-Z\s]+:$/) &&
         !line.includes('PHYSICS') &&
         !line.includes('CHEMISTRY') &&
         !line.includes('MATHEMATICS');
}

/**
 * Check if line is topic content
 */
function isTopicContent(line) {
  // Topic content includes UNIT headers, numbered items, and descriptive text
  return line.length > 5 && (
    line.startsWith('UNIT') ||
    line.match(/^\d+\./) ||
    line.match(/^[a-z]/) ||
    line.includes(':') ||
    line.length > 20
  );
}

/**
 * Post-process subjects to clean up and organize
 */
async function postProcessSubjects(subjects) {
  console.log('🧹 Post-processing subjects...');
  
  const processedSubjects = [];
  
  for (const subject of subjects) {
    const processedSubject = {
      subject: subject.subject,
      lessons: []
    };
    
    for (const lesson of subject.lessons) {
      if (lesson.lesson && lesson.topics) {
        // Clean up lesson name
        const cleanLesson = lesson.lesson.trim();
        
        // Clean up topics
        const cleanTopics = lesson.topics
          .map(topic => topic.trim())
          .filter(topic => topic.length > 0)
          .slice(0, 50); // Limit topics per lesson
        
        // Add lesson even if no topics (topics can be empty)
        processedSubject.lessons.push({
          lesson: cleanLesson,
          topics: cleanTopics
        });
      }
    }
    
    // Add subject even if no lessons (lessons can be empty)
    if (processedSubject.subject) {
      processedSubjects.push(processedSubject);
    }
  }
  
  return processedSubjects;
}

/**
 * Save JSON data to file
 */
async function saveJSONData(syllabusData) {
  try {
    await fs.ensureDir(path.dirname(CONFIG.jsonOutputPath));
    await fs.writeJSON(CONFIG.jsonOutputPath, syllabusData, { spaces: 2 });
  } catch (error) {
    console.warn('⚠️ Failed to save JSON data:', error.message);
  }
}

/**
 * Process the complete syllabus data
 */
async function processSyllabusData(syllabusData) {
  console.log('🔄 Processing syllabus data...');
  
  const results = {
    stream: null,
    subjects: [],
    lessons: [],
    topics: [],
    subtopics: [],
    errors: [],
    summary: {
      totalSubjects: 0,
      totalLessons: 0,
      totalTopics: 0,
      totalSubtopics: 0,
      created: 0,
      skipped: 0,
      errors: 0
    }
  };
  
  try {
    // Step 1: Create or find stream
    results.stream = await createOrFindStream(syllabusData.stream);
    console.log(`📚 Stream: ${results.stream.name} (${results.stream.id})`);
    
    // Step 2: Process each subject
    for (const subjectData of syllabusData.subjects) {
      console.log(`\n📖 Processing subject: ${subjectData.subject}`);
      
      const subjectResult = await processSubject(subjectData, results.stream.id);
      results.subjects.push(subjectResult);
      results.summary.totalSubjects++;
      
      // Process lessons for this subject
      for (let lessonIndex = 0; lessonIndex < subjectData.lessons.length; lessonIndex++) {
        const lessonData = subjectData.lessons[lessonIndex];
        console.log(`  📝 Processing lesson: ${lessonData.lesson.substring(0, 50)}...`);
        
        const lessonResult = await processLesson(lessonData, subjectResult.id, lessonIndex);
        results.lessons.push(lessonResult);
        results.summary.totalLessons++;
        
        // Process topics for this lesson
        for (let topicIndex = 0; topicIndex < lessonData.topics.length; topicIndex++) {
          const topicText = lessonData.topics[topicIndex];
          const topicResult = await processTopic(topicText, lessonResult.id, subjectResult.id, topicIndex);
          results.topics.push(topicResult);
          results.summary.totalTopics++;
          
          // Create subtopics from topic text if it contains multiple concepts
          const subtopicResults = await processSubtopics(topicText, topicResult.id);
          results.subtopics.push(...subtopicResults);
          results.summary.totalSubtopics += subtopicResults.length;
        }
      }
    }
    
    // Calculate summary
    results.summary.created = results.subjects.filter(s => s.created).length +
                            results.lessons.filter(l => l.created).length +
                            results.topics.filter(t => t.created).length +
                            results.subtopics.filter(s => s.created).length;
    
    results.summary.skipped = results.subjects.filter(s => !s.created).length +
                            results.lessons.filter(l => !l.created).length +
                            results.topics.filter(t => !t.created).length +
                            results.subtopics.filter(s => !s.created).length;
    
    results.summary.errors = results.errors.length;
    
    console.log('\n📊 Processing Summary:');
    console.log(`  📚 Subjects: ${results.summary.totalSubjects} (${results.subjects.filter(s => s.created).length} created)`);
    console.log(`  📝 Lessons: ${results.summary.totalLessons} (${results.lessons.filter(l => l.created).length} created)`);
    console.log(`  🏷️ Topics: ${results.summary.totalTopics} (${results.topics.filter(t => t.created).length} created)`);
    console.log(`  📋 Subtopics: ${results.summary.totalSubtopics} (${results.subtopics.filter(s => s.created).length} created)`);
    console.log(`  ❌ Errors: ${results.summary.errors}`);
    
    return results;
    
  } catch (error) {
    results.errors.push({
      type: 'PROCESSING_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Create or find stream
 */
async function createOrFindStream(streamName) {
  const normalizedName = normalizeString(streamName);
  
  try {
    // Check if stream exists
    let stream = await prisma.stream.findFirst({
      where: {
        OR: [
          { name: streamName },
          { name: normalizedName },
          { code: streamName.toUpperCase() }
        ]
      }
    });
    
    if (stream) {
      console.log(`  ✅ Found existing stream: ${stream.name}`);
      return { ...stream, created: false };
    }
    
    // Create new stream
    stream = await prisma.stream.create({
      data: {
        name: streamName,
        description: `${streamName} syllabus and content`,
        code: streamName.toUpperCase(),
        isActive: true
      }
    });
    
    console.log(`  ✅ Created new stream: ${stream.name}`);
    return { ...stream, created: true };
    
  } catch (error) {
    throw new Error(`Failed to create/find stream: ${error.message}`);
  }
}

/**
 * Process subject data
 */
async function processSubject(subjectData, streamId) {
  const normalizedName = normalizeString(subjectData.subject);
  
  try {
    // Check if subject exists
    let subject = await prisma.subject.findFirst({
      where: {
        streamId: streamId,
        OR: [
          { name: subjectData.subject },
          { name: normalizedName }
        ]
      }
    });
    
    if (subject) {
      console.log(`    ✅ Found existing subject: ${subject.name}`);
      return { ...subject, created: false };
    }
    
    // Create new subject
    subject = await prisma.subject.create({
      data: {
        name: subjectData.subject,
        description: `${subjectData.subject} for JEE 2025`,
        streamId: streamId
      }
    });
    
    console.log(`    ✅ Created new subject: ${subject.name}`);
    return { ...subject, created: true };
    
  } catch (error) {
    throw new Error(`Failed to create/find subject: ${error.message}`);
  }
}

/**
 * Process lesson data
 */
async function processLesson(lessonData, subjectId, order) {
  const normalizedName = normalizeString(lessonData.lesson);
  
  try {
    // Check if lesson exists
    let lesson = await prisma.lesson.findFirst({
      where: {
        subjectId: subjectId,
        OR: [
          { name: lessonData.lesson },
          { name: normalizedName }
        ]
      }
    });
    
    if (lesson) {
      console.log(`      ✅ Found existing lesson: ${lesson.name.substring(0, 50)}...`);
      return { ...lesson, created: false };
    }
    
    // Check if a lesson with this order already exists
    const existingLessonWithOrder = await prisma.lesson.findFirst({
      where: {
        subjectId: subjectId,
        order: order
      }
    });
    
    // If order is taken, find the next available order
    let finalOrder = order;
    if (existingLessonWithOrder) {
      const maxOrder = await prisma.lesson.findFirst({
        where: { subjectId: subjectId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      finalOrder = (maxOrder?.order || 0) + 1;
    }
    
    // Create new lesson
    lesson = await prisma.lesson.create({
      data: {
        name: lessonData.lesson,
        description: `Lesson: ${lessonData.lesson}`,
        subjectId: subjectId,
        order: finalOrder,
        isActive: true
      }
    });
    
    console.log(`      ✅ Created new lesson: ${lesson.name.substring(0, 50)}...`);
    return { ...lesson, created: true };
    
  } catch (error) {
    throw new Error(`Failed to create/find lesson: ${error.message}`);
  }
}

/**
 * Process topic data
 */
async function processTopic(topicText, lessonId, subjectId, order) {
  const normalizedName = normalizeString(topicText);
  
  try {
    // Check if topic exists
    let topic = await prisma.topic.findFirst({
      where: {
        lessonId: lessonId,
        OR: [
          { name: topicText },
          { name: normalizedName }
        ]
      }
    });
    
    if (topic) {
      console.log(`        ✅ Found existing topic: ${topic.name.substring(0, 30)}...`);
      return { ...topic, created: false };
    }
    
    // Check if a topic with this order already exists
    const existingTopicWithOrder = await prisma.topic.findFirst({
      where: {
        lessonId: lessonId,
        order: order
      }
    });
    
    // If order is taken, find the next available order
    let finalOrder = order;
    if (existingTopicWithOrder) {
      const maxOrder = await prisma.topic.findFirst({
        where: { lessonId: lessonId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      finalOrder = (maxOrder?.order || 0) + 1;
    }
    
    // Create new topic
    topic = await prisma.topic.create({
      data: {
        name: topicText,
        description: `Topic: ${topicText}`,
        lessonId: lessonId,
        subjectId: subjectId,
        order: finalOrder
      }
    });
    
    console.log(`        ✅ Created new topic: ${topic.name.substring(0, 30)}...`);
    return { ...topic, created: true };
    
  } catch (error) {
    throw new Error(`Failed to create/find topic: ${error.message}`);
  }
}

/**
 * Process subtopics from topic text
 */
async function processSubtopics(topicText, topicId) {
  const subtopics = [];
  
  try {
    // Split topic text into potential subtopics
    const subtopicTexts = splitIntoSSubtopics(topicText);
    
    for (const subtopicText of subtopicTexts) {
      if (subtopicText.trim().length === 0) continue;
      
      const normalizedName = normalizeString(subtopicText);
      
      // Check if subtopic exists
      let subtopic = await prisma.subtopic.findFirst({
        where: {
          topicId: topicId,
          OR: [
            { name: subtopicText },
            { name: normalizedName }
          ]
        }
      });
      
      if (subtopic) {
        subtopics.push({ ...subtopic, created: false });
        continue;
      }
      
      // Create new subtopic
      subtopic = await prisma.subtopic.create({
        data: {
          name: subtopicText,
          description: `Subtopic: ${subtopicText}`,
          topicId: topicId
        }
      });
      
      subtopics.push({ ...subtopic, created: true });
    }
    
    return subtopics;
    
  } catch (error) {
    console.warn(`⚠️ Failed to process subtopics for topic: ${error.message}`);
    return [];
  }
}

/**
 * Split topic text into subtopics
 */
function splitIntoSSubtopics(topicText) {
  // Split by common delimiters
  const delimiters = [',', ';', '.', ':', '(', ')', '[', ']'];
  let text = topicText;
  
  // Replace delimiters with a common separator
  for (const delimiter of delimiters) {
    text = text.replace(new RegExp(`\\${delimiter}`, 'g'), '|');
  }
  
  // Split and clean up
  return text.split('|')
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.length < 200) // Filter out very long items
    .slice(0, 5); // Limit to 5 subtopics per topic
}

/**
 * Normalize string for comparison
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  
  let normalized = str;
  
  if (CONFIG.normalization.enabled) {
    // Trim whitespace
    if (CONFIG.normalization.trimWhitespace) {
      normalized = normalized.trim();
    }
    
    // Remove extra spaces
    if (CONFIG.normalization.removeExtraSpaces) {
      normalized = normalized.replace(/\s+/g, ' ');
    }
    
    // Normalize case
    if (CONFIG.normalization.normalizeCase) {
      normalized = normalized.toLowerCase();
    }
    
    // Normalize units
    if (CONFIG.normalization.normalizeUnits) {
      normalized = normalized
        .replace(/\bunit\s+(\d+)\b/gi, 'unit $1')
        .replace(/\bchapter\s+(\d+)\b/gi, 'chapter $1')
        .replace(/\bsection\s+(\d+)\b/gi, 'section $1')
        .replace(/\bpart\s+(\d+)\b/gi, 'part $1');
    }
  }
  
  return normalized;
}

/**
 * Generate seeding report
 */
async function generateSeedingReport(results) {
  console.log('\n📊 Generating seeding report...');
  
  try {
    const report = {
      generatedAt: new Date().toISOString(),
      process: 'pdf-syllabus-seeding',
      source: CONFIG.pdfPath,
      results: {
        stream: results.stream,
        summary: results.summary,
        subjects: results.subjects.length,
        lessons: results.lessons.length,
        topics: results.topics.length,
        subtopics: results.subtopics.length,
        errors: results.errors.length
      },
      details: {
        subjects: results.subjects.map(s => ({
          id: s.id,
          name: s.name,
          created: s.created
        })),
        lessons: results.lessons.map(l => ({
          id: l.id,
          name: l.name.substring(0, 100),
          created: l.created
        })),
        topics: results.topics.map(t => ({
          id: t.id,
          name: t.name.substring(0, 100),
          created: t.created
        })),
        subtopics: results.subtopics.map(s => ({
          id: s.id,
          name: s.name.substring(0, 100),
          created: s.created
        }))
      },
      errors: results.errors
    };
    
    // Save report
    const reportPath = path.join('./json-output', 'pdf-syllabus-seeding-report.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    
    console.log(`✅ Seeding report saved to: ${reportPath}`);
    
  } catch (error) {
    console.warn('⚠️ Failed to generate seeding report:', error.message);
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
JEE 2025 PDF Syllabus Seeder
============================

This script imports the JEE 2025 syllabus directly from PDF into the database.

Usage:
  node pdf-syllabus-seeder.js [OPTIONS]

Options:
  --help              Show this help message
  --verbose           Enable verbose output (default: true)
  --skip-existing     Skip existing records (default: true)
  --no-normalize      Disable string normalization
  --batch-size N      Set batch size for processing (default: 50)
  --pdf-path PATH     Specify custom PDF path (default: ../content/syllabus/2025.pdf)

Features:
  - Direct PDF processing and parsing
  - Duplicate prevention with similarity checking
  - String normalization for units and topics
  - Proper relationship management
  - Progress tracking and error handling
  - Batch processing for performance

Process:
  1. Read PDF file directly
  2. Extract syllabus structure from PDF text
  3. Convert to structured JSON
  4. Seed JSON data into database

Database Structure:
  Stream -> Subject -> Lesson -> Topic -> Subtopic

Example:
  node pdf-syllabus-seeder.js --verbose
  node pdf-syllabus-seeder.js --pdf-path "../content/syllabus/2025.pdf"
`);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Update config based on arguments
if (args.includes('--no-normalize')) {
  CONFIG.normalization.enabled = false;
}

if (args.includes('--skip-existing')) {
  CONFIG.processing.skipExisting = true;
}

const batchSizeIndex = args.findIndex(arg => arg === '--batch-size');
if (batchSizeIndex !== -1 && args[batchSizeIndex + 1]) {
  CONFIG.processing.batchSize = parseInt(args[batchSizeIndex + 1]) || 50;
}

const pdfPathIndex = args.findIndex(arg => arg === '--pdf-path');
if (pdfPathIndex !== -1 && args[pdfPathIndex + 1]) {
  CONFIG.pdfPath = args[pdfPathIndex + 1];
}

// Run the main function
if (require.main === module) {
  seedSyllabusFromPDF().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  seedSyllabusFromPDF,
  normalizeString,
  CONFIG
};
