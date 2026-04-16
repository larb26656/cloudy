# Fix Mobile Settings Overlay Issue

## Problem
On mobile, selecting a settings menu item creates stacked/overlapping pages because both `SettingsMenu` and `<Outlet />` render simultaneously.

## Solution
Use `useLocation` to detect if we're on the parent settings route or a child route. Show EITHER menu OR detail, not both.

## Changes

### File: `apps/web-app/src/routes/settings.tsx`

**Add import:**
```tsx
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
```

**Modify SettingsPage function:**
```tsx
function SettingsPage() {
  const { isMobile } = useDeviceType();
  const location = useLocation();
  const isOnSettingsRoot = location.pathname === "/settings";

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <Header prefixActions={isOnSettingsRoot ? [] : [<BackButton />]} title="Settings" />
        {isOnSettingsRoot ? (
          <SettingsMenu className="flex-1 overflow-y-auto p-4" />
        ) : (
          <Outlet />
        )}
      </div>
    );
  }
  // ... desktop layout unchanged
}
```

## Result
- On `/settings` → shows Header + SettingsMenu
- On `/settings/instance` → shows Header with BackButton + Detail content only
