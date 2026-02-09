# Kitch

## Overview
Kitch is a React Native/Expo mobile application designed to transform ephemeral Instagram and TikTok food content into permanent, organized, cookbook-quality recipes. It extracts and structures recipe information using AI, including ingredients, instructions, and categorization. The app features local storage, smart AI-powered filtering, pantry management with voice input, and a Cook Mode for guided cooking. It also includes an AI assistant, Remi, for cooking conversations and recommendations. Kitch aims to be a comprehensive culinary companion with a warm, organic, and editorial aesthetic inspired by premium cookbooks. Key capabilities include AI-powered recipe extraction from social media, web search fallback, transparent recipe sourcing with confidence levels, and intuitive native gesture controls for an enhanced cooking experience. The project envisions widespread adoption among home cooks and food enthusiasts, offering a seamless way to save and utilize online culinary inspiration.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (New Architecture enabled).
- **Navigation**: React Navigation v7 with tab-based navigation (Collection, Add Recipe, Remi, Pantry, Shop) and stack navigation within tabs. Cook Mode is a full-screen modal.
- **State Management**: TanStack React Query for server state, AsyncStorage for local recipe persistence.
- **Animations**: React Native Reanimated.
- **Styling**: Custom design system in `client/constants/theme.ts` with a "Warm Modern Kitchen" aesthetic.
  - **Palette**: Teal (#0D9488) primary, Amber (#E8A838) accent, Slate (#1E293B) dark sections, warm off-white (#FAF7F5) background.
  - **Design Elements**: 4 streamlined card accent colors, pill-shaped buttons, large rounded corners (24px), warm shadows, generous spacing, dark slate cards for premium sections.
  - **Accessibility**: WCAG-compliant contrast ratios.
  - **Typography**: Google Fonts (Inter) for all text.
- **Gesture Controls**:
    - **Pan-to-Cook Swipe**: Swipe right on recipe cards to enter Cook Mode, triggering voice reading.
    - **Recipe Roulette**: Shake phone on Collection screen to randomly select a recipe, prioritizing pantry-matched.
    - **Pinch-to-Scale Ingredients**: Pinch on Recipe Detail to adjust servings (0.25x to 4x), with real-time recalculation.
- **Cook Mode Upgrades**:
    - **YouTube Player Integration**: Embedded player for YouTube recipes, auto-seeking to step timestamps.
    - **Swipe Navigation**: Swipe left/right between cooking steps.
    - **Timer Detection**: RegEx scans instructions for time mentions, rendering inline "Start Timer" buttons.
- **Smart Ghost Shopping List**: Groups items by aisle, consolidates duplicates, cross-references with pantry (ghosting matched items).
- **Creator Credits**: Displays creator information and "View Original Post" link on Recipe Detail.
- **Measurement Unit Preference**: Toggle between Imperial/Metric units, persisted locally, with dynamic conversion.

### Backend Architecture
- **Runtime**: Express.js on Node.js with TypeScript.
- **API Design**: RESTful endpoints under `/api/`.
- **AI Integration (via OpenAI API)**:
    - Recipe extraction from social media URLs and YouTube, including transcription with Whisper.
    - Web search fallback for incomplete social media recipes.
    - Ingredient estimation (`isEstimated`, `aisle` tagging) and recipe confidence levels (`confidence`).
    - Smart search, pantry ingredient matching, and pantry voice input parsing.
    - Remi AI chat assistant (`/api/remy/chat`) with recipe context awareness and voice transcription.
- **Authentication**: Email/password (scrypt hashing), Apple Sign-In, with Google/Facebook OAuth readiness. Bearer token-based sessions.
- **Subscriptions**: 30-day free trial, managed server-side. In-app subscriptions via RevenueCat SDK, syncing status to backend.
- **Data Storage**:
    - **Client-side**: AsyncStorage for offline-first recipe and pantry item storage.
    - **Server-side**: PostgreSQL with Drizzle ORM (schema in `shared/schema.ts`).
    - **Database Tables**: `users`, `sessions`.

### Project Structure
- `client/`: React Native app code.
- `server/`: Express backend with routes, data access layer, and AI service utilities.
- `shared/`: Shared code including Drizzle database schema and data models.

## External Dependencies

### AI Services
- **OpenAI API** (via Replit AI Integrations): Used for recipe extraction, smart search, pantry matching, and the Remi AI assistant.

### Database
- **PostgreSQL**: Primary data store.
- **Drizzle ORM**: Used for database schema management and type-safe queries.

### Subscriptions
- **RevenueCat**: Manages in-app purchases and subscriptions through `react-native-purchases`.

### Key npm Packages
- `expo`: Core mobile framework.
- `@tanstack/react-query`: Data fetching and caching.
- `react-native-reanimated`: Animations.
- `expo-image`: Optimized image loading.
- `openai`: AI API client.
- `drizzle-orm` & `drizzle-zod`: ORM with Zod validation.
- `react-native-purchases`: RevenueCat SDK.
- `expo-apple-authentication`: Apple Sign-In.
- `react-native-youtube-iframe` & `react-native-web-webview`: YouTube player integration.
- `react-native-gesture-handler`: For gesture controls.

### Deep Linking
- **Custom scheme**: `kitch://`.
- **Associated domains**: For handling Instagram/TikTok URLs.