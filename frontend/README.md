# Analyst Copilot Frontend

Air Force SOC Intelligence Platform - Frontend UI built with Next.js 14, TypeScript, and Tailwind CSS.

## ✅ Complete Features

### UI Component Library

- ✅ **Base Components**: Button, Badge, Card, Modal, Input, Chip, Tooltip
- ✅ **Layout Components**: Header (72px), SideNav (260px, collapsible)
- ✅ **Event Components**: EventRow (expandable), EventList (with filters)
- ✅ **Enrichment Components**: TechniqueCard (MITRE ATT&CK), MISPMatchRow (threat intel)
- ✅ **Report Components**: ReportEditor (with AI actions, diff view)

### Pages

- ✅ **Home Page** (`/`): Package list view with cards
- ✅ **Package Detail** (`/packages/[id]`): Full three-column layout
  - Events column (340px): Scrollable event list with filters
  - Enrichment column (360px): MITRE techniques + MISP matches
  - Report column (flex): Editable report with AI actions

### Design System

- ✅ **Air Force Color Palette**: Navy #0B2545, Accent Blue #0A63D8
- ✅ **Typography**: Inter (UI), JetBrains Mono (code)
- ✅ **Component Styles**: Consistent spacing, shadows, hover states
- ✅ **Animations**: Fade-in, slide-up, smooth transitions

### Interactions

- ✅ Click event → Expand raw data, highlight related techniques
- ✅ Click technique → Highlight related events, show MITRE details
- ✅ LLM actions → Modal with diff view (accept/reject)
- ✅ Filters → Host, subtype, search query
- ✅ Collapsible sidebar

## 🚀 Quick Start

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout with fonts
│   │   ├── page.tsx                 # Home page (package list)
│   │   ├── packages/[id]/page.tsx   # Package detail (3-column layout)
│   │   └── api/packages/[id]/       # Mock API endpoint
│   ├── components/
│   │   ├── ui/                      # Base UI primitives
│   │   │   ├── Button.tsx           # Primary, secondary, danger, ghost variants
│   │   │   ├── Badge.tsx            # Severity indicators
│   │   │   ├── Card.tsx             # Container with hover/selected states
│   │   │   ├── Modal.tsx            # Dialog with overlay
│   │   │   ├── Input.tsx            # Text field with validation
│   │   │   ├── Chip.tsx             # Entity badges (host, IP, user, file)
│   │   │   └── Tooltip.tsx          # Hover information
│   │   ├── layout/
│   │   │   ├── Header.tsx           # Top nav (72px)
│   │   │   └── SideNav.tsx          # Left sidebar (260px, collapsible)
│   │   ├── events/
│   │   │   ├── EventRow.tsx         # Individual event (expandable)
│   │   │   └── EventList.tsx        # Scrollable list with filters
│   │   ├── enrichment/
│   │   │   ├── TechniqueCard.tsx    # MITRE ATT&CK technique
│   │   │   └── MISPMatchRow.tsx     # Threat intel match
│   │   └── report/
│   │       └── ReportEditor.tsx     # Editable report with AI actions
│   ├── lib/
│   │   ├── types.ts                 # TypeScript definitions (250+ lines)
│   │   └── utils.ts                 # Utility functions (cn, formatDate, etc.)
│   └── styles/
│       └── globals.css              # Tailwind + Air Force design system
├── public/                           # Static assets
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Air Force color palette
└── next.config.js                    # Next.js configuration
```

## 🎨 Design System

### Colors

- **Navy**: `#0B2545` (primary background, headers)
- **Accent Blue**: `#0A63D8` (actions, links, highlights)
- **Slate Grays**: 50-900 scale (secondary UI)
- **Semantic Colors**: Danger (red), Warning (amber), Success (green)

### Layout Variables

```css
--header-height: 72px --sidebar-width: 260px --footer-height: 40px;
```

### Component Classes

All components use Tailwind CSS with custom Air Force design tokens. See `globals.css` for component styles.

## 📊 Mock Data

Currently loads sample data from `/api/packages/[id]` which serves files from `../data/samples/`:

- `ex1-enriched.json` - PsExec lateral movement example
- `baseline.json` - Empty schema template

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 3.x + custom Air Force palette
- **UI Primitives**: Radix UI (Dialog, Tooltip)
- **Icons**: Lucide React
- **Fonts**: Inter (UI), JetBrains Mono (code)

## 🎯 Next Steps (Future Work)

### Backend Integration

- [ ] Connect to FastAPI backend (`http://localhost:8000`)
- [ ] Replace mock API with real endpoints
- [ ] Implement authentication (user profiles)

### State Management

- [ ] Zustand store for global state
- [ ] Persist selected event/technique across navigation
- [ ] Cache loaded packages

### Additional Features

- [ ] Upload package modal with drag-drop
- [ ] Export modal with format options (PDF, JSON, Word)
- [ ] Provenance panel showing LLM call history
- [ ] Raw JSON toggle in footer
- [ ] Real-time updates (WebSocket)
- [ ] Dark mode toggle

### LLM Integration

- [ ] Connect LLM actions to backend
- [ ] Real diff view (text-diff library)
- [ ] Stream AI responses
- [ ] LLM call history panel

## 📝 Notes

### Current State

- ✅ All UI components built and styled
- ✅ Three-column layout fully functional
- ✅ Interactions implemented (click events, filters, highlights)
- ✅ TypeScript types match JSON schemas
- ✅ Build succeeds with no errors
- ✅ Responsive to Figma specification

### Known Limitations

- Mock data only (no real backend connection yet)
- LLM actions show diff view but don't call actual API
- No authentication system
- No real-time updates
- Provenance panel not implemented (planned for footer)

### Development Notes

- All components use `forwardRef` for flexibility
- Accessibility attributes included (aria-label, sr-only)
- TypeScript strict mode enabled (zero `any` types)
- Consistent naming conventions (PascalCase components, camelCase props)
- All interactive elements have hover states

## 📚 Documentation

For more information:

- Project architecture: `/ARCHITECTURE.md`
- Contributing guidelines: `/CONTRIBUTING.md`
- Backend API: `/backend/README.md` (when implemented)
- Type definitions: `/frontend/src/lib/types.ts`

---

**Built with ❤️ for the Air Force SOC**
