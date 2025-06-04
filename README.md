# 🚀 AgenoQuiz – Secure Quiz & Exam Platform by Agenoverse

Examverse is a modern web-based exam and quiz platform focused on **security**, **monitoring**, and **scalability**. Developed by **Team Agenoverse**, it allows educators to create quizzes, monitor students via webcam/microphone, and securely evaluate responses — all in real time.

---

## 🔧 Tech Stack

- **Frontend**: Next.js + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication with SWR
- **Media Access**: WebRTC/MediaDevices API
- **Hosting**: Vercel

---

## 🎯 Features

- ✅ Create and manage multiple quizzes
- ✅ Add MCQs with options and optional timers
- ✅ User authentication (admin/student)
- ✅ SWR-based auth hook with caching and revalidation
- ✅ Enhanced error handling for auth operations
- ✅ Multi-factor authentication support
- ✅ Enter quiz via access code
- ✅ Real-time camera and mic access
- ✅ Automatic answer checking and scoring
- ✅ Show results when admin allows
- ✅ Admin-only quiz and user management dashboard
- ✅ Firebase-based data storage and security

---

## 📂 Folder Structure

````

/pages
/admin ← Admin dashboard, quiz creation
/quiz ← Join & attempt quiz
/auth ← Login/Register

/lib
firebase.ts ← Firebase config
auth.ts ← Auth functions
camera.ts ← Media device logic

/types
quiz.ts ← Quiz & question types

/components
Question.tsx, Timer.tsx, QuizCard.tsx

---

## 🔐 Enhanced Authentication with useAuth Hook

The application uses a custom `useAuth` hook that enhances authentication with SWR caching:

```typescript
import { useAuth } from '@/hooks/useAuth';

// In your component
const { user, loading, isAdmin, login, logout } = useAuth();
````

### Key Benefits:

- **Optimized Performance**: SWR caching reduces unnecessary API calls
- **Automatic Session Revalidation**: Session stays fresh with focus/reconnect events
- **Consistent Error Handling**: Standardized error responses across all auth operations
- **Type Safety**: Full TypeScript support with detailed interfaces
- **Enhanced Security**: Improved session management and validation

For detailed documentation, see [useAuth documentation](./docs/useAuth.md).

````

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/ageno-quiz.git
cd ageno-quiz
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

- Create a Firebase project
- Enable Firestore and Auth
- Add your credentials in `/lib/firebase.ts`

```ts
// lib/firebase.ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

### 4. Run the App

```bash
npm run dev
```

---

## 👨‍💻 Team – Agenoverse

- **Lead Developer (Admin Module)**: \[Your Name]
- **Frontend Developer (Quiz Flow)**: \[Teammate 2]
- **Security & Auth (Proctoring/Monitoring)**: \[Teammate 3]

---

## 📦 Deployment

This project can be deployed easily using [Vercel](https://vercel.com).

```bash
vercel deploy
```

---

## 📜 License

MIT License © 2025 Agenoverse

---

## 🔠 Multi-Difficulty Quiz Support

AgenoQuiz features a robust difficulty system that allows quiz creators to:

- Set up multiple difficulty levels (easy, medium, hard)
- Define custom time limits for each difficulty
- Assign point multipliers to reward challenging difficulty selection
- Customize which difficulties are available per quiz

### Key Components:

- **Difficulty Settings UI**: Admin can configure time limits and point multipliers
- **Difficulty Selection**: Quiz takers can choose their preferred difficulty level
- **Adaptive Scoring**: Scores are adjusted based on the selected difficulty
- **Flexible Timing**: Timer automatically adjusts to match the selected difficulty

### Helper Functions:

We provide a set of utility functions in `utils/difficulty-helpers.ts` to handle difficulty-related logic:

```typescript
// Get duration for a specific difficulty
const duration = getDifficultyDuration(quiz, "hard"); // Returns duration in minutes

// Apply difficulty multiplier to score
const finalScore = applyDifficultyMultiplier(rawScore, quiz, "hard");

// Get formatted difficulty info for display
const info = getDifficultyDisplayInfo(quiz, "medium");
console.log(info.duration); // "30 minutes"
console.log(info.multiplier); // "1.5x"
```

For detailed documentation, see [Difficulty Settings documentation](./docs/DifficultySettings.md) and [Difficulty Helpers documentation](./docs/DifficultyHelpers.md).
