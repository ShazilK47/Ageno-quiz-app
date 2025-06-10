# Ageno Quiz App

## Overview

Ageno Quiz App is a comprehensive assessment platform built with Next.js and Firebase, designed to streamline the creation, management, and analysis of educational quizzes. The application offers robust features for administrators and an intuitive interface for users taking assessments.

## Features

### For Quiz Administrators
- **Quiz Creation and Management**
  - Create custom quizzes with various question types
  - Upload images for rich multimedia questions
  - Edit existing quizzes with question reordering and duplication
  - Import/export functionality for quiz questions

- **User Management**
  - Complete user administration dashboard
  - Role-based access control
  - Sorting and filtering capabilities

- **Advanced Analytics**
  - Detailed performance metrics and statistics
  - Visual data representations with interactive charts
  - Score and time distribution analysis
  - CSV export for extended data analysis

### For Quiz Participants
- **Seamless Quiz Experience**
  - Easy quiz access through unique codes
  - Clean, distraction-free quiz interface
  - Real-time progress tracking
  - Immediate feedback on quiz completion

- **User Features**
  - Personal profile management
  - Quiz history and performance tracking
  - Leaderboard access

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **Visualization**: Chart.js, React-ChartJS-2
- **Animation**: Framer Motion
- **Testing**: Vitest

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ageno-quiz-app.git
   cd ageno-quiz-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
ageno-quiz-app/
├── app/                  # Next.js app directory with routing
│   ├── (admin)/          # Admin routes and components
│   ├── (auth)/           # Authentication routes
│   ├── (quiz)/           # Quiz taking experience routes
│   ├── (user)/           # User dashboard routes
│   └── api/              # API endpoints
├── components/           # Shared React components
│   ├── analytics/        # Analytics and visualization components
│   ├── common/           # Common UI elements
│   └── quiz/             # Quiz-related components
├── contexts/             # React contexts
├── firebase/             # Firebase configuration and utilities
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and services
└── public/               # Static assets
```

## Features and Functionality

- **Media Management**: Full support for image uploads in quiz questions with preview and deletion
- **Enhanced Quiz Analytics**: Detailed score and time distribution visualizations
- **CSV Export**: One-click export of quiz results for further analysis
- **Improved UI/UX**: Intuitive navigation, consistent styling, and responsive design
- **Data Visualization**: Interactive charts for quiz performance metrics

## License

[MIT](LICENSE)

## Acknowledgments

- CodeRiders Development Team
- Next.js and React teams for the exceptional frameworks
- Firebase team for the robust backend services