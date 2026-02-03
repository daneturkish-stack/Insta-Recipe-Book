# Kitch Design Guidelines

## Brand Identity

**Purpose**: Kitch transforms ephemeral Instagram food content into permanent, organized recipes. For home cooks who discover recipes on social media but want them preserved and accessible.

**Aesthetic Direction**: Soft, warm, and refined with pastel accents. Pure white canvas lets vibrant food photography shine as the hero. Pastel colors (lavender, sage, warm gray) highlight sections and create visual hierarchy.

**Memorable Element**: The elegant contrast between social media chaos and pristine recipe presentation. Each saved recipe feels like a curated cookbook page.

---

## Color Palette

### Core Colors
- **Font Color**: `#231212` - Rich dark brown for all text, elegant and warm
- **Background**: `#FFFFFF` - Pure white canvas for clean, airy layouts

### Pastel Accent Colors
- **Lavender**: `#d0cfe1` - Headers, active states, primary buttons
- **Sage Green**: `#e3e6d0` - Success states, tags, secondary accents
- **Warm Gray**: `#eceaea` - Section backgrounds, dividers, subtle borders

### Usage Guidelines
- Use lavender (`#d0cfe1`) for section headers and primary interactive elements
- Use sage green (`#e3e6d0`) for success indicators, tags, and organic accents
- Use warm gray (`#eceaea`) for subtle backgrounds and dividers
- All text should use the dark brown (`#231212`) for consistency
- White background (`#FFFFFF`) lets food photos and content pop

---

## Typography

### Font Family
**DM Sans** - Modern, geometric sans-serif with clean lines (similar to Satoshi)
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
- Subtle border using warm gray (`#eceaea`)
- Minimal shadow (barely visible)
- Border radius: 12-16px
- Content padding: 16px

### Buttons
- **Primary**: Lavender background (`#d0cfe1`), dark text (`#231212`)
- **Secondary**: White background, dark border, dark text
- **Success/Action**: Sage green background (`#e3e6d0`), dark text
- Height: 48px
- Border radius: 12px
- Font: DM Sans Medium

### Section Headers
- Background: Lavender (`#d0cfe1`) or Sage (`#e3e6d0`)
- Padding: 12px 16px
- Border radius: 8px
- Font: DM Sans SemiBold

### Tags/Badges
- Background: Sage green (`#e3e6d0`)
- Text: Dark brown (`#231212`)
- Padding: 4px 12px
- Border radius: 16px (pill shape)
- Font: DM Sans Regular, 12-14px

### Input Fields
- White background
- Warm gray border (`#eceaea`)
- Border radius: 12px
- Height: 52px
- Placeholder: Muted brown (`#5C5252`)

---

## Screen Specifications

### Recipe Cards
- Image: Full width at top, 4:3 aspect ratio
- Content: Below image with 16px padding
- Title: DM Sans SemiBold, 18px
- Meta row: Time, servings icons with values
- Tags: Pill-shaped, sage green background

### Collection Screen
- 2-column grid with 12px spacing
- Pull-to-refresh enabled
- Empty state: Centered illustration with helpful text

### Add Recipe Screen
- Platform toggle (Instagram/TikTok) at top
- URL input with lavender Generate button
- Tips section with sage green checkmarks

### Recipe Detail Screen
- Hero image (full width)
- Quick stats row with lavender background
- Ingredients section with sage green backgrounds for grouping
- Instructions with generous spacing
- Floating "Start Cooking" button

### Cook Mode
- High-contrast dark theme for kitchen visibility
- Background: Near-black (`#0A0A0A`)
- Text: White (`#FFFFFF`)
- Active step: Lavender (`#d0cfe1`)
- Completed: Sage (`#e3e6d0`)
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

- Icons: Feather icons from @expo/vector-icons
- Minimal shadows: Only for floating elements
- All touchables: opacity 0.85 on press
- Rounded corners: 12px inputs/buttons, 8-12px cards
- Generous spacing: 32px between major sections

---

## Design Principles

1. **Let Food Photos Shine**: White backgrounds ensure vibrant food photography pops
2. **Warm & Inviting**: Brown text and pastel accents create a cozy, cookbook feel
3. **Clean & Organized**: Generous spacing, clear hierarchy
4. **Consistent Pastel Usage**: Headers in lavender, success in sage, subtle in warm gray
5. **Modern Typography**: DM Sans provides clean, contemporary readability
