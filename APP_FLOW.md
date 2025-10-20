# 📱 Application Flow Guide

## Complete User Journeys

### 🎯 Quiz Host Flow

```
1. Home Page (/)
   ↓ Click "Create Room"
   
2. Create Room (/create)
   ↓ Fill details → Create
   
3. Room Dashboard (/room/:roomId)
   - View room code
   - Add/edit/delete questions
   - See players joining
   - Click "Publish Room" (when ready)
   - Click "Start Quiz" (when players are ready)
   ↓ Start Quiz
   
4. Quiz Control (/room/:roomId/control)
   - Configure question settings (points, time, scoring mode)
   - Publish questions one by one
   - See live answers from players
   - View real-time statistics
   - Move to next question or end quiz
   ↓ End Quiz
   
5. Leaderboard (/leaderboard/:roomId)
   - View final rankings
   - See winner with confetti 🎉
   - Share results
   - Create new quiz or go home
```

### 👥 Player Flow

```
1. Home Page (/)
   ↓ Click "Join Room"
   
2. Join Room (/join)
   ↓ Enter room code + name → Join
   
3. Player Lobby (/lobby)
   - See room details
   - See other players
   - Wait for host to start
   ↓ Quiz starts (auto-redirect)
   
4. Play Quiz (/play)
   - See questions as they're published
   - Select/enter answers
   - Submit before time runs out
   - See confirmation after submitting
   - Wait for next question
   ↓ Quiz ends (auto-redirect)
   
5. Leaderboard (/leaderboard/:roomId)
   - View your ranking
   - See all player scores
   - Celebrate if you won! 🏆
   - Join another quiz or go home
```

## Page Details

### 1. Home Page (`/`)
**Purpose:** Landing page with feature showcase

**Actions:**
- Create Room → `/create`
- Join Room → `/join`

**Features:**
- Hero section
- Feature cards
- Role descriptions
- CTA buttons

---

### 2. Create Room (`/create`)
**Purpose:** Host creates a new quiz room

**Inputs:**
- Room name
- Owner name
- Max players (2-100)

**On Submit:**
- Creates room in Firebase
- Stores room ID in localStorage
- Redirects to Room Dashboard

**Firebase:**
- Writes to `rooms/{roomId}`

---

### 3. Room Dashboard (`/room/:roomId`)
**Purpose:** Host manages room before quiz starts

**Features:**
- Display room code (with copy button)
- Show room statistics
- Add/edit/delete questions
- View live player list
- Publish room (makes it joinable)
- Start quiz button

**On Start Quiz:**
- Updates room: `isStarted = true`
- Redirects to Quiz Control

**Firebase:**
- Reads: `rooms/{roomId}`
- Writes: `rooms/{roomId}/questions`, `rooms/{roomId}/isPublished`
- Listens: `players/` (filtered by roomId)

---

### 4. Join Room (`/join`)
**Purpose:** Players join an existing room

**Inputs:**
- Room code (6 characters)
- Player name

**On Submit:**
- Finds room by code
- Validates room is published and not started
- Creates player in Firebase
- Stores player ID and room ID in localStorage
- Redirects to Player Lobby

**Firebase:**
- Reads: `rooms/` (finds by code)
- Writes: `players/{playerId}`

---

### 5. Player Lobby (`/lobby`)
**Purpose:** Players wait for quiz to start

**Features:**
- Show room name and code
- List all players
- Show ready status
- Auto-redirect when quiz starts

**Listeners:**
- Watches `currentRoom.isStarted`
- Redirects to `/play` when true

**Firebase:**
- Listens: `rooms/{roomId}`
- Listens: `players/` (filtered by roomId)

---

### 6. Quiz Control (`/room/:roomId/control`)
**Purpose:** Host controls live quiz session

**Features:**
- Progress bar (questions completed)
- Question display with correct answer highlighted
- Configure settings per question:
  - Base points (10-1000)
  - Time limit (5-300 seconds)
  - Scoring mode (time-based, order-based, first-only)
- Publish question button
- Live answer tracking:
  - Who answered
  - Their answer
  - Time taken
  - Points earned
- Real-time statistics:
  - Answered count
  - Correct answers
  - Time remaining
- Next question / End quiz buttons
- Live player leaderboard (sidebar)

**On Publish Question:**
- Updates `currentQuestionIndex`
- Writes to `currentQuestions/{roomId}`
- Clears `answers/{roomId}`
- Starts countdown timer

**On Next Question:**
- Clears `currentQuestions/{roomId}`
- Moves to next question index

**On End Quiz:**
- Sets `isCompleted = true`
- Redirects to Leaderboard

**Firebase:**
- Reads: `rooms/{roomId}`, `players/`, `answers/{roomId}`
- Writes: `rooms/{roomId}/currentQuestionIndex`, `currentQuestions/{roomId}`, `rooms/{roomId}/isCompleted`
- Listens: `currentQuestions/{roomId}`, `answers/{roomId}`, `players/`

---

### 7. Play Quiz (`/play`)
**Purpose:** Players answer questions

**Features:**
- Countdown timer with progress bar
- Question display
- Answer options based on question type:
  - **True/False:** Two large buttons
  - **Multiple Choice:** List of option buttons (A, B, C, D)
  - **Text Input:** Text field with Enter to submit
- Disabled state after submission
- Visual feedback:
  - ✅ Answer submitted (green)
  - ⏰ Time's up (red)
- Waiting state between questions
- Scoring mode hints
- Auto-redirect to leaderboard when quiz ends

**On Submit Answer:**
- Calculates time taken
- Checks if correct
- Calculates points based on scoring mode
- Updates player score
- Writes answer to Firebase

**Firebase:**
- Reads: `players/` (finds current player)
- Writes: `players/{playerId}/score`, `answers/{roomId}/{answerId}`
- Listens: `currentQuestions/{roomId}`, `rooms/{roomId}`

---

### 8. Leaderboard (`/leaderboard/:roomId`)
**Purpose:** Show final results and rankings

**Features:**
- Confetti animation for winner 🎉
- Winner spotlight (large card)
- Podium display (1st, 2nd, 3rd places)
- Full rankings list with:
  - Position medals (🥇🥈🥉)
  - Player names
  - Final scores
  - Color-coded by rank
- Quiz statistics:
  - Total players
  - Total questions
  - Highest score
  - Average score
- Share results button
- Play again options:
  - Create new quiz
  - Join another quiz
- Copy room code

**Animations:**
- Staggered fade-in for each element
- Confetti burst on load

**Firebase:**
- Reads: `rooms/{roomId}`, `players/` (filtered by roomId)

---

## Firebase Real-time Synchronization

### Room State Updates
- **Host publishes room** → All players see room is joinable
- **Host starts quiz** → All players auto-redirect to play page
- **Host publishes question** → All players see the question immediately
- **Host ends quiz** → Everyone redirects to leaderboard

### Player Updates
- **Player joins** → Host sees new player in list
- **Player answers** → Host sees answer in real-time
- **Player score changes** → Everyone sees updated leaderboard

### Question Flow
- **Question published** → `currentQuestions/{roomId}` created
- **Players answer** → `answers/{roomId}/{answerId}` added
- **Next question** → `currentQuestions/{roomId}` deleted, answers cleared

## Navigation Guards

### Auto-Redirects
1. **Player Lobby** → Play Quiz (when `isStarted = true`)
2. **Play Quiz** → Leaderboard (when `isCompleted = true`)
3. **Quiz Control** → Leaderboard (when `isCompleted = true`)

### Validation
1. **Join Room:**
   - Room must exist
   - Room must be published
   - Room must not be started
   - Room must not be full

2. **Start Quiz:**
   - At least one player must be ready (host can override)
   - Room must have questions

3. **Publish Question:**
   - Valid question index
   - Valid settings

## Local Storage Keys

- `quiz_user_id` - Unique user identifier (persistent)
- `current_player_id` - Current player's Firebase ID
- `current_room_id` - Current room being played/hosted

## Scoring Modes

### Time-Based
```
points = basePoints - floor(timeTaken)
```
**Example:** 100 points, answer in 5s = 95 points

### Order-Based
```
1st correct: 100% of basePoints
2nd correct: 70% of basePoints  
3rd correct: 40% of basePoints
4th+ correct: 0 points
```
**Example:** 100 points
- 1st = 100 points
- 2nd = 70 points
- 3rd = 40 points

### First-Only
```
Only 1st correct answer gets points
```
**Example:** 100 points
- 1st = 100 points
- Others = 0 points

## Error Handling

### Common Errors
1. **Room not found** → Show error, redirect to home
2. **Room already started** → Can't join
3. **Room is full** → Can't join
4. **Firebase connection error** → Show error toast
5. **Player ID not found** → Error submitting answer

### User Feedback
- Success toasts (green) for successful actions
- Error toasts (red) for failures
- Info toasts (blue) for notifications
- Loading states during async operations

## Testing Checklist

### Host Flow
- [ ] Create room successfully
- [ ] Add 3+ questions
- [ ] Delete a question
- [ ] Publish room
- [ ] See players join
- [ ] Start quiz
- [ ] Publish each question
- [ ] See live answers
- [ ] Move to next question
- [ ] End quiz
- [ ] View leaderboard

### Player Flow
- [ ] Join with valid code
- [ ] See other players in lobby
- [ ] Auto-redirect when quiz starts
- [ ] Answer true/false question
- [ ] Answer multiple choice question
- [ ] Answer text input question
- [ ] Submit before time runs out
- [ ] See time's up message
- [ ] Auto-redirect to leaderboard
- [ ] See final ranking

### Real-time Features
- [ ] New player appears in host's player list
- [ ] Published question appears for all players
- [ ] Submitted answer appears for host
- [ ] Score updates in leaderboard
- [ ] Quiz end redirects everyone

---

**Last Updated:** 2025-10-20
