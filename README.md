# 🏭 LNV ERP — Enterprise Resource Planning for Indian Manufacturing

<div align="center">

![LNV ERP Banner](https://img.shields.io/badge/LNV%20ERP-v2.0-714B67?style=for-the-badge&logo=react&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Modules](https://img.shields.io/badge/Modules-18+-00A09D?style=flat-square)
![Screens](https://img.shields.io/badge/Screens-250+-E06F39?style=flat-square)
![GST](https://img.shields.io/badge/GST-Compliant-196F3D?style=flat-square)

**A full-stack, production-ready ERP built specifically for Indian manufacturing companies.**  
Surface Treatment · Textile · Fabrication · Auto Components · General Manufacturing

[🚀 Live Demo](#demo) · [📦 Modules](#modules) · [⚙️ Setup](#setup) · [📋 Validate](#validate)

</div>

---

## 📸 Screenshots

| Home Dashboard | Sales Module | Finance / GST |
|---|---|---|
| SAP-style tree sidebar | Invoice + GST breakup | ITC Reconciliation |

---

## 🗂️ Module Index

| # | Module | Key | Screens | Status |
|---|---|---|---|---|
| 1  | Sales & Distribution | `/sd`      | 14 | ✅ Complete |
| 2  | Materials Management | `/mm`      | 17+ | ✅ Complete |
| 3  | Warehouse Management | `/wm`      | 14 | ✅ Complete |
| 4  | Finance & Accounting | `/fi`      | 35 | ✅ Complete |
| 5  | Production Planning  | `/pp`      | 35 | ✅ Complete |
| 6  | Quality Management   | `/qm`      | 12 | ✅ Complete |
| 7  | Plant Maintenance    | `/pm`      | 12 | ✅ Complete |
| 8  | Human Capital Mgmt   | `/hcm`     | 28 | ✅ Complete |
| 9  | CRM                  | `/crm`     | 18 | ✅ Complete |
| 10 | Transport Management | `/tm`      | 6  | ✅ Complete |
| 11 | Asset Management     | `/am`      | 6  | ✅ Complete |
| 12 | Civil / Projects     | `/civil`   | 6  | ✅ Complete |
| 13 | Visitor Management   | `/vm`      | 4  | ✅ Complete |
| 14 | Canteen Management   | `/cn`      | 4  | ✅ Complete |
| 15 | Reports & Analytics  | `/reports` | 13 | ✅ Complete |
| 16 | KPI / KRA            | `/kpi`     | 8  | ✅ Complete |
| 17 | Admin / Audit        | `/admin`   | 5  | ✅ Complete |
| 18 | Config / Settings    | `/config`  | 13 | ✅ Complete |

**Total: 250+ screens · 18 modules · 24 print templates**

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 5 + React Router v6 |
| **Styling** | CSS Modules + CSS Variables (Odoo-inspired purple palette) |
| **Fonts** | Syne (headings) · DM Sans (body) · DM Mono (numbers) |
| **Charts** | Pure CSS bar/donut charts (no chart library dependency) |
| **Print** | `window.print()` + `@page { size: A4 }` CSS |
| **Excel** | SheetJS (xlsx) for comparative statement export |
| **State** | React useState / useContext (AuthContext with RBAC) |
| **Backend** | Node.js + Express (localhost:3000) — *integration in progress* |
| **Notifications** | react-hot-toast |

---

## 🚀 Quick Start

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/lnv-erp.git
cd lnv-erp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
> App runs at **http://localhost:5173**

### 4. Build for production
```bash
npm run build
npm run preview   # preview production build
```

---

## 🔐 Demo Login Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | admin@lnv.com | admin123 | All 18 modules |
| **Manager** | manager@lnv.com | manager123 | Operations + Finance |
| **Accounts** | accounts@lnv.com | accounts123 | FI + SD + MM |
| **Operations** | ops@lnv.com | ops123 | PP + QM + PM + WM + MM |
| **HR** | hr@lnv.com | hr123 | HCM + Canteen + Visitor |
| **Sales** | sales@lnv.com | sales123 | SD + CRM |

> **Tip:** Click any role card on the login page to auto-fill credentials.

---

## 📁 Project Structure

```
lnv-erp/
├── public/
├── src/
│   ├── modules/               # All ERP modules
│   │   ├── sd/pages/          # Sales & Distribution (14 screens)
│   │   ├── mm/pages/          # Materials Management (17+ screens)
│   │   ├── fi/pages/          # Finance (35 screens)
│   │   ├── pp/pages/          # Production (35 screens)
│   │   ├── qm/pages/          # Quality (12 screens)
│   │   ├── pm/pages/          # Maintenance (12 screens)
│   │   ├── hcm/pages/         # HR (28 screens)
│   │   ├── wm/pages/          # Warehouse (14 screens)
│   │   ├── crm/pages/         # CRM (18 screens)
│   │   ├── tm/pages/          # Transport (6 screens)
│   │   ├── am/pages/          # Assets (6 screens)
│   │   ├── civil/pages/       # Civil (6 screens)
│   │   ├── vm/pages/          # Visitor (4 screens)
│   │   ├── cn/pages/          # Canteen (4 screens)
│   │   ├── reports/pages/     # Reports (13 screens)
│   │   ├── kpi/pages/         # KPI/KRA (8 screens)
│   │   ├── admin/pages/       # Admin (5 screens)
│   │   └── config/pages/      # Config (13 screens)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx   # Main shell (topbar + module nav)
│   │   │   ├── ModuleLayout.jsx # Per-module sidebar + subnav
│   │   │   └── ProtectedRoute.jsx
│   │   ├── print/             # 24 A4 print templates
│   │   └── ui/
│   │       ├── UniversalSearch.jsx  # Ctrl+K global search
│   │       └── NotificationsPanel.jsx
│   ├── context/
│   │   └── AuthContext.jsx    # RBAC + 9 roles + canDo() helper
│   ├── hooks/
│   │   └── useAuth.js
│   ├── services/
│   │   └── api.js             # Backend API connector
│   └── styles/
│       └── globals.css        # Global design tokens + utilities
├── package.json
└── vite.config.js
```

---

## 🖨️ Print Templates

Access the **Print Center** at `/print` — all 22 document types:

| Module | Documents |
|---|---|
| SD | Sales Order · Tax Invoice · Delivery Challan · Quotation |
| MM | Purchase Indent · Purchase Order · Comparative Statement · GRN |
| PP | Job Order · Bill of Materials · Labour Card |
| WM | Stock Transfer Note · Material Issue Slip |
| FI | Payment Voucher · Receipt Voucher · Journal Entry |
| QM | Inspection Report · NCR |
| PM | Maintenance Work Order · Breakdown Report |
| HCM | Pay Slip |
| TM | Trip Sheet · Fuel Log Report |

---

## 🛡️ RBAC — Role-Based Access Control

9 roles defined in `src/context/AuthContext.jsx`:

| Role | Modules | Actions |
|---|---|---|
| admin | All 18 | Full CRUD + Approve + Export + Settings |
| manager | Operations + Support | CRUD + Approve + Export |
| accounts | FI + SD + MM + AM | CRUD + Approve + Export |
| operations | PP + QM + PM + WM + MM + TM | CRUD + Reports |
| hr | HCM + CN + VM | CRUD + Approve + Export |
| sales | SD + CRM | CRUD + Reports |
| transport | TM + MM | CRUD + Approve + Export |
| civil | Civil + AM + MM | CRUD + Approve + Export |
| viewer | SD + MM + PP + FI | View + Reports only |

---

## 🔍 What to Validate (Peer Review Checklist)

### ✅ Already Implemented
- [ ] Login with RBAC (9 roles)
- [ ] Module navigation (grouped dropdown nav)
- [ ] Universal Search (Ctrl+K) across 50+ items
- [ ] Notifications Panel (RBAC-aware alerts)
- [ ] All 18 module layouts + sidebars
- [ ] PR → CS → PO → GRN workflow (MM)
- [ ] Sales Order → Invoice → Payment workflow (SD)
- [ ] GST compliance: GSTR-1/3B/9, ITC Recon, E-Invoice, HSN
- [ ] KPI Master → Monthly Entry → Scorecard → Incentive
- [ ] 24 print templates (A4 PDF)
- [ ] Print buttons on 28 list screens
- [ ] Reports module (13 reports)
- [ ] Home dashboard with KPI tiles + chart

### 🔲 Pending / Missing — Please Validate
- [ ] **Backend API** — All pages use mock data. `localhost:3000` API integration pending.
- [ ] **Search functionality** — Universal search is UI only, no backend search
- [ ] **Real notifications** — Currently static mock data, not from DB
- [ ] **Mobile responsive** — Desktop optimized, mobile layout not done
- [ ] **AI Intelligence Suite** — HTML prototype exists, React port pending
- [ ] **User profile edit** — No profile picture / password change UI
- [ ] **Multi-company** — Config exists but switching not wired
- [ ] **Excel Import** — Export works (SheetJS), import not built
- [ ] **Email notifications** — WhatsApp/SMS/Email integration not done
- [ ] **Audit trail** — Admin audit log page exists but not wired to actions
- [ ] **Dark mode** — Not implemented
- [ ] **Data validation** — Forms have basic validation, need thorough review
- [ ] **Error boundaries** — Need React error boundary wrappers
- [ ] **Loading states** — Some pages missing skeleton loaders
- [ ] **Pagination** — List pages show mock data, pagination UI exists but not wired

### 🐛 Known Issues
- Some emoji in JSX text nodes may cause Babel parse errors on older Vite configs
- AppShell topbar search needs `UniversalSearch.jsx` and `NotificationsPanel.jsx` in `src/components/ui/`
- New modules (TM, AM, Civil, VM, CN, KPI, Reports) need to be added to `App.jsx` and `AuthContext.jsx`

---

## 📋 File Installation Order (Fresh Setup)

If installing fresh from provided ZIP files, apply in this order:

1. `lnv-erp-base.zip` — Core modules (SD, MM, WM, FI, PP, QM, PM, HCM, CRM, Admin, Config)
2. `lnv-erp-extended-modules.zip` — TM, AM, Civil, VM, CN modules
3. `lnv-erp-rbac-update.zip` — AuthContext + RolesPermissions update
4. `lnv-erp-reports-module.zip` — Reports module
5. `lnv-erp-kpi-module.zip` — KPI/KRA module
6. `lnv-erp-universal-search.zip` — UniversalSearch component
7. `lnv-erp-notifications.zip` — NotificationsPanel component
8. `lnv-erp-all-prints.zip` — 24 print templates
9. `lnv-erp-all-print-buttons.zip` — Print buttons on list pages
10. `lnv-erp-all-reports.zip` — Full reports module
11. `lnv-erp-nav-fix2.zip` — Navigation redesign (AppShell + HomeDashboard)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/module-name`
3. Commit changes: `git commit -m 'Add: Module description'`
4. Push: `git push origin feature/module-name`
5. Open a Pull Request

**Contribution areas:**
- Backend API (Node.js + Express + Prisma)
- Mobile responsive CSS
- Unit tests (Vitest + React Testing Library)
- Additional industry templates (Pharma, Food, Textiles)

---

## 📞 Contact

**Developer:** Saravanaperumal  
**Location:** Coimbatore, Tamil Nadu  
**Client:** LNV Manufacturing Pvt. Ltd., Ranipet  

---

## 📄 License

MIT License — Free to use, modify, and distribute.

---

<div align="center">
Built with ❤️ in Coimbatore · React 18 + Vite 5 · For Indian Manufacturing
</div>
