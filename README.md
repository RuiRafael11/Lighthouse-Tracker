# Lighthouse Tracker

A Next.js 14 application using TypeScript and Tailwind CSS for tracking website performance with Firebase Authentication and Firestore integration.

## Features

- 🔐 Firebase Authentication with Google Sign-In
- 📊 Dashboard with Chart.js integration for data visualization
- 🗄️ Firestore database to store website URLs
- 🎨 Modern UI with Tailwind CSS
- ⚡ Built with Next.js 14 App Router

## Prerequisites

- Node.js 18.17 or later
- A Firebase project with Authentication and Firestore enabled

## Setup

1. Clone the repository:
```bash
git clone https://github.com/RuiRafael11/Lighthouse-Tracker.git
cd Lighthouse-Tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a Firebase project:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Google Authentication in Authentication > Sign-in method
   - Create a Firestore database in Firestore Database

4. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Firebase configuration from Project Settings > General > Your apps

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── dashboard/        # Protected dashboard route
│   │   └── page.tsx
│   ├── login/           # Login page
│   │   └── page.tsx
│   ├── layout.tsx       # Root layout with AuthProvider
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── lib/
│   ├── firebase.ts      # Firebase configuration
│   └── AuthContext.tsx  # Authentication context
└── ...config files

```

## Usage

1. Navigate to the homepage at `/`
2. Click "Go to Dashboard" 
3. You'll be redirected to `/login` if not authenticated
4. Sign in with Google
5. Once authenticated, you'll be redirected to `/dashboard`
6. Add URLs using the form
7. View your saved URLs and analytics chart

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase Authentication** - User authentication with Google Sign-In
- **Firestore** - NoSQL database for storing URLs
- **Chart.js** - Data visualization library
- **react-chartjs-2** - React wrapper for Chart.js

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

ISC