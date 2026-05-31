// ============================================
// QUESTION SERVICE
// Handles fetching and managing interview questions
// ============================================

const axios = require('axios');

// Sample interview questions database
// In production, this would fetch from LeetCode/HackerRank APIs
const questionDatabase = {
  frontend: {
    easy: [
      {
        id: 'fe-easy-1',
        title: 'Reverse a String',
        description: 'Write a function that reverses a string. The input string is given as an array of characters.',
        difficulty: 'easy',
        category: 'Strings',
        example: 'Input: ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]',
        hint: 'Try using two pointers, one at the beginning and one at the end.',
        solution: 'function reverseString(s) {\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left++;\n    right--;\n  }\n  return s;\n}'
      },
      {
        id: 'fe-easy-2',
        title: 'FizzBuzz',
        description: 'Write a program that outputs the string representation of numbers from 1 to n. For multiples of 3, output "Fizz". For multiples of 5, output "Buzz". For multiples of both, output "FizzBuzz".',
        difficulty: 'easy',
        category: 'Logic',
        example: 'Input: n = 15\nOutput: ["1","2","Fizz","4","Buzz",...,"FizzBuzz"]',
        hint: 'Check divisibility by 15 first, then 3, then 5.',
        solution: 'function fizzBuzz(n) {\n  const result = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) result.push("FizzBuzz");\n    else if (i % 3 === 0) result.push("Fizz");\n    else if (i % 5 === 0) result.push("Buzz");\n    else result.push(String(i));\n  }\n  return result;\n}'
      },
      {
        id: 'fe-easy-3',
        title: 'Debounce Function',
        description: 'Implement a debounce function that delays invoking a function until after a specified wait time has elapsed since the last time it was invoked.',
        difficulty: 'easy',
        category: 'JavaScript',
        example: 'Input: func, wait = 100ms\nOutput: debounced function',
        hint: 'Use setTimeout and clearTimeout to manage the delay.',
        solution: 'function debounce(func, wait) {\n  let timeout;\n  return function(...args) {\n    clearTimeout(timeout);\n    timeout = setTimeout(() => func.apply(this, args), wait);\n  };\n}'
      }
    ],
    medium: [
      {
        id: 'fe-medium-1',
        title: 'Implement Promise.all',
        description: 'Implement your own version of Promise.all() that takes an array of promises and returns a single promise that resolves when all promises resolve.',
        difficulty: 'medium',
        category: 'Promises',
        example: 'Input: [promise1, promise2, promise3]\nOutput: Promise with array of results',
        hint: 'Keep track of resolved promises and resolve when count equals input length.',
        solution: 'function promiseAll(promises) {\n  return new Promise((resolve, reject) => {\n    const results = [];\n    let completed = 0;\n    promises.forEach((promise, index) => {\n      Promise.resolve(promise)\n        .then(value => {\n          results[index] = value;\n          completed++;\n          if (completed === promises.length) resolve(results);\n        })\n        .catch(reject);\n    });\n  });\n}'
      },
      {
        id: 'fe-medium-2',
        title: 'Deep Clone Object',
        description: 'Write a function to create a deep clone of a JavaScript object, including nested objects and arrays.',
        difficulty: 'medium',
        category: 'Objects',
        example: 'Input: {a: 1, b: {c: 2}}\nOutput: new object with same structure',
        hint: 'Handle objects, arrays, and primitive types recursively.',
        solution: 'function deepClone(obj) {\n  if (obj === null || typeof obj !== "object") return obj;\n  if (Array.isArray(obj)) return obj.map(deepClone);\n  const cloned = {};\n  for (let key in obj) {\n    if (obj.hasOwnProperty(key)) cloned[key] = deepClone(obj[key]);\n  }\n  return cloned;\n}'
      }
    ],
    hard: [
      {
        id: 'fe-hard-1',
        title: 'Virtual DOM Diff Algorithm',
        description: 'Implement a simplified version of React\'s virtual DOM diffing algorithm.',
        difficulty: 'hard',
        category: 'React',
        example: 'Input: oldVDOM, newVDOM\nOutput: patches to apply',
        hint: 'Compare nodes recursively and generate patch operations.',
        solution: '// Complex implementation - see React source code'
      }
    ]
  },
  backend: {
    easy: [
      {
        id: 'be-easy-1',
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
        difficulty: 'easy',
        category: 'Arrays',
        example: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
        hint: 'Use a hash map to store numbers you\'ve seen.',
        solution: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}'
      },
      {
        id: 'be-easy-2',
        title: 'Valid Palindrome',
        description: 'Given a string s, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.',
        difficulty: 'easy',
        category: 'Strings',
        example: 'Input: "A man, a plan, a canal: Panama"\nOutput: true',
        hint: 'Use two pointers from both ends.',
        solution: 'function isPalindrome(s) {\n  s = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    if (s[left] !== s[right]) return false;\n    left++; right--;\n  }\n  return true;\n}'
      }
    ],
    medium: [
      {
        id: 'be-medium-1',
        title: 'LRU Cache',
        description: 'Design a data structure that follows Least Recently Used (LRU) cache constraints.',
        difficulty: 'medium',
        category: 'Data Structures',
        example: 'Input: capacity = 2, get(1), put(1,1), get(1)\nOutput: -1, null, 1',
        hint: 'Use a hash map combined with a doubly linked list.',
        solution: 'class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.cache = new Map();\n  }\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    this.cache.delete(key);\n    this.cache.set(key, value);\n    if (this.cache.size > this.capacity) {\n      this.cache.delete(this.cache.keys().next().value);\n    }\n  }\n}'
      }
    ],
    hard: [
      {
        id: 'be-hard-1',
        title: 'Merge K Sorted Lists',
        description: 'Merge k sorted linked lists and return it as one sorted list.',
        difficulty: 'hard',
        category: 'Linked Lists',
        example: 'Input: [[1,4,5],[1,3,4],[2,6]]\nOutput: [1,1,2,3,4,4,5,6]',
        hint: 'Use a min heap or divide and conquer approach.',
        solution: '// Use priority queue or divide & conquer'
      }
    ]
  },
  fullstack: {
    easy: [
      {
        id: 'fs-easy-1',
        title: 'REST API Design',
        description: 'Design a RESTful API for a simple blog with posts and comments.',
        difficulty: 'easy',
        category: 'System Design',
        example: 'Define endpoints for CRUD operations',
        hint: 'Use standard HTTP methods and resource-based URLs.',
        solution: 'GET /posts, POST /posts, GET /posts/:id, PUT /posts/:id, DELETE /posts/:id'
      }
    ],
    medium: [
      {
        id: 'fs-medium-1',
        title: 'Rate Limiter',
        description: 'Implement a rate limiter that allows only N requests per minute from each user.',
        difficulty: 'medium',
        category: 'System Design',
        example: 'Limit: 100 requests/min per user',
        hint: 'Use a sliding window or token bucket algorithm.',
        solution: 'class RateLimiter {\n  constructor(limit) {\n    this.limit = limit;\n    this.requests = new Map();\n  }\n  isAllowed(userId) {\n    const now = Date.now();\n    const userRequests = this.requests.get(userId) || [];\n    const recent = userRequests.filter(time => now - time < 60000);\n    if (recent.length < this.limit) {\n      recent.push(now);\n      this.requests.set(userId, recent);\n      return true;\n    }\n    return false;\n  }\n}'
      }
    ],
    hard: []
  }
};

// ============================================
// GET QUESTIONS
// ============================================

async function getQuestions(role, level, company) {
  try {
    // In production, this would fetch from real APIs
    // For now, we'll use our database
    
    const roleQuestions = questionDatabase[role] || questionDatabase.backend;
    const levelQuestions = roleQuestions[level] || roleQuestions.easy;
    
    // Return random subset of questions
    const shuffled = levelQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10); // Return 10 questions
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

// ============================================
// GET HINT FOR QUESTION
// ============================================

async function getHint(questionId) {
  try {
    // Find question in database
    for (const role in questionDatabase) {
      for (const level in questionDatabase[role]) {
        const question = questionDatabase[role][level].find(q => q.id === questionId);
        if (question) {
          return question.hint || 'Think about the problem step by step. What data structure would be most efficient?';
        }
      }
    }
    return 'No hint available for this question.';
  } catch (error) {
    console.error('Error getting hint:', error);
    return 'Error getting hint.';
  }
}

// ============================================
// GET SOLUTION FOR QUESTION
// ============================================

async function getSolution(questionId) {
  try {
    for (const role in questionDatabase) {
      for (const level in questionDatabase[role]) {
        const question = questionDatabase[role][level].find(q => q.id === questionId);
        if (question) {
          return question.solution;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting solution:', error);
    return null;
  }
}

// Export functions
module.exports = {
  getQuestions,
  getHint,
  getSolution
};