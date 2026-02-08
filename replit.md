# Kitch

## Overview

Kitch is a React Native/Expo mobile application that transforms ephemeral Instagram and TikTok food content into permanent, organized cookbook-quality recipes. Users can paste social media URLs, and the app uses AI to extract and structure recipe information including ingredients, instructions, prep times, and categorization. The app features a warm, organic/editorial aesthetic inspired by premium cookbooks.

Key capabilities:
- Extract recipes from Instagram Reels/Posts and TikTok videos via AI
- Video transcription using OpenAI Whisper for accurate recipe extraction
- Web search fallback to find creator's full recipe on their website/blog
- Recipe transparency: confidence levels (high/medium/low), source attribution, authoritative references
- Local recipe storage with search and smart AI-powered filtering
- Pantry management with ingredient matching to find makeable recipes
- Voice input for pantry: speak items aloud, AI parses and categorizes them automatically
- Cook Mode for step-by-step guided cooking with hands-free voice reading
- Remi AI assistant (dedicated tab) for food and cooking conversations, recipe help, and recommendations — Jamie Oliver-inspired conversational tone
- Remi chat UI: ChatGPT-style clean layout (no speech bubbles), typewriter text effect with word highlighting
- Remi Tips & Tricks guide: built-in modal with app usage tips (gestures, saving recipes, accuracy, pantry, Cook Mode)
- Dietary preferences (Vegetarian, Vegan, Gluten-Free, etc.) that Remi respects in suggestions
- Native gesture controls for intuitive cooking experience
- Cross-platform support (iOS, Android, Web)
- User authentication (email/password, Apple Sign-In, Google/Facebook ready)
- 30-day free trial with hard paywall via RevenueCat
- In-app subscriptions managed through RevenueCat SDK

### Gesture Controls (Native Mobile Features)
The app includes intuitive gesture controls designed for hands-free cooking:

**Pan-to-Cook Swipe:**
- Swipe right on any recipe card in the collection to instantly enter Cook Mode
- Visual "Cook!" indicator appears during swipe with haptic feedback
- Threshold: swipe 100px to trigger, auto-enables voice reading

**Recipe Roulette (Shake-to-Pick):**
- Shake your phone on the Collection screen to randomly select a recipe
- Prioritizes pantry-matched recipes (50%+ ingredient match) when available
- Animated overlay with slot machine effect and haptic feedback
- Native mobile only (uses Accelerometer - disabled on web)

**Pinch-to-Scale Ingredients:**
- Pinch in/out on the ingredients section in Recipe Detail to adjust servings
- Scale range: 0.25x to 4x (rounds to nearest 0.25 increment)
- Real-time ingredient amount recalculation
- Visual scale indicator bubble during pinch
- Alternative +/- buttons for manual adjustment

### Recipe Transparency System
Kitch provides full transparency about where recipe information comes from and how accurate it is:

**Confidence Levels (now returned by both server logic AND the LLM):**
- **High**: Full recipe found on **verified** creator's website with explicit measurements
- **Medium**: Extracted from video transcript, filled from authoritative sources, OR found on unverified website
- **Low**: Reconstructed from social post caption only - details may be estimated

**Source Types:**
- `creator_website`: Full recipe retrieved from creator's blog/website
- `authoritative_source`: Missing details filled from trusted culinary references
- `video_transcript`: Extracted from video audio with OpenAI Whisper
- `social_post_only`: Only post caption available

**Website Verification System:**
When a recipe is found via web search, Kitch verifies whether the website belongs to the content creator:
- `domain_match`: Domain closely matches the creator's handle (e.g., @thehappypear → thehappypear.ie)
- `instagram_link`: Website contains an Instagram link matching the creator's handle
- `unverified`: No verification found - recipe may not be from the original creator

Only verified sources receive "High Accuracy" status. Unverified websites are capped at "Medium Accuracy" even if the recipe content is complete.

**Authoritative References:**
When the AI fills in missing measurements or techniques, it references trusted sources:
- Serious Eats / J. Kenji López-Alt
- NYT Cooking / Melissa Clark
- Bon Appétit / Claire Saffitz
- America's Test Kitchen
- Jacques Pépin
- Marcella Hazan
- Samin Nosrat / Salt Fat Acid Heat

## Recent Changes (Feb 2026)

### Smart Ghost Shopping List
- Shopping list now groups items by aisle category headers (Produce, Meat, Dairy, Bakery, etc.)
- Duplicate ingredients are consolidated: amounts merge when units match, or show combined amounts
- Pantry cross-reference: when adding recipes to shopping list, ingredients are compared against the user's pantry
- Ghost state: pantry-matched items appear with `inPantry: true` and `isChecked: true` by default, shown at 50% opacity with an "In Pantry" badge
- Users can uncheck ghost items if they need to buy more
- Items are sorted by aisle order, with pantry items appearing last within each aisle

### Creator Credits on Recipe Detail
- New "Creator Credits" section at the bottom of the Recipe Detail screen
- Displays creator name, handle, avatar, and platform badge
- "View Original Post" button links back to the source URL

### Cook Mode Upgrades (YouTube Sync, Remi Voice, Timers)
- **YouTube Player Integration**: YouTube recipes (`platform === 'youtube'` with `videoUrl`) show an embedded YouTube player at the top of Cook Mode. Player auto-seeks to step timestamps when navigating steps.
- **Structured Instructions**: Instructions now support both plain strings and `{ text, timestamp }` objects via `InstructionStep` type. The `timestamp` field enables YouTube video sync per step.
- **Ask Remi Mic Button**: Floating mic FAB (bottom-right) in Cook Mode. Triggers haptic pulse and reads out step-specific ingredients via TTS. Hackathon demo keyword detection for "How much?" / "What ingredients?" queries.
- **Timer Detection**: RegEx scans instruction text for time mentions (e.g., "10 mins", "2 hours", "30 seconds"). Renders inline "Start Timer" buttons. Active timers show countdown badge. Native alert fires when timer hits zero.
- **Dependencies**: `react-native-youtube-iframe` + `react-native-web-webview` (web fallback)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (New Architecture enabled)
- **Navigation**: React Navigation v7 with native stack navigators
  - Tab-based navigation (Collection, Add Recipe, Remi, Pantry, Profile)
  - Stack navigation within each tab for detail views
  - Full-screen modal for Cook Mode
- **State Management**: TanStack React Query for server state, local AsyncStorage for recipe persistence
- **Animations**: React Native Reanimated for smooth micro-interactions
- **Styling**: Custom design system in `client/constants/theme.ts` with Warm Modern Kitchen palette (Teal #0D9488 primary, Amber #E8A838 accent, Slate #1E293B dark sections, warm off-white #FAF7F5 background)
- **Typography**: Google Fonts (Inter for all text - modern, clean sans-serif) with hero typography (40px) for splash screens
- **Design Philosophy**: "Warm Modern Kitchen" aesthetic with deep warm teal (#0D9488) primary, golden amber (#E8A838) accents, warm off-white (#FAF7F5) backgrounds. Features:
  - 4 streamlined card accent colors (teal, golden, pink, lavender)
  - Pill-shaped buttons with full border radius
  - Large rounded corners (24px), warm shadows with visible depth, generous spacing
  - Dark slate (#1E293B) cards for premium sections
  - Semantic color systems: MatchColors (pantry), PastelColors (category chips), VibeTagColors (recipe tags)
  - WCAG-compliant contrast ratios throughout
  - Warm dark mode with deep black (#141218) background and warm undertones

### Backend Architecture
- **Runtime**: Express.js on Node.js with TypeScript
- **API Design**: RESTful endpoints under `/api/` prefix
- **AI Integration**: OpenAI API via Replit AI Integrations for:
  - Recipe extraction from social media URLs including YouTube (`/api/recipes/generate`)
  - YouTube transcript fetching via `youtube-transcript` package (captions API)
  - Video transcription with Whisper for accurate ingredient/instruction extraction
  - Web search fallback to find creator's full recipe on their website/blog when social media post is incomplete
  - Per-ingredient `isEstimated` flags and `aisle` (AisleCategory) tagging
  - Per-recipe `isEstimatedInstructions` flag and LLM-returned `confidence` level
  - Smart search across recipe collection (`/api/recipes/search`)
  - Pantry ingredient matching (`/api/recipes/pantry-match`)
  - Pantry voice input parsing (`/api/pantry/parse-voice`) - converts spoken ingredients to categorized items
  - Remi AI chat assistant (`/api/remy/chat`) with recipe context awareness
  - Voice transcription for Remi (`/api/remy/transcribe`)

### Authentication & Subscriptions
- **Auth**: Email/password with scrypt hashing, Apple Sign-In (iOS), Google/Facebook OAuth (UI ready, needs OAuth config)
- **Sessions**: Bearer token-based, stored in SecureStore (native) / AsyncStorage (web), managed via `client/lib/auth-token.ts`
- **Trial System**: 30-day free trial starts on signup, tracked server-side via `trial_start_date`
- **Subscriptions**: RevenueCat SDK (`react-native-purchases`) for in-app purchases
  - Configured with `EXPO_PUBLIC_REVENUECAT_API_KEY` env var
  - User identified with RevenueCat on login via `identifyRevenueCatUser()`
  - After purchase, subscription status synced to backend via `POST /api/auth/subscription`
  - PaywallScreen shows when `hasAccess` is false (trial expired + no active subscription)
- **Access Logic**: `active` subscription → access granted; `expired`/`cancelled` → access revoked; `trial` → time-based (30 days)
- **Navigation Gating**: `RootStackNavigator` shows AuthScreen → PaywallScreen → Main app based on auth/access state

### Data Storage
- **Client-side**: AsyncStorage for recipes and pantry items (offline-first approach)
- **Server-side**: PostgreSQL with Drizzle ORM (schema in `shared/schema.ts`)
- **Database Tables**: `users` (auth, profile, trial/subscription), `sessions` (auth tokens)

### Project Structure
```
client/           # React Native app code
├── components/   # Reusable UI components
├── screens/      # Screen components
├── navigation/   # Navigation configuration
├── hooks/        # Custom React hooks
├── constants/    # Theme and design tokens
├── types/        # TypeScript type definitions
└── lib/          # Utilities (API client, query client)

server/           # Express backend
├── routes.ts     # API route definitions
├── storage.ts    # Data access layer
└── replit_integrations/  # AI service utilities

shared/           # Shared code between client/server
├── schema.ts     # Drizzle database schema
└── models/       # Shared data models
```

### Path Aliases
- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

## External Dependencies

### AI Services
- **OpenAI API** (via Replit AI Integrations): Recipe extraction, smart search, pantry matching
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Database
- **PostgreSQL**: Connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and type-safe queries

### Subscriptions
- **RevenueCat**: In-app purchase management via `react-native-purchases`
  - Environment variable: `EXPO_PUBLIC_REVENUECAT_API_KEY`
  - Entitlement ID: `premium`
  - Hook: `client/hooks/useRevenueCat.ts`

### Key npm Packages
- `expo` (SDK 54): Core mobile framework
- `@tanstack/react-query`: Data fetching and caching
- `react-native-reanimated`: Animations
- `expo-image`: Optimized image loading
- `openai`: AI API client
- `drizzle-orm` + `drizzle-zod`: Database ORM with Zod validation
- `react-native-purchases`: RevenueCat SDK for subscriptions
- `expo-apple-authentication`: Apple Sign-In

### Deep Linking
- Custom scheme: `kitch://`
- Associated domains for Instagram/TikTok URL handling (iOS/Android intent filters configured in `app.json`)