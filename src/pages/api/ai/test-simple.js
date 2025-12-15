// Ultra simple test to verify API routes are working
export default async function handler(req, res) {
  const grokKey = process.env.GROK_API_KEY || 'not-found';
  const hasKey = !!process.env.GROK_API_KEY;
  
  // Return immediately with env var status
  return res.status(200).json({
    message: 'API route is working',
    timestamp: new Date().toISOString(),
    grokKeyExists: hasKey,
    grokKeyPreview: hasKey ? grokKey.substring(0, 15) + '...' : 'NO KEY FOUND',
    envVars: {
      NODE_ENV: process.env.NODE_ENV,
      hasFirebaseKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    }
  });
}