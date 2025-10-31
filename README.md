# co2ounter

A comprehensive AI usasge tracking system that monitors your interactions with ChatGPT and Claude while calculating your carbon footprint. Features a Next.js dashboard, Node.js backend with Firebase, and a Chrome extension for real-time tracking.

## Features

### Dashboard
- Real-time statistics for daily and lifetime AI usage
- Interactive weekly activity charts
- Year-long heatmap visualiztion (similar to Github's commit map)
- Global leaderboard
- Customizable daily limits for prompts and CO2 emissions
- Carbon offset resources and recommendations

### Chrome Extension

- Automatic prompt and response tracking for ChatGPT and Claude
- Real-time badge updates with color coded usage levels
- Limit exceeded notifications
- Model-specific tracking and CO2 calculations
- Secure Firebase authentication integration

### Backend
- RESTful API with Express.js
- Firebase Firestore for data persistence
- Automatic daily history tracking
- JWT authentication for secure API access
- CORS support for web and extension clients

## Architecture
```
┌─────────────────┐
│  Chrome Ext     │
│  (injected.js)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Chrome Ext     │◄────►│  Next.js     │
│  (background.js)│      │  Dashboard   │
└────────┬────────┘      └──────┬───────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │   Node.js Backend     │
         │   Express + Firebase  │
         └───────────────────────┘
```
