# LNV ERP — React + Vite Frontend

**LNV Manufacturing Pvt. Ltd., Ranipet, Tamil Nadu**

## Stack
- **React 18** + **Vite 5** + **React Router v6**
- **Axios** (backend API) | **Recharts** (charts) | **lucide-react** (icons)
- CSS Modules (scoped styles per component)
- Backend: `http://localhost:3000` (proxied via `/api`)

## Start
```bash
cd lnv-erp
npm install
npm run dev
# Open: http://localhost:5173
```

## Structure
```
src/
├── main.jsx              # Entry point
├── App.jsx               # Router (lazy-loaded per module)
├── styles/               # Global CSS + design tokens
├── context/              # Auth (RBAC), Theme
├── services/api.js       # Central Axios client
├── hooks/useApi.js       # Data fetching hooks
├── utils/format.js       # INR, date, GST formatters
├── components/
│   ├── ui/               # Badge, Button, KPICard, DataTable, Modal, FormSection
│   └── layout/           # AppShell, ModuleLayout, ProtectedRoute
└── modules/
    ├── auth/             # Login page
    ├── home/             # Master dashboard
    ├── sd/               # Sales & Distribution
    ├── mm/               # Materials Management (Purchase)
    ├── pp/               # Production Planning
    ├── fi/               # Finance & Accounting
    ├── qm/               # Quality Management
    ├── pm/               # Plant Maintenance
    ├── hcm/              # HR & Payroll
    ├── wm/               # Warehouse Management
    ├── crm/              # CRM
    └── config/           # System Configuration
```

## Module Structure (per module)
```
modules/mm/
├── pages/
│   ├── MMLayout.jsx      # Sub-router + nav + sidebar config
│   ├── MMDashboard.jsx   # Dashboard page
│   ├── POList.jsx        # List pages
│   ├── PONew.jsx         # Form pages
│   └── ...
└── services/
    └── mmApi.js          # All API calls for this module
```

## Key Design Decisions
- **Lazy loading**: Each module loads only when navigated to (code split)
- **RBAC**: Role → module access in `AuthContext`
- **Shared components**: DataTable, KPICard, FormSection used by ALL modules
- **CSS Modules**: No global class conflicts
- **Demo login**: 6 roles available without backend
