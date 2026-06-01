document.addEventListener("DOMContentLoaded", function () {

  const slackButton = document.querySelectorAll(".btn-primary, .nav-cta");

  slackButton.forEach(btn => {
    btn.href = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=app_mentions:read,chat:write,commands,im:write,users:read&redirect_uri=${SLACK_REDIRECT_URI}`;
  });

});