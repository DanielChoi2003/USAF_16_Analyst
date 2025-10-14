git clone https://github.com/ethancurb/analyst-copilot.git
cd analyst-copilot
make setup # or: bash scripts/setup.sh

```
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

git add .
git commit -m "feat: add LLM ask question modal"

# Contributing — Short Guide

Getting started

```bash
git clone https://github.com/ethancurb/analyst-copilot.git
cd analyst-copilot
make setup    # runs backend/frontend setup
```

Development

- Start both services: make dev
- Run tests: make test
- Lint: make lint
- Format: make format

Testing

- Backend: pytest
- Frontend: Vitest

### **Frontend (TypeScript/React)**

#### Style Guide

- **Functional components** with hooks (no class components)
- **TypeScript strict mode** (no `any` without justification)
- **Props interfaces** defined for all components

#### Example:

```typescript
import { FC } from "react";
import { Package } from "@/lib/types";

interface PackageCardProps {
  package: Package;
  onSelect: (id: string) => void;
}

/**
 * Displays a package summary card in the sidebar.
 */
export const PackageCard: FC<PackageCardProps> = ({
  package: pkg,
  onSelect,
}) => {
  return (
    <div onClick={() => onSelect(pkg.package_id)}>
      <h3>{pkg.title}</h3>
      <span className="severity">{pkg.severity}</span>
    </div>
  );
};
```

#### File Structure

- **Components**: `PascalCase.tsx`
- **Utilities**: `camelCase.ts`
- **Hooks**: `useCustomHook.ts`

#### Tailwind CSS

- **Use utility classes** (avoid custom CSS where possible)
- **Group utilities logically**: layout → spacing → colors → typography
- **Extract repeated patterns** into components
