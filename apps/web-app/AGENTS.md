# @cloudy/web-app

React 19 web application with TypeScript, Vite, and Tailwind.

## Commands

```bash
bun run dev                    # Development
bun run build                  # Build (includes tsc -b)
bun run lint                   # Linting (ESLint)
bun run lint --fix             # Auto-fix

bun test                       # Run all tests
bun test src/components/button.test.ts  # Single test file
bun test --watch               # Watch mode

bun run storybook              # Storybook dev
bun run build-storybook        # Build Storybook
```

## TypeScript

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `moduleResolution: bundler`
- `target: ESNext`

## React

- **React 19** with functional components and hooks
- Prefer **named exports** for components
- Use `type` for TypeScript type annotations (not `interface` for component props)

## Component Structure

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ComponentProps<"button"> {
    variant?: "default" | "outline"
    size?: "default" | "sm"
}

function Button({ className, variant = "default", ...props }: ButtonProps) {
    return (
        <button
            className={cn("base-classes", className)}
            {...props}
        />
    )
}

export { Button }
```

## Styling

- **Tailwind CSS v4**
- Use `cn()` utility from `@/lib/utils` for class merging
- **shadcn/ui** patterns with `class-variance-authority` (CVA) for component variants
- Design tokens via CSS variables: `bg-primary`, `text-muted-foreground`

### CVA Example

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva("base-classes", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground",
            outline: "border-border bg-background hover:bg-muted",
        },
        size: {
            default: "h-8 px-2.5",
            sm: "h-7 px-2.5",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
})
```

## State Management

- **Zustand** - global state (stores in `src/stores/`)
- **React Hook Form** + **Zod** - form handling
- **@tanstack/react-router** - routing

## Path Aliases

- `@/*` maps to `src/*`
- Use absolute imports

## Directory Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui base components
│   ├── chat/        # Chat-related components
│   └── markdown/    # Markdown rendering
├── features/        # Feature-specific components
├── hooks/           # Custom React hooks
├── stores/          # Zustand stores
├── routes/          # TanStack Router routes
└── lib/             # Utilities
```

## Testing (Vitest)

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Component', () => {
    it('renders', () => {
        render(<Component />)
        expect(screen.getByText('Hello')).toBeInTheDocument()
    })
})
```

Test files go **alongside** components (not in `test/` directory).

## Storybook

- Stories co-located with components in `*.stories.tsx` files
- Run `bun run storybook` for dev
- Addons: a11y, docs

## Linting (ESLint)

ESLint config: `eslint.config.js` with:
- `typescript-eslint`
- `react-hooks`
- `react-refresh`
- `eslint-plugin-storybook`

## Dependencies Key

| Package | Purpose |
|---------|---------|
| `@base-ui/react` | Base UI components |
| `@cloudy/contracts` | Shared contracts |
| `@elysiajs/eden` | Elysia client |
| `@tanstack/react-router` | Routing |
| `react-hook-form` + `zod` | Forms |
| `zustand` | State management |
| `shadcn` | UI components |
| `tiptap` | Rich text editor |
| `mermaid` | Diagrams |
| `diff2html` | Diff viewing |
| `highlight.js` | Syntax highlighting |
