# RiseRight: Technical Implementation Plan

## 1.0 High-Level Architecture

The application will follow a **client-server architecture**.

* **Client (Mobile App):** Handles the UI and interacts with the native device features (alarms, notifications).
* **Backend Service:** (Serverless function/Managed service like Firebase) Handles Google Calendar API interactions and data storage.

---

## 2.0 Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Mobile Framework** | **React Native with Expo** | Strong cross-platform capabilities, single codebase for iOS and Android. Expo simplifies the environment and provides easy access to native features. |
| **Backend** | **Firebase** | Excellent for this scope, providing integrated services: |
| | **Authentication** | Firebase Auth for secure user sign-in with Google. |
| | **Database** | Firestore for storing user preferences and settings. |
| | **Server Logic** | Cloud Functions for secure, scheduled polling and data processing. |

---

## 3.0 Component Breakdown

### 3.1. User Interface (UI)

* **Onboarding:** A simple, guided flow to connect Google Calendar and set sleep/alarm preferences.
* **Main Dashboard:** Displays the next scheduled meeting, the **calculated alarm time**, and the **recommended bedtime**.
* **Settings Screen:** Allows users to adjust their desired sleep duration and alarm offset.

### 3.2. Authentication & Data Flow

1.  User initiates a Google sign-in from the app.
2.  App uses Expo's Google Auth to get an **access token**.
3.  App sends this token to a **Firebase Cloud Function**.
4.  The Cloud Function uses the access token to:
    * Interact with the **Google Calendar API** on behalf of the user.
    * Create a secure, authenticated **Firebase user profile**.

### 3.3. Calendar Integration & Sync

The app will primarily use a **polling mechanism** via a Cloud Function scheduled to run every **15 minutes**.

#### Polling Logic:

1.  The **Cloud Function** retrieves the user's ID and preferences from **Firestore**.
2.  It uses the **Google Calendar API** to fetch the user's events for the next 24-48 hours.
3.  It finds the first event within the defined "morning" window.
4.  It **calculates the alarm time** and checks for changes.
5.  It **pushes a notification** to the user's device with the updated alarm time if a change is detected.

> **Note:** While webhooks offer real-time updates, polling via a Cloud Function provides a simpler, more robust solution for this use case.

### 3.4. Alarm & Notification Management

* **Alarm Setting:** The app receives the updated alarm time via a **push notification** from the backend. It then uses a native module (e.g., `expo-alarms`) to **set or update the device's native alarm**.
* **"Sleep Reminder" Notification:**
    * The **Cloud Function** calculates the recommended bedtime based on the user's sleep duration.
    * It sends a push notification to the user's device in the evening, reminding them to sleep on time.

---

## 4.0 Next Steps

1.  **UI/UX Prototyping:** Create high-fidelity mockups for all screens.
2.  **Backend Setup:** Configure Firebase project (Auth, Firestore, and Cloud Functions).
3.  **Development Sprints:** Begin development on core features (Google Calendar integration and native alarm management).
4.  **Testing:** Conduct thorough unit and integration tests, especially for the core logic and cross-platform functionality.
