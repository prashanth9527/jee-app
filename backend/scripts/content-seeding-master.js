/**
 * Content Seeding Master Script
 * 
 * This script orchestrates the entire content seeding process:
 * 1. Converts PDF/Image files to JSON
 * 2. Seeds JSON data into the database
 * 3. Provides comprehensive reporting and error handling
 * 
 * Usage:
 * - node content-seeding-master.js --convert-only    (Convert files to JSON only)
 * - node content-seeding-master.js --seed-only      (Seed from existing JSON files)
 * - node content-seeding-master.js --full           (Full process: convert + seed)
 * - node content-seeding-master.js --help           (Show help)
 */

const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const CONFIG = {
  scripts: {
    converter: './scripts/pdf-image-to-json-converter.js',
    seeder: './scripts/json-to-database-seeder.js'
  },
  directories: {
    content: '../content',
    jsonOutput: './json-output',
    reports: './json-output/reports'
  },
  options: {
    verbose: true,
    saveLogs: true,
    continueOnError: true,
    skipExisting: false,      // Skip existing JSON files
    noBackup: false,          // Don't create backup before overwriting
    flattenStructure: false   // Don't preserve folder structure (legacy mode)
  }
};

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--full';
  
  // Parse additional arguments for path
  const pathIndex = args.findIndex(arg => arg === '--path' || arg === '-p');
  const targetPath = pathIndex !== -1 && args[pathIndex + 1] ? args[pathIndex + 1] : null;
  
  // Parse file handling options
  if (args.includes('--skip-existing')) {
    CONFIG.options.skipExisting = true;
  }
  if (args.includes('--no-backup')) {
    CONFIG.options.noBackup = true;
  }
  if (args.includes('--flatten-structure')) {
    CONFIG.options.flattenStructure = true;
  }
  
  console.log('🚀 JEE Content Seeding Master Script');
  console.log('====================================');
  console.log(`Command: ${command}`);
  if (targetPath) {
    console.log(`Target Path: ${targetPath}`);
    CONFIG.directories.content = targetPath;
  }
  if (CONFIG.options.skipExisting || CONFIG.options.noBackup || CONFIG.options.flattenStructure) {
    console.log(`File Options: skip existing=${CONFIG.options.skipExisting}, no backup=${CONFIG.options.noBackup}, flatten=${CONFIG.options.flattenStructure}`);
  }
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    switch (command) {
      case '--convert-only':
        await convertOnly();
        break;
      case '--seed-only':
        await seedOnly();
        break;
      case '--full':
        await fullProcess();
        break;
      case '--help':
        showHelp();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Master script failed:', error.message);
    process.exit(1);
  }
}

/**
 * Convert files to JSON only
 */
async function convertOnly() {
  console.log('📄 Phase 1: Converting PDF/Image files to JSON...\n');
  
  try {
    await runConverter();
    console.log('✅ Conversion phase completed successfully!\n');
    
    // Show conversion summary
    await showConversionSummary();
    
  } catch (error) {
    console.error('❌ Conversion phase failed:', error.message);
    if (!CONFIG.options.continueOnError) {
      throw error;
    }
  }
}

/**
 * Seed from existing JSON files only
 */
async function seedOnly() {
  console.log('🌱 Phase 2: Seeding JSON files to database...\n');
  
  try {
    // Verify JSON files exist
    await verifyJsonFilesExist();
    
    await runSeeder();
    console.log('✅ Seeding phase completed successfully!\n');
    
    // Show seeding summary
    await showSeedingSummary();
    
  } catch (error) {
    console.error('❌ Seeding phase failed:', error.message);
    if (!CONFIG.options.continueOnError) {
      throw error;
    }
  }
}

/**
 * Full process: convert + seed
 */
async function fullProcess() {
  console.log('🔄 Running full content seeding process...\n');
  
  const startTime = Date.now();
  
  try {
    // Phase 1: Convert files to JSON
    await convertOnly();
    
    // Phase 2: Seed JSON to database
    await seedOnly();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('🎉 Full content seeding process completed successfully!');
    console.log(`⏱️ Total duration: ${duration} seconds`);
    
    // Generate final summary
    await generateFinalSummary();
    
  } catch (error) {
    console.error('❌ Full process failed:', error.message);
    throw error;
  }
}

/**
 * Run the PDF/Image to JSON converter
 */
async function runConverter() {
  console.log('🔄 Starting PDF/Image to JSON conversion...');
  
  try {
    const contentPath = CONFIG.directories.content;
    let command = `node ${CONFIG.scripts.converter} --content-path "${contentPath}"`;
    
    // Add file handling options based on CONFIG
    if (CONFIG.options.skipExisting) {
      command += ' --skip-existing';
    }
    if (CONFIG.options.noBackup) {
      command += ' --no-backup';
    }
    if (CONFIG.options.flattenStructure) {
      command += ' --flatten-structure';
    }
    
    console.log(`📁 Processing content from: ${contentPath}`);
    console.log(`🔧 File handling: preserve structure=${!CONFIG.options.flattenStructure}, skip existing=${CONFIG.options.skipExisting}, backup=${!CONFIG.options.noBackup}`);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (CONFIG.options.verbose) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.warn('⚠️ Converter warnings:', stderr);
    }
    
  } catch (error) {
    console.error('❌ Converter execution failed:', error.message);
    throw error;
  }
}

/**
 * Run the JSON to database seeder
 */
async function runSeeder() {
  console.log('🔄 Starting JSON to database seeding...');
  
  try {
    const { stdout, stderr } = await execAsync(`node ${CONFIG.scripts.seeder}`);
    
    if (CONFIG.options.verbose) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.warn('⚠️ Seeder warnings:', stderr);
    }
    
  } catch (error) {
    console.error('❌ Seeder execution failed:', error.message);
    throw error;
  }
}

/**
 * Verify JSON files exist before seeding
 */
async function verifyJsonFilesExist() {
  console.log('🔍 Verifying JSON files exist...');
  
  const jsonDirs = [
    path.join(CONFIG.directories.jsonOutput, 'pdfs'),
    path.join(CONFIG.directories.jsonOutput, 'images')
  ];
  
  let totalFiles = 0;
  
  for (const dir of jsonDirs) {
    if (await fs.pathExists(dir)) {
      const files = await fs.readdir(dir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      totalFiles += jsonFiles.length;
      console.log(`  📁 ${dir}: ${jsonFiles.length} JSON files`);
    }
  }
  
  if (totalFiles === 0) {
    throw new Error('No JSON files found. Please run conversion first.');
  }
  
  console.log(`✅ Found ${totalFiles} JSON files to process`);
}

/**
 * Show conversion summary
 */
async function showConversionSummary() {
  console.log('📊 Conversion Summary:');
  
  try {
    const summaryPath = path.join(CONFIG.directories.reports, 'conversion-summary.json');
    
    if (await fs.pathExists(summaryPath)) {
      const summary = await fs.readJSON(summaryPath);
      
      console.log(`  📄 PDFs processed: ${summary.summary.successfulPDFs}/${summary.summary.totalPDFs}`);
      console.log(`  🖼️ Images processed: ${summary.summary.successfulImages}/${summary.summary.totalImages}`);
      console.log(`  ❌ Failed files: ${summary.summary.failedPDFs + summary.summary.failedImages}`);
      
      if (summary.subjectBreakdown) {
        console.log('  📚 Subject breakdown:');
        Object.entries(summary.subjectBreakdown).forEach(([subject, count]) => {
          console.log(`    - ${subject}: ${count} files`);
        });
      }
      
      if (summary.yearBreakdown) {
        console.log('  📅 Year breakdown:');
        Object.entries(summary.yearBreakdown).forEach(([year, count]) => {
          console.log(`    - ${year}: ${count} files`);
        });
      }
    } else {
      console.log('  ⚠️ Conversion summary not found');
    }
  } catch (error) {
    console.warn('⚠️ Failed to read conversion summary:', error.message);
  }
}

/**
 * Show seeding summary
 */
async function showSeedingSummary() {
  console.log('📊 Seeding Summary:');
  
  try {
    const summaryPath = path.join(CONFIG.directories.jsonOutput, 'seeding-report.json');
    
    if (await fs.pathExists(summaryPath)) {
      const summary = await fs.readJSON(summaryPath);
      
      console.log(`  📄 Files processed: ${summary.summary.successfulFiles}/${summary.summary.totalFiles}`);
      console.log(`  ❓ Questions created: ${summary.summary.totalQuestionsCreated}`);
      console.log(`  📖 Topics created: ${summary.summary.totalTopicsCreated}`);
      console.log(`  🏷️ Tags created: ${summary.summary.totalTagsCreated}`);
      console.log(`  ❌ Failed files: ${summary.summary.failedFiles}`);
      
      if (summary.errors && summary.errors.length > 0) {
        console.log('  ⚠️ Errors encountered:');
        summary.errors.slice(0, 5).forEach(error => {
          console.log(`    - ${error.type}: ${error.file}`);
        });
        if (summary.errors.length > 5) {
          console.log(`    ... and ${summary.errors.length - 5} more errors`);
        }
      }
    } else {
      console.log('  ⚠️ Seeding summary not found');
    }
  } catch (error) {
    console.warn('⚠️ Failed to read seeding summary:', error.message);
  }
}

/**
 * Generate final summary report
 */
async function generateFinalSummary() {
  console.log('📊 Generating final summary report...');
  
  try {
    const finalReport = {
      generatedAt: new Date().toISOString(),
      process: 'full',
      phases: {
        conversion: {},
        seeding: {}
      }
    };
    
    // Add conversion summary
    const conversionSummaryPath = path.join(CONFIG.directories.reports, 'conversion-summary.json');
    if (await fs.pathExists(conversionSummaryPath)) {
      finalReport.phases.conversion = await fs.readJSON(conversionSummaryPath);
    }
    
    // Add seeding summary
    const seedingSummaryPath = path.join(CONFIG.directories.jsonOutput, 'seeding-report.json');
    if (await fs.pathExists(seedingSummaryPath)) {
      finalReport.phases.seeding = await fs.readJSON(seedingSummaryPath);
    }
    
    // Calculate totals
    const conversionSummary = finalReport.phases.conversion.summary;
    const seedingSummary = finalReport.phases.seeding.summary;
    
    finalReport.totals = {
      filesProcessed: (conversionSummary?.successfulPDFs || 0) + (conversionSummary?.successfulImages || 0),
      questionsCreated: seedingSummary?.totalQuestionsCreated || 0,
      topicsCreated: seedingSummary?.totalTopicsCreated || 0,
      tagsCreated: seedingSummary?.totalTagsCreated || 0,
      errorsEncountered: (conversionSummary?.failedPDFs || 0) + (conversionSummary?.failedImages || 0) + (seedingSummary?.failedFiles || 0)
    };
    
    // Save final report
    const finalReportPath = path.join(CONFIG.directories.reports, 'final-summary.json');
    await fs.writeJSON(finalReportPath, finalReport, { spaces: 2 });
    
    console.log('✅ Final summary report generated');
    console.log(`📁 Report saved to: ${finalReportPath}`);
    
  } catch (error) {
    console.warn('⚠️ Failed to generate final summary:', error.message);
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
JEE Content Seeding Master Script
=================================

This script manages the complete content seeding process for JEE question papers.

Usage:
  node content-seeding-master.js [COMMAND] [OPTIONS]

Commands:
  --convert-only    Convert PDF/Image files to JSON format only
  --seed-only       Seed database from existing JSON files only
  --full            Run complete process: convert files + seed database (default)
  --help            Show this help message

Options:
  --path, -p           Specify custom content directory path (relative to backend/)
  --verbose            Enable verbose output (default: true)
  --skip-existing      Skip existing JSON files (don't overwrite)
  --no-backup          Don't create backup before overwriting existing files
  --flatten-structure  Don't preserve folder structure (legacy mode)

Examples:
  node content-seeding-master.js --convert-only
  node content-seeding-master.js --seed-only
  node content-seeding-master.js --full
  node content-seeding-master.js --convert-only --path "../content/JEE/Previous Papers/2025"
  node content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025/Session1"
  node content-seeding-master.js --convert-only --skip-existing --path "../content/JEE/Previous Papers/2025"

Process Overview:
  1. Convert PDF/Image files to structured JSON
     - Extract text content and images
     - Process mathematical and chemical equations
     - Identify questions, options, and explanations
     - Generate metadata and categorization

  2. Seed JSON data into database
     - Create topics, subtopics, and tags
     - Insert questions with proper relationships
     - Handle duplicates and validation
     - Generate comprehensive reports

Output:
  - JSON files in ./json-output/
  - Reports in ./json-output/reports/
  - Database seeding with progress tracking

Requirements:
  - Node.js dependencies installed
  - Database connection configured
  - Content files in ../content/ directory

For more information, check the individual script documentation.
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

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  main,
  convertOnly,
  seedOnly,
  fullProcess,
  CONFIG
};
