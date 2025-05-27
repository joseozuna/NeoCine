# 🎬 NeoCine

[![Expo](https://img.shields.io/badge/Expo-%5E53.0.0-000?logo=expo)](https://expo.dev/)  [![React Native](https://img.shields.io/badge/React%20Native-0.74.x-61dafb?logo=react)](https://reactnative.dev/)  [![Firebase](https://img.shields.io/badge/Firebase-9.22.2-FFCA28?logo=firebase)](https://firebase.google.com/)  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **NeoCine** is a mobile application for passionate cinephiles, inspired by **Letterboxd**. Built with **React Native (Expo)**, **Firebase**, and the **TMDB API**, NeoCine lets you discover, rate, and review films while exploring world cinema on an interactive map—all wrapped in a polished dark‑mode interface with *Merriweather* typography.

---

## 📸 Screenshots

|              Home             |            Movie Detail           |          World Map          |               Profile               |
| :---------------------------: | :-------------------------------: | :-------------------------: | :---------------------------------: |
| ![Home](screenshots/home.png) | ![Detail](screenshots/detail.png) | ![Map](screenshots/map.png) | ![Profile](screenshots/profile.png) |

> *Add your own screenshots / GIF demos in the **screenshots/** directory.*

---

## ✨ Features

* **Firebase Auth** – Email/password sign‑up, login, and persistent sessions.
* **Letterboxd‑style Home** – Genre‑based horizontal carousels pulling data from TMDB.
* **Advanced Search** – Filters for year, language, vote count, and more.
* **Movie Detail View** – Trailers, cast, director, streaming providers, and user reviews.
* **Interactive World Map** – Tap a country to see cultural highlights and legendary directors.
* **User Profile** – Avatar picker, public reviews, favorites, and dark/light theme toggle.
* **Top 100 All‑Time** – Curated list grouped by decade with smooth scrolling.

> See the **Roadmap** for planned enhancements.

---

## 🛠 Tech Stack

* **React Native (Expo SDK 53)**
* **Firebase v9** (Auth, Firestore, Storage)
* **TMDB REST API**
* **React Navigation v7**
* **Context API & Custom Hooks** for global state
* **TypeScript** for type safety
* **Merriweather** font + custom dark/light palette

---

## 📂 Project Structure (excerpt)

```text
neoCine/
├─ app/
│  ├─ screens/
│  │  ├─ HomeScreen.tsx
│  │  ├─ MovieDetailScreen.tsx
│  │  ├─ SearchScreen.tsx
│  │  ├─ ProfileScreen.tsx
│  │  └─ MapScreen.tsx
│  ├─ components/
│  ├─ hooks/
│  ├─ navigation/
│  └─ contexts/
├─ lib/
│  ├─ firebase/
│  │  └─ firebaseConfig.ts
│  └─ tmdb/
│     └─ tmdbService.ts
├─ assets/
├─ screenshots/
├─ .env.example
└─ README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool               | Version             |
| ------------------ | ------------------- |
| **Node.js**        | ≥ 18 LTS            |
| **Expo CLI**       | `npm i -g expo-cli` |
| **Yarn (Classic)** | optional            |

### 1. Clone the repo

```bash
git clone https://github.com/your‑username/NeoCine.git
cd NeoCine
```

### 2. Install dependencies

```bash
yarn install        # or npm install
```

### 3. Environment variables

Copy the template and add your API keys:

```bash
cp .env.example .env
```

```env
# .env
TMDB_API_KEY=your_tmdb_key
FIREBASE_API_KEY=your_firebase_key
FIREBASE_PROJECT_ID=your_project_id
...
```

### 4. Run the app

```bash
expo start          # press "i" for iOS, "a" for Android, or scan the QR
```

### 5. Building releases *(optional)*

```bash
# Install EAS CLI
npm i -g eas-cli

# Configure your project once
eas build:configure

# Build Android APK / AAB
eas build --platform android

# Build iOS (requires Apple account)
eas build --platform ios
```

---

## 🏗 Architecture Overview

```text
┌────────────┐    REST   ┌────────────┐
│  NeoCine   │ ───────▶ │  TMDB API  │
│  (Mobile)  │          └────────────┘
│            │
│  React Nav │
│  Context   │
│  Hooks     │            ┌─────────────┐
│            │   gRPC /   │  Firebase    │
│            │  REST/WS ─▶│  Auth & DB   │
└────────────┘            └─────────────┘
```

* **Presentation Layer**: React Native Screens & components
* **State Layer**: Context + custom hooks (auth, theme, movies)
* **Data Layer**: `tmdbService.ts` (REST) & `firebaseService.ts`

---

## 🧩 Contributing

1. **Fork** the project
2. Create your **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request**

All contributions are welcome! Please follow the existing code style and add tests where possible.

---

## 📅 Roadmap

* [ ] Offline caching with SQLite / MMKV
* [ ] Social sharing of lists & reviews
* [ ] Push notifications for watch‑list reminders
* [ ] Localization (ES / EN)
* [ ] Unit & E2E tests with Jest + Detox

Feel free to suggest more ideas by opening an issue.

---



## 🙏 Acknowledgements

* [The Movie Database (TMDB)](https://www.themoviedb.org/) for the wonderful API
* [Firebase](https://firebase.google.com/) for their generous free tier
* [Expo](https://expo.dev/) for painless React Native workflows

> Icons by [Lucide‑React](https://lucide.dev/)

---

Made with ❤️ by **Jose** & contributors.
