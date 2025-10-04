/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Scheduled function to update tweets every 30 minutes
exports.updateTweets = onSchedule({
  schedule: "every 30 minutes",
  timeZone: "America/New_York", // Change to your timezone
  memory: "256MiB",
  maxInstances: 1
}, async () => {
  logger.info("Starting scheduled tweet update", {structuredData: true});
  
  try {
    // Get environment variables  
    const functions = require("firebase-functions");
    const twitterToken = functions.config().twitter?.bearer_token;
    if (!twitterToken) {
      throw new Error("TWITTER_BEARER_TOKEN not configured");
    }
    
    logger.info("Fetching user data for RL80coin");
    
    // Fetch user data from Twitter API
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/RL80coin?user.fields=id,name`,
      {
        headers: {
          'Authorization': `Bearer ${twitterToken}`
        }
      }
    );
    
    if (!userResponse.ok) {
      if (userResponse.status === 429) {
        logger.warn("Rate limited on user fetch, will retry next scheduled run");
        return null;
      }
      throw new Error(`Twitter API error: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    if (!userData.data) {
      throw new Error("User not found");
    }
    
    const userId = userData.data.id;
    logger.info(`Fetching tweets for user: ${userId}`);
    
    // Fetch latest tweets
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,text`,
      {
        headers: {
          'Authorization': `Bearer ${twitterToken}`
        }
      }
    );
    
    if (!tweetsResponse.ok) {
      if (tweetsResponse.status === 429) {
        logger.warn("Rate limited on tweets fetch, will retry next scheduled run");
        return null;
      }
      throw new Error(`Twitter API error: ${tweetsResponse.status}`);
    }
    
    const tweets = await tweetsResponse.json();
    if (!tweets.data || tweets.data.length === 0) {
      throw new Error("No tweets found");
    }
    
    // Prepare tweet data
    const tweetData = {
      username: userData.data.username,
      name: userData.data.name,
      latestTweet: tweets.data[0].text,
      createdAt: tweets.data[0].created_at,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      success: true
    };
    
    // Save to Firestore
    await admin.firestore()
      .collection('tweets')
      .doc('latest')
      .set(tweetData);
    
    logger.info("Tweet data successfully saved to Firestore", {
      username: tweetData.username,
      tweetLength: tweetData.latestTweet.length
    });
    
    return null;
    
  } catch (error) {
    logger.error("Error in scheduled tweet update:", error);
    
    // Save error to Firestore for debugging
    try {
      await admin.firestore()
        .collection('tweets')
        .doc('latest')
        .set({
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          success: false
        }, { merge: true });
    } catch (firestoreError) {
      logger.error("Failed to save error to Firestore:", firestoreError);
    }
    
    return null;
  }
});
