# FuelTracker 🚗⛽

A comprehensive React Native mobile app for tracking vehicle fuel consumption, maintenance, and performance analytics. Built with Expo and React Navigation.

## Features

- **Fuel Tracking**: Log and monitor your vehicle's fuel consumption over time
- **Maintenance Logs**: Keep records of all vehicle maintenance activities
- **Analytics & Reports**: Visualize fuel efficiency trends and patterns
- **History**: View complete history of all fuel fill-ups and maintenance records
- **Vehicle Management**: Manage multiple vehicles with personalized settings
- **Exploration**: Browse and analyze vehicle data with interactive charts

## Download & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (optional, but recommended)

### Steps to Install

1. **Clone the repository**
   ```bash
   git clone https://github.com/himal-cmb/FuelTracker.git
   cd FuelTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Running the App

### Development Mode

Start the development server:
```bash
npm start
```

Or using Expo CLI directly:
```bash
npx expo start
```

### Run on Different Platforms

After running `npm start`, choose an option:

- **Android Emulator**
  ```bash
  Press 'a' or npx expo start --android
  ```

- **iOS Simulator** (macOS only)
  ```bash
  Press 'i' or npx expo start --ios
  ```

- **Web Browser**
  ```bash
  Press 'w' or npx expo start --web
  ```

- **Expo Go App** (easiest for testing on physical device)
  - Download Expo Go from App Store or Google Play
  - Scan the QR code displayed in terminal

## Use Cases

- **Personal Vehicle Owners**: Track fuel efficiency and maintenance schedules
- **Fleet Managers**: Monitor multiple vehicles' performance metrics
- **Drivers**: Optimize driving habits based on fuel consumption data
- **Maintenance Planning**: Get insights into maintenance patterns and costs
- **Budget Planning**: Analyze fuel expenses and predict future costs

## Project Structure

```
├── app/              # Main app screens and routing
│   ├── (tabs)/       # Tab-based navigation screens
│   │   ├── index.tsx         # Home screen
│   │   ├── analysis.tsx       # Analytics & reports
│   │   ├── explore.tsx        # Data exploration
│   │   ├── history.tsx        # Fuel & maintenance history
│   │   └── maintenance.tsx    # Maintenance management
│   ├── _layout.tsx   # Root layout
│   └── modal.tsx     # Modal screens
├── components/       # Reusable React components
├── context/          # React Context for state management
├── hooks/            # Custom React hooks
├── constants/        # App constants and theme
└── assets/           # Images and static assets
```

## Technologies Used

- **React Native** - Cross-platform mobile framework
- **Expo** - React Native development platform
- **React Navigation** - App navigation
- **TypeScript** - Type-safe development
- **Async Storage** - Local data persistence
- **React Native Gifted Charts** - Data visualization
- **React Native Reanimated** - Smooth animations

## Scripts

```bash
npm start          # Start development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run on web browser
npm run lint       # Run ESLint
```

## Contributing

Contributions are welcome! Feel free to open issues and submit pull requests.

## License

This project is private. Contact the maintainer for usage inquiries.

## Support

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/himal-cmb/FuelTracker).
