# 🚀 AgenoQuiz – Secure Quiz & Exam Platform by Agenoverse

Examverse is a modern web-based exam and quiz platform focused on **security**, **monitoring**, and **scalability**. Developed by **Team Agenoverse**, it allows educators to create quizzes, monitor students via webcam/microphone, and securely evaluate responses — all in real time.

---

## 🔧 Tech Stack

- **Frontend**: Next.js + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Media Access**: WebRTC/MediaDevices API
- **Hosting**: Vercel

---

## 🎯 Features

- ✅ Create and manage multiple quizzes
- ✅ Add MCQs with options and optional timers
- ✅ User authentication (admin/student)
- ✅ Enter quiz via access code
- ✅ Real-time camera and mic access
- ✅ Automatic answer checking and scoring
- ✅ Show results when admin allows
- ✅ Admin-only quiz and user management dashboard
- ✅ Firebase-based data storage and security

---

## 📂 Folder Structure

```

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

```

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/ageno-quiz.git
cd ageno-quiz
```

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
