# Design Guidelines: Next.js Auth Starter

## Design Approach
**System Selected**: Material Design 3 with modern refinements
**Rationale**: Authentication applications demand trust, clarity, and efficiency. Material Design provides established patterns for forms, data display, and state management while feeling contemporary and professional.

## Typography
**Font Stack**: 
- Primary: Inter (weights: 400, 500, 600, 700)
- Monospace: JetBrains Mono (for code/tokens)

**Hierarchy**:
- H1: 3xl-4xl, font-bold (page titles)
- H2: 2xl-3xl, font-semibold (section headers)
- H3: xl, font-semibold (card titles)
- Body: base, font-normal
- Small: sm, font-medium (labels, captions)

## Layout System
**Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16 for consistent rhythm
**Container**: max-w-7xl with px-4 for main content areas
**Cards**: max-w-md for auth forms, max-w-4xl for dashboard content

## Component Library

### Authentication Pages
**Login/Signup Forms**:
- Centered card layout (max-w-md) with generous padding (p-8)
- Floating labels on inputs with subtle border emphasis
- Large, prominent CTA button (w-full, py-3)
- Social auth buttons with provider icons (stacked or 2-column grid)
- "Remember me" checkbox + "Forgot password" link alignment
- Footer with navigation to alternate auth action

### Dashboard Layout
**Structure**:
- Persistent sidebar (w-64) with user profile section at top
- Main content area with breadcrumb navigation
- Top bar with search, notifications, user menu (right-aligned)
- Card-based content sections with subtle shadows (shadow-sm)

### Navigation
**Sidebar**:
- Grouped menu items with icon + label
- Active state: background highlight + left border accent
- Collapsible menu groups for organization
- User profile card: avatar (h-10 w-10) + name + role

**Top Bar**:
- Sticky positioning (sticky top-0)
- Search input with icon prefix (w-96 max)
- Icon buttons for notifications and user menu
- Dropdown menus with dividers between sections

### Forms & Inputs
**Text Inputs**:
- Full-width with bottom border emphasis
- Floating label animation on focus
- Helper text below (text-sm text-gray-600)
- Error states with red accent + icon

**Buttons**:
- Primary: solid background, rounded-lg, px-6 py-3
- Secondary: outlined with 2px border
- Text buttons: no background, underline on hover
- Icon buttons: p-2 with hover background

### Data Display
**Tables**:
- Striped rows for readability
- Fixed header on scroll
- Row hover state with subtle background change
- Action column (right-aligned) with icon buttons

**Cards**:
- Consistent padding (p-6)
- Header section with title + action button
- Divider between header and content (border-b)
- Footer for metadata or secondary actions

### Account Management
**Settings Sections**:
- Tab navigation for categories (Profile, Security, Notifications)
- Two-column layout for labels + inputs (grid grid-cols-3)
- Save button fixed at bottom-right of content area
- Confirmation toasts for successful updates

### Profile Section
**User Profile Display**:
- Large avatar (h-24 w-24) with upload overlay on hover
- Name, email, role in stacked layout
- Metadata badges (account type, join date)
- Quick stats cards (sessions, activity) in 3-column grid

## Images

**Hero Image**: No large hero image needed. Focus on clean, functional UI.

**Avatar Images**: User profile pictures throughout (default to initials in colored circle if no image)

**Empty States**: Simple illustration placeholders for empty tables/lists (max-w-xs, centered)

**Brand Assets**: Logo in sidebar header (h-8) and auth pages (h-12)

## Animations
**Minimal Motion**:
- Input focus: border color transition (150ms)
- Button hover: scale(1.02) + shadow increase (200ms)
- Dropdown menus: fade-in with slide-down (150ms)
- Toast notifications: slide-in from top-right (300ms)
- Page transitions: crossfade (200ms)

## Visual Treatment
**Elevation**: Use shadow-sm for cards, shadow-md for dropdowns, shadow-lg for modals

**Borders**: Subtle gray borders (border-gray-200) for separation, avoid heavy lines

**Rounded Corners**: Consistent rounded-lg (8px) for most elements, rounded-full for avatars/pills

**Focus States**: 2px blue ring offset by 2px for all interactive elements