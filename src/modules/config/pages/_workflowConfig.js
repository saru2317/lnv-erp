// ═══════════════════════════════════════════════════════════════
// LNV ERP — Industry Workflow Configuration
// When company registers → selects industry → this config loads
// ═══════════════════════════════════════════════════════════════

export const INDUSTRY_WORKFLOWS = {

  // ── CONSTRUCTION / CIVIL ─────────────────────────────────────
  'Construction / Civil Works': {
    label: 'Construction',
    icon:  '🏗️',
    color: '#6E2C00',

    // Active modules
    modules: ['sd','mm','wm','fi','hcm','civil','crm','am'],

    // Procurement flow
    procurement: {
      flow: ['CIVIL_INDENT → APPROVAL → PO → GRN → CIVIL_STOCK'],
      steps: [
        { step:1, name:'Site Indent',       module:'civil',  doc:'CivilIndent',     description:'Site engineer raises material indent per project' },
        { step:2, name:'PM Approval',       module:'civil',  doc:'CivilIndent',     description:'Project Manager approves indent' },
        { step:3, name:'Purchase Order',    module:'mm',     doc:'PurchaseOrder',   description:'Purchase team creates PO — vendor from MDM Supplier Master' },
        { step:4, name:'GRN',               module:'wm',     doc:'GRN',             description:'Material received at site/store — with projectId linked' },
        { step:5, name:'Civil Stock Update',module:'civil',  doc:'CivilStock',      description:'GRN auto-updates Civil site stock project-wise' },
        { step:6, name:'Issue Slip',         module:'civil',  doc:'IssueSip',        description:'Material issued from store to site floor' },
      ],
      // PO must carry these fields
      poRequiredFields: ['projectId', 'civilIndentId', 'siteLocation', 'deliveryLocation'],
      // GRN auto-triggers civil stock update
      grnAutoUpdateCivilStock: true,
      // Vendor source: MDM Supplier Master (vendorCategory = CONSTRUCTION)
      vendorSource: 'mdm_supplier',
      vendorCategory: 'CONSTRUCTION',
    },

    // Billing flow
    billing: {
      flow: ['BOQ → DPR Progress → RA Bill → Client Payment'],
      steps: [
        { step:1, name:'BOQ Entry',         doc:'BOQ',           description:'Bill of Quantities entered per project' },
        { step:2, name:'DPR Update',        doc:'DPRNew',        description:'Daily progress updates BOQ done%' },
        { step:3, name:'RA Bill Generate',  doc:'RABill',        description:'Running Account bill generated from BOQ progress' },
        { step:4, name:'Client Payment',    doc:'FI',            description:'Payment receipt against RA Bill in Finance' },
      ],
    },

    // Contractor flow
    contractor: {
      flow: ['Contractor WO → Weekly Bill → Approved → Payment'],
      vendorSource: 'mdm_supplier',
      vendorCategory: 'CONTRACTOR',
      tdsDefault: 1, // 1% TDS on contractor payments
    },

    // Default master data to seed on company registration
    seedDefaults: {
      supplierCategories: ['CONSTRUCTION', 'CONTRACTOR', 'MATERIAL_SUPPLIER', 'EQUIPMENT_HIRE', 'LABOUR_CONTRACTOR'],
      boqActivities: ['Foundation','RCC Structure','Brick Masonry','Plastering','Flooring','Doors & Windows','Electrical','Plumbing','Painting','Waterproofing'],
      materialCategories: ['Concrete','Steel','Masonry','Finishing','Plumbing','Electrical','Shuttering','Waterproofing','Misc'],
      expenseHeads: ['Labour Cost','Material Cost','Contractor Cost','Equipment Hire','Site Overhead','Project Management'],
      documentTypes: ['Drawing','BOQ','Specification','Contract Agreement','Work Order','RA Bill','Completion Certificate'],
    },

    // Sidebar customization
    sidebarOrder: ['civil','mm','wm','fi','hcm','sd','crm','am'],

    // KPIs to show on dashboard
    kpis: ['Active Projects','Total Contract Value','BOQ Completion %','RA Billed','Est vs Actual Variance','Workers Today'],

    // Approvals required
    approvals: [
      { doc:'CivilIndent', threshold:50000, approver:'Project Manager' },
      { doc:'PurchaseOrder', threshold:100000, approver:'Director' },
      { doc:'RABill', threshold:0, approver:'Project Manager' },
    ],
  },

  // ── EDUCATION ────────────────────────────────────────────────
  'School / CBSE / State Board': {
    label: 'School',
    icon:  '🎓',
    color: '#1A5276',

    modules: ['fi','hcm','crm','edu'],

    procurement: {
      flow: ['PURCHASE_REQUEST → PO → GRN → STORE'],
      steps: [
        { step:1, name:'Purchase Request',  module:'mm',  doc:'PurchaseRequest',  description:'Office admin raises purchase request' },
        { step:2, name:'Principal Approval',module:'mm',  doc:'Approval',         description:'Principal approves above threshold' },
        { step:3, name:'Purchase Order',    module:'mm',  doc:'PurchaseOrder',    description:'PO raised to vendor' },
        { step:4, name:'GRN',               module:'wm',  doc:'GRN',              description:'Material received in school store' },
      ],
      vendorSource: 'mdm_supplier',
      vendorCategory: 'EDUCATION',
    },

    billing: {
      flow: ['Fee Structure → Student Admission → Fee Demand → Collection'],
      steps: [
        { step:1, name:'Fee Structure',   doc:'FeeStructure',  description:'Define fee heads per class per academic year' },
        { step:2, name:'Student Admission',doc:'StudentNew',   description:'Student admitted → fee demand auto-created' },
        { step:3, name:'Fee Collection',  doc:'FeeCollection', description:'Fee collected → receipt generated' },
        { step:4, name:'Fee Report',      doc:'FeeReport',     description:'Pending/collected fee report' },
      ],
    },

    seedDefaults: {
      supplierCategories: ['STATIONERY', 'FURNITURE', 'SPORTS', 'LAB_EQUIPMENT', 'MAINTENANCE', 'TRANSPORT'],
      feeHeads: ['Tuition Fee','Transport Fee','Library Fee','Lab Fee','Sports Fee','Exam Fee','Annual Day','Uniform'],
      leaveTypes: ['CL','SL','EL','MATERNITY','LOP','STUDY_LEAVE'],
      documentTypes: ['Birth Certificate','TC','Aadhar','Mark Sheet','Community Certificate'],
      departments: ['SCHOOL'],
    },

    sidebarOrder: ['edu','fi','hcm','crm'],
    kpis: ['Total Students','Fee Collected Today','Attendance %','Pending Fees','Staff Count','Buses Running'],

    approvals: [
      { doc:'FeeWaiver', threshold:0, approver:'Principal' },
      { doc:'PurchaseOrder', threshold:50000, approver:'Principal' },
      { doc:'StaffLeave', threshold:3, approver:'HM', unit:'days' },
    ],
  },

  'College / University': {
    label: 'College',
    icon:  '🏛️',
    color: '#714B67',
    modules: ['fi','hcm','crm','edu','mm'],
    // inherits school config with additions
    inherits: 'School / CBSE / State Board',
    seedDefaults: {
      supplierCategories: ['STATIONERY','FURNITURE','LAB_EQUIPMENT','LIBRARY','MAINTENANCE','TRANSPORT','CANTEEN'],
      feeHeads: ['Tuition Fee','Exam Fee','Library Fee','Lab Fee','Transport Fee','Hostel Fee','Sports Fee'],
      departments: ['COLLEGE'],
    },
  },

  // ── MANUFACTURING ────────────────────────────────────────────
  'Injection Moulding': {
    label: 'Manufacturing',
    icon:  '🏭',
    color: '#117A65',

    modules: ['sd','mm','wm','fi','pp','qm','pm','hcm','crm'],

    procurement: {
      flow: ['PURCHASE_REQUEST → COMPARATIVE_STATEMENT → PO → GRN → QC → RM_STORE'],
      steps: [
        { step:1, name:'Purchase Request',  module:'mm',  doc:'PurchaseRequest',  description:'Production/store raises RM request' },
        { step:2, name:'Comparative Stmt',  module:'mm',  doc:'CS',               description:'3 vendor quotes compared' },
        { step:3, name:'Purchase Order',    module:'mm',  doc:'PurchaseOrder',    description:'PO raised to selected vendor' },
        { step:4, name:'Gate Entry',        module:'wm',  doc:'GateEntry',        description:'Vehicle entry recorded' },
        { step:5, name:'GRN',               module:'wm',  doc:'GRN',              description:'Material received and counted' },
        { step:6, name:'QC Inspection',     module:'qm',  doc:'Inspection',       description:'Quality inspection — pass/fail' },
        { step:7, name:'RM Store',          module:'wm',  doc:'Stock',            description:'QC passed material → RM store stock updated' },
      ],
      vendorSource: 'mdm_supplier',
      vendorCategory: 'MATERIAL',
      qcRequired: true,
    },

    billing: {
      flow: ['Sales Order → Production → QC → Dispatch → Invoice → Payment'],
    },

    seedDefaults: {
      supplierCategories: ['RAW_MATERIAL','CONSUMABLE','PACKING','TOOLING','MACHINE_SPARE','SERVICE'],
      expenseHeads: ['RM Cost','Labour Cost','Machine Cost','Overhead','Quality Cost'],
      movementTypes: ['101','201','261','551','601','602'],
    },

    sidebarOrder: ['sd','pp','qm','wm','mm','fi','hcm','pm','crm'],
    kpis: ['Production Today','Quality Pass %','Stock Value','Pending Orders','On-Time Delivery %','OEE %'],

    approvals: [
      { doc:'PurchaseOrder', threshold:100000, approver:'Purchase Manager' },
      { doc:'SalesOrder', threshold:500000, approver:'Sales Manager' },
    ],
  },


  // ── COMPUTER SERVICE & REPAIR ────────────────────────────────
  'Computer Service & Repair': {
    label: 'Computer Service',
    icon:  '🖥️',
    color: '#117A65',

    modules: ['sd','mm','wm','fi','hcm','crm'],

    procurement: {
      flow: ['PURCHASE → GRN → PARTS_STOCK → ISSUE_TO_JOB'],
      steps: [
        { step:1, name:'Parts Purchase',    module:'mm',  doc:'PurchaseOrder',  description:'Buy spare parts, components from distributor' },
        { step:2, name:'GRN',               module:'wm',  doc:'GRN',            description:'Parts received in service center stock' },
        { step:3, name:'Parts Stock',       module:'wm',  doc:'Stock',          description:'Stock maintained part-wise — RAM, HDD, Motherboard etc.' },
        { step:4, name:'Issue to Job Card', module:'sd',  doc:'ServiceJob',     description:'Parts issued against customer service job' },
      ],
      vendorSource: 'mdm_supplier',
      vendorCategory: 'PARTS_SUPPLIER',
    },

    billing: {
      flow: ['Service Enquiry → Job Card → Diagnosis → Repair → Invoice → Collection'],
      steps: [
        { step:1, name:'Service Enquiry',   doc:'CRM',        description:'Customer walks in or calls — complaint registered' },
        { step:2, name:'Job Card',          doc:'SD',         description:'Job card created — device, complaint, customer details' },
        { step:3, name:'Diagnosis',         doc:'SD',         description:'Technician diagnoses — estimated cost given to customer' },
        { step:4, name:'Repair / Replace',  doc:'SD',         description:'Parts issued, repair done, tested' },
        { step:5, name:'Invoice',           doc:'SD',         description:'Service charge + parts invoice generated' },
        { step:6, name:'Collection',        doc:'FI',         description:'Payment collected — cash/UPI/card' },
        { step:7, name:'AMC Contract',      doc:'SD',         description:'Annual maintenance contracts for business clients' },
      ],
    },

    seedDefaults: {
      supplierCategories: ['PARTS_SUPPLIER','DISTRIBUTOR','BRAND_SERVICE_CENTER'],
      serviceTypes: [
        'OS Installation','Virus Removal','Data Recovery','Hardware Repair',
        'Screen Replacement','Keyboard Repair','Battery Replacement',
        'Networking Setup','CCTV Installation','Printer Service',
        'AMC - Annual Maintenance','New Computer Assembly','Laptop Service',
      ],
      itemCategories: ['Processor','RAM','HDD / SSD','Motherboard','Power Supply','GPU','Keyboard','Mouse','Monitor','Printer Parts','Networking','CCTV','Cables & Accessories'],
      expenseHeads: ['Purchases - Parts','Salary','Rent','Electricity','Courier','Tools & Equipment'],
      complaintTypes: ['Not Starting','Slow Performance','Virus Issue','Screen Problem','Keyboard Issue','Battery Problem','Data Loss','Overheating','Network Issue','Printer Problem'],
      warrantyPeriods: ['No Warranty','1 Month','3 Months','6 Months','1 Year'],
      paymentModes: ['Cash','UPI','Card','Bank Transfer','Credit (30 days)'],
      documentTypes: ['Job Card','Service Report','Invoice','AMC Agreement','Warranty Card'],
    },

    sidebarOrder: ['crm','sd','wm','mm','fi','hcm'],
    kpis: ['Jobs Today','Pending Jobs','Revenue Today','Parts Stock Value','AMC Clients','Monthly Revenue'],

    approvals: [
      { doc:'Discount', threshold:10, approver:'Owner', unit:'%' },
      { doc:'WriteOff',  threshold:0,  approver:'Owner' },
    ],

    // Special: Job Card numbering
    jobCardPrefix: 'RP-JOB-',
    amcPrefix:     'RP-AMC-',
  },

  // ── IT / SOFTWARE SERVICES ───────────────────────────────────
  'IT / Software Services': {
    label: 'IT & Software',
    icon:  '💻',
    color: '#1A5276',

    modules: ['sd','fi','hcm','crm','pm'],

    procurement: {
      flow: ['PURCHASE_REQUEST → APPROVAL → PO → RECEIPT'],
      steps: [
        { step:1, name:'Purchase Request', module:'mm', doc:'PurchaseRequest', description:'Staff raises request for software/hardware/service' },
        { step:2, name:'MD Approval',      module:'mm', doc:'Approval',        description:'MD approves above threshold' },
        { step:3, name:'Purchase Order',   module:'mm', doc:'PurchaseOrder',   description:'PO to vendor — cloud services, licenses etc.' },
      ],
      vendorSource: 'mdm_supplier',
      vendorCategory: 'IT_VENDOR',
    },

    billing: {
      flow: ['Lead → Demo → Proposal → Agreement → Invoice → Renewal'],
      steps: [
        { step:1, name:'Lead Capture',    doc:'CRM',      description:'Prospect from website/referral captured in CRM' },
        { step:2, name:'Demo',            doc:'CRM',      description:'Product demo scheduled and conducted' },
        { step:3, name:'Proposal',        doc:'SD',       description:'Commercial proposal with pricing sent' },
        { step:4, name:'Agreement',       doc:'SD',       description:'License agreement signed' },
        { step:5, name:'Invoice',         doc:'SD',       description:'Implementation + annual license invoice raised' },
        { step:6, name:'AMC Renewal',     doc:'SD',       description:'Annual maintenance contract renewal' },
      ],
    },

    seedDefaults: {
      supplierCategories: ['CLOUD_SERVICE','SOFTWARE_LICENSE','HARDWARE','FREELANCER','CONSULTANT'],
      serviceTypes: ['ERP Implementation','Annual License','AMC','Training','Customization','Support'],
      expenseHeads: ['Salaries','Cloud Hosting','Software License','Marketing','Travel','Office Rent'],
      documentTypes: ['Proposal','Agreement','SOW','Invoice','AMC Contract','NDA'],
      customerCategories: ['Manufacturing','Construction','Education','Trading','Healthcare'],
      leadSources: ['Website','Referral','LinkedIn','Direct Call','Demo Request','Partner'],
    },

    sidebarOrder: ['crm','sd','pm','fi','hcm'],
    kpis: ['Active Leads','Demos This Month','Revenue This Month','Active Clients','Pending Renewals','Team Count'],

    approvals: [
      { doc:'Proposal', threshold:500000, approver:'MD' },
      { doc:'Discount', threshold:10,     approver:'MD', unit:'%' },
    ],
  },

}

// ── WORKFLOW CONFIG KEY saved in localStorage ──────────────────
// localStorage.getItem('lnv_industry_workflow') → industry name
// localStorage.getItem('lnv_workflow_config')   → full config JSON

// ── HELPER FUNCTIONS ──────────────────────────────────────────
export const getWorkflowConfig = () => {
  try {
    const industry = JSON.parse(localStorage.getItem('lnv_company') || '{}')?.industry
    return INDUSTRY_WORKFLOWS[industry] || null
  } catch { return null }
}

export const getProcurementFlow = () => getWorkflowConfig()?.procurement || null
export const getBillingFlow     = () => getWorkflowConfig()?.billing     || null
export const getDefaultKPIs     = () => getWorkflowConfig()?.kpis        || []
export const getSeedDefaults    = () => getWorkflowConfig()?.seedDefaults || {}
export const getVendorCategory  = () => getWorkflowConfig()?.procurement?.vendorCategory || null
