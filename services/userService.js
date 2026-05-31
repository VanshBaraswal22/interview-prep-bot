// ============================================
// USER SERVICE
// Handles user data and progress tracking
// ============================================

// In-memory storage (in production, use a real database)
const users = new Map();
const submissions = new Map();

// ============================================
// CREATE OR UPDATE USER
// ============================================

async function createOrUpdateUser(userId, profileData) {
  try {
    const existingUser = users.get(userId) || {};
    
    const updatedUser = {
      ...existingUser,
      ...profileData,
      lastUpdated: new Date()
    };
    
    users.set(userId, updatedUser);
    return updatedUser;
    
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

// ============================================
// SET CURRENT QUESTION
// ============================================

async function setCurrentQuestion(userId, questionId) {
  try {
    const user = users.get(userId) || {};
    user.currentQuestionId = questionId;
    user.currentQuestionStartedAt = new Date();
    users.set(userId, user);
    
  } catch (error) {
    console.error('Error setting current question:', error);
  }
}

// ============================================
// SAVE SUBMISSION
// ============================================

async function saveSubmission(userId, questionId, code, score) {
  try {
    const userSubmissions = submissions.get(userId) || [];
    
    const submission = {
      questionId,
      code,
      score,
      submittedAt: new Date()
    };
    
    userSubmissions.push(submission);
    submissions.set(userId, userSubmissions);
    
    return submission;
    
  } catch (error) {
    console.error('Error saving submission:', error);
    throw error;
  }
}

// ============================================
// GET USER PROGRESS
// ============================================

async function getProgress(userId) {
  try {
    const user = users.get(userId) || {};
    const userSubmissions = submissions.get(userId) || [];
    
    // Calculate statistics
    const solved = userSubmissions.length;
    const total = 20; // Total questions available
    
    const totalScore = userSubmissions.reduce((sum, sub) => sum + sub.score, 0);
    const averageScore = solved > 0 ? (totalScore / solved).toFixed(1) : 0;
    
    const successRate = solved > 0 ? Math.round((userSubmissions.filter(s => s.score >= 7).length / solved) * 100) : 0;
    
    const startDate = user.startedAt || new Date();
    const daysActive = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    
    // Analyze strong and weak areas
    const topicScores = {};
    userSubmissions.forEach(sub => {
      const topic = sub.questionId.split('-')[0]; // Extract topic from ID
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(sub.score);
    });
    
    const strongAreas = [];
    const weakAreas = [];
    
    for (const topic in topicScores) {
      const avgScore = topicScores[topic].reduce((a, b) => a + b, 0) / topicScores[topic].length;
      if (avgScore >= 7) {
        strongAreas.push(getTopicName(topic));
      } else {
        weakAreas.push(getTopicName(topic));
      }
    }
    
    if (strongAreas.length === 0) strongAreas.push('Keep practicing!');
    if (weakAreas.length === 0) weakAreas.push('None yet - great job!');
    
    return {
      solved,
      total,
      averageScore,
      successRate,
      daysActive,
      strongAreas,
      weakAreas
    };
    
  } catch (error) {
    console.error('Error getting progress:', error);
    return {
      solved: 0,
      total: 20,
      averageScore: 0,
      successRate: 0,
      daysActive: 0,
      strongAreas: ['Keep practicing!'],
      weakAreas: ['Start solving questions']
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTopicName(code) {
  const topicMap = {
    'fe': 'Frontend',
    'be': 'Backend',
    'fs': 'Full-Stack'
  };
  return topicMap[code] || 'General';
}

// Export functions
module.exports = {
  createOrUpdateUser,
  setCurrentQuestion,
  saveSubmission,
  getProgress
};