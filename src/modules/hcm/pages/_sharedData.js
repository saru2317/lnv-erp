// Shared employee data across HCM pages
export const EMPLOYEES = [
  {id:'EMP-001',name:'Ramesh Kumar',   dept:'Production',desg:'Plant Manager',  type:'Staff',    grade:'M3',doj:'01 Jan 2018',shift:'General',ctc:540000,basic:22500,status:'Active',ph:'9876543210'},
  {id:'EMP-002',name:'Priya Sharma',   dept:'Accounts',  desg:'Sr. Accountant', type:'Staff',    grade:'S3',doj:'15 Mar 2020',shift:'General',ctc:384000,basic:16000,status:'Active',ph:'9876543211'},
  {id:'EMP-003',name:'Suresh M.',      dept:'Maintenance',desg:'Sr. Technician',type:'Worker',   grade:'W4',doj:'01 Jun 2017',shift:'A',       ctc:252000,basic:12000,status:'Active',ph:'9876543212'},
  {id:'EMP-004',name:'Rajesh Kumar',   dept:'Production',desg:'Operator',       type:'Worker',   grade:'W2',doj:'10 Jan 2020',shift:'B',       ctc:216000,basic:10000,status:'Active',ph:'9876543213'},
  {id:'EMP-005',name:'Kavitha M.',     dept:'Quality',   desg:'QC Lead',        type:'Staff',    grade:'S2',doj:'01 Apr 2021',shift:'General',ctc:312000,basic:13000,status:'Active',ph:'9876543214'},
  {id:'EMP-006',name:'Kannan E.',      dept:'Maintenance',desg:'Electrician',   type:'Worker',   grade:'W3',doj:'15 Aug 2019',shift:'A',       ctc:228000,basic:11000,status:'Active',ph:'9876543215'},
  {id:'EMP-007',name:'Anitha R.',      dept:'HR & Admin',desg:'HR Executive',   type:'Staff',    grade:'S1',doj:'01 Jul 2022',shift:'General',ctc:264000,basic:11000,status:'Active',ph:'9876543216'},
  {id:'EMP-008',name:'Vijay A.',       dept:'Sales',     desg:'Sales Executive',type:'Staff',    grade:'S2',doj:'15 Oct 2020',shift:'General',ctc:360000,basic:15000,status:'Active',ph:'9876543217'},
  {id:'EMP-009',name:'Ravi K.',        dept:'Maintenance',desg:'Technician',    type:'Worker',   grade:'W3',doj:'01 Jan 2021',shift:'C',       ctc:216000,basic:10500,status:'Active',ph:'9876543218'},
  {id:'EMP-010',name:'Murugan S.',     dept:'Production',desg:'Operator',       type:'Worker',   grade:'W1',doj:'01 Feb 2023',shift:'B',       ctc:192000,basic:9000, status:'Active',ph:'9876543219'},
]

export const DEPT_COLORS = {
  'Production':'#8E44AD','Accounts':'#196F3D','Quality':'#117A65',
  'Maintenance':'#E06F39','HR & Admin':'#2874A6','Sales':'#B7950B','Warehouse':'#784212'
}
export const TYPE_COLORS = {'Staff':'var(--odoo-blue)','Worker':'var(--odoo-orange)','Contractor':'var(--odoo-red)'}

export const LEAVE_TYPES_DEFAULT = [
  {code:'EL',name:'Earned Leave',days:15,carry:true,encash:true,period:'Annual'},
  {code:'CL',name:'Casual Leave',days:12,carry:false,encash:false,period:'Annual'},
  {code:'SL',name:'Sick Leave',days:12,carry:false,encash:false,period:'Annual'},
  {code:'FH',name:'Festival Holiday',days:5,carry:false,encash:false,period:'Annual'},
  {code:'ML',name:'Maternity Leave',days:182,carry:false,encash:false,period:'Per Occurrence'},
  {code:'LOP',name:'Loss of Pay',days:999,carry:false,encash:false,period:'As Required'},
]
