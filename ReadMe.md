# ZenFB PoC - Professional Facebook Automation Extension

ZenFB is a modern, high-performance Chrome Extension designed to simplify Facebook marketing and management. This **Proof of Concept (PoC)** demonstrates a robust architecture using **React**, **TypeScript**, and **Vite** to provide a seamless automation experience.

## 🚀 Key Features

### 1. Advanced Extraction Engine
A robust detection system for essential Facebook identifiers, using a 4-stage fallback strategy (Meta Tags, URL Regex, Script DOM Scan, and Cookies):
- **User ID**: Instantly retrieve your profile ID or any visited profile ID.
- **Group ID**: Extract the unique ID of any Facebook group you are browsing.
- **Page ID**: Identify the underlying ID of Facebook business pages.
- **fb_dtsg Token**: Extract secure tokens required for API interactions.

### 2. Professional Dashboard
A sleek, premium dashboard built with **React** and **Tailwind CSS**:
- **Campaign Setup**: Configure group auto-posting with Spintax support (`{Hello|Hi}`).
- **Anti-Checkpoint Engine**: Randomized delays (Min/Max) to prevent account flags.
- **Live Status Viewer**: Real-time execution logs for monitoring automation tasks.
- **Saved Post Management**: A premium modal interface for creating and managing reusable post templates.

### 3. Modern Tech Stack
- **Framework**: React 18
- **Language**: TypeScript (Strict typing for reliability)
- **Bundler**: Vite (Ultra-fast build and packaging)
- **Styling**: Tailwind CSS (Modern, responsive design)
- **Icons**: Lucide React

## 🛠️ Build & Installation

Follow these steps to build the project and load it into your browser:

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [npm](https://www.npmjs.com/)

### Step 1: Install Dependencies
Open your terminal in the `PoC` directory and run:
```bash
npm install
```

### Step 2: Build the Extension
Compile the React/TypeScript code into the final extension:
```bash
npm run build
```
This will create a `dist/` folder in the project root.

### Step 3: Load into Chrome
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right corner).
3. Click **Load unpacked**.
4. Select the **`dist`** folder inside the `PoC` directory.

## 📂 Project Structure
- `src/popup/`: Source code for the extension popup menu.
- `src/dashboard/`: Source code for the full-page dashboard.
- `src/content/`: TypeScript content scripts for Facebook interaction.
- `src/background/`: Background service worker (TypeScript).
- `dist/`: The final, compiled extension (Load this into Chrome).
- `legacy/`: Original vanilla JavaScript implementation (for reference).

## 🛡️ Anti-Checkpoint Note
The automation logic is built with security in mind, utilizing human-like delays and Spintax to minimize detection risks. Always use automation responsibly.
