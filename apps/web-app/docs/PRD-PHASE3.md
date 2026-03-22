# OpenCode Chat - Phase 3 PRD

## Document Information

- **Version:** 3.0.0
- **Date:** 2026-03-09
- **Phase:** Phase 3 - Responsive & Panel Controls

---

## 1. Feature Overview

### 1.1 Responsive Design

**User Stories:**

```
As a user, I want to run this on mobile and tablet so UI should be responsive and fully functional even on mobile

As a user, I want to resize and hide/show session panel so I can use chat in full screen
```

**Breakpoints:**

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### 1.2 Mobile Adaptations (< 640px)

**Acceptance Criteria:**

- [ ] Sidebar hidden by default
- [ ] Hamburger menu button in header to toggle sidebar
- [ ] Sidebar opens as full-screen overlay with slide animation
- [ ] Chat area takes full width
- [ ] Message input at bottom with larger touch targets (min 48px height)
- [ ] Message bubbles use full width with smaller padding
- [ ] Touch swipe to navigate back from chat
- [ ] Keyboard-aware input (adjusts for virtual keyboard)
- [ ] No hover-only interactions

**UI Layout - Mobile:**

```
┌─────────────────────────────┐
│ ☰  OpenCode Chat      ⋮   │ ← Header with hamburger
├─────────────────────────────┤
│                             │
│   ┌─────────────────────┐   │
│   │ User message        │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │ Bot response        │   │
│   │ with markdown       │   │
│   └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│ [Message input...        ]  │ ← Fixed bottom input
│                             │
└─────────────────────────────┘
```

**Sidebar Overlay - Mobile:**

```
┌─────────────────────────────┐
│ ✕  Sessions            + New│
├─────────────────────────────┤
│ 🔍 Search...                │
├─────────────────────────────┤
│ 📄 Session 1           2m   │
│ 📄 Session 2           5m   │
│ 📄 Session 3          10m   │
│ ...                         │
└─────────────────────────────┘
```

### 1.3 Tablet Adaptations (640px - 1024px)

**Acceptance Criteria:**

- [ ] Sidebar closed by default
- [ ] Sidebar toggle button visible in header
- [ ] Sidebar opens as overlay (not full-screen, ~280px width)
- [ ] Chat area can expand when sidebar closed
- [ ] Semi-transparent backdrop when sidebar open
- [ ] Tap outside to close sidebar

**UI Layout - Tablet:**

```
┌──────┬───────────────────────────────┐
│ ☰    │  OpenCode Chat           ⋮   │
├──────┼───────────────────────────────┤
│      │                               │
│ SIDE │    Chat Area                  │
│ BAR  │                               │
│      │                               │
│ (280 │                               │
│  px) │                               │
│      ├───────────────────────────────┤
│      │ [Message input...         ]   │
└──────┴───────────────────────────────┘
```

---

## 2. Session Panel Controls

### 2.1 Hide/Show Toggle

**Acceptance Criteria:**

- [ ] Toggle button in header or sidebar to show/hide session panel
- [ ] Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
- [ ] Smooth slide animation (200ms ease-out)
- [ ] Chat area expands to fill space when sidebar hidden
- [ ] Persist sidebar state in localStorage
- [ ] Button icon changes based on state (☰ open / ✕ closed)

**API/State:**

```typescript
interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;  // in pixels
}

// Actions
toggleSidebar: () => void;
setSidebarOpen: (open: boolean) => void;
```

### 2.2 Resizable Sidebar

**Acceptance Criteria:**

- [ ] Drag handle on right edge of sidebar
- [ ] Visual indicator on hover (highlight color)
- [ ] Cursor changes to resize cursor on drag handle
- [ ] Min width: 200px
- [ ] Max width: 400px
- [ ] Real-time resize (no lag)
- [ ] Persist width in localStorage
- [ ] Double-click handle to reset to default (280px)

**Drag Handle UI:**

```
┌──────────┬─────────────────────────────┐
│ Sidebar  │ ║ ← Drag handle (6px wide)  │
│          │ ║                           │
│          │ ║   Chat Area               │
│          │ ║                           │
└──────────┴─────────────────────────────┘
```

**Technical Implementation:**

```typescript
interface ResizablePanelProps {
  direction: "left" | "right";
  minWidth: number;
  maxWidth: number;
  defaultWidth: number;
  storageKey: string; // for localStorage
  children: React.ReactNode;
}

// Uses CSS resize or custom drag implementation
// Recommend: react-resizable-panels or custom implementation
```

### 2.3 Fullscreen Chat Mode

**Acceptance Criteria:**

- [ ] Button to enter fullscreen chat mode
- [ ] Hides both sidebar and header
- [ ] Maximizes chat area to full viewport
- [ ] Floating button to exit fullscreen
- [ ] Keyboard shortcut: Cmd/Ctrl + Shift + F
- [ ] Preserves chat functionality (send messages, view history)

**UI - Fullscreen Mode:**

```
┌─────────────────────────────────────────┐
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ User message                    │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │ Bot response with markdown      │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Message input...                ] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                        [⊻] ← Exit button│
└─────────────────────────────────────────┘
```

---

## 3. Technical Requirements

### 3.1 Responsive CSS Strategy

**Tailwind CSS Approach:**

```css
/* Mobile (< 640px) */
.mobile-only {
  @apply block;
}
.tablet-only {
  @apply hidden;
}
.desktop-only {
  @apply hidden;
}

/* Tablet (640px - 1024px) */
@media (min-width: 640px) and (max-width: 1024px) {
  .tablet-only {
    @apply block;
  }
  .mobile-only {
    @apply hidden;
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
  .desktop-only {
    @apply block;
  }
  .mobile-only {
    @apply hidden;
  }
  .tablet-only {
    @apply hidden;
  }
}
```

### 3.2 State Management

```typescript
// stores/uiStore.ts
interface UIState {
  // Responsive
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;

  // Fullscreen
  isFullscreen: boolean;

  // Actions
  setDeviceType: () => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleFullscreen: () => void;
}

// Initialize device type on mount
const initDeviceType = () => {
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};
```

### 3.3 LocalStorage Keys

```typescript
const STORAGE_KEYS = {
  SIDEBAR_OPEN: "cloudy-webapp-sidebar-open",
  SIDEBAR_WIDTH: "cloudy-webapp-sidebar-width",
  FULLSCREEN: "cloudy-webapp-fullscreen",
  DEVICE_TYPE: "cloudy-webapp-device-type",
};
```

### 3.4 New Components

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx              # Add hamburger, toggle buttons
│   │   ├── Sidebar.tsx             # Add resize handle
│   │   ├── MobileSidebar.tsx      # Full-screen mobile sidebar
│   │   ├── TabletSidebar.tsx      # Overlay tablet sidebar
│   │   └── ResizableHandle.tsx    # Drag-to-resize component
│   └── common/
│       ├── FullscreenButton.tsx   # Fullscreen toggle
│       └── DeviceAware.tsx        # Device type detection wrapper
├── hooks/
│   ├── useDeviceType.ts            # Detect mobile/tablet/desktop
│   ├── useWindowSize.ts           # Window resize listener
│   └── useLocalStorage.ts         # Persist UI state
└── styles/
    └── responsive.css              # Responsive utilities
```

---

## 4. UI/UX Specifications

### 4.1 Header Modifications

**Mobile/Tablet Header:**

```
┌─────────────────────────────────────────┐
│ [☰] [Logo/Title]           [⋮] [⚙]    │
└─────────────────────────────────────────┘
```

- Hamburger button (☰) - Toggle sidebar
- Title - Centered or left-aligned
- Menu button (⋮) - Additional options
- Settings (⚙) - Settings modal

**Desktop Header:**

```
┌─────────────────────────────────────────┐
│ [Logo]  [Search...]          [⚙] [👤]  │
└─────────────────────────────────────────┘
```

- Sidebar toggle integrated in sidebar header
- No hamburger needed

### 4.2 Animations

**Sidebar Toggle (Desktop):**

- Slide: 200ms ease-out
- Width change: 150ms ease-in-out

**Sidebar Overlay (Mobile/Tablet):**

- Slide in: 250ms ease-out
- Backdrop fade: 200ms

**Fullscreen Transition:**

- Fade: 150ms
- Button appear: 300ms delay

---

## 5. Implementation Timeline

### Week 1: Foundation

- [ ] Add device type detection hooks
- [ ] Create responsive layout wrapper
- [ ] Implement sidebar toggle state
- [ ] Add localStorage persistence

### Week 2: Mobile

- [ ] Create mobile header with hamburger
- [ ] Implement full-screen sidebar overlay
- [ ] Adjust message bubbles for mobile
- [ ] Add touch-friendly input area

### Week 3: Tablet & Desktop

- [ ] Implement tablet overlay sidebar
- [ ] Add resize handle to desktop sidebar
- [ ] Implement width persistence
- [ ] Add keyboard shortcuts

### Week 4: Polish

- [ ] Fullscreen mode
- [ ] Animations refinement
- [ ] Test on real devices
- [ ] Fix edge cases

---

## 6. Testing Checklist

### Responsive

- [ ] UI renders correctly on 320px width
- [ ] UI renders correctly on 375px width (iPhone)
- [ ] UI renders correctly on 768px width (iPad)
- [ ] UI renders correctly on 1024px width
- [ ] Text is readable on all sizes
- [ ] Touch targets are minimum 44x44px
- [ ] No horizontal scroll on any size

### Sidebar Toggle

- [ ] Toggle button works on all breakpoints
- [ ] Keyboard shortcut works (Cmd/Ctrl + B)
- [ ] State persists after reload
- [ ] Animation is smooth

### Resizable Sidebar

- [ ] Drag handle is visible
- [ ] Cursor changes on hover
- [ ] Min/max width enforced
- [ ] Resize is smooth (no lag)
- [ ] Width persists after reload
- [ ] Double-click resets width

### Fullscreen Mode

- [ ] Button visible and works
- [ ] Keyboard shortcut works
- [ ] Chat fully functional in fullscreen
- [ ] Exit button visible and works

---

## 7. Keyboard Shortcuts

| Shortcut             | Action                        |
| -------------------- | ----------------------------- |
| Cmd/Ctrl + B         | Toggle sidebar                |
| Cmd/Ctrl + Shift + F | Toggle fullscreen             |
| Esc                  | Close sidebar (mobile/tablet) |

---

## Appendix

### Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### CSS Considerations

- Use `clamp()` for fluid typography
- Use `calc()` for dynamic spacing
- Avoid fixed pixel values where possible
- Test with device emulation in DevTools
