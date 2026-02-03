# Kitch Design Guidelines

## Brand Identity

**Purpose**: Kitch transforms ephemeral Instagram food content into permanent, organized cookbook-quality recipes. It's for home cooks who discover recipes on social media but want them preserved in a structured, reliable format.

**Aesthetic Direction**: Organic/Editorial fusion - warm, curated, and sophisticated like a premium cookbook with modern touches. Think earthy tones, generous whitespace, and typographic hierarchy that elevates food content.

**Memorable Element**: The instant transformation from social media chaos to cookbook clarity. Each recipe card feels like a page from a beautifully designed cookbook.

---

## Navigation Architecture

**Root Navigation**: Tab Bar (3 tabs)
- **Collection** (tab 1): Browse saved recipes in grid layout
- **Add** (tab 2, center): Core action - add recipe from Instagram URL
- **Profile** (tab 3): User settings and preferences

**Navigation Stack**: Simple two-level hierarchy
- Tab screens are root level
- Recipe detail is pushed onto Collection stack
- Modals: None required for MVP

---

## Screen Specifications

### 1. Collection Screen (Tab 1)
**Purpose**: Browse and search saved recipes

**Layout**:
- Header: Transparent, large title "My Recipes", right button (search icon)
- Content: 2-column grid of recipe cards, scrollable
- Safe area: top = headerHeight + 32, bottom = tabBarHeight + 32

**Components**:
- Recipe cards: Image (16:9 aspect), recipe title overlay (bottom gradient), prep time badge (top-right)
- Empty state: Center-aligned illustration with "No recipes yet" heading and "Save your first recipe" subtext
- Search bar (appears when search icon tapped): Filters by recipe name or ingredients
- Pull-to-refresh

**Visual Details**:
- Cards have subtle rounded corners (12px) with soft shadow
- Tap feedback: slight scale down (0.97)
- Grid spacing: 16px between cards

---

### 2. Add Recipe Screen (Tab 2)
**Purpose**: Input Instagram URL and generate recipe

**Layout**:
- Header: Transparent, large title "Add Recipe"
- Content: Scrollable form
- Safe area: top = headerHeight + 32, bottom = tabBarHeight + 32

**Components**:
- Instagram URL input field with placeholder "Paste Instagram link..."
- "Generate Recipe" button (primary, full-width, below input)
- Loading state: Spinner with "Extracting recipe..." text
- Success state: Preview card of generated recipe with "Save to Collection" button
- Error state: Inline error message below input

**Visual Details**:
- Input has subtle border, focus state increases border opacity
- Button uses primary color with press feedback
- Preview card matches Collection card style

---

### 3. Recipe Detail Screen (Stack, from Collection)
**Purpose**: View complete recipe with ingredients and instructions

**Layout**:
- Header: Default navigation header with back button, title = recipe name, right button (share icon, placeholder)
- Content: Scrollable
- Safe area: top = 16, bottom = insets.bottom + 32

**Components**:
- Hero image (full-width, 300px height)
- Recipe metadata row: Prep time, cook time, servings
- Ingredients section: List with checkboxes (non-functional MVP)
- Instructions section: Numbered steps, generous line height
- Source badge: "From Instagram" with link icon

**Visual Details**:
- Sections separated by subtle dividers
- Generous vertical spacing (24px between sections)
- Instructions use larger font size for readability

---

### 4. Profile Screen (Tab 3)
**Purpose**: User preferences (no auth required)

**Layout**:
- Header: Transparent, large title "Profile"
- Content: Scrollable form
- Safe area: top = headerHeight + 32, bottom = tabBarHeight + 32

**Components**:
- Avatar (generated preset, circular, 80px)
- Display name field
- App preferences: Theme toggle (light/dark), notification preferences (placeholder)
- About section: App version, privacy policy link (placeholder), terms link (placeholder)

---

## Color Palette

**Primary**: #D97E43 (warm terracotta - approachable, food-friendly)
**Background**: #FFFBF7 (cream - soft, warm base)
**Surface**: #FFFFFF (white cards for recipe content)
**Text Primary**: #2D2520 (dark brown - readable, warm)
**Text Secondary**: #7A6F68 (muted brown)
**Border**: #E8DFD8 (subtle taupe)
**Accent**: #8FA67C (sage green - fresh, organic)
**Error**: #C94528 (warm red)

---

## Typography

**Font**: Crimson Text (Google Font) for headings, paired with Inter (Google Font) for body text
- **Large Title**: Crimson Text Bold, 32px
- **Title**: Crimson Text Semibold, 24px
- **Headline**: Inter Semibold, 18px
- **Body**: Inter Regular, 16px
- **Caption**: Inter Regular, 14px
- **Small**: Inter Regular, 12px

---

## Visual Design

- Use Feather icons from @expo/vector-icons
- Floating "Generate Recipe" button: subtle shadow (offset: {width: 0, height: 2}, opacity: 0.10, radius: 2)
- All touchable elements: opacity 0.7 on press
- Recipe cards: soft shadow (offset: {width: 0, height: 4}, opacity: 0.08, radius: 8)
- Rounded corners: 12px for cards, 8px for buttons/inputs

---

## Assets to Generate

1. **icon.png** - App icon featuring stylized cookbook with Instagram gradient accent
   - WHERE USED: Device home screen

2. **splash-icon.png** - Same as icon.png, centered on cream background
   - WHERE USED: App launch screen

3. **empty-collection.png** - Warm illustration of empty cookbook with bookmark
   - WHERE USED: Collection screen when no recipes saved

4. **avatar-preset.png** - Circular avatar with chef's hat icon on terracotta background
   - WHERE USED: Profile screen default avatar

5. **recipe-placeholder.png** - Soft food-themed pattern (subtle vegetables/herbs silhouettes)
   - WHERE USED: Recipe cards when image fails to load