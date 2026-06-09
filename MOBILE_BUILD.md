# Mobile App Build Guide

This guide covers building and deploying the React Native mobile app using Expo.

## Project Structure

```
roadmap-mobile/
├── App.js                          # Main entry point
├── src/
│   ├── config/
│   │   └── supabaseClient.js       # Supabase initialization
│   ├── context/
│   │   └── AppContext.js           # Global state management
│   ├── screens/
│   │   ├── LoginScreen.js          # Authentication screen
│   │   ├── DecisionTreeScreen.js   # Assessment questions
│   │   ├── RoadmapScreen.js        # Study plan view
│   │   └── ProgressScreen.js       # Progress tracking
│   ├── utils/
│   │   └── roadmapGenerator.js     # Roadmap generation logic
│   ├── types/
│   │   └── index.js                # Type definitions
│   └── data/
│       └── MODULE_DATA.json        # Module and path data
└── package.json
```

## Setup

### Prerequisites
- Node.js 18+ (recommended: LTS version)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode on macOS
- For Android: Android Studio + Android SDK

### Installation

1. Navigate to the project:
```bash
cd roadmap-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Add your Supabase credentials to `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Development

### Running on Web
```bash
npm run web
```
Best for quick development and debugging.

### Running on iOS
```bash
npm run ios
```
Requires:
- macOS
- Xcode installed
- iOS Simulator or connected iPhone

### Running on Android
```bash
npm run android
```
Requires:
- Android Studio installed
- Android SDK configured
- Android Emulator or connected Android device

### Local Development Server
```bash
npm start
```
This starts the Expo dev server. Use options:
- `w` - Open web
- `i` - Open iOS simulator
- `a` - Open Android emulator
- `j` - Open debugger
- `r` - Restart metro bundler
- `m` - Toggle menu

## Building

### Web Build
```bash
npm run build
```
Creates optimized web bundle in `web-build/` directory.

### iOS Build

For local development:
```bash
eas build --platform ios --local
```

For production (requires EAS account):
```bash
eas build --platform ios
```

### Android Build

For local development:
```bash
eas build --platform android --local
```

For production APK:
```bash
eas build --platform android --output app.apk
```

For production AAB (for Play Store):
```bash
eas build --platform android
```

## Features

### Authentication
- Google OAuth integration via Supabase
- Anonymous guest login
- Persistent session management using AsyncStorage

### Assessment Flow
- 5-question decision tree
- Real-time validation
- Progress tracking with visual indicators

### Roadmap Visualization
- Weekly schedule view
- Module status tracking (pending, in-progress, done)
- Real-time progress synchronization
- Offline support with AsyncStorage

### Progress Tracking
- Overall progress percentage
- Weekly module statistics
- Module completion tracking
- Notification support

### Offline Support
- AsyncStorage for local caching
- Automatic sync on network reconnection
- Works without internet connection

## Deployment

### Expo Development Client
For continuous development and testing:
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Production Build
1. Update version in `package.json`
2. Update app.json configuration
3. Build for each platform
4. Submit to App Store (iOS) or Play Store (Android)

### Environment Setup for CI/CD

Store these securely in your CI/CD platform:
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EAS_BUILD_PROFILE
```

## Troubleshooting

### Common Issues

**Metro bundler crashes**
```bash
npm start -- --reset-cache
```

**Dependency conflicts**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Simulator/Emulator issues**
- Restart the simulator/emulator
- Clear Expo cache: `expo start -c`
- Reset Metro bundler: `expo start --reset-cache`

**AsyncStorage not working**
- Ensure `@react-native-async-storage/async-storage` is installed
- For web, use expo-sqlite instead

**Supabase connection issues**
- Verify environment variables are set
- Check Supabase URL and key are correct
- Ensure network connectivity

## Performance Optimization

1. **Code Splitting**: Use lazy loading for screens
2. **Image Optimization**: Use expo-image for better performance
3. **State Management**: Minimize context updates
4. **Caching**: Leverage AsyncStorage effectively
5. **Bundle Size**: Monitor with `expo-bundle-analyzer`

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
- Use Detox for e2e testing
- Test on actual devices when possible

### Manual Testing Checklist
- [ ] Login/Logout flow
- [ ] Assessment completion
- [ ] Roadmap generation
- [ ] Module progress tracking
- [ ] Offline functionality
- [ ] Dark mode (if implemented)
- [ ] Cross-device sync

## Performance Monitoring

- Use React DevTools in development
- Monitor bundle size with `expo report`
- Track app performance with Sentry/Firebase
- Use Expo Analytics for user metrics

## Release Notes

### Version 1.0.0
- Initial release
- Authentication with Google OAuth
- 5-question assessment
- Personalized roadmap generation
- Progress tracking
- Offline support with AsyncStorage
- iOS and Android ready

## Support

For issues or questions:
1. Check [Expo Documentation](https://docs.expo.dev/)
2. Review [React Navigation Docs](https://reactnavigation.org/)
3. Check [Supabase Documentation](https://supabase.com/docs)
4. Open issue in repository

## License

This project is part of the College CS Roadmap application.
