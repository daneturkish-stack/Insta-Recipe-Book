# Kitch Design Guidelines

## Brand Identity

**Purpose**: Kitch transforms ephemeral Instagram food content into permanent, organized recipes. For home cooks who discover recipes on social media but want them preserved and accessible.

**Aesthetic Direction**: Minimalist/clean - soft, airy, and refined. Maximum whitespace, subtle details, letting vibrant food photography shine as the hero. Think gallery-like presentation where the food is art and the interface fades into the background.

**Memorable Element**: The dramatic contrast between social media chaos and pristine recipe presentation. Each saved recipe feels like a professional food magazine layout.

---

## Navigation Architecture

**Root Navigation**: Tab Bar (3 tabs)
- **Collection** (tab 1): Browse saved recipes in grid
- **Add** (tab 2, center): Core action - add from Instagram URL
- **Profile** (tab 3): User settings and preferences

**Authentication**: Not required (local storage only)

**Stack Structure**:
- Collection tab → Recipe Detail (pushed)
- No modals for MVP

---

## Screen Specifications

### 1. Collection Screen
**Purpose**: Browse and search saved recipes

**Layout**:
- Header: Transparent, large title "Recipes", right button (search icon)
- Content: 2-column grid, scrollable
- Safe area: top = headerHeight + 32, bottom = tabBarHeight + 32

**Components**:
- Recipe cards: Full-bleed image (1:1 aspect), thin gradient overlay at bottom, recipe title (white, bottom-left), prep time badge (top-right, frosted glass effect)
- Empty state: Center-aligned illustration, "No recipes yet" heading, "Save your first from Instagram" subtext
- Search bar (when activated): Filters by name/ingredients
- Pull-to-refresh

**Visual Details**:
- Cards: 8px rounded corners, no visible shadows (images float cleanly)
- Grid spacing: 12px
- Press feedback: opacity 0.85

---

### 2. Add Recipe Screen
**Purpose**: Input Instagram URL and generate recipe

**Layout**:
- Header: Transparent, large title "Add Recipe"
- Content: Scrollable form, centered vertically when not loading
- Safe area: top = headerHeight + 32, bottom = tabBarHeight + 32

**Components**:
- Instagram URL input: Large, borderless with light gray background, placeholder "Paste Instagram link..."
- "Generate Recipe" button: Primary color, full-width, 48px height
- Loading state: Spinner with "Extracting recipe..." below
- Success state: Preview card (matches Collection style) with "Save" button
- Error state: Inline message below input, subtle red text

**Visual Details**:
- Input: 12px rounded, subtle fill color, no border
- Button: 12px rounded, press opacity 0.85
- Generous vertical spacing (32px between elements)

---

### 3. Recipe Detail Screen
**Purpose**: View complete recipe with ingredients and instructions

**Layout**:
- Header: Default navigation, back button, title (recipe name), right button (share icon, placeholder)
- Content: Scrollable
- Safe area: top = 16, bottom = insets.bottom + 32

**Components**:
- Hero image: Full-width, 375px height
- Quick stats row (below image): Prep time, servings, difficulty - horizontal layout with icons, light gray background, rounded
- Ingredients section: Title, list with tap-to-check circles (non-functional MVP)
- Instructions section: Title, numbered steps with generous line spacing
- Source footer: "Saved from Instagram" with small link icon

**Visual Details**:
- Sections: 32px vertical spacing
- Quick stats: 16px padding, 8px rounded, centered text
- Instructions: 20px line height for readability
- No section dividers - whitespace defines hierarchy

---

### 4. Profile Screen
**Purpose**: User preferences (no authentication)

**Layout**:
- Header: Transparent, large title "Profile"
- Content: Scrollable form
- Safe area: top = headerHeight + 32, bottom = tabBarHeight + 32

**Components**:
- Avatar: 88px circle, generated preset
- Display name field: Editable text input
- Preferences: Theme toggle (light/dark), notifications toggle
- About section: App version, privacy policy link, terms link (all placeholders)

---

## Color Palette

**Primary**: #4A90E2 (soft blue - fresh, trustworthy)
**Background**: #FAFAFA (soft white - airy, clean)
**Surface**: #FFFFFF (pure white - cards, inputs)
**Text Primary**: #1A1A1A (near-black - crisp readability)
**Text Secondary**: #6B6B6B (medium gray)
**Border**: #E5E5E5 (subtle gray)
**Accent**: #7DC579 (fresh green - organic, positive)
**Error**: #E85D5D (soft red)

---

## Typography

**Fonts**: SF Pro (iOS system font) for consistency and legibility
- **Large Title**: SF Pro Bold, 32px
- **Title**: SF Pro Semibold, 24px
- **Headline**: SF Pro Semibold, 18px
- **Body**: SF Pro Regular, 16px
- **Caption**: SF Pro Regular, 14px
- **Small**: SF Pro Regular, 12px

---

## Visual Design

- Icons: Feather icons from @expo/vector-icons
- Minimal shadows: Only use for floating elements
- "Generate Recipe" button shadow: offset {width: 0, height: 2}, opacity 0.10, radius 2
- All touchables: opacity 0.85 on press
- Rounded corners: 12px inputs/buttons, 8px cards
- Generous spacing: 32px between major sections, 16px between related elements

---

## Assets to Generate

1. **icon.png** - Minimalist cookbook icon, soft blue accent on white
   - WHERE USED: Device home screen

2. **splash-icon.png** - Same as icon.png, centered on soft white
   - WHERE USED: App launch screen

3. **empty-collection.png** - Light, airy illustration of empty recipe book with Instagram icon
   - WHERE USED: Collection screen when no recipes saved

4. **avatar-preset.png** - Simple circular avatar, light gray background with chef hat icon in soft blue
   - WHERE USED: Profile screen default avatar

5. **recipe-placeholder.png** - Soft gradient (white to light gray) with subtle cutlery pattern
   - WHERE USED: Recipe cards when image fails to load