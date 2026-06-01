require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Slack OAuth variables
const CLIENT_ID = process.env.SLACK_CLIENT_ID;
const CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const REDIRECT_URI = process.env.SLACK_REDIRECT_URI;

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Slack OAuth callback route
app.get('/slack/oauth/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("Authorization failed.");
  }

  try {
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!response.data.ok) {
      return res.send("Slack authorization failed.");
    }

    res.redirect('/success.html');

  } catch (error) {
    console.error(error);
    res.send("Error during OAuth.");
  }
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Web server running on port ${PORT}`);
});