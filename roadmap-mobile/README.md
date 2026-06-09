# CS Interview Roadmap - Mobile App

A React Native mobile application built with Expo for creating personalized CS interview preparation roadmaps.

## Features

- **Personalized Assessment**: 5-question decision tree to understand your goals and constraints
- **Smart Roadmap Generation**: AI-powered study plan based on your background and timeline
- **Progress Tracking**: Track module completion and visualize overall progress
- **Offline Support**: Full offline functionality with AsyncStorage caching
- **Real-time Sync**: Seamless sync across multiple devices via Supabase
- **Google OAuth**: Secure authentication with Google or anonymous guest login
- **Mobile-Optimized UI**: Clean, intuitive interface designed for mobile devices

## Tech Stack

- **React Native** - Cross-platform mobile development
- **Expo** - Simplified React Native development and deployment
- **React Navigation** - Navigation management (Stack & Tab navigation)
- **Supabase** - Backend, authentication, and database
- **AsyncStorage** - Local data persistence
- **JavaScript/ES6+** - Modern JavaScript

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Navigate to project:
```bash
cd roadmap-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Start development:
```bash
npm start
```

Then press:
- `w` for web (fastest for development)
- `i` for iOS simulator
- `a` for Android emulator

## Project Structure

```
src/
├── config/
│   └── supabaseClient.js           # Supabase client initialization
├── context/
│   └── AppContext.js               # Global state management using useReducer
├── screens/
│   ├── LoginScreen.js              # Authentication (Google OAuth + Guest)
│   ├── DecisionTreeScreen.js       # 5-question assessment
│   ├── RoadmapScreen.js            # Study plan visualization
│   └── ProgressScreen.js           # Progress tracking & statistics
├── services/
│   └── authService.js              # Authentication utilities
├── utils/
│   └── roadmapGenerator.js         # Roadmap generation algorithm
├── types/
│   └── index.js                    # Type definitions
└── data/
    └── MODULE_DATA.json            # Course modules and paths
```

## Running the App

### Development
```bash
npm start
```

### Web
```bash
npm run web
```

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Building

### Web Build
```bash
npm run build:web
```

### iOS Build
```bash
npm run build:ios
```

### Android Build
```bash
npm run build:android
```

See [../MOBILE_BUILD.md](../MOBILE_BUILD.md) for detailed instructions.

## Navigation Structure

```
App
├── Login (unauthenticated)
├── DecisionTree (if assessment not complete)
└── MainApp (authenticated + assessment complete)
    ├── Roadmap (Tab)
    └── Progress (Tab)
```

## Key Features

### Assessment Flow
5 questions to personalize your roadmap:
1. Tech level (beginner/intermediate/advanced)
2. Target company type (FAANG/startup/balanced)
3. Hours per week (5-10/10-15/15-20)
4. Existing project (yes/no)
5. Timeline (summer/fall/spring)

### Roadmap Screen
- Weekly schedule view
- Module status tracking
- Mark modules as complete
- Overall progress percentage
- Real-time sync with backend

### Progress Screen
- Overall progress circle
- Weekly breakdown
- Module statistics
- Activity tracking
- Reset functionality

## State Management

Uses React Context API with useReducer:
- Global app state
- User authentication
- Roadmap data
- Module progress tracking

## Offline Support

- Cached with AsyncStorage
- Works without internet
- Automatic sync when online

## License

Part of College CS Roadmap project.
