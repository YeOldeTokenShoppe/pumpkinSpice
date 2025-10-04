#!/bin/bash

# Tweet Updater Script
# Usage: ./update-tweet.sh

echo "🐦 Tweet Embed Updater"
echo "======================"
echo ""
echo "Instructions:"
echo "1. Go to any tweet on Twitter/X"
echo "2. Click the '...' menu → 'Embed Tweet'"
echo "3. Copy the entire embed code"
echo "4. Paste it below when prompted"
echo ""

# Prompt for embed HTML
echo "Paste your Twitter embed code here (press Enter twice when done):"
echo ""

# Read multi-line input
embed_html=""
while IFS= read -r line; do
    if [[ -z "$line" && -n "$embed_html" ]]; then
        break
    fi
    embed_html+="$line"$'\n'
done

# Remove trailing newline
embed_html=${embed_html%$'\n'}

if [[ -z "$embed_html" ]]; then
    echo "❌ No embed code provided. Exiting."
    exit 1
fi

echo ""
echo "📡 Updating tweet embed..."

# Escape the HTML for JSON
escaped_html=$(echo "$embed_html" | sed 's/"/\\"/g')

# Make the API call
response=$(curl -s -X POST http://localhost:3001/api/embed-tweet \
  -H "Content-Type: application/json" \
  -d "{\"embedHtml\": \"$escaped_html\"}")

# Check if successful
if echo "$response" | grep -q '"success":true'; then
    username=$(echo "$response" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
    tweetText=$(echo "$response" | grep -o '"tweetText":"[^"]*"' | cut -d'"' -f4)
    
    echo "✅ Tweet updated successfully!"
    echo "👤 User: @$username"
    echo "📝 Tweet: $tweetText"
    echo ""
    echo "🎯 Go to http://localhost:3001/home3 and click the phone screen to see the new tweet!"
else
    echo "❌ Failed to update tweet. Response:"
    echo "$response"
fi