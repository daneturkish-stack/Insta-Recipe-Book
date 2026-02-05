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
- Remy AI assistant for cooking questions, substitutions, and recipe recommendations
- Text-to-speech for Remy responses with auto-speak toggle
- Cross-platform support (iOS, Android, Web)

### Recipe Transparency System
Kitch provides full transparency about where recipe information comes from and how accurate it is:

**Confidence Levels:**
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

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (New Architecture enabled)
- **Navigation**: React Navigation v7 with native stack navigators
  - Tab-based navigation (Collection, Add Recipe, Pantry, Profile)
  - Stack navigation within each tab for detail views
  - Full-screen modal for Cook Mode
- **State Management**: TanStack React Query for server state, local AsyncStorage for recipe persistence
- **Animations**: React Native Reanimated for smooth micro-interactions
- **Styling**: Custom design system in `client/constants/theme.ts` with soft pastel palette (lavender #d0cfe1 primary, sage #e3e6d0 accent, white background)
- **Typography**: Google Fonts (DM Sans for all text - modern geometric sans-serif)
- **Design Philosophy**: Light, airy layouts with pastel accents; dark brown (#231212) text for warmth; generous spacing to let food photos shine

### Backend Architecture
- **Runtime**: Express.js on Node.js with TypeScript
- **API Design**: RESTful endpoints under `/api/` prefix
- **AI Integration**: OpenAI API via Replit AI Integrations for:
  - Recipe extraction from social media URLs (`/api/recipes/generate`)
  - Video transcription with Whisper for accurate ingredient/instruction extraction
  - Web search fallback to find creator's full recipe on their website/blog when social media post is incomplete
  - Smart search across recipe collection (`/api/recipes/search`)
  - Pantry ingredient matching (`/api/recipes/pantry-match`)
  - Pantry voice input parsing (`/api/pantry/parse-voice`) - converts spoken ingredients to categorized items
  - Remy AI chat assistant (`/api/remy/chat`) with recipe context awareness
  - Voice transcription for Remy (`/api/remy/transcribe`)

### Data Storage
- **Client-side**: AsyncStorage for recipes and pantry items (offline-first approach)
- **Server-side**: PostgreSQL with Drizzle ORM (schema in `shared/schema.ts`)
- **Current Usage**: Users table exists; recipes are stored client-side only

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

### Key npm Packages
- `expo` (SDK 54): Core mobile framework
- `@tanstack/react-query`: Data fetching and caching
- `react-native-reanimated`: Animations
- `expo-image`: Optimized image loading
- `openai`: AI API client
- `drizzle-orm` + `drizzle-zod`: Database ORM with Zod validation

### Deep Linking
- Custom scheme: `kitch://`
- Associated domains for Instagram/TikTok URL handling (iOS/Android intent filters configured in `app.json`)