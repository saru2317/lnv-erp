// ── LNV ERP — Config Module Master Data ──────────────────────────────────────

export const COMPANY = {
  name:        'LNV Manufacturing Pvt. Ltd.',
  shortName:   'LNV',
  legalName:   'LNV Manufacturing Private Limited',
  cin:         'U28910TN2018PTC123456',
  gstin:       '33AABCL1234F1Z5',
  pan:         'AABCL1234F',
  industry:    'Injection Moulding',
  type:        'Private Limited',
  founded:     '2018',
  email:       'info@lnvmfg.com',
  phone:       '+91 99440 01234',
  website:     'www.lnvmfg.com',
  address:     'Plot No. 42, SIDCO Industrial Estate',
  city:        'Ranipet',
  state:       'Tamil Nadu',
  pincode:     '632401',
  country:     'India',
  logo:        'LNV',
  fiscalStart: 'April',
  currency:    'INR',
  timezone:    'Asia/Kolkata',
  dateFormat:  'DD-MM-YYYY',
}

export const BRANCHES = [
  { id:'BR-001', name:'Ranipet Plant',   type:'Manufacturing', address:'Plot 42, SIDCO, Ranipet', gstin:'33AABCL1234F1Z5', phone:'04172-234567', head:'Saravana Kumar', status:'Active',  isHQ:true  },
  { id:'BR-002', name:'Chennai Office',  type:'Sales Office',  address:'Anna Salai, Chennai-2',    gstin:'33AABCL1234F2Z4', phone:'044-28456789',  head:'Vijay T.',      status:'Active',  isHQ:false },
  { id:'BR-003', name:'Coimbatore Depot',type:'Warehouse',     address:'Ganapathy, Coimbatore',    gstin:'33AABCL1234F3Z3', phone:'0422-2345678',  head:'Karthik M.',    status:'Inactive',isHQ:false },
]

export const ALL_MODULES = [
  { key:'home',   label:'Dashboard',    icon:'🏠', group:'Core' },
  { key:'sd',     label:'Sales (SD)',   icon:'📋', group:'Operations' },
  { key:'mm',     label:'Purchase (MM)',icon:'📦', group:'Operations' },
  { key:'wm',     label:'Warehouse',    icon:'▸', group:'Operations' },
  { key:'fi',     label:'Finance (FI)', icon:'💰', group:'Finance' },
  { key:'pp',     label:'Production',   icon:'⚙️', group:'Operations' },
  { key:'qm',     label:'Quality',      icon:'✅', group:'Operations' },
  { key:'pm',     label:'Maintenance',  icon:'🔧', group:'Operations' },
  { key:'hcm',    label:'HR (HCM)',     icon:'👥', group:'People' },
  { key:'crm',    label:'CRM',          icon:'🤝', group:'Operations' },
  { key:'tm',     label:'Transport',    icon:'🚛', group:'Support' },
  { key:'am',     label:'Assets',       icon:'🏗️', group:'Support' },
  { key:'civil',  label:'Civil',        icon:'👷', group:'Support' },
  { key:'vm',     label:'Visitor',      icon:'🪪', group:'Support' },
  { key:'cn',     label:'Canteen',      icon:'🍽️', group:'Support' },
  { key:'admin',  label:'Admin',        icon:'🛡️', group:'System' },
  { key:'kpi',    label:'KPI / KRA',     icon:'🎯', group:'System' },
  { key:'reports',label:'Reports',       icon:'📊', group:'System' },
  { key:'config', label:'Config',       icon:'⚙️', group:'System' },
]

export const ROLES = [
  { id:'ROLE-001', name:'admin',      label:'Administrator',   color:'#714B67', bg:'#F8D7DA', desc:'Full access to all modules and settings',
    modules:['home','sd','mm','wm','fi','pp','qm','pm','hcm','crm','tm','am','civil','vm','cn','admin','config','reports','kpi'] },
  { id:'ROLE-002', name:'manager',    label:'Plant Manager',   color:'#1A5276', bg:'#EDE0EA', desc:'Operations, production and support modules',
    modules:['home','pp','qm','pm','wm','mm','tm','am','vm','reports'] },
  { id:'ROLE-003', name:'accounts',   label:'Accounts',        color:'#196F3D', bg:'#CCE5FF', desc:'Finance, sales and purchase access',
    modules:['home','fi','sd','mm','am','reports'] },
  { id:'ROLE-004', name:'operations', label:'Operations',      color:'#784212', bg:'#D1ECF1', desc:'Production floor, warehouse and transport access',
    modules:['home','pp','qm','pm','wm','mm','tm','reports'] },
  { id:'ROLE-005', name:'hr',         label:'HR Executive',    color:'#6C3483', bg:'#FFF3CD', desc:'HR, payroll and canteen/visitor management',
    modules:['home','hcm','cn','vm','reports'] },
  { id:'ROLE-006', name:'sales',      label:'Sales Executive', color:'#117A65', bg:'#D4EDDA', desc:'Sales and CRM access only',
    modules:['home','sd','crm','reports'] },
  { id:'ROLE-007', name:'transport',  label:'Transport Head',  color:'#E06F39', bg:'#E2E3E5', desc:'Full transport module + vehicle & trip management',
    modules:['home','tm','mm'] },
  { id:'ROLE-008', name:'civil',      label:'Civil Engineer',  color:'#1B4F72', bg:'#EDE0EF', desc:'Civil projects, BOQ, contractor billing',
    modules:['home','civil','am','mm'] },
  { id:'ROLE-009', name:'viewer',     label:'Viewer (Read-only)',color:'#6C757D', bg:'#F8F9FA', desc:'Read-only access to assigned modules — no create/edit/delete',
    modules:['home','sd','mm','pp','fi'] },
]

export const USERS = [
  { id:'USR-001', name:'Saravana Kumar', email:'admin@lnv.com',      role:'admin',      branch:'BR-001', phone:'9944001001', status:'Active',  lastLogin:'2026-03-11 09:05', avatar:'SK' },
  { id:'USR-002', name:'Ramesh P',       email:'manager@lnv.com',    role:'manager',    branch:'BR-001', phone:'9944001002', status:'Active',  lastLogin:'2026-03-11 08:55', avatar:'RP' },
  { id:'USR-003', name:'Priya S',        email:'accounts@lnv.com',   role:'accounts',   branch:'BR-001', phone:'9944001003', status:'Active',  lastLogin:'2026-03-10 17:30', avatar:'PS' },
  { id:'USR-004', name:'Karthik M',      email:'ops@lnv.com',        role:'operations', branch:'BR-001', phone:'9944001004', status:'Active',  lastLogin:'2026-03-11 07:45', avatar:'KM' },
  { id:'USR-005', name:'Kavitha R',      email:'hr@lnv.com',         role:'hr',         branch:'BR-001', phone:'9944001005', status:'Active',  lastLogin:'2026-03-10 16:20', avatar:'KR' },
  { id:'USR-006', name:'Vijay T',        email:'sales@lnv.com',      role:'sales',      branch:'BR-002', phone:'9944001006', status:'Active',  lastLogin:'2026-03-09 14:10', avatar:'VT' },
  { id:'USR-007', name:'Murugan S',      email:'murugan@lnv.com',    role:'operations', branch:'BR-001', phone:'9944001007', status:'Inactive',lastLogin:'2026-02-28 10:00', avatar:'MS' },
]

export const SESSION_LOG = [
  { id:'SL-001', userId:'USR-001', userName:'Saravana Kumar', role:'admin',      ip:'192.168.1.10', browser:'Chrome 122', loginTime:'2026-03-11 09:05', logoutTime:'—',             status:'Active'  },
  { id:'SL-002', userId:'USR-002', userName:'Ramesh P',       role:'manager',    ip:'192.168.1.11', browser:'Chrome 122', loginTime:'2026-03-11 08:55', logoutTime:'—',             status:'Active'  },
  { id:'SL-003', userId:'USR-004', userName:'Karthik M',      role:'operations', ip:'192.168.1.14', browser:'Firefox 123',loginTime:'2026-03-11 07:45', logoutTime:'—',             status:'Active'  },
  { id:'SL-004', userId:'USR-003', userName:'Priya S',        role:'accounts',   ip:'192.168.1.13', browser:'Edge 122',   loginTime:'2026-03-10 17:30', logoutTime:'2026-03-10 18:00',status:'Closed'},
  { id:'SL-005', userId:'USR-005', userName:'Kavitha R',      role:'hr',         ip:'192.168.1.15', browser:'Chrome 121', loginTime:'2026-03-10 16:20', logoutTime:'2026-03-10 17:45',status:'Closed'},
  { id:'SL-006', userId:'USR-001', userName:'Saravana Kumar', role:'admin',      ip:'192.168.1.10', browser:'Chrome 122', loginTime:'2026-03-10 09:00', logoutTime:'2026-03-10 18:30',status:'Closed'},
]

export const TAX_RATES = [
  { id:'TAX-001', name:'GST 0%',    rate:0,  type:'GST', cgst:0,   sgst:0,   igst:0,   cess:0, status:'Active', applicableTo:'Essential Goods' },
  { id:'TAX-002', name:'GST 5%',    rate:5,  type:'GST', cgst:2.5, sgst:2.5, igst:5,   cess:0, status:'Active', applicableTo:'Common Goods' },
  { id:'TAX-003', name:'GST 12%',   rate:12, type:'GST', cgst:6,   sgst:6,   igst:12,  cess:0, status:'Active', applicableTo:'Standard Goods' },
  { id:'TAX-004', name:'GST 18%',   rate:18, type:'GST', cgst:9,   sgst:9,   igst:18,  cess:0, status:'Active', applicableTo:'Industrial Goods & Services' },
  { id:'TAX-005', name:'GST 28%',   rate:28, type:'GST', cgst:14,  sgst:14,  igst:28,  cess:0, status:'Active', applicableTo:'Luxury Goods' },
  { id:'TAX-006', name:'TDS 1%',    rate:1,  type:'TDS', cgst:0,   sgst:0,   igst:0,   cess:0, status:'Active', applicableTo:'Contractors' },
  { id:'TAX-007', name:'TDS 2%',    rate:2,  type:'TDS', cgst:0,   sgst:0,   igst:0,   cess:0, status:'Active', applicableTo:'Professionals' },
  { id:'TAX-008', name:'TDS 10%',   rate:10, type:'TDS', cgst:0,   sgst:0,   igst:0,   cess:0, status:'Active', applicableTo:'Rent' },
]

export const HSN_CODES = [
  { code:'7326', desc:'Articles of iron or steel',     gstRate:18, type:'Goods' },
  { code:'8412', desc:'Other engines and motors',      gstRate:18, type:'Goods' },
  { code:'3208', desc:'Paints and varnishes (polymer)',gstRate:18, type:'Goods' },
  { code:'3403', desc:'Lubricating preparations',      gstRate:18, type:'Goods' },
  { code:'9987', desc:'Maintenance / repair services', gstRate:18, type:'Services' },
  { code:'9988', desc:'Manufacturing services on goods',gstRate:18, type:'Services' },
  { code:'9954', desc:'Construction services',         gstRate:18, type:'Services' },
]

export const CURRENCIES = [
  { code:'INR', name:'Indian Rupee',    symbol:'₹',  rate:1,     isBase:true,  status:'Active' },
  { code:'USD', name:'US Dollar',       symbol:'$',  rate:83.45, isBase:false, status:'Active' },
  { code:'EUR', name:'Euro',            symbol:'€',  rate:90.12, isBase:false, status:'Active' },
  { code:'GBP', name:'British Pound',   symbol:'£',  rate:105.30,isBase:false, status:'Active' },
  { code:'AED', name:'UAE Dirham',      symbol:'د.إ',rate:22.72, isBase:false, status:'Active' },
  { code:'SGD', name:'Singapore Dollar',symbol:'S$', rate:62.10, isBase:false, status:'Inactive'},
]

export const FISCAL_YEARS = [
  { id:'FY-2024', label:'FY 2024-25', start:'2024-04-01', end:'2025-03-31', status:'Closed',  periods:12, locked:true  },
  { id:'FY-2025', label:'FY 2025-26', start:'2025-04-01', end:'2026-03-31', status:'Active',  periods:12, locked:false },
  { id:'FY-2026', label:'FY 2026-27', start:'2026-04-01', end:'2027-03-31', status:'Upcoming',periods:12, locked:false },
]

export const NUMBER_SERIES = [
  { id:'NS-001', module:'SD',   docType:'Sales Order',      prefix:'SO/',   next:1042, padding:4, suffix:'',     example:'SO/1042',     status:'Active' },
  { id:'NS-002', module:'SD',   docType:'Sales Invoice',    prefix:'INV/',  next:2218, padding:4, suffix:'',     example:'INV/2218',    status:'Active' },
  { id:'NS-003', module:'SD',   docType:'Delivery Note',    prefix:'DN/',   next:889,  padding:4, suffix:'',     example:'DN/0889',     status:'Active' },
  { id:'NS-004', module:'MM',   docType:'Purchase Order',   prefix:'PO/',   next:567,  padding:4, suffix:'',     example:'PO/0567',     status:'Active' },
  { id:'NS-005', module:'MM',   docType:'GRN',              prefix:'GRN/',  next:445,  padding:4, suffix:'',     example:'GRN/0445',    status:'Active' },
  { id:'NS-006', module:'PP',   docType:'Job Card',         prefix:'JC-',   next:43,   padding:4, suffix:'',     example:'JC-0043',     status:'Active' },
  { id:'NS-007', module:'PP',   docType:'Work Order',       prefix:'WO/',   next:128,  padding:4, suffix:'',     example:'WO/0128',     status:'Active' },
  { id:'NS-008', module:'FI',   docType:'Payment Voucher',  prefix:'PV/',   next:334,  padding:4, suffix:'',     example:'PV/0334',     status:'Active' },
  { id:'NS-009', module:'FI',   docType:'Receipt Voucher',  prefix:'RV/',   next:412,  padding:4, suffix:'',     example:'RV/0412',     status:'Active' },
  { id:'NS-010', module:'QM',   docType:'Quality Report',   prefix:'QR/',   next:89,   padding:4, suffix:'',     example:'QR/0089',     status:'Active' },
  { id:'NS-011', module:'HCM',  docType:'Employee ID',      prefix:'EMP-',  next:35,   padding:3, suffix:'',     example:'EMP-035',     status:'Active' },
  { id:'NS-012', module:'CRM',  docType:'Lead',             prefix:'LEAD-', next:156,  padding:4, suffix:'',     example:'LEAD-0156',   status:'Active' },
]

export const EMAIL_CONFIG = {
  provider:   'SMTP',
  host:       'smtp.gmail.com',
  port:       '587',
  encryption: 'TLS',
  fromEmail:  'erp@lnvmfg.com',
  fromName:   'LNV ERP System',
  username:   'erp@lnvmfg.com',
  password:   '••••••••••••',
  status:     'Connected',
  lastTest:   '2026-03-10 14:22',
  templates: [
    { id:'ET-001', name:'PO Confirmation',    trigger:'PO Created',       status:'Active' },
    { id:'ET-002', name:'Invoice to Customer',trigger:'Invoice Generated', status:'Active' },
    { id:'ET-003', name:'Job Card Alert',     trigger:'Job Delayed',       status:'Active' },
    { id:'ET-004', name:'Payment Reminder',   trigger:'Invoice Overdue',   status:'Active' },
    { id:'ET-005', name:'GRN Notification',   trigger:'GRN Received',      status:'Inactive' },
  ]
}

export const PRINT_TEMPLATES = [
  { id:'PT-001', name:'Sales Invoice (A4)',       module:'SD',  format:'A4',  status:'Active',  default:true  },
  { id:'PT-002', name:'Purchase Order (A4)',       module:'MM',  format:'A4',  status:'Active',  default:true  },
  { id:'PT-003', name:'Delivery Note',             module:'SD',  format:'A4',  status:'Active',  default:true  },
  { id:'PT-004', name:'Job Work Invoice',          module:'PP',  format:'A4',  status:'Active',  default:true  },
  { id:'PT-005', name:'Quality Report',            module:'QM',  format:'A4',  status:'Active',  default:false },
  { id:'PT-006', name:'Pay Slip (A5)',             module:'HCM', format:'A5',  status:'Active',  default:true  },
  { id:'PT-007', name:'GRN Label (Thermal)',       module:'MM',  format:'Label',status:'Active', default:false },
  { id:'PT-008', name:'Production Label (80mm)',   module:'PP',  format:'Label',status:'Active', default:false },
]
