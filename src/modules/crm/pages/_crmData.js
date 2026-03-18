// ── CRM Shared Static Data ─────────────────────────────────────────────────

export const LEAD_SOURCES = ['Website','Email','Phone Call','Trade Exhibition','Referral','Social Media','Cold Calling','Channel Partner','Marketing Campaign']
export const LEAD_STATUSES = ['New Lead','Contacted','Qualified','Not Qualified','Junk Lead']
export const OPP_STAGES = ['Requirement Understanding','Solution Discussion','Demo / Presentation','Proposal Submitted','Negotiation','Decision Pending','Won','Lost']
export const INDUSTRIES = ['Surface Treatment','Automotive','Textile','Pharma','Food & Beverage','Engineering','Construction','Electronics','Chemical']
export const ACTIVITY_TYPES = ['Call','Meeting','Email','Demo','Site Visit','Technical Discussion']
export const LOST_REASONS = ['Price Too High','Competitor Won','Delivery Timeline','Technical Mismatch','Budget Cancelled','No Response','Other']

export const SALESREPS = [
  {id:'SR-001',name:'Vijay A.',   email:'vijay@lnvmfg.com',  phone:'9876543210',target:5000000,achieved:4200000,region:'South'},
  {id:'SR-002',name:'Ravi Kumar', email:'ravi@lnvmfg.com',   phone:'9876543211',target:4000000,achieved:3800000,region:'North'},
  {id:'SR-003',name:'Preethi S.', email:'preethi@lnvmfg.com',phone:'9876543212',target:3500000,achieved:3150000,region:'West'},
  {id:'SR-004',name:'Suresh M.',  email:'suresh@lnvmfg.com', phone:'9876543213',target:3000000,achieved:2100000,region:'East'},
]

export const CUSTOMERS = [
  {id:'CUST-001',name:'Sri Lakshmi Mills',        industry:'Textile',       city:'Coimbatore',state:'Tamil Nadu', contact:'Mani Kumar',   phone:'9944001122',email:'mani@slmills.com',   annualValue:12000000,status:'Active',since:'2020'},
  {id:'CUST-002',name:'MEC Spinning Ltd',         industry:'Textile',       city:'Tirupur',   state:'Tamil Nadu', contact:'Ramesh P.',    phone:'9944001133',email:'ramesh@mecsp.com',   annualValue:8500000, status:'Active',since:'2019'},
  {id:'CUST-003',name:'Kovai Auto Components',    industry:'Automotive',    city:'Coimbatore',state:'Tamil Nadu', contact:'Senthil K.',   phone:'9944001144',email:'senthil@kovai.com',  annualValue:9200000, status:'Active',since:'2021'},
  {id:'CUST-004',name:'Delta Engineering Works',  industry:'Engineering',   city:'Chennai',   state:'Tamil Nadu', contact:'Anand R.',     phone:'9944001155',email:'anand@delta.com',    annualValue:6700000, status:'Active',since:'2022'},
  {id:'CUST-005',name:'ABC Pharma Industries',    industry:'Pharma',        city:'Hyderabad', state:'Telangana',  contact:'Priya V.',     phone:'9944001166',email:'priya@abcpharma.com',annualValue:5400000, status:'Active',since:'2022'},
  {id:'CUST-006',name:'Chennai Steel Fab',        industry:'Engineering',   city:'Chennai',   state:'Tamil Nadu', contact:'Murugan S.',   phone:'9944001177',email:'murugan@csf.com',    annualValue:4200000, status:'Active',since:'2023'},
  {id:'CUST-007',name:'Rajasthan Auto Parts',     industry:'Automotive',    city:'Jaipur',    state:'Rajasthan',  contact:'Rajesh B.',    phone:'9944001188',email:'rajesh@rajauto.com', annualValue:3800000, status:'Inactive',since:'2021'},
  {id:'CUST-008',name:'Shree Textiles',           industry:'Textile',       city:'Surat',     state:'Gujarat',    contact:'Dinesh M.',    phone:'9944001199',email:'dinesh@shree.com',   annualValue:7100000, status:'Active',since:'2020'},
]

export const LEADS = [
  {id:'LEAD-0042',date:'2025-03-01',company:'Velocity Auto Pvt Ltd',contact:'Arun Kumar',phone:'9500012345',email:'arun@velocityauto.com',industry:'Automotive',source:'Trade Exhibition',owner:'Vijay A.',status:'Qualified',requirement:'Zinc Phosphating for auto parts 500 kg/day',value:800000,nextFollowup:'2025-03-05'},
  {id:'LEAD-0041',date:'2025-02-28',company:'KSR Textiles',contact:'Karthik S.',phone:'9500012346',email:'karthik@ksr.com',industry:'Textile',source:'Referral',owner:'Ravi Kumar',status:'Contacted',requirement:'Powder coating for textile machinery',value:450000,nextFollowup:'2025-03-04'},
  {id:'LEAD-0040',date:'2025-02-27',company:'Apex Engineering',contact:'Suresh R.',phone:'9500012347',email:'suresh@apex.com',industry:'Engineering',source:'Website',owner:'Vijay A.',status:'New Lead',requirement:'Electroplating — nickel and chrome',value:600000,nextFollowup:'2025-03-03'},
  {id:'LEAD-0039',date:'2025-02-26',company:'Meenakshi Pharma',contact:'Kavitha P.',phone:'9500012348',email:'kavitha@meenakshi.com',industry:'Pharma',source:'Email',owner:'Preethi S.',status:'Qualified',requirement:'Passivation treatment for SS components',value:350000,nextFollowup:'2025-03-02'},
  {id:'LEAD-0038',date:'2025-02-25',company:'Global Motors',contact:'Manoj T.',phone:'9500012349',email:'manoj@globalmotors.com',industry:'Automotive',source:'Cold Calling',owner:'Suresh M.',status:'Not Qualified',requirement:'General inquiry — no specific requirement',value:0,nextFollowup:''},
  {id:'LEAD-0037',date:'2025-02-24',company:'Star Fab Works',contact:'Rajan V.',phone:'9500012350',email:'rajan@starfab.com',industry:'Engineering',source:'Social Media',owner:'Vijay A.',status:'Qualified',requirement:'Hot dip galvanizing for structural steel',value:1200000,nextFollowup:'2025-03-01'},
  {id:'LEAD-0036',date:'2025-02-23',company:'Nova Electronics',contact:'Deepa M.',phone:'9500012351',email:'deepa@nova.com',industry:'Electronics',source:'Channel Partner',owner:'Ravi Kumar',status:'Contacted',requirement:'Anodizing for aluminium components',value:280000,nextFollowup:'2025-02-28'},
  {id:'LEAD-0035',date:'2025-02-22',company:'Junk Company XYZ',contact:'Test Person',phone:'0000000000',email:'test@test.com',industry:'Other',source:'Website',owner:'Vijay A.',status:'Junk Lead',requirement:'Spam form submission',value:0,nextFollowup:''},
]

export const OPPORTUNITIES = [
  {id:'OPP-0018',leadId:'LEAD-0042',company:'Velocity Auto Pvt Ltd',contact:'Arun Kumar',product:'Zinc Phosphating Line',value:800000,stage:'Proposal Submitted',closeDate:'2025-03-31',owner:'Vijay A.',winProb:72,competitor:'Henkel India',createdDate:'2025-02-15',activities:4},
  {id:'OPP-0017',leadId:'LEAD-0037',company:'Star Fab Works',contact:'Rajan V.',product:'Hot Dip Galvanizing',value:1200000,stage:'Negotiation',closeDate:'2025-03-20',owner:'Vijay A.',winProb:60,competitor:'Tata Chemicals',createdDate:'2025-02-10',activities:6},
  {id:'OPP-0016',leadId:'LEAD-0039',company:'Meenakshi Pharma',contact:'Kavitha P.',product:'Passivation Treatment',value:350000,stage:'Demo / Presentation',closeDate:'2025-04-15',owner:'Preethi S.',winProb:45,competitor:'',createdDate:'2025-02-18',activities:3},
  {id:'OPP-0015',leadId:'',company:'Sri Lakshmi Mills',contact:'Mani Kumar',product:'Annual Maintenance Contract',value:480000,stage:'Solution Discussion',closeDate:'2025-04-30',owner:'Ravi Kumar',winProb:80,competitor:'',createdDate:'2025-02-05',activities:5},
  {id:'OPP-0014',leadId:'',company:'Delta Engineering Works',contact:'Anand R.',product:'Chrome Plating Upgrade',value:950000,stage:'Requirement Understanding',closeDate:'2025-05-15',owner:'Suresh M.',winProb:30,competitor:'Local vendor',createdDate:'2025-02-20',activities:2},
  {id:'OPP-0013',leadId:'',company:'Kovai Auto Components',contact:'Senthil K.',product:'E-Coat Paint Line',value:2200000,stage:'Won',closeDate:'2025-02-28',owner:'Vijay A.',winProb:100,competitor:'PPG India',createdDate:'2025-01-10',activities:10},
  {id:'OPP-0012',leadId:'',company:'Rajasthan Auto Parts',contact:'Rajesh B.',product:'Powder Coating Line',value:1800000,stage:'Lost',closeDate:'2025-02-20',owner:'Ravi Kumar',winProb:0,lostReason:'Price Too High',competitor:'Akzo Nobel',createdDate:'2025-01-05',activities:8},
]

export const QUOTATIONS = [
  {id:'QT-CRM-0028',date:'2025-03-01',oppId:'OPP-0018',company:'Velocity Auto Pvt Ltd',product:'Zinc Phosphating Line',amount:800000,discount:5,finalAmount:760000,validity:'2025-03-31',status:'Sent',owner:'Vijay A.'},
  {id:'QT-CRM-0027',date:'2025-02-28',oppId:'OPP-0017',company:'Star Fab Works',product:'Hot Dip Galvanizing Setup',amount:1200000,discount:8,finalAmount:1104000,validity:'2025-03-20',status:'Negotiation',owner:'Vijay A.'},
  {id:'QT-CRM-0026',date:'2025-02-25',oppId:'OPP-0016',company:'Meenakshi Pharma',product:'Passivation Treatment Pack',amount:350000,discount:0,finalAmount:350000,validity:'2025-03-25',status:'Draft',owner:'Preethi S.'},
  {id:'QT-CRM-0025',date:'2025-02-20',oppId:'OPP-0015',company:'Sri Lakshmi Mills',product:'Annual Maintenance Contract',amount:480000,discount:10,finalAmount:432000,validity:'2025-03-20',status:'Won',owner:'Ravi Kumar'},
  {id:'QT-CRM-0024',date:'2025-02-15',oppId:'OPP-0013',company:'Kovai Auto Components',product:'E-Coat Paint Line',amount:2200000,discount:5,finalAmount:2090000,validity:'2025-03-15',status:'Won',owner:'Vijay A.'},
  {id:'QT-CRM-0023',date:'2025-01-30',oppId:'OPP-0012',company:'Rajasthan Auto Parts',product:'Powder Coating Line',amount:1800000,discount:12,finalAmount:1584000,validity:'2025-02-28',status:'Lost',owner:'Ravi Kumar'},
  {id:'QT-CRM-0022',date:'2025-01-25',oppId:'',company:'MEC Spinning Ltd',product:'Chemical Treatment Annual Pack',amount:320000,discount:5,finalAmount:304000,validity:'2025-02-25',status:'Expired',owner:'Ravi Kumar'},
]

export const ACTIVITIES = [
  {id:'ACT-0089',date:'2025-03-01',type:'Call',oppId:'OPP-0018',company:'Velocity Auto Pvt Ltd',contact:'Arun Kumar',owner:'Vijay A.',duration:'25 mins',notes:'Discussed technical specs of zinc phosphating. Customer satisfied with proposal. Follow up on Monday.',nextFollowup:'2025-03-04',status:'Completed'},
  {id:'ACT-0088',date:'2025-03-01',type:'Email',oppId:'OPP-0017',company:'Star Fab Works',contact:'Rajan V.',owner:'Vijay A.',duration:'',notes:'Sent revised quotation with 8% discount. Awaiting approval.',nextFollowup:'2025-03-03',status:'Completed'},
  {id:'ACT-0087',date:'2025-02-28',type:'Meeting',oppId:'OPP-0016',company:'Meenakshi Pharma',contact:'Kavitha P.',owner:'Preethi S.',duration:'1.5 hrs',notes:'Demo conducted at client site. Very positive response. Need to send formal proposal.',nextFollowup:'2025-03-05',status:'Completed'},
  {id:'ACT-0086',date:'2025-03-04',type:'Demo',oppId:'OPP-0018',company:'Velocity Auto Pvt Ltd',contact:'Arun Kumar',owner:'Vijay A.',duration:'',notes:'Plant visit demo scheduled.',nextFollowup:'2025-03-06',status:'Pending'},
  {id:'ACT-0085',date:'2025-03-03',type:'Call',oppId:'OPP-0015',company:'Sri Lakshmi Mills',contact:'Mani Kumar',owner:'Ravi Kumar',duration:'',notes:'Follow up on AMC proposal.',nextFollowup:'2025-03-05',status:'Pending'},
  {id:'ACT-0084',date:'2025-02-27',type:'Site Visit',oppId:'OPP-0014',company:'Delta Engineering Works',contact:'Anand R.',owner:'Suresh M.',duration:'3 hrs',notes:'Site assessment done. Need to prepare detailed proposal.',nextFollowup:'2025-03-05',status:'Completed'},
]

export const CONTACTS = [
  {id:'CON-001',name:'Mani Kumar',  company:'Sri Lakshmi Mills',designation:'Purchase Manager',phone:'9944001122',email:'mani@slmills.com',  lastContact:'2025-02-28',status:'Active'},
  {id:'CON-002',name:'Ramesh P.',   company:'MEC Spinning Ltd', designation:'MD',              phone:'9944001133',email:'ramesh@mecsp.com',  lastContact:'2025-02-25',status:'Active'},
  {id:'CON-003',name:'Senthil K.',  company:'Kovai Auto Components',designation:'GM Operations',phone:'9944001144',email:'senthil@kovai.com',lastContact:'2025-03-01',status:'Active'},
  {id:'CON-004',name:'Arun Kumar',  company:'Velocity Auto Pvt Ltd',designation:'CEO',         phone:'9500012345',email:'arun@velocityauto.com',lastContact:'2025-03-01',status:'Active'},
  {id:'CON-005',name:'Rajan V.',    company:'Star Fab Works',    designation:'Director',        phone:'9500012350',email:'rajan@starfab.com',  lastContact:'2025-02-28',status:'Active'},
  {id:'CON-006',name:'Kavitha P.',  company:'Meenakshi Pharma',  designation:'Procurement Head',phone:'9500012348',email:'kavitha@meenakshi.com',lastContact:'2025-02-28',status:'Active'},
  {id:'CON-007',name:'Anand R.',    company:'Delta Engineering',  designation:'GM Purchase',    phone:'9944001155',email:'anand@delta.com',    lastContact:'2025-02-27',status:'Active'},
  {id:'CON-008',name:'Rajesh B.',   company:'Rajasthan Auto Parts',designation:'MD',            phone:'9944001188',email:'rajesh@rajauto.com', lastContact:'2025-01-30',status:'Inactive'},
]

export const COMPLAINTS = [
  {id:'TKT-0012',date:'2025-03-01',company:'Kovai Auto Components',contact:'Senthil K.',type:'Quality',priority:'High',subject:'Surface finish inconsistency in E-Coat batch',status:'In Progress',owner:'Vijay A.',resolvedDate:''},
  {id:'TKT-0011',date:'2025-02-25',company:'Sri Lakshmi Mills',contact:'Mani Kumar',type:'Delivery',priority:'Medium',subject:'Delay in chemical supply — 3 days overdue',status:'Resolved',owner:'Ravi Kumar',resolvedDate:'2025-02-28'},
  {id:'TKT-0010',date:'2025-02-20',company:'MEC Spinning Ltd',contact:'Ramesh P.',type:'Invoice',priority:'Low',subject:'GST amount mismatch in Invoice INV-0112',status:'Resolved',owner:'Preethi S.',resolvedDate:'2025-02-22'},
  {id:'TKT-0009',date:'2025-02-18',company:'Delta Engineering Works',contact:'Anand R.',type:'Technical',priority:'High',subject:'Zinc phosphate bath concentration off spec',status:'Resolved',owner:'Suresh M.',resolvedDate:'2025-02-21'},
  {id:'TKT-0008',date:'2025-03-02',company:'Shree Textiles',contact:'Dinesh M.',type:'Quality',priority:'Medium',subject:'Color variation in powder coat finish',status:'Open',owner:'Vijay A.',resolvedDate:''},
]

// Status colors
export const LEAD_STATUS_COLORS = {
  'New Lead':'crm-badge-new','Contacted':'crm-badge-contacted',
  'Qualified':'crm-badge-qualified','Not Qualified':'crm-badge-notq','Junk Lead':'crm-badge-junk'
}
export const OPP_STAGE_COLORS = {
  'Requirement Understanding':'crm-stage-req','Solution Discussion':'crm-stage-sol',
  'Demo / Presentation':'crm-stage-demo','Proposal Submitted':'crm-stage-prop',
  'Negotiation':'crm-stage-neg','Decision Pending':'crm-stage-dec',
  'Won':'crm-stage-won','Lost':'crm-stage-lost'
}
export const QT_STATUS_COLORS = {
  'Draft':'crm-badge-new','Sent':'crm-badge-contacted','Negotiation':'crm-stage-neg',
  'Won':'crm-stage-won','Lost':'crm-stage-lost','Expired':'crm-badge-notq'
}
export const ACT_TYPE_COLORS = {
  'Call':'crm-act-call','Meeting':'crm-act-meeting','Email':'crm-act-email',
  'Demo':'crm-act-demo','Site Visit':'crm-act-visit','Technical Discussion':'crm-act-tech'
}
export const TICKET_PRIORITY_COLORS = {
  'High':'crm-badge-notq','Medium':'crm-badge-contacted','Low':'crm-badge-new'
}
export const TICKET_STATUS_COLORS = {
  'Open':'crm-badge-new','In Progress':'crm-badge-contacted','Resolved':'crm-stage-won'
}

export const fmt = n => '₹' + (n/100000).toFixed(1) + ' L'
export const fmtFull = n => '₹' + n.toLocaleString('en-IN')
