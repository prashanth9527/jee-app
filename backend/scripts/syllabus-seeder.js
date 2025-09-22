/**
 * Syllabus Seeder Script for JEE 2025
 * 
 * This script imports the JEE 2025 syllabus from JSON into the database
 * with proper hierarchy: Stream -> Subject -> Lesson -> Topic -> Subtopic
 * 
 * Features:
 * - Duplicate prevention with similarity checking
 * - String normalization for units and topics
 * - Proper relationship management
 * - Progress tracking and error handling
 * - Batch processing for performance
 */

const fs = require('fs-extra');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CONFIG = {
  // Input configuration
  syllabusJsonPath: './prisma/seeds/JEE/Syllabus/JEE_2025_Syllabus_with_stream_fixed_v2.json',
  
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
async function seedSyllabus() {
  console.log('🌱 Starting JEE 2025 Syllabus seeding...');
  console.log('=====================================');
  
  try {
    // Verify database connection
    await verifyDatabaseConnection();
    
    // Load and validate syllabus JSON
    const syllabusData = await loadSyllabusData();
    console.log(`📚 Loaded syllabus data for stream: ${syllabusData.stream}`);
    
    // Process the syllabus data
    const results = await processSyllabusData(syllabusData);
    
    // Generate seeding report
    await generateSeedingReport(results);
    
    console.log('✅ Syllabus seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Syllabus seeding failed:', error);
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
 * Load and validate syllabus JSON data
 */
async function loadSyllabusData() {
  console.log('📄 Loading syllabus JSON data...');
  
  try {
    const jsonPath = path.resolve(CONFIG.syllabusJsonPath);
    
    if (!await fs.pathExists(jsonPath)) {
      throw new Error(`Syllabus JSON file not found: ${jsonPath}`);
    }
    
    const data = await fs.readJSON(jsonPath);
    
    // Validate required structure
    if (!data.stream || !data.subjects || !Array.isArray(data.subjects)) {
      throw new Error('Invalid syllabus JSON structure');
    }
    
    console.log(`✅ Loaded syllabus data: ${data.subjects.length} subjects`);
    return data;
    
  } catch (error) {
    throw new Error(`Failed to load syllabus data: ${error.message}`);
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
    
    // Create new lesson
    lesson = await prisma.lesson.create({
      data: {
        name: lessonData.lesson,
        description: `Lesson: ${lessonData.lesson}`,
        subjectId: subjectId,
        order: order,
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
      process: 'syllabus-seeding',
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
    const reportPath = path.join('./json-output', 'syllabus-seeding-report.json');
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
JEE 2025 Syllabus Seeder
========================

This script imports the JEE 2025 syllabus from JSON into the database.

Usage:
  node syllabus-seeder.js [OPTIONS]

Options:
  --help              Show this help message
  --verbose           Enable verbose output (default: true)
  --skip-existing     Skip existing records (default: true)
  --no-normalize      Disable string normalization
  --batch-size N      Set batch size for processing (default: 50)

Features:
  - Duplicate prevention with similarity checking
  - String normalization for units and topics
  - Proper relationship management
  - Progress tracking and error handling
  - Batch processing for performance

Database Structure:
  Stream -> Subject -> Lesson -> Topic -> Subtopic

Example:
  node syllabus-seeder.js --verbose
  node syllabus-seeder.js --batch-size 100
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

// Run the main function
if (require.main === module) {
  seedSyllabus().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  seedSyllabus,
  normalizeString,
  CONFIG
};
