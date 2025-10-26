# EventMemory Design System

## 🎨 Overview

The EventMemory Design System implements a **vintage-modern hybrid** aesthetic with warm, nostalgic tones and clean, minimal components.

---

## Color Palette

### Primary Colors
- **Primary Background**: `#D2C1A1` - Warm beige (main background)
- **Accent**: `#C7B291` - Darker beige (highlights, secondary buttons)
- **Neutral Light**: `#E8E4DC` - Very light beige (cards, containers)
- **Neutral Dark**: `#3A2E1F` - Dark brown (borders, accents)

### Text Colors
- **Text Primary**: `#000000` - Black (main text)
- **Text Secondary**: `#4B3F2F` - Brown (secondary text)

### Inputs
- **Input Background**: `#E4E0D0` - Light beige

---

## Typography

### Font Family
- Primary: **Inter** (imported from Google Fonts)
- Fallback: System fonts (Helvetica, Arial, sans-serif)

### Font Sizes
- **Title**: 24px (large headings)
- **Subtitle**: 18px (section headings)
- **Body**: 14px (regular text)
- **Label**: 12px (small labels, uppercase)

### Font Weights
- **Title**: 700 (bold)
- **Body**: 400 (regular)

---

## Components

### Buttons

#### Primary Button
```tsx
<Button variant="primary">click me</Button>
```
- Background: Primary color
- Lowercase text
- Rounded corners (24px)
- Hover: 90% opacity

#### Secondary Button
```tsx
<Button variant="secondary">secondary</Button>
```
- Background: Accent color
- Same styling as primary

### Cards
```tsx
<Card>
  <h3>Card Title</h3>
  <p>Card content...</p>
</Card>
```
- Background: Primary color
- Border radius: 16px
- Shadow: Subtle
- Padding: 24px

### Panels
```tsx
<Panel>
  <p>Panel content</p>
</Panel>
```
- Background: Primary with 85% opacity
- Backdrop blur effect
- Border radius: 12px
- Padding: 16px
- Use for floating menus/overlays

### Inputs
```tsx
<Input 
  label="email address"
  placeholder="enter your email"
  type="email"
/>
```
- Background: Light neutral
- Border radius: 12px
- Focus: Ring in accent color
- Labels: Uppercase, small

### Modals
```tsx
<Modal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="modal title"
>
  <p>Modal content</p>
</Modal>
```
- Centered on screen
- Backdrop blur
- Scale-in animation
- Can include title (optional)

---

## Layout Patterns

### Floating Right Sidebar
```tsx
<div className="sidebar-right">
  {/* Menu items */}
</div>
```
- Fixed position on right side
- Vertically centered
- Used for main navigation menu

### Modal Center
```tsx
<div className="modal-center">
  {/* Modal content */}
</div>
```
- Fixed position, centered
- Max width: 28rem (448px)

### Event List Items
```tsx
<div className="event-list-item">
  {/* Event info */}
</div>
```
- Light neutral background
- Rounded corners
- Hover: Shadow effect
- Spacing: 16px between items

---

## Backgrounds

### Vintage Background
```tsx
<div className="vintage-bg">
  {/* Content */}
</div>
```
- Subtle cross pattern
- Warm beige overlay

### Map Texture Background
```tsx
<div className="map-texture-bg">
  {/* Content */}
</div>
```
- Radial gradients for depth
- Suitable for landing pages

---

## Animations

### Fade In
```tsx
<div className="animate-fade-in">
  {/* Content */}
</div>
```
- Duration: 300ms
- Ease-out timing

### Scale In
```tsx
<div className="animate-scale-in">
  {/* Content */}
</div>
```
- Duration: 250ms
- Used for modals
- Combines scale + fade

### Transitions
```tsx
<div className="transition-default">
  {/* Smoothly transitions all properties */}
</div>
```
- Duration: 300ms
- Ease-in-out timing

---

## Design Principles

### 1. **Lowercase Text**
All button text and most UI elements use lowercase for a casual, friendly feel.

### 2. **Rounded Corners**
Generous border radius (12-24px) for a modern, soft aesthetic.

### 3. **Subtle Shadows**
Light shadows for depth without heaviness.

### 4. **Warm Palette**
Beige and brown tones create a nostalgic, warm atmosphere.

### 5. **Minimal Icons**
Use outline-style icons, 16-20px size.

### 6. **Generous Spacing**
8px base grid for consistent spacing.

---

## Tailwind Config

All colors, fonts, and utilities are configured in `tailwind.config.js`:

```javascript
colors: {
  primary: { DEFAULT: '#D2C1A1', ... },
  accent: '#C7B291',
  // ...
}
```

Access them in your components:
```tsx
<div className="bg-primary text-text-primary">...</div>
```

---

## Usage Examples

### Login Form
```tsx
<Card>
  <h2 className="text-title mb-4">sign in</h2>
  <Input label="email" type="email" />
  <Input label="password" type="password" />
  <Button variant="primary" fullWidth>
    sign in
  </Button>
</Card>
```

### Event Card
```tsx
<Card className="hover:shadow-active transition-shadow cursor-pointer">
  <h3 className="text-subtitle mb-2">wedding celebration</h3>
  <p className="text-body text-text-secondary mb-4">
    October 25, 2025
  </p>
  <div className="flex gap-2">
    <Button variant="primary">view</Button>
    <Button variant="secondary">upload</Button>
  </div>
</Card>
```

---

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Panel.tsx
│   │   └── index.ts
│   └── layout/
│       └── FloatingMenu.tsx
├── design-system.json  # Design tokens
├── index.css          # Tailwind + custom styles
└── DESIGN_SYSTEM.md   # This file
```

---

## Tips

1. **Import from index**: 
   ```tsx
   import { Button, Card, Input } from '@/components/ui'
   ```

2. **Use Tailwind utilities** for spacing and layout:
   ```tsx
   <div className="flex gap-4 p-6">
   ```

3. **Combine custom classes** with Tailwind:
   ```tsx
   <div className="card mt-8 max-w-lg">
   ```

4. **Respect the design language**: lowercase, rounded, warm tones

---

## Resources

- Design System JSON: `src/design-system.json`
- Tailwind Config: `tailwind.config.js`
- Base Styles: `src/index.css`
- Component Examples: `src/pages/HomePage.tsx`

---

**Design Philosophy**: *nostalgic • refined • elegant*

