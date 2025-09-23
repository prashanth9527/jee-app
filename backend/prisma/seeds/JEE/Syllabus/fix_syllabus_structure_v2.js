const fs = require('fs');
const path = require('path');

// Read the original file
const filePath = path.join(__dirname, 'JEE_2025_Syllabus_with_stream_fixed_v2.json');
const originalData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

console.log('Original structure:');
console.log(`Total subjects: ${originalData.subjects.length}`);
originalData.subjects.forEach((subject, index) => {
  console.log(`${subject.subject} lessons: ${subject.lessons.length}`);
});

// Function to fix the malformed structure
function fixSubjectStructure(subject) {
  const newLessons = [];
  let currentLesson = null;
  let currentTopics = [];
  
  for (const lesson of subject.lessons) {
    const lessonName = lesson.lesson;
    const topics = lesson.topics || [];
    
    // Check if this lesson name looks like a concatenated topic list
    const isConcatenatedTopics = lessonName.includes(',') && 
                                 lessonName.length > 100 && 
                                 !lessonName.startsWith('UNIT');
    
    if (isConcatenatedTopics) {
      // This is actually topics, not a lesson name
      // Split by comma and add as topics
      const topicStrings = lessonName.split(',').map(t => t.trim()).filter(t => t.length > 0);
      currentTopics.push(...topicStrings);
      
      // Also add the structured topics
      topics.forEach(topic => {
        if (typeof topic === 'object' && topic.topic) {
          currentTopics.push(topic.topic);
        } else if (typeof topic === 'string') {
          currentTopics.push(topic);
        }
      });
    } else {
      // This is a proper lesson name
      // Save previous lesson if it exists
      if (currentLesson) {
        newLessons.push({
          lesson: currentLesson,
          topics: currentTopics
        });
      }
      
      // Start new lesson
      currentLesson = lessonName;
      currentTopics = [];
      
      // Add topics from this lesson
      topics.forEach(topic => {
        if (typeof topic === 'object' && topic.topic) {
          currentTopics.push(topic.topic);
        } else if (typeof topic === 'string') {
          currentTopics.push(topic);
        }
      });
    }
  }
  
  // Don't forget the last lesson
  if (currentLesson) {
    newLessons.push({
      lesson: currentLesson,
      topics: currentTopics
    });
  }
  
  return {
    ...subject,
    lessons: newLessons
  };
}

// Fix the structure
const fixedData = {
  ...originalData,
  subjects: originalData.subjects.map(fixSubjectStructure)
};

console.log('\nFixed structure:');
fixedData.subjects.forEach((subject, index) => {
  console.log(`${subject.subject} lessons: ${subject.lessons.length}`);
});

// Show sample of fixed structure for each subject
fixedData.subjects.forEach((subject, subjectIndex) => {
  console.log(`\nSample ${subject.subject} lessons:`);
  subject.lessons.slice(0, 3).forEach((lesson, index) => {
    console.log(`${index + 1}. ${lesson.lesson}`);
    console.log(`   Topics: ${lesson.topics.length}`);
    if (lesson.topics.length > 0) {
      console.log(`   Sample topics: ${lesson.topics.slice(0, 3).join(', ')}`);
    }
  });
  if (subject.lessons.length > 3) {
    console.log(`   ... and ${subject.lessons.length - 3} more lessons`);
  }
});

// Write the fixed file
const fixedFilePath = path.join(__dirname, 'JEE_2025_Syllabus_with_stream_fixed_v2.json');
fs.writeFileSync(fixedFilePath, JSON.stringify(fixedData, null, 2));

console.log(`\nFixed file written to: ${fixedFilePath}`);



