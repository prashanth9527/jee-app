/**
 * Content Seeding Master Script - Syllabus Only
 * 
 * This script orchestrates the syllabus seeding process:
 * 1. Seeds syllabus JSON data into the database
 * 2. Provides comprehensive reporting and error handling
 * 
 * Usage:
 * - node content-seeding-master.js --syllabus-seed      (Seed syllabus from JSON)
 * - node content-seeding-master.js --syllabus-pdf       (Process PDF and seed syllabus)
 * - node content-seeding-master.js --help               (Show help)
 */

const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const CONFIG = {
  scripts: {
    syllabusSeeder: './scripts/syllabus-seeder.js',
    pdfSyllabusSeeder: './scripts/pdf-syllabus-seeder.js'
  },
  directories: {
    content: '../content',
    reports: './reports'
  },
  options: {
    verbose: true,
    saveLogs: true,
    continueOnError: true
  }
};

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--help';
  
  console.log('🚀 JEE Content Seeding Master Script');
  console.log('====================================');
  console.log(`Command: ${command}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  try {
    switch (command) {
      case '--syllabus-seed':
        await runSyllabusSeeding();
        break;
        
      case '--syllabus-pdf':
        await runPdfSyllabusSeeding();
        break;
        
      case '--help':
        showHelp();
        break;
        
      default:
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
    
    console.log('✅ All operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Master script failed:', error.message);
    if (CONFIG.options.verbose) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * Run syllabus seeding from JSON
 */
async function runSyllabusSeeding() {
  console.log('📚 Phase 1: Seeding syllabus from JSON...');
  console.log('');
  
  try {
    const { stdout, stderr } = await execAsync(`node ${CONFIG.scripts.syllabusSeeder}`);
    
    if (CONFIG.options.verbose && stdout) {
      console.log('Syllabus Seeder Output:');
      console.log(stdout);
    }
    
    if (stderr) {
      console.log('Syllabus Seeder Warnings/Errors:');
      console.log(stderr);
    }
    
    console.log('✅ Syllabus seeding phase completed successfully!');
    
  } catch (error) {
    console.error('❌ Syllabus seeding failed:', error.message);
    if (CONFIG.options.continueOnError) {
      console.log('⚠️ Continuing despite error...');
    } else {
      throw error;
    }
  }
}

/**
 * Run PDF syllabus processing and seeding
 */
async function runPdfSyllabusSeeding() {
  console.log('📄 Phase 1: Processing PDF syllabus and seeding...');
  console.log('');
  
  try {
    const { stdout, stderr } = await execAsync(`node ${CONFIG.scripts.pdfSyllabusSeeder}`);
    
    if (CONFIG.options.verbose && stdout) {
      console.log('PDF Syllabus Seeder Output:');
      console.log(stdout);
    }
    
    if (stderr) {
      console.log('PDF Syllabus Seeder Warnings/Errors:');
      console.log(stderr);
    }
    
    console.log('✅ PDF syllabus processing and seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ PDF syllabus processing failed:', error.message);
    if (CONFIG.options.continueOnError) {
      console.log('⚠️ Continuing despite error...');
    } else {
      throw error;
    }
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log('📖 JEE Content Seeding Master Script - Help');
  console.log('============================================');
  console.log('');
  console.log('Available commands:');
  console.log('');
  console.log('  --syllabus-seed     Seed syllabus from existing JSON file');
  console.log('  --syllabus-pdf      Process PDF syllabus and seed to database');
  console.log('  --help              Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node content-seeding-master.js --syllabus-seed');
  console.log('  node content-seeding-master.js --syllabus-pdf');
  console.log('');
  console.log('Configuration:');
  console.log(`  Syllabus Seeder: ${CONFIG.scripts.syllabusSeeder}`);
  console.log(`  PDF Syllabus Seeder: ${CONFIG.scripts.pdfSyllabusSeeder}`);
  console.log(`  Content Directory: ${CONFIG.directories.content}`);
  console.log('');
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  main,
  CONFIG
};