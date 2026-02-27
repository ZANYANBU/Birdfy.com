# Birdfy Mobile

This is the React Native (Expo) version of the Birdfy game.

## Prerequisites

- Node.js installed
- Expo Go app on your iOS or Android device

## How to Run

1. Open a terminal in this directory:
   ```bash
   cd BirdfyMobile
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android).

## Building for iOS (App Store / TestFlight)

To build the standalone `.ipa` file:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure the build:
   ```bash
   eas build:configure
   ```

4. Build for iOS:
   ```bash
   eas build -p ios
   ```
