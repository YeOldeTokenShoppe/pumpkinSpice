#!/bin/bash

# Update tweets cron script
# Add to crontab with: */30 * * * * /path/to/this/script.sh

# Set your site URL and API key
SITE_URL="https://yoursite.com"  # Change this to your actual site URL
API_KEY="your-secure-random-key-here-change-this"  # Should match your .env

# Make the API call
curl -X POST "$SITE_URL/api/update-tweet" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  --fail-with-body \
  --max-time 30 \
  --silent \
  --show-error

# Log the result with timestamp
echo "$(date): Tweet update attempted" >> /tmp/tweet-update.log