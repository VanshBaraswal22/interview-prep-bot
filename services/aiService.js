// ============================================
// AI SERVICE
// Handles AI-powered code evaluation
// ============================================

const questionService = require('./questionService');

// ============================================
// EVALUATE CODE SUBMISSION
// ============================================

async function evaluateCode(code, approach, questionId) {
  try {
    // Get the optimal solution for comparison
    const optimalSolution = await questionService.getSolution(questionId);
    
    // Simulate AI evaluation
    // In production, this would use actual AI/ML models
    const evaluation = simulateAIEvaluation(code, approach, optimalSolution);
    
    return evaluation;
    
  } catch (error) {
    console.error('Error evaluating code:', error);
    return getDefaultFeedback();
  }
}

// ============================================
// SIMULATE AI EVALUATION
// (In production, use actual AI models)
// ============================================

function simulateAIEvaluation(code, approach, optimalSolution) {
  // Basic code analysis
  const codeLength = code.length;
  const hasComments = code.includes('//') || code.includes('/*');
  const hasGoodVariableNames = !code.match(/\b[a-z]\b/g); // Single letter vars
  const hasLoops = code.includes('for') || code.includes('while');
  const usesModernSyntax = code.includes('=>') || code.includes('const') || code.includes('let');
  
  // Calculate score
  let score = 5; // Base score
  
  if (codeLength > 50) score += 1;
  if (hasComments) score += 1;
  if (hasGoodVariableNames) score += 1;
  if (usesModernSyntax) score += 1;
  if (approach.length > 20) score += 1;
  
  // Cap at 10
  score = Math.min(score, 10);
  
  // Generate feedback
  const positives = [];
  const improvements = [];
  
  if (usesModernSyntax) {
    positives.push('Good use of modern JavaScript syntax (const/let, arrow functions)');
  } else {
    improvements.push('Consider using modern JavaScript syntax (const, let, arrow functions)');
  }
  
  if (hasComments) {
    positives.push('Code is well commented');
  } else {
    improvements.push('Add comments to explain your logic');
  }
  
  if (hasGoodVariableNames) {
    positives.push('Variable names are descriptive');
  } else {
    improvements.push('Use more descriptive variable names instead of single letters');
  }
  
  if (approach.length > 20) {
    positives.push('Good explanation of your approach');
  } else {
    improvements.push('Provide a more detailed explanation of your approach');
  }
  
  // Add default positives/improvements if empty
  if (positives.length === 0) {
    positives.push('You attempted the problem');
    positives.push('Code structure is reasonable');
  }
  
  if (improvements.length === 0) {
    improvements.push('Consider edge cases (empty input, null values)');
    improvements.push('Think about time and space complexity');
  }
  
  // Generate complexity analysis
  const complexity = analyzeComplexity(code);
  
  return {
    score,
    feedback: generateFeedback(score),
    positives,
    improvements,
    optimalSolution: optimalSolution || code,
    complexity
  };
}

// ============================================
// GENERATE FEEDBACK BASED ON SCORE
// ============================================

function generateFeedback(score) {
  if (score >= 9) {
    return '🔥 Excellent work! Your solution is very well implemented. You demonstrate strong problem-solving skills and code quality.';
  } else if (score >= 7) {
    return '👍 Good job! Your solution works well. With a few minor improvements, it could be even better.';
  } else if (score >= 5) {
    return '👌 Nice effort! Your solution is on the right track. Focus on the improvement areas to make it production-ready.';
  } else {
    return '💪 Keep practicing! Review the optimal solution and try to understand the approach. You\'re learning!';
  }
}

// ============================================
// ANALYZE CODE COMPLEXITY
// ============================================

function analyzeComplexity(code) {
  let time = 'O(n)';
  let space = 'O(1)';
  
  // Simple heuristics
  const nestedLoops = (code.match(/for|while/g) || []).length;
  const usesMap = code.includes('Map') || code.includes('Set') || code.includes('{}');
  const usesArray = code.includes('[') || code.includes('Array');
  
  if (nestedLoops >= 2) {
    time = 'O(n²)';
  } else if (nestedLoops === 1) {
    time = 'O(n)';
  } else {
    time = 'O(1)';
  }
  
  if (usesMap || usesArray) {
    space = 'O(n)';
  }
  
  return { time, space };
}

// ============================================
// DEFAULT FEEDBACK
// ============================================

function getDefaultFeedback() {
  return {
    score: 5,
    feedback: 'Thanks for your submission! Keep practicing.',
    positives: ['You attempted the problem'],
    improvements: ['Review the problem requirements', 'Consider edge cases'],
    optimalSolution: '// Solution not available',
    complexity: { time: 'Unknown', space: 'Unknown' }
  };
}

// Export functions
module.exports = {
  evaluateCode
};