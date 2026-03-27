// Shared audit trail data — used across all admin pages
export const AUDIT_LOGS = [
  // SD
  {id:'AUD-00198',ts:'01 Mar 2025 10:42:15',user:'admin',role:'Admin',module:'SD',entity:'Sales Order',ref:'SO-2025-042',action:'CREATE',
   ip:'192.168.1.10',browser:'Chrome 122',
   changes:{Customer:'Sri Lakshmi Mills',Amount:'₹3,91,780',Status:'Draft'}},
  {id:'AUD-00197',ts:'01 Mar 2025 10:38:02',user:'vijay.a',role:'Sales',module:'SD',entity:'Quotation',ref:'QT-2025-038',action:'UPDATE',
   ip:'192.168.1.25',browser:'Chrome 122',
   changes:{before:{Status:'Draft',Discount:'0%'},after:{Status:'Sent',Discount:'2%'}}},
  {id:'AUD-00196',ts:'01 Mar 2025 09:55:44',user:'priya.s',role:'Accounts',module:'SD',entity:'Invoice',ref:'INV-0128',action:'DELETE',
   ip:'192.168.1.12',browser:'Edge 121',
   changes:{Note:'Duplicate invoice deleted',Invoice:'INV-0128',Customer:'MEC Spinning'}},
  // FI
  {id:'AUD-00195',ts:'01 Mar 2025 09:30:11',user:'priya.s',role:'Accounts',module:'FI',entity:'Journal Voucher',ref:'JV-2025-082',action:'CREATE',
   ip:'192.168.1.12',browser:'Edge 121',
   changes:{Debit:'Rent A/c ₹45,000',Credit:'Bank A/c ₹45,000',Narration:'March rent paid'}},
  {id:'AUD-00194',ts:'28 Feb 2025 17:20:33',user:'priya.s',role:'Accounts',module:'FI',entity:'Payment',ref:'PMT-0042',action:'UPDATE',
   ip:'192.168.1.12',browser:'Edge 121',
   changes:{before:{Amount:'₹3,80,000',Mode:'NEFT'},after:{Amount:'₹3,91,780',Mode:'NEFT'}}},
  // HCM
  {id:'AUD-00193',ts:'28 Feb 2025 16:45:00',user:'anitha.r',role:'HR',module:'HCM',entity:'Employee',ref:'EMP-011',action:'CREATE',
   ip:'192.168.1.18',browser:'Chrome 122',
   changes:{Name:'Murugan Selvam',Dept:'Production',Grade:'W1',CTC:'₹1,92,000/yr',DOJ:'01 Mar 2025'}},
  {id:'AUD-00192',ts:'28 Feb 2025 15:10:55',user:'anitha.r',role:'HR',module:'HCM',entity:'Leave Approval',ref:'LA-2025-079',action:'APPROVE',
   ip:'192.168.1.18',browser:'Chrome 122',
   changes:{Employee:'Priya Sharma',LeaveType:'EL',Days:'5',Status:'Approved'}},
  {id:'AUD-00191',ts:'28 Feb 2025 14:52:10',user:'admin',role:'Admin',module:'HCM',entity:'Salary Master',ref:'EMP-004',action:'UPDATE',
   ip:'192.168.1.10',browser:'Chrome 122',
   changes:{before:{Basic:'₹9,500',CTC:'₹2,04,000'},after:{Basic:'₹10,000',CTC:'₹2,16,000'}}},
  // MM
  {id:'AUD-00190',ts:'28 Feb 2025 13:30:40',user:'ramesh.k',role:'Manager',module:'MM',entity:'Purchase Order',ref:'PO-2025-041',action:'APPROVE',
   ip:'192.168.1.11',browser:'Chrome 122',
   changes:{Vendor:'ABC Chemicals',Amount:'₹1,84,000',Status:'Approved → PO Issued'}},
  {id:'AUD-00189',ts:'28 Feb 2025 11:00:22',user:'admin',role:'Admin',module:'MM',entity:'Item Master',ref:'ITM-0092',action:'UPDATE',
   ip:'192.168.1.10',browser:'Chrome 122',
   changes:{before:{ReorderLevel:'50 Kg',LeadTime:'7 days'},after:{ReorderLevel:'75 Kg',LeadTime:'5 days'}}},
  // QM
  {id:'AUD-00188',ts:'28 Feb 2025 10:15:30',user:'kavitha.m',role:'Operations',module:'QM',entity:'NCR',ref:'NCR-2025-018',action:'CREATE',
   ip:'192.168.1.15',browser:'Firefox 123',
   changes:{Machine:'WND-01',Defect:'Yarn breakage rate 4.2%',Severity:'Major',Disposition:'Rework'}},
  {id:'AUD-00187',ts:'27 Feb 2025 16:40:10',user:'kavitha.m',role:'Operations',module:'QM',entity:'Inspection',ref:'QA-2025-066',action:'UPDATE',
   ip:'192.168.1.15',browser:'Firefox 123',
   changes:{before:{Result:'Review',YarnCount:'29.8s'},after:{Result:'Pass',YarnCount:'30.2s'}}},
  // PM
  {id:'AUD-00186',ts:'27 Feb 2025 14:22:05',user:'suresh.m',role:'Operations',module:'PM',entity:'Breakdown',ref:'BD-2025-008',action:'CREATE',
   ip:'192.168.1.20',browser:'Chrome 122',
   changes:{Machine:'WND-01',Issue:'Bearing failure',Priority:'High',Downtime:'Started'}},
  {id:'AUD-00185',ts:'27 Feb 2025 09:00:00',user:'admin',role:'Admin',module:'PM',entity:'Spare Part',ref:'SP-0042',action:'UPDATE',
   ip:'192.168.1.10',browser:'Chrome 122',
   changes:{before:{Stock:'8 Nos',ReorderLevel:'5 Nos'},after:{Stock:'3 Nos',ReorderLevel:'8 Nos'}}},
  // Auth
  {id:'AUD-00184',ts:'27 Feb 2025 08:55:12',user:'admin',role:'Admin',module:'AUTH',entity:'Login',ref:'SESSION',action:'LOGIN',
   ip:'192.168.1.10',browser:'Chrome 122',
   changes:{Status:'Login successful',Location:'Ranipet LAN'}},
  {id:'AUD-00183',ts:'26 Feb 2025 18:30:00',user:'vijay.a',role:'Sales',module:'AUTH',entity:'Login',ref:'SESSION',action:'LOGIN',
   ip:'103.45.12.88',browser:'Mobile Chrome',
   changes:{Status:'Login from external IP',Location:'Tamil Nadu Mobile'}},
  // WM
  {id:'AUD-00182',ts:'26 Feb 2025 15:10:20',user:'ramesh.k',role:'Manager',module:'WM',entity:'GRN',ref:'GRN-2025-042',action:'CREATE',
   ip:'192.168.1.11',browser:'Chrome 122',
   changes:{PO:'PO-2025-039',Items:'Zinc Phosphate 200Kg + Degreaser 100L',WH:'RM Store'}},
  // Export
  {id:'AUD-00181',ts:'26 Feb 2025 11:05:45',user:'priya.s',role:'Accounts',module:'FI',entity:'Report',ref:'P&L Feb 2025',action:'EXPORT',
   ip:'192.168.1.12',browser:'Edge 121',
   changes:{Format:'PDF',Report:'Profit & Loss — Feb 2025',Size:'142 KB'}},
]

export const ACTION_CONFIG = {
  CREATE: {cls:'audit-badge-create',rowCls:'audit-row-create',icon:'▸'},
  UPDATE: {cls:'audit-badge-update',rowCls:'audit-row-update',icon:'▸'},
  DELETE: {cls:'audit-badge-delete',rowCls:'audit-row-delete',icon:'▸'},
  LOGIN:  {cls:'audit-badge-login', rowCls:'audit-row-login', icon:'▸'},
  EXPORT: {cls:'audit-badge-export',rowCls:'audit-row-export',icon:'⬇'},
  APPROVE:{cls:'audit-badge-approve',rowCls:'audit-row-update',icon:'▸'},
}

export const MODULES = ['All','SD','MM','WM','FI','PP','QM','PM','HCM','AUTH']
export const ACTIONS = ['All','CREATE','UPDATE','DELETE','APPROVE','LOGIN','EXPORT']

// ACTION_COLORS maps action → CSS class (alias for ACTION_CONFIG.cls)
export const ACTION_COLORS = Object.fromEntries(
  Object.entries(ACTION_CONFIG).map(([k,v]) => [k, v.cls])
)

// Unique user list derived from AUDIT_LOGS
export const USERS = ['All', ...Array.from(new Set(AUDIT_LOGS.map(l => l.user)))]
