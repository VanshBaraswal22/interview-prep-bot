// ============================================
// INTERVIEW PREP BOT - MAIN APPLICATION
// ============================================

// Load environment variables
require('dotenv').config();

// Import required packages
const { App } = require('@slack/bolt');
const cron = require('node-cron');

// Import our custom modules
const questionService = require('./services/questionService');
const aiService = require('./services/aiService');
const userService = require('./services/userService');
const express = require('express');
const webApp = express();
webApp.use(express.static('public'));
webApp.listen(8080, () => console.log('🌐 Dashboard running at http://localhost:8080'));
// ============================================
// INITIALIZE SLACK APP
// ============================================

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

// ============================================
// COMMAND: /interview-prep
// This is the main command to start interview prep
// ============================================

app.command('/interview-prep', async ({ command, ack, client, say }) => {
  // Acknowledge command request
  await ack();

  try {
    // Open a modal for user to enter details
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'interview_setup_modal',
        title: {
          type: 'plain_text',
          text: '🎯 Interview Prep'
        },
        submit: {
          type: 'plain_text',
          text: 'Start Prep'
        },
        close: {
          type: 'plain_text',
          text: 'Cancel'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Welcome to Interview Prep Bot!* 🚀\n\nLet\'s get you ready for your dream job.'
            }
          },
          {
            type: 'divider'
          },
          {
            type: 'input',
            block_id: 'company_block',
            label: {
              type: 'plain_text',
              text: 'Which company are you interviewing with?'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'company_input',
              placeholder: {
                type: 'plain_text',
                text: 'e.g., Google, Meta, Amazon, Netflix'
              }
            }
          },
          {
            type: 'input',
            block_id: 'role_block',
            label: {
              type: 'plain_text',
              text: 'What type of role?'
            },
            element: {
              type: 'static_select',
              action_id: 'role_input',
              placeholder: {
                type: 'plain_text',
                text: 'Select a role type'
              },
              options: [
                {
                  text: { type: 'plain_text', text: 'Frontend Engineer' },
                  value: 'frontend'
                },
                {
                  text: { type: 'plain_text', text: 'Backend Engineer' },
                  value: 'backend'
                },
                {
                  text: { type: 'plain_text', text: 'Full-Stack Engineer' },
                  value: 'fullstack'
                },
                {
                  text: { type: 'plain_text', text: 'Mobile Developer' },
                  value: 'mobile'
                },
                {
                  text: { type: 'plain_text', text: 'DevOps Engineer' },
                  value: 'devops'
                }
              ]
            }
          },
          {
            type: 'input',
            block_id: 'level_block',
            label: {
              type: 'plain_text',
              text: 'What is your experience level?'
            },
            element: {
              type: 'static_select',
              action_id: 'level_input',
              placeholder: {
                type: 'plain_text',
                text: 'Select experience level'
              },
              options: [
                {
                  text: { type: 'plain_text', text: 'Junior (0-2 years)' },
                  value: 'junior'
                },
                {
                  text: { type: 'plain_text', text: 'Mid-Level (2-5 years)' },
                  value: 'mid'
                },
                {
                  text: { type: 'plain_text', text: 'Senior (5+ years)' },
                  value: 'senior'
                }
              ]
            }
          },
          {
            type: 'input',
            block_id: 'timeline_block',
            label: {
              type: 'plain_text',
              text: 'When is your interview?'
            },
            element: {
              type: 'static_select',
              action_id: 'timeline_input',
              placeholder: {
                type: 'plain_text',
                text: 'Select timeline'
              },
              options: [
                {
                  text: { type: 'plain_text', text: 'This week' },
                  value: '1week'
                },
                {
                  text: { type: 'plain_text', text: 'In 2 weeks' },
                  value: '2weeks'
                },
                {
                  text: { type: 'plain_text', text: 'In 1 month' },
                  value: '1month'
                },
                {
                  text: { type: 'plain_text', text: 'More than 1 month' },
                  value: 'flexible'
                }
              ]
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error opening modal:', error);
    await say('❌ Sorry, something went wrong. Please try again.');
  }
});

// ============================================
// HANDLE MODAL SUBMISSION
// ============================================

app.view('interview_setup_modal', async ({ ack, body, view, client }) => {
  // Acknowledge the view submission
  await ack();

  const userId = body.user.id;
  
  // Extract form values
  const values = view.state.values;
  const company = values.company_block.company_input.value;
  const role = values.role_block.role_input.selected_option.value;
  const level = values.level_block.level_input.selected_option.value;
  const timeline = values.timeline_block.timeline_input.selected_option.value;

  try {
    // Save user profile
    await userService.createOrUpdateUser(userId, {
      company,
      role,
      level,
      timeline,
      startedAt: new Date()
    });

    // Send welcome message
    await client.chat.postMessage({
      channel: userId,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎉 Let\'s Get You Ready!',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Great! I'll help you prepare for your *${company}* ${role} interview.\n\n*Your Prep Plan:*\n• Company: ${company}\n• Role: ${role.charAt(0).toUpperCase() + role.slice(1)}\n• Level: ${level.charAt(0).toUpperCase() + level.slice(1)}\n• Timeline: ${getTimelineText(timeline)}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Ready to start your first question?*'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🚀 Start First Question',
                emoji: true
              },
              style: 'primary',
              action_id: 'start_first_question',
              value: `${company}|${role}|${level}`
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📊 View Study Plan',
                emoji: true
              },
              action_id: 'view_study_plan',
              value: `${company}|${role}|${level}`
            }
          ]
        }
      ]
    });

  } catch (error) {
    console.error('Error processing interview setup:', error);
    await client.chat.postMessage({
      channel: userId,
      text: '❌ Sorry, something went wrong setting up your interview prep. Please try again with /interview-prep'
    });
  }
});

// ============================================
// HANDLE: Start First Question Button
// ============================================

app.action('start_first_question', async ({ action, ack, client, body }) => {
  await ack();
  
  const userId = body.user.id;
  const [company, role, level] = action.value.split('|');

  try {
    // Fetch questions based on role and level
    const questions = await questionService.getQuestions(role, level, company);
    
    if (!questions || questions.length === 0) {
      await client.chat.postMessage({
        channel: userId,
        text: '❌ Sorry, couldn\'t fetch questions right now. Please try again later.'
      });
      return;
    }

    // Get first question
    const firstQuestion = questions[0];
    
    // Save current question to user profile
    await userService.setCurrentQuestion(userId, firstQuestion.id);

    // Send the question
    await sendQuestion(client, userId, firstQuestion, 1, questions.length);

  } catch (error) {
    console.error('Error starting questions:', error);
    await client.chat.postMessage({
      channel: userId,
      text: '❌ Error loading questions. Please try again.'
    });
  }
});

// ============================================
// FUNCTION: Send Question to User
// ============================================

async function sendQuestion(client, userId, question, questionNumber, totalQuestions) {
  await client.chat.postMessage({
    channel: userId,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📝 Question ${questionNumber} of ${totalQuestions}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${question.title}*\n\n${question.description}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Difficulty:*\n${getDifficultyEmoji(question.difficulty)} ${question.difficulty}`
          },
          {
            type: 'mrkdwn',
            text: `*Category:*\n${question.category || 'General'}`
          }
        ]
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Example:*\n```' + (question.example || 'Input: [1,2,3]\nOutput: [3,2,1]') + '```'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Submit Solution',
              emoji: true
            },
            style: 'primary',
            action_id: 'submit_solution',
            value: question.id
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '💡 Get Hint',
              emoji: true
            },
            action_id: 'get_hint',
            value: question.id
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '⏭️ Skip Question',
              emoji: true
            },
            action_id: 'skip_question',
            value: question.id
          }
        ]
      }
    ]
  });
}

// ============================================
// HANDLE: Submit Solution Button
// ============================================

app.action('submit_solution', async ({ action, ack, client, body }) => {
  await ack();
  
  const userId = body.user.id;
  const questionId = action.value;

  try {
    // Open modal for code submission
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'submit_code_modal',
        title: {
          type: 'plain_text',
          text: '💻 Submit Solution'
        },
        submit: {
          type: 'plain_text',
          text: 'Submit'
        },
        close: {
          type: 'plain_text',
          text: 'Cancel'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Paste your solution code below:'
            }
          },
          {
            type: 'input',
            block_id: 'code_block',
            label: {
              type: 'plain_text',
              text: 'Your Solution'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'code_input',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'function solution(input) {\n  // Your code here\n  return result;\n}'
              }
            }
          },
          {
            type: 'input',
            block_id: 'approach_block',
            label: {
              type: 'plain_text',
              text: 'Explain your approach (optional)'
            },
            element: {
              type: 'plain_text_input',
              action_id: 'approach_input',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'I used a hash map to...'
              }
            },
            optional: true
          }
        ],
        private_metadata: questionId
      }
    });
  } catch (error) {
    console.error('Error opening solution modal:', error);
  }
});

// ============================================
// HANDLE: Code Submission
// ============================================

app.view('submit_code_modal', async ({ ack, body, view, client }) => {
  await ack();
  
  const userId = body.user.id;
  const questionId = view.private_metadata;
  
  const values = view.state.values;
  const code = values.code_block.code_input.value;
  const approach = values.approach_block.approach_input.value || 'No explanation provided';

  try {
    // Get AI feedback on the solution
    const feedback = await aiService.evaluateCode(code, approach, questionId);
    
    // Save submission to user history
    await userService.saveSubmission(userId, questionId, code, feedback.score);

    // Send feedback to user
    await client.chat.postMessage({
      channel: userId,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ Solution Submitted!',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Your Score: ${feedback.score}/10* ${getScoreEmoji(feedback.score)}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*AI Feedback:*\n${feedback.feedback}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*What You Did Well:*\n${feedback.positives.map(p => `✅ ${p}`).join('\n')}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Areas to Improve:*\n${feedback.improvements.map(i => `⚠️ ${i}`).join('\n')}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Optimal Solution:*\n```' + feedback.optimalSolution + '```'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Time Complexity:* ${feedback.complexity.time}\n*Space Complexity:* ${feedback.complexity.space}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '➡️ Next Question',
                emoji: true
              },
              style: 'primary',
              action_id: 'next_question',
              value: 'next'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📊 View Progress',
                emoji: true
              },
              action_id: 'view_progress',
              value: 'progress'
            }
          ]
        }
      ]
    });

  } catch (error) {
    console.error('Error evaluating code:', error);
    await client.chat.postMessage({
      channel: userId,
      text: '❌ Error evaluating your solution. Please try again.'
    });
  }
});

// ============================================
// HANDLE: Get Hint Button
// ============================================

app.action('get_hint', async ({ action, ack, client, body }) => {
  await ack();
  
  const userId = body.user.id;
  const questionId = action.value;

  try {
    const hint = await questionService.getHint(questionId);
    
    await client.chat.postMessage({
      channel: userId,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `💡 *Hint:*\n${hint}`
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error getting hint:', error);
  }
});

// ============================================
// HANDLE: View Progress
// ============================================

app.action('view_progress', async ({ action, ack, client, body }) => {
  await ack();
  
  const userId = body.user.id;

  try {
    const progress = await userService.getProgress(userId);
    
    await client.chat.postMessage({
      channel: userId,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Your Progress',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Questions Solved:*\n${progress.solved}/${progress.total}`
            },
            {
              type: 'mrkdwn',
              text: `*Average Score:*\n${progress.averageScore}/10`
            },
            {
              type: 'mrkdwn',
              text: `*Success Rate:*\n${progress.successRate}%`
            },
            {
              type: 'mrkdwn',
              text: `*Days Active:*\n${progress.daysActive}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Strong Areas:*\n${progress.strongAreas.map(a => `✅ ${a}`).join('\n')}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Areas to Practice:*\n${progress.weakAreas.map(a => `⚠️ ${a}`).join('\n')}`
          }
        }
      ]
    });
  } catch (error) {
    console.error('Error getting progress:', error);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTimelineText(timeline) {
  const timelineMap = {
    '1week': 'This week',
    '2weeks': 'In 2 weeks',
    '1month': 'In 1 month',
    'flexible': 'Flexible'
  };
  return timelineMap[timeline] || 'Not specified';
}

function getDifficultyEmoji(difficulty) {
  const emojiMap = {
    'easy': '🟢',
    'medium': '🟡',
    'hard': '🔴'
  };
  return emojiMap[difficulty.toLowerCase()] || '⚪';
}

function getScoreEmoji(score) {
  if (score >= 9) return '🔥';
  if (score >= 7) return '👍';
  if (score >= 5) return '👌';
  return '💪';
}
// Handle @mentions

app.event('app_mention', async ({ event, say }) => {
  try {
    await say(
      `👋 Hi <@${event.user}>!\n\nUse the command:\n/interview-prep\n\nto start your interview preparation.`
    );
  } catch (error) {
    console.error('Mention error:', error);
  }
});
app.message(async ({ message, say }) => {
  if (message.subtype) return;

  await say(
    '👋 Hello! Use /interview-prep to begin your interview preparation.'
  );
});
// ============================================
// START THE APP
// ============================================

(async () => {
  try {
    await app.start();
    console.log('⚡️ Interview Prep Bot is running!');
    console.log('✅ Connected to Slack');
    console.log('🚀 Ready to help developers prepare for interviews!');
  } catch (error) {
    console.error('❌ Error starting app:', error);
    process.exit(1);
  }
})();
const PORT = process.env.PORT || 3000;

webApp.get("/", (req, res) => {
  res.send("Interview Prep Bot is running");
});

webApp.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

// Export app for testing
module.exports = { app };