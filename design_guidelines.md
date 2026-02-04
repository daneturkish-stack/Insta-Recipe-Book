# Kitch Design Guidelines

## Brand Identity

**Purpose**: Kitch transforms ephemeral Instagram food content into permanent, organized recipes. For home cooks who discover recipes on social media but want them preserved and accessible.

**Aesthetic Direction**: Playful, vibrant, and energetic - inspired by modern app design (like Maggie). Fresh mint green primary color with sunny yellow accents creates a joyful, food-friendly atmosphere. The design feels fun and approachable, making recipe saving feel like an adventure rather than a chore.

**Memorable Element**: A friendly, organic feel with bold rounded shapes and cheerful colors. Each interaction should spark joy and make cooking feel lighter.

---

## Color Palette

### Core Colors
- **Primary**: `#82EDA6` - Fresh mint green for buttons and interactive elements
- **Accent**: `#FFFF94` - Sunny yellow for highlights and special elements
- **Background**: `#F9F8F4` - Warm cream/off-white for cozy canvas
- **Text Primary**: `#03594D` - Deep teal for headings and emphasis
- **Text Secondary**: `#4A6B65` - Muted teal for body text

### Supporting Colors
- **Secondary Button**: `#FCCDDC` - Soft pink for secondary actions
- **Surface**: `#FFFFFF` - Pure white for cards and inputs
- **Border**: `#E8E6E0` - Subtle warm gray for dividers
- **Error**: `#E85858` - Warm red for errors

### Usage Guidelines
- Use mint green (`#82EDA6`) for primary buttons and key interactive elements
- Use sunny yellow (`#FFFF94`) sparingly for badges, highlights, and playful accents
- Use deep teal (`#03594D`) for headings and important text
- Cream background (`#F9F8F4`) creates warmth; white for cards/inputs
- Pink (`#FCCDDC`) for secondary buttons and gentle emphasis

---

## Typography

### Font Family
**Archivo** - Clean, modern sans-serif with friendly character
- Regular (400) - Body text, descriptions
- Medium (500) - Labels, links, emphasis
- SemiBold (600) - Subheadings, important text
- Bold (700) - Headings, titles

### Type Scale
- **H1**: 32px / 40px line-height - Page titles
- **H2**: 28px / 36px line-height - Section headings
- **H3**: 24px / 32px line-height - Card titles
- **H4**: 20px / 28px line-height - Subsection titles
- **Body**: 16px / 24px line-height - Regular text
- **Small**: 14px / 20px line-height - Secondary info
- **Caption**: 12px / 16px line-height - Labels, timestamps

---

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs)
- **Collection** (tab 1): Browse saved recipes in grid
- **Add** (tab 2): Add from Instagram/TikTok URL
- **Pantry** (tab 3): Manage ingredients
- **Profile** (tab 4): User settings and preferences

**Stack Structure**:
- Collection tab → Recipe Detail (pushed) → Cook Mode (modal)

---

## Components

### Cards
- White background (`#FFFFFF`)
- Very subtle border using warm gray (`#E8E6E0`)
- Soft rounded corners (16-20px)
- Content padding: 16px
- Minimal shadow for depth

### Buttons
- **Primary**: Mint green background (`#82EDA6`), teal text (`#03594D`)
- **Secondary**: Soft pink background (`#FCCDDC`), teal text
- **Outline**: Transparent with teal border and text
- Height: 48-52px
- Border radius: 100px (fully rounded/pill shape)
- Font: Archivo Medium

### Section Headers
- Background: Mint green (`#82EDA6`) or cream (`#F9F8F4`)
- Padding: 12px 16px
- Border radius: 16px
- Font: Archivo SemiBold

### Tags/Badges
- Background: Sunny yellow (`#FFFF94`) or mint green (`#82EDA6`)
- Text: Deep teal (`#03594D`)
- Padding: 6px 14px
- Border radius: 100px (fully rounded/pill shape)
- Font: Archivo Medium, 12-14px

### Input Fields
- White background
- Warm gray border (`#E8E6E0`)
- Border radius: 16px
- Height: 52px
- Placeholder: Muted teal (`#4A6B65`)

---

## Screen Specifications

### Recipe Cards
- Image: Full width at top, 4:3 aspect ratio
- Content: Below image with 16px padding
- Title: Archivo SemiBold, 18px, deep teal
- Meta row: Time, servings icons with values
- Tags: Pill-shaped, yellow or mint background

### Collection Screen
- 2-column grid with 12px spacing
- Cream background (`#F9F8F4`)
- Pull-to-refresh enabled
- Empty state: Cheerful illustration with helpful text

### Add Recipe Screen
- Platform toggle (Instagram/TikTok) at top
- URL input with mint green Generate button
- Tips section with friendly icons

### Recipe Detail Screen
- Hero image (full width)
- Quick stats row with mint green background
- Ingredients section with subtle cards
- Instructions with generous spacing
- Floating "Start Cooking" button (mint green, fully rounded)

### Cook Mode
- High-contrast dark theme for kitchen visibility
- Background: Near-black (`#0A0A0A`)
- Text: White (`#FFFFFF`)
- Active step: Mint green (`#82EDA6`)
- Completed: Sunny yellow (`#FFFF94`)
- Extra large typography (26px+ body text)

---

## Spacing System

Using 4px base unit:
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 32px
- **4xl**: 40px

---

## Visual Design

- Icons: Feather icons from @expo/vector-icons in teal
- Soft shadows: For cards and floating elements
- All touchables: opacity 0.85 on press
- Rounded corners: 16-20px for cards, 100px (full) for buttons/tags
- Generous spacing: 32px between major sections
- Organic, blob-like shapes for backgrounds when appropriate

---

## Design Principles

1. **Joyful & Playful**: Colors and shapes should spark joy and make cooking fun
2. **Fresh & Friendly**: Mint green evokes freshness; rounded shapes feel approachable
3. **Clean & Organized**: Generous spacing, clear hierarchy
4. **Let Food Photos Shine**: Subtle backgrounds ensure food photography pops
5. **Consistent Color Usage**: Mint for primary actions, yellow for highlights, pink for secondary
