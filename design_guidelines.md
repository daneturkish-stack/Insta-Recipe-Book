# Kitch Design Guidelines - Premium Light

## Brand Identity

**Purpose**: Kitch transforms ephemeral Instagram and TikTok food content into permanent, organized recipes. For home cooks who discover recipes on social media but want them preserved and accessible.

**Aesthetic Direction**: Premium Light - A clean, sophisticated, modern culinary app aesthetic. Features vibrant Emerald Green for primary actions, warm Amber accents, and soft off-white backgrounds that make food photography pop. The design feels fresh, trustworthy, and appetizing.

**Memorable Element**: Modern rounded shapes with generous spacing, soft shadows, and a harmonious color palette that evokes freshness and culinary excellence.

---

## Color Palette

### Core Colors
- **Primary**: `#10B981` - Vibrant Emerald Green for buttons and interactive elements
- **Accent**: `#FBBF24` - Warm Amber for secondary accents and highlights
- **Background**: `#F8F9FA` - Soft off-white for canvas (lets food photos pop)
- **Surface**: `#FFFFFF` - Pure white for cards and inputs
- **Text Primary**: `#1F2937` - Dark slate for high readability
- **Text Secondary**: `#6B7280` - Cool gray for secondary text

### Supporting Colors
- **Border**: `#E5E7EB` - Light gray for subtle dividers
- **Neutral**: `#F3F4F6` - Light gray for subtle backgrounds
- **Error**: `#EF4444` - Red for errors
- **Success**: `#10B981` - Emerald for success states (same as primary)

### Dark Mode
- **Background**: `#111827`
- **Surface**: `#1F2937`
- **Text Primary**: `#F9FAFB`
- **Text Secondary**: `#9CA3AF`
- **Border**: `#374151`

### Usage Guidelines
- Use Emerald Green (`#10B981`) for primary buttons and key interactive elements
- Use Amber (`#FBBF24`) for secondary accents, badges, and warm highlights
- White text on Emerald buttons for high contrast
- Off-white background (`#F8F9FA`) creates a clean canvas for food imagery
- Soft shadows instead of borders for depth (modern, clean look)

---

## Typography

### Font Family
**Inter** - Clean, modern sans-serif with excellent readability
- Regular (400) - Body text, descriptions
- Medium (500) - Labels, links, emphasis
- SemiBold (600) - Subheadings, important text
- Bold (700) - Headings, titles

### Type Scale
- **H1**: 32px / 40px line-height - Page titles (Inter Bold)
- **H2**: 28px / 36px line-height - Section headings (Inter Bold)
- **H3**: 24px / 32px line-height - Card titles (Inter SemiBold)
- **H4**: 20px / 28px line-height - Subsection titles (Inter SemiBold)
- **Body**: 16px / 24px line-height - Regular text (Inter Regular)
- **Body Medium**: 16px / 24px line-height - Emphasized text (Inter Medium)
- **Small**: 14px / 20px line-height - Secondary info (Inter Regular)
- **Caption**: 12px / 16px line-height - Labels, timestamps (Inter Regular)

---

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs) with Emerald Green active states
- **Recipes** (tab 1): Browse saved recipes in grid
- **Add** (tab 2): Add from Instagram/TikTok URL
- **Pantry** (tab 3): Manage ingredients
- **Profile** (tab 4): User settings and preferences

**Stack Structure**:
- Collection tab → Recipe Detail (pushed) → Cook Mode (modal)

---

## Components

### Cards
- White background (`#FFFFFF`)
- Large rounded corners: 24px border-radius
- Soft shadows (no visible borders)
- Content padding: 16px
- Shadow: `shadowOpacity: 0.08, shadowRadius: 16px`

### Buttons
- **Primary**: Emerald Green background (`#10B981`), white text
- **Amber/Secondary**: Amber background (`#FBBF24`), dark text
- **Outline**: Transparent with Emerald border and text
- Height: 52px
- Border radius: 9999px (fully rounded/pill shape)
- Font: Inter Medium, 600 weight
- Subtle shadow on primary buttons

### Section Headers
- Background: Off-white (`#F8F9FA`) or light surface
- Padding: 12px 16px
- Border radius: 16px
- Font: Inter SemiBold

### Tags/Badges
- Primary tags: Emerald Green 15% opacity background, Emerald text
- Accent tags: Amber 20% opacity background, amber-brown text (`#92400E`)
- Padding: 6px 14px
- Border radius: 9999px (fully rounded/pill shape)
- Font: Inter Medium, 12-14px

### Input Fields
- Default: White background, soft gray border on focus
- Search: Pill-shaped, soft gray background (`#F3F4F6`), no border
- Border radius: 16px (default), 9999px (search)
- Height: 52px (default), 48px (search)
- Placeholder: Cool gray (`#6B7280`)

---

## Screen Specifications

### Recipe Cards (Grid)
- Image: Full width at top, 4:3 aspect ratio
- Large rounded corners: 24px border-radius
- Soft shadow for depth
- Content: Below image with 12px padding
- Title: Inter Medium, 16px
- Meta row: Time, servings with Emerald icons
- Tags: Pill-shaped, Emerald/Amber background

### Collection Screen
- 2-column grid with 16px spacing
- Off-white background (`#F8F9FA`)
- Pull-to-refresh enabled
- Emerald Green active tab indicator
- Quick action chips: Pill-shaped with Emerald active state

### Add Recipe Screen
- Platform toggle (Instagram/TikTok) at top
- URL input with Emerald Green Generate button
- Pill-shaped inputs and buttons

### Recipe Detail Screen
- **Hero Image**: Full width, 320px height with rounded bottom corners (24px)
- **Title**: Large Inter Bold heading
- **Stats Bar**: Horizontal row with 3 sections
  - Time (clock icon, Emerald background)
  - Steps (list icon, Amber background)
  - Difficulty (award icon, Purple background)
  - 24px border-radius, soft shadow
- **Visual Ingredient Cards**: Horizontal scrollable
  - Each card: 100px wide, icon above name
  - Rounded corners: 20px
  - Tap to check off ingredients
- **Full Ingredients List**: Card with checkboxes
- **Instructions**: Numbered steps with Emerald step indicators
- **Floating CTA**: "Start Cooking" button - Emerald, pill-shaped, bottom-fixed

### Cook Mode
- High-contrast dark theme for kitchen visibility
- Background: Near-black (`#0A0A0A`)
- Text: White (`#FFFFFF`)
- Active step: Emerald Green (`#10B981`)
- Completed: Amber (`#FBBF24`)
- Extra large typography (26px+ body text)
- Timer: 64px bold

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
- **5xl**: 48px

---

## Border Radius System

- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 32px
- **card**: 24px (standard for all cards)
- **full**: 9999px (pill shapes)

---

## Shadow System

### Card Shadow
```javascript
shadowColor: "#000000",
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.08,
shadowRadius: 16,
elevation: 4
```

### Card Light Shadow
```javascript
shadowColor: "#000000",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 8,
elevation: 2
```

### Button Shadow (Emerald)
```javascript
shadowColor: "#10B981",
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.25,
shadowRadius: 8,
elevation: 4
```

### Floating Shadow
```javascript
shadowColor: "#000000",
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 0.12,
shadowRadius: 24,
elevation: 8
```

---

## Visual Design

- Icons: Feather icons from @expo/vector-icons
  - Primary actions: Emerald Green
  - Secondary/neutral: Cool gray
- Soft shadows: For cards and floating elements (no harsh borders)
- All touchables: Scale to 0.97 on press with spring animation
- Rounded corners: 24px for cards, pill (full) for buttons/tags
- Generous spacing: 32px between major sections
- Tab bar: Blur effect on iOS, Emerald active indicator

---

## Design Principles

1. **Clean & Premium**: White space, soft shadows, polished feel
2. **Food-Forward**: Off-white backgrounds let food photos be the hero
3. **Fresh & Modern**: Emerald evokes freshness and natural ingredients
4. **Warm & Inviting**: Amber accents add warmth and appetite appeal
5. **Readable & Accessible**: Inter font, high contrast text
6. **Consistent Hierarchy**: Clear visual weight with color and typography
