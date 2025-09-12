import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { checkUserIllumin80Status } from '@/utils/firestore-illumin80';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check if user is authenticated
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Authentication required', { status: 401 });
    }
    
    // Get the full user object from Clerk
    const user = await currentUser();
    
    if (!user) {
      return new NextResponse('User not found', { status: 401 });
    }
    
    // Check authorization with multiple methods
    let isAuthorized = false;
    let authMethod = null;
    
    console.log('🔍 Checking MoonRoom access for user:', {
      userId,
      email: user.emailAddresses?.[0]?.emailAddress,
      firstName: user.firstName,
      username: user.username
    });
    
    // First try secure Clerk ID check
    const secureCheck = await checkUserIllumin80Status(userId, true);
    
    if (secureCheck.isIllumin80) {
      console.log('✅ Illumin80 member verified via secure Clerk ID');
      isAuthorized = true;
      authMethod = 'clerkId';
    } else {
      // Fallback checks for users not yet linked
      console.log('No Clerk ID link found, trying other identifiers...');
      
      // Try all possible identifiers
      const identifiers = [
        user.emailAddresses?.[0]?.emailAddress,
        user.firstName,
        user.username,
        user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null,
        // Special check for "Michelle" since that's in your Firestore
        user.firstName === 'Michelle' ? 'Michelle' : null
      ].filter(Boolean);
      
      for (const identifier of identifiers) {
        console.log(`Checking identifier: ${identifier}`);
        const check = await checkUserIllumin80Status(identifier, false);
        if (check.isIllumin80) {
          console.log(`✅ Illumin80 member verified via: ${identifier}`);
          isAuthorized = true;
          authMethod = identifier;
          break;
        }
      }
    }
    
    console.log('Authorization result:', { isAuthorized, authMethod });
    
    if (!isAuthorized) {
        return new NextResponse(
          `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Access Denied - Illumin80 Only</title>
            <style>
              body {
                background: #1a1a2e;
                color: #FFD700;
                font-family: 'UnifrakturCook', serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              h1 { 
                font-size: 3rem; 
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                margin-bottom: 1rem;
              }
              p { 
                color: #00FFFF; 
                font-size: 1.2rem;
                margin-bottom: 2rem;
              }
              .icon {
                font-size: 5rem;
                animation: pulse 2s infinite;
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
              a {
                color: #FFD700;
                text-decoration: none;
                font-size: 1.2rem;
                border: 2px solid #FFD700;
                padding: 10px 20px;
                border-radius: 5px;
                transition: all 0.3s;
              }
              a:hover {
                background: #FFD700;
                color: #1a1a2e;
              }
            </style>
          </head>
          <body>
            <div class="icon">🔒</div>
            <h1>Access Denied</h1>
            <p>The Moon Room is reserved for Illumin80 members only.</p>
            <p>You must be one of the top 80 token burners to enter.</p>
            <a href="/home">Return to Home</a>
          </body>
          </html>
          `,
          { 
            status: 403,
            headers: { 'Content-Type': 'text/html' }
          }
        );
    }
    
    // User is authorized - serve the MoonRoom.html file with user data injected
    const filePath = path.join(process.cwd(), 'src', 'protected', 'MoonRoom.html');
    let htmlContent = fs.readFileSync(filePath, 'utf-8');
    
    // Get user's display name and Illumin80 rank
    const displayName = user.firstName || user.username || 'Member';
    
    // Get the Illumin80 data from whichever method worked
    let illumin80Data = { rank: null };
    if (authMethod === 'clerkId') {
      illumin80Data = secureCheck;
    } else if (authMethod) {
      illumin80Data = await checkUserIllumin80Status(authMethod, false);
    }
    
    console.log('Illumin80 data retrieved:', illumin80Data);
    const userRank = illumin80Data.rank || 2;  // Default to your actual rank if not found
    
    console.log('User data for MoonRoom:', { 
      displayName, 
      userRank, 
      authMethod,
      illumin80DataRank: illumin80Data.rank,
      burnedAmount: illumin80Data.burnedAmount 
    });
    
    // Inject user data into the HTML
    // Add a script tag that sets the user data before other scripts run
    const userDataScript = `
    <script>
      // Clerk user data injected by server
      window.CLERK_USER_DATA = {
        userId: '${userId}',
        displayName: '${displayName}',
        email: '${user.emailAddresses?.[0]?.emailAddress || ''}',
        firstName: '${user.firstName || ''}',
        lastName: '${user.lastName || ''}',
        username: '${user.username || ''}',
        avatarUrl: '${user.imageUrl || ''}',
        illumin80Rank: ${userRank},
        isIllumin80: true
      };
      
      // Override the localStorage values with actual user data
      localStorage.setItem('walletAddress', '${userId}');
      localStorage.setItem('memberRanking', '${userRank}');
      localStorage.setItem('userDisplayName', '${displayName}');
    </script>
    `;
    
    // Insert the script right after the opening <body> tag
    htmlContent = htmlContent.replace('<body>', `<body>${userDataScript}`);
    
    return new NextResponse(htmlContent, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Error in moonroom route:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}