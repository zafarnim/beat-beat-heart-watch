
# Beat Beat — Heart Rate Anomaly Detection App

## Overview
A mobile-first web app for iPhone users to manually log heart rate readings and get alerted when anomalies are detected. All data stays on-device using localStorage.

## Branding
- **Primary color**: Deep red/coral (#E54D4D-ish) — evokes heartbeat
- **Accent**: Soft pink/white gradients
- **Font feel**: Clean, medical-modern
- **Logo area**: "Beat Beat" with a heart pulse icon

## Pages & Features

### 1. Onboarding / Welcome Screen
- Brief intro: "Track your heart. Catch what matters."
- Set personal baseline: age, resting heart rate range
- Stored locally

### 2. Home Dashboard
- **Current status card**: Last reading + status (Normal / Warning / Alert)
- **Quick log button**: Large, prominent "Log Reading" FAB
- **7-day mini chart**: Sparkline showing recent trend
- **Anomaly count badge**: How many anomalies this week

### 3. Log Heart Rate
- Simple input: BPM number + optional note (e.g., "after exercise", "resting", "dizzy")
- Timestamp auto-filled, editable
- Instant feedback: green (normal), yellow (elevated), red (anomaly) based on user's baseline

### 4. History & Trends
- Interactive line chart of all readings (filterable: 7d, 30d, 90d, all)
- Anomalous readings highlighted in red
- Tap a reading to see details/notes

### 5. Anomaly Detection Logic
- Flag readings outside personalized thresholds (e.g., ±20% from baseline)
- Detect sudden spikes/drops between consecutive readings
- Browser push notification when anomaly logged

### 6. Settings
- Edit baseline heart rate range
- Set custom anomaly thresholds
- Clear all data option
- Enable/disable notifications

## Technical Approach
- **Storage**: localStorage for all readings and settings
- **Charts**: Recharts for trend visualization
- **Notifications**: Browser Notification API (with permission prompt)
- **Mobile-first**: Designed for iPhone Safari, installable as PWA-ready layout
- **No backend**: Fully client-side
