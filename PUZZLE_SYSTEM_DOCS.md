# Gallery3 Daily Puzzle System Documentation

## Overview
The Gallery3 puzzle system is a daily challenge where authenticated users solve 3 puzzles to reveal a unique symbol sequence. This sequence corresponds to sections on the mystical wheel - clicking these sections in the correct order triggers the CoinStream reward component.

## Key Features
- **Daily Unique Sequences**: Each user receives a cryptographically generated sequence that's unique to them and changes daily at midnight UTC
- **Anti-Sharing Security**: Sequences are user-specific and server-validated, preventing players from sharing answers
- **Progressive Unlock**: Players must complete 3 puzzles in order to reveal their daily sequence
- **Persistent State**: Uses Firebase Firestore to track completion status and attempts
- **Developer Mode**: Includes reset functionality for testing (toggle DEV_MODE in utilities)

## Architecture

### Core Components

#### 1. PuzzleSystem (`/src/components/PuzzleSystem.jsx`)
Main UI controller that manages the puzzle interface:
- Displays 3 puzzle slots with progressive unlocking
- Shows daily symbol sequence upon completion
- Handles collapsed/expanded states (starts as game controller icon)
- Integrates with Clerk authentication
- Provides dev mode reset button when enabled

#### 2. PuzzleModal (`/src/components/PuzzleModal.jsx`)
Individual puzzle interface:
- Currently placeholder for actual puzzle implementation
- Returns a symbol upon "completion"
- Modal overlay with closeable interface

#### 3. SymbolReveal (`/src/components/SymbolReveal.jsx`)
Displays the completed 3-symbol sequence:
- Shows symbols with their names
- Provides visual feedback for the sequence order
- Includes instructions for using the sequence on the wheel

### Backend Systems

#### 1. Daily Sequence Generation (`/src/utilities/dailyPuzzleSequence.js`)
Handles all Firebase operations and sequence generation:

```javascript
// Core functions:
- getUserDailySequence(userId) - Gets or creates daily sequence
- validateUserSequence(userId, attemptedSequence) - Server-side validation
- recordPuzzleAttempt(userId, success) - Tracks attempts
- resetPuzzleForDev(userId) - Dev mode reset (deletes Firebase doc)
```

**Sequence Generation Algorithm:**
- Creates seed from: `userId + dateString + SECRET_SALT`
- Uses deterministic pseudo-random selection
- Ensures 3 unique symbols from pool of 16
- Same user + same day = same sequence

**Symbol Pool Mapping:**
```javascript
wheel_section     → 🌹 Rose
wheel_section001  → 🔒 Lock
wheel_section002  → ⏳ Hourglass
wheel_section003  → 🦉 Owl
wheel_section004  → ❤️‍🔥 Burning Heart
wheel_section005  → ♾️ Infinity Symbol
wheel_section006  → 👁️ Illumin80 eye
wheel_section007  →    Sacred Geometry
wheel_section008  →    Lucky Cat
wheel_section009  → ♍︎  Virgo
wheel_section010  → 🎱 8ball
wheel_section011  → 📿 Prayer Beads
wheel_section012  → 🚀 Rocket
wheel_section013  → 🕸️ Spiderweb
wheel_section014  → 🐂 Bull
wheel_section015  → 🕯️ Candle
```

#### 2. Custom Hook (`/src/hooks/useDailyPuzzleSequence.js`)
React hook that manages puzzle state:
- Fetches daily sequence from Firebase
- Handles authentication state
- Provides validation methods
- Auto-refreshes at midnight UTC
- Returns loading/error states

#### 3. API Route (`/src/app/api/validate-puzzle/route.js`)
Server-side validation endpoint:
- Verifies user authentication via Clerk
- Validates sequence attempts
- Awards coins for successful completion (5000 base reward)
- Prevents client-side manipulation

### Integration with Gallery3Scene

The Gallery3Scene component receives the puzzle sequence and validates wheel clicks:

```javascript
// In gallery3/page.js:
<PuzzleSystem onSequenceComplete={handlePuzzleSequenceComplete} />
<Gallery3Scene puzzleSequence={puzzleSequence} />

// Gallery3Scene validates clicks:
1. User clicks wheel sections
2. System tracks click sequence
3. When sequence matches puzzle sequence:
   - Validates with server API
   - Triggers CoinStream on success
   - Awards coins to user
```

## User Flow

1. **Initial State**: User sees collapsed puzzle icon (game controller)
2. **Expand Puzzle**: Click icon to reveal puzzle interface
3. **Complete Puzzles**: Solve 3 puzzles sequentially (currently placeholders)
4. **Reveal Sequence**: See 3-symbol sequence (e.g., "🔒 Lock, 🕸️ Spiderweb, 🐂 Bull")
5. **Click Wheel**: Click corresponding sections on the mystical wheel in order
6. **Earn Reward**: CoinStream triggers, awarding 5000 coins
7. **Daily Reset**: New sequence available at midnight UTC

## Firebase Schema

```javascript
// Collection: userPuzzles
// Document ID: userId
{
  userId: string,
  date: "YYYY-MM-DD",  // UTC date string
  sequence: [          // Array of 3 symbol objects
    { symbol: "🔒", section: "wheel_section001", name: "Lock", id: 1 },
    // ... 2 more symbols
  ],
  completedToday: boolean,
  attempts: number,
  createdAt: timestamp,
  lastAttempt: timestamp | null,
  completedAt: timestamp | null
}
```

## Development Mode

Toggle in `/src/utilities/dailyPuzzleSequence.js`:
```javascript
export const DEV_MODE = true; // Set to false for production
```

When enabled:
- Shows "Reset Puzzle (Dev)" button in UI
- Allows unlimited puzzle resets
- Deletes Firebase document completely for fresh start
- Useful for testing different sequences and debugging

## Security Features

1. **User-Specific Sequences**: Each user gets a unique sequence based on their userId
2. **Server Validation**: All completions validated server-side to prevent cheating
3. **Daily Rotation**: Sequences change daily at midnight UTC
4. **Attempt Tracking**: System tracks attempts to prevent brute forcing
5. **Authentication Required**: Must be signed in via Clerk to participate

## Troubleshooting

### Common Issues

1. **"Already completed" message**: 
   - User has completed today's puzzle
   - Wait until midnight UTC or use dev reset

2. **CoinStream not triggering**:
   - Ensure symbols match wheel visuals
   - Check console for sequence validation logs
   - Verify clicking correct wheel sections

3. **Symbols not matching wheel**:
   - Symbol pool in `dailyPuzzleSequence.js` must match actual wheel visuals
   - Update SYMBOL_POOL if wheel graphics change

4. **Reset not working**:
   - Ensure DEV_MODE = true
   - Check Firebase connection
   - User must be authenticated

## Future Enhancements

1. **Actual Puzzles**: Replace placeholder puzzles with real challenges
2. **Difficulty Progression**: Make puzzles harder throughout the week
3. **Streak System**: Track consecutive days completed
4. **Leaderboard**: Show completion times and attempts
5. **Special Events**: Holiday-themed puzzles with bonus rewards
6. **Hint System**: Allow users to spend coins for hints
7. **Achievement Badges**: Award special badges for milestones

## Testing Checklist

- [ ] User can expand/collapse puzzle system
- [ ] Puzzles unlock sequentially (1→2→3)
- [ ] Symbol sequence displays after all 3 complete
- [ ] Clicking wheel sections in order triggers CoinStream
- [ ] Wrong sequence doesn't trigger reward
- [ ] Puzzle resets at midnight UTC
- [ ] Each user gets unique sequence
- [ ] Dev reset works when DEV_MODE enabled
- [ ] Server validation prevents cheating
- [ ] UI panels are closeable
- [ ] Mobile responsive layout works