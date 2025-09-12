'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import SubscriptionGuard from '@/components/SubscriptionGuard';

interface StreamInfo {
  name: string;
  code: string;
  fullName: string;
  notifications: string[];
  importantDates: { event: string; date: string; description: string }[];
  syllabus: { subject: string; topics: string[] }[];
  cutoffRanks: { institute: string; branch: string; openingRank: string; closingRank: string; year: string }[];
  examPattern: { section: string; questions: string; marks: string; duration: string }[];
  eligibility: string[];
  applicationFee: string;
  examCenters: string;
  website: string;
}

const streamData: Record<string, StreamInfo> = {
  JEE: {
    name: 'JEE (Joint Entrance Examination)',
    code: 'JEE',
    fullName: 'Joint Entrance Examination for IITs, NITs, and other engineering colleges',
    notifications: [
      'JEE Main 2025 registration will start from December 2024',
      'JEE Advanced 2025 will be conducted by IIT Madras',
      'New pattern introduced with 25% weightage to Class 12 board marks',
      'Computer-based test (CBT) mode for all sessions',
      'Multiple attempts allowed (January, April, May, June 2025)',
      'Aadhaar card mandatory for registration',
      'Category-wise reservation as per government norms'
    ],
    importantDates: [
      { event: 'JEE Main 2025 Registration Start', date: 'December 15, 2024', description: 'Online registration begins for all sessions' },
      { event: 'JEE Main Session 1', date: 'January 24-31, 2025', description: 'First session of JEE Main 2025' },
      { event: 'JEE Main Session 2', date: 'April 1-15, 2025', description: 'Second session of JEE Main 2025' },
      { event: 'JEE Main Session 3', date: 'May 1-15, 2025', description: 'Third session of JEE Main 2025' },
      { event: 'JEE Main Session 4', date: 'June 1-15, 2025', description: 'Fourth session of JEE Main 2025' },
      { event: 'JEE Advanced Registration', date: 'May 20-25, 2025', description: 'Registration for JEE Advanced 2025' },
      { event: 'JEE Advanced 2025', date: 'June 22, 2025', description: 'JEE Advanced examination' },
      { event: 'JEE Advanced Result', date: 'July 10, 2025', description: 'Declaration of JEE Advanced results' },
      { event: 'JoSAA Counselling', date: 'July 15-30, 2025', description: 'Joint Seat Allocation Authority counselling' }
    ],
    syllabus: [
      {
        subject: 'Physics',
        topics: [
          'Mechanics: Laws of motion, Work, Energy, Power',
          'Thermodynamics: Heat, Temperature, Kinetic theory',
          'Electromagnetism: Electric field, Magnetic field, Electromagnetic waves',
          'Optics: Ray optics, Wave optics, Interference, Diffraction',
          'Modern Physics: Photoelectric effect, Atomic structure, Nuclear physics'
        ]
      },
      {
        subject: 'Chemistry',
        topics: [
          'Physical Chemistry: Thermodynamics, Chemical kinetics, Electrochemistry',
          'Organic Chemistry: Hydrocarbons, Alcohols, Aldehydes, Ketones, Carboxylic acids',
          'Inorganic Chemistry: Periodic table, Chemical bonding, Coordination compounds',
          'Analytical Chemistry: Qualitative analysis, Quantitative analysis'
        ]
      },
      {
        subject: 'Mathematics',
        topics: [
          'Algebra: Complex numbers, Quadratic equations, Matrices, Determinants',
          'Calculus: Differentiation, Integration, Applications',
          'Geometry: Coordinate geometry, 3D geometry, Vectors',
          'Trigonometry: Trigonometric functions, Identities, Equations',
          'Statistics & Probability: Mean, Median, Mode, Probability'
        ]
      }
    ],
    cutoffRanks: [
      { institute: 'IIT Bombay', branch: 'Computer Science', openingRank: '1', closingRank: '63', year: '2024' },
      { institute: 'IIT Delhi', branch: 'Computer Science', openingRank: '1', closingRank: '89', year: '2024' },
      { institute: 'IIT Madras', branch: 'Computer Science', openingRank: '1', closingRank: '112', year: '2024' },
      { institute: 'IIT Kanpur', branch: 'Computer Science', openingRank: '1', closingRank: '156', year: '2024' },
      { institute: 'IIT Kharagpur', branch: 'Computer Science', openingRank: '1', closingRank: '178', year: '2024' },
      { institute: 'IIT Bombay', branch: 'Electrical Engineering', openingRank: '64', closingRank: '234', year: '2024' },
      { institute: 'IIT Delhi', branch: 'Mechanical Engineering', openingRank: '90', closingRank: '456', year: '2024' },
      { institute: 'IIT Madras', branch: 'Civil Engineering', openingRank: '113', closingRank: '789', year: '2024' },
      { institute: 'NIT Trichy', branch: 'Computer Science', openingRank: '234', closingRank: '567', year: '2024' },
      { institute: 'NIT Warangal', branch: 'Electrical Engineering', openingRank: '456', closingRank: '890', year: '2024' }
    ],
    examPattern: [
      { section: 'Physics', questions: '25', marks: '100', duration: '3 hours total' },
      { section: 'Chemistry', questions: '25', marks: '100', duration: '3 hours total' },
      { section: 'Mathematics', questions: '25', marks: '100', duration: '3 hours total' },
      { section: 'Total', questions: '75', marks: '300', duration: '3 hours' }
    ],
    eligibility: [
      'Passed Class 12 or equivalent examination',
      'Minimum 75% marks in Class 12 (65% for SC/ST/PwD)',
      'Must have studied Physics, Chemistry, and Mathematics',
      'Age limit: Born on or after October 1, 2000',
      'Maximum 3 attempts for JEE Advanced',
      'Must qualify JEE Main to appear for JEE Advanced'
    ],
    applicationFee: '₹1000 for General/OBC, ₹500 for SC/ST/PwD',
    examCenters: 'Over 500 cities across India and abroad',
    website: 'https://jeemain.nta.nic.in'
  },
  NEET: {
    name: 'NEET (National Eligibility cum Entrance Test)',
    code: 'NEET',
    fullName: 'National Eligibility cum Entrance Test for medical courses',
    notifications: [
      'NEET 2025 registration expected to start in March 2025',
      'Single entrance test for all medical courses in India',
      'Aadhaar card mandatory for registration',
      'Age limit: Minimum 17 years, Maximum 25 years (30 for reserved categories)',
      'Maximum 3 attempts allowed',
      'Computer-based test with OMR sheet',
      'Negative marking: -1 mark for each wrong answer'
    ],
    importantDates: [
      { event: 'NEET 2025 Registration Start', date: 'March 1, 2025', description: 'Online registration begins' },
      { event: 'Last Date for Registration', date: 'April 15, 2025', description: 'Final date to submit application' },
      { event: 'Admit Card Release', date: 'May 1, 2025', description: 'Download admit card from official website' },
      { event: 'NEET 2025 Examination', date: 'May 5, 2025', description: 'National level medical entrance test' },
      { event: 'Answer Key Release', date: 'May 10, 2025', description: 'Provisional answer key available' },
      { event: 'Result Declaration', date: 'June 15, 2025', description: 'NEET 2025 results announced' },
      { event: 'Counselling Registration', date: 'June 20, 2025', description: 'MCC counselling registration starts' }
    ],
    syllabus: [
      {
        subject: 'Physics',
        topics: [
          'Mechanics: Laws of motion, Work, Energy, Power',
          'Thermodynamics: Heat, Temperature, Kinetic theory',
          'Electromagnetism: Electric field, Magnetic field',
          'Optics: Ray optics, Wave optics',
          'Modern Physics: Photoelectric effect, Atomic structure'
        ]
      },
      {
        subject: 'Chemistry',
        topics: [
          'Physical Chemistry: Thermodynamics, Chemical kinetics',
          'Organic Chemistry: Hydrocarbons, Alcohols, Aldehydes, Ketones',
          'Inorganic Chemistry: Periodic table, Chemical bonding',
          'Biomolecules: Carbohydrates, Proteins, Nucleic acids'
        ]
      },
      {
        subject: 'Biology',
        topics: [
          'Botany: Plant morphology, Plant physiology, Plant reproduction',
          'Zoology: Animal diversity, Human physiology, Human reproduction',
          'Cell Biology: Cell structure, Cell division, Genetics',
          'Ecology: Ecosystem, Environmental issues, Biodiversity'
        ]
      }
    ],
    cutoffRanks: [
      { institute: 'AIIMS Delhi', branch: 'MBBS', openingRank: '1', closingRank: '72', year: '2024' },
      { institute: 'JIPMER Puducherry', branch: 'MBBS', openingRank: '1', closingRank: '150', year: '2024' },
      { institute: 'Maulana Azad Medical College', branch: 'MBBS', openingRank: '73', closingRank: '234', year: '2024' },
      { institute: 'Lady Hardinge Medical College', branch: 'MBBS', openingRank: '151', closingRank: '456', year: '2024' },
      { institute: 'Vardhman Mahavir Medical College', branch: 'MBBS', openingRank: '235', closingRank: '567', year: '2024' },
      { institute: 'University College of Medical Sciences', branch: 'MBBS', openingRank: '457', closingRank: '789', year: '2024' },
      { institute: 'Government Medical College Chandigarh', branch: 'MBBS', openingRank: '568', closingRank: '890', year: '2024' },
      { institute: 'Government Medical College Patiala', branch: 'MBBS', openingRank: '790', closingRank: '1234', year: '2024' }
    ],
    examPattern: [
      { section: 'Physics', questions: '45', marks: '180', duration: '3 hours 20 minutes total' },
      { section: 'Chemistry', questions: '45', marks: '180', duration: '3 hours 20 minutes total' },
      { section: 'Biology', questions: '90', marks: '360', duration: '3 hours 20 minutes total' },
      { section: 'Total', questions: '180', marks: '720', duration: '3 hours 20 minutes' }
    ],
    eligibility: [
      'Passed Class 12 with Physics, Chemistry, Biology/Biotechnology',
      'Minimum 50% marks in PCB (40% for SC/ST/OBC)',
      'Age: Minimum 17 years, Maximum 25 years (30 for reserved)',
      'Indian nationals or OCI/PIO candidates',
      'Maximum 3 attempts allowed',
      'Must have studied English in Class 12'
    ],
    applicationFee: '₹1600 for General/OBC, ₹900 for SC/ST/PwD',
    examCenters: 'Over 400 cities across India',
    website: 'https://neet.nta.nic.in'
  },
  CLAT: {
    name: 'CLAT (Common Law Admission Test)',
    code: 'CLAT',
    fullName: 'Common Law Admission Test for National Law Universities',
    notifications: [
      'CLAT 2025 registration expected to start in January 2025',
      'Computer-based test (CBT) mode',
      'No negative marking for wrong answers',
      'Age limit: No upper age limit',
      'Multiple attempts allowed',
      'Aadhaar card mandatory for registration',
      'English medium examination'
    ],
    importantDates: [
      { event: 'CLAT 2025 Registration Start', date: 'January 15, 2025', description: 'Online registration begins' },
      { event: 'Last Date for Registration', date: 'March 31, 2025', description: 'Final date to submit application' },
      { event: 'Admit Card Release', date: 'May 1, 2025', description: 'Download admit card' },
      { event: 'CLAT 2025 Examination', date: 'May 15, 2025', description: 'Computer-based test' },
      { event: 'Answer Key Release', date: 'May 20, 2025', description: 'Provisional answer key' },
      { event: 'Result Declaration', date: 'June 10, 2025', description: 'CLAT 2025 results' },
      { event: 'Counselling Registration', date: 'June 15, 2025', description: 'NLU counselling starts' }
    ],
    syllabus: [
      {
        subject: 'English Language',
        topics: [
          'Reading comprehension passages',
          'Grammar and vocabulary',
          'Verbal ability and reasoning',
          'Legal terminology and concepts'
        ]
      },
      {
        subject: 'Current Affairs & General Knowledge',
        topics: [
          'National and international events',
          'Legal developments and judgments',
          'Political and economic news',
          'Sports, arts, and culture'
        ]
      },
      {
        subject: 'Legal Reasoning',
        topics: [
          'Legal principles and maxims',
          'Case law analysis',
          'Constitutional law basics',
          'Criminal and civil law concepts'
        ]
      },
      {
        subject: 'Logical Reasoning',
        topics: [
          'Analytical reasoning',
          'Logical sequences',
          'Blood relations',
          'Direction sense and coding'
        ]
      },
      {
        subject: 'Quantitative Techniques',
        topics: [
          'Basic mathematics',
          'Data interpretation',
          'Graphs and charts',
          'Percentage and profit-loss'
        ]
      }
    ],
    cutoffRanks: [
      { institute: 'NLSIU Bangalore', branch: 'BA LLB (Hons)', openingRank: '1', closingRank: '98', year: '2024' },
      { institute: 'NALSAR Hyderabad', branch: 'BA LLB (Hons)', openingRank: '1', closingRank: '123', year: '2024' },
      { institute: 'NLIU Bhopal', branch: 'BA LLB (Hons)', openingRank: '1', closingRank: '156', year: '2024' },
      { institute: 'WBNUJS Kolkata', branch: 'BA LLB (Hons)', openingRank: '1', closingRank: '178', year: '2024' },
      { institute: 'NLU Jodhpur', branch: 'BA LLB (Hons)', openingRank: '1', closingRank: '234', year: '2024' },
      { institute: 'HNLU Raipur', branch: 'BA LLB (Hons)', openingRank: '1', closingRank: '456', year: '2024' },
      { institute: 'GLC Mumbai', branch: 'LLB', openingRank: '234', closingRank: '567', year: '2024' },
      { institute: 'ILS Pune', branch: 'LLB', openingRank: '456', closingRank: '789', year: '2024' }
    ],
    examPattern: [
      { section: 'English Language', questions: '28-32', marks: '28-32', duration: '2 hours total' },
      { section: 'Current Affairs & GK', questions: '35-39', marks: '35-39', duration: '2 hours total' },
      { section: 'Legal Reasoning', questions: '35-39', marks: '35-39', duration: '2 hours total' },
      { section: 'Logical Reasoning', questions: '28-32', marks: '28-32', duration: '2 hours total' },
      { section: 'Quantitative Techniques', questions: '13-17', marks: '13-17', duration: '2 hours total' },
      { section: 'Total', questions: '150', marks: '150', duration: '2 hours' }
    ],
    eligibility: [
      'Class 12 or equivalent examination passed',
      'Minimum 45% marks (40% for SC/ST)',
      'No upper age limit for UG programs',
      'Indian nationals or OCI/PIO candidates',
      'Must have studied English in Class 12',
      'Appearing candidates can also apply'
    ],
    applicationFee: '₹4000 for General/OBC, ₹3500 for SC/ST/PwD',
    examCenters: 'Over 150 cities across India',
    website: 'https://consortiumofnlus.ac.in'
  },
  COMPETITIVE: {
    name: 'Other Competitive Exams',
    code: 'COMPETITIVE',
    fullName: 'Various competitive examinations for different fields',
    notifications: [
      'Multiple competitive exams available for different career paths',
      'Each exam has its own eligibility criteria and application process',
      'Regular updates on exam schedules and notifications',
      'Specialized preparation required for each exam type',
      'Various government and private sector opportunities',
      'Different age limits and educational requirements'
    ],
    importantDates: [
      { event: 'UPSC CSE 2025', date: 'May 26, 2025', description: 'Civil Services Preliminary Examination' },
      { event: 'CAT 2025', date: 'November 24, 2025', description: 'Common Admission Test for MBA' },
      { event: 'GATE 2025', date: 'February 1-8, 2025', description: 'Graduate Aptitude Test in Engineering' },
      { event: 'SSC CGL 2025', date: 'September 2025', description: 'Staff Selection Commission Combined Graduate Level' },
      { event: 'Bank PO 2025', date: 'October 2025', description: 'Bank Probationary Officer Examination' },
      { event: 'CDS 2025', date: 'April 2025', description: 'Combined Defence Services Examination' }
    ],
    syllabus: [
      {
        subject: 'General Studies',
        topics: [
          'Current Affairs and General Knowledge',
          'Indian History and Geography',
          'Indian Polity and Constitution',
          'Economics and Social Development',
          'Science and Technology',
          'Environment and Ecology'
        ]
      },
      {
        subject: 'Quantitative Aptitude',
        topics: [
          'Number System and Arithmetic',
          'Algebra and Geometry',
          'Data Interpretation',
          'Logical Reasoning',
          'Mathematical Operations'
        ]
      },
      {
        subject: 'English Language',
        topics: [
          'Reading Comprehension',
          'Grammar and Vocabulary',
          'Verbal Ability',
          'Writing Skills',
          'Communication Skills'
        ]
      }
    ],
    cutoffRanks: [
      { institute: 'UPSC CSE', branch: 'IAS', openingRank: '1', closingRank: '1000', year: '2024' },
      { institute: 'CAT', branch: 'MBA', openingRank: '1', closingRank: '5000', year: '2024' },
      { institute: 'GATE', branch: 'M.Tech', openingRank: '1', closingRank: '10000', year: '2024' },
      { institute: 'SSC CGL', branch: 'Group A', openingRank: '1', closingRank: '2000', year: '2024' },
      { institute: 'Bank PO', branch: 'Probationary Officer', openingRank: '1', closingRank: '5000', year: '2024' }
    ],
    examPattern: [
      { section: 'General Studies', questions: '100', marks: '200', duration: '2 hours' },
      { section: 'Quantitative Aptitude', questions: '50', marks: '100', duration: '1 hour' },
      { section: 'English Language', questions: '50', marks: '100', duration: '1 hour' },
      { section: 'Total', questions: '200', marks: '400', duration: '4 hours' }
    ],
    eligibility: [
      'Varies by exam type and level',
      'Generally requires graduation or equivalent',
      'Age limits vary (18-32 years typically)',
      'Indian nationality required for most exams',
      'Specific educational qualifications for each exam',
      'Physical standards for certain exams (defence, police)'
    ],
    applicationFee: 'Varies from ₹100 to ₹2000 depending on exam',
    examCenters: 'Multiple cities across India',
    website: 'Various official websites'
  }
};

export default function InformationPage() {
  const { user } = useAuth();
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (user?.stream?.code) {
        const info = streamData[user.stream.code];
        setStreamInfo(info);
      } else {
        // User doesn't have a stream assigned
        setStreamInfo(null);
      }
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading stream information...</p>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  if (!streamInfo) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
                <h1 className="text-3xl font-bold mb-2">Stream Information</h1>
                <p className="text-orange-100">Select your stream to view exam information</p>
              </div>

              {/* No Stream Assigned Message */}
              <div className="bg-white rounded-lg shadow p-8">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Stream Assigned</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't been assigned to a specific exam stream yet. Please contact your administrator to set up your stream preference.
                  </p>
                  
                  {/* Stream Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    {Object.entries(streamData).map(([code, info]) => (
                      <div key={code} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-semibold text-gray-900 mb-2">{info.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{info.fullName}</p>
                        <div className="text-xs text-gray-500">
                          <div>• {info.examPattern.length} sections</div>
                          <div>• {info.importantDates.length} key dates</div>
                          <div>• {info.cutoffRanks.length} institutes</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <SubscriptionGuard>
        <StudentLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">{streamInfo.name} Information</h1>
              <p className="text-blue-100">{streamInfo.fullName}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <h3 className="font-semibold text-gray-800">Exam Mode</h3>
                <p className="text-2xl font-bold text-blue-600">CBT</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <h3 className="font-semibold text-gray-800">Duration</h3>
                <p className="text-2xl font-bold text-green-600">3 Hours</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                <h3 className="font-semibold text-gray-800">Total Marks</h3>
                <p className="text-2xl font-bold text-purple-600">300</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                <h3 className="font-semibold text-gray-800">Attempts</h3>
                <p className="text-2xl font-bold text-orange-600">3</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notifications */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Latest Notifications
                  </h2>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {streamInfo.notifications.map((notification, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                        <span className="text-gray-700">{notification}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Important Dates */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Important Dates 2025
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {streamInfo.importantDates.map((date, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <div className="font-semibold text-gray-900">{date.event}</div>
                        <div className="text-green-600 font-medium">{date.date}</div>
                        <div className="text-sm text-gray-600">{date.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Syllabus */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Detailed Syllabus
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {streamInfo.syllabus.map((subject, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-3 border-b pb-2">{subject.subject}</h3>
                      <ul className="space-y-2">
                        {subject.topics.map((topic, topicIndex) => (
                          <li key={topicIndex} className="flex items-start">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2"></div>
                            <span className="text-sm text-gray-700">{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cutoff Ranks */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Cutoff Ranks {streamInfo.cutoffRanks[0]?.year}
                </h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institute</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Rank</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {streamInfo.cutoffRanks.map((cutoff, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cutoff.institute}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cutoff.branch}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{cutoff.openingRank}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{cutoff.closingRank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exam Pattern */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Exam Pattern
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {streamInfo.examPattern.map((section, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{section.section}</span>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">{section.questions} questions</div>
                          <div className="text-sm text-gray-600">{section.marks} marks</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Eligibility & Details */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 text-teal-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Eligibility & Details
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Eligibility Criteria:</h3>
                      <ul className="space-y-2">
                        {streamInfo.eligibility.map((criteria, index) => (
                          <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 mr-2"></div>
                            <span className="text-sm text-gray-700">{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Application Fee:</span>
                          <span className="text-sm text-gray-900">{streamInfo.applicationFee}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Exam Centers:</span>
                          <span className="text-sm text-gray-900">{streamInfo.examCenters}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Official Website:</span>
                          <a href={streamInfo.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            Visit Website
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 