// ── LNV ERP — PP Master Config ───────────────────────────────────────────────
// Industry is driven by _configData.js → COMPANY.industry (single source of truth)
// 100% dynamic — no company hardcoding
// Routing is ITEM-WISE (not customer-wise)
// Production types: job_work | batch | mould | continuous | discrete
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCTION_TYPES = {
  job_work:   { label:'Job Work / Service',     icon:'▸', desc:'Customer material processed, labour charged' },
  batch:      { label:'Batch Process',          icon:'🪣', desc:'Multiple items/jobs in one tank/furnace run' },
  mould:      { label:'Mould / Cavity',         icon:'▸', desc:'Shots × Cavity = Output qty' },
  continuous: { label:'Continuous Process',     icon:'▸', desc:'Non-stop line — textile, rolling mills' },
  discrete:   { label:'Discrete Manufacturing', icon:'▸', desc:'Unit-by-unit — assembly, machining' },
}

// ── ALL 15 INDUSTRIES ─────────────────────────────────────────────────────────
export const INDUSTRIES = {

  surface_treatment: {
    name:'Surface Treatment / Coating', icon:'▸', color:'#714B67', light:'#EDE0EA',
    desc:'Powder · CED · Chrome · Anodize', prodType:'batch', batchConcept:'tank',
    stages:[
      { id:'s1', name:'Inward Inspection',          icon:'▸', machine:'INWARD',   fields:['DC No.','Customer','Item','Qty Received','Condition','Received By'] },
      { id:'s2', name:'Pre-Treatment / Degreasing', icon:'▸', machine:'TANK-01',  fields:['Chemical Used','Concentration %','Temp (°C)','Duration (min)','Batch No.','Operator'] },
      { id:'s3', name:'Rinsing',                    icon:'▸', machine:'RINSE-01', fields:['Water Temp (°C)','Duration (min)','pH Value','Operator'] },
      { id:'s4', name:'Phosphating',                icon:'▸', machine:'TANK-02',  fields:['Chemical','Concentration %','Temp (°C)','Duration (min)','Coating Wt (g/m²)','Operator'] },
      { id:'s5', name:'Powder Coating',             icon:'▸', machine:'BOOTH-01', fields:['Powder Brand','Color Code','Voltage (kV)','Thickness Target (µm)','Qty Coated','Operator'] },
      { id:'s6', name:'Curing / Oven',              icon:'▸', machine:'OVEN-01',  fields:['Temp (°C)','Duration (min)','Oven ID','Qty In','Qty Out','Operator'] },
      { id:'s7', name:'DFT / QC Check',             icon:'▸', machine:'QC',       fields:['DFT Actual (µm)','DFT Target (µm)','Adhesion Test','Impact Test','Pass Qty','Fail Qty','Inspector'] },
      { id:'s8', name:'Outward / Dispatch',         icon:'▸', machine:'DISPATCH', fields:['Qty Dispatched','Vehicle No.','DC No. (Out)','Remarks','Dispatched By'] },
    ]
  },

  heat_treatment: {
    name:'Heat Treatment', icon:'▸', color:'#C0392B', light:'#FDEDEC',
    desc:'Hardening · Annealing · Tempering', prodType:'batch', batchConcept:'furnace',
    stages:[
      { id:'s1', name:'Job Receipt & Check',     icon:'▸', machine:'INWARD',          fields:['Job Card No.','Material Grade','Qty (Kg)','Drawing No.','Required HRC','Received By'] },
      { id:'s2', name:'Furnace Loading',          icon:'▸', machine:'FURNACE-01',      fields:['Furnace ID','Load Qty (Kg)','Fixture Used','Loading Pattern','Loaded By'] },
      { id:'s3', name:'Hardening / Heating',      icon:'▸', machine:'FURNACE-01',      fields:['Set Temp (°C)','Actual Temp (°C)','Soak Time (min)','Atmosphere','Technician'] },
      { id:'s4', name:'Quenching',                icon:'▸', machine:'QUENCH-01',       fields:['Quench Medium','Quench Temp (°C)','Duration (sec)','Agitation','Operator'] },
      { id:'s5', name:'Tempering',                icon:'▸', machine:'TEMP-01',         fields:['Set Temp (°C)','Actual Temp (°C)','Soak Time (min)','Cooling Method','Operator'] },
      { id:'s6', name:'Hardness Testing',         icon:'▸', machine:'HARDNESS-TESTER', fields:['Job Card No.','HRC Reading 1','HRC Reading 2','HRC Reading 3','Average HRC','Required HRC','Pass/Fail','Inspector'], perJobInBatch:true },
      { id:'s7', name:'Shot Blasting / Cleaning', icon:'▸', machine:'BLAST-01',        fields:['Media Type','Pressure (bar)','Duration (min)','Surface Profile','Operator'] },
      { id:'s8', name:'Final Dispatch',           icon:'▸', machine:'DISPATCH',        fields:['Qty Dispatched','HRC Report No.','Dispatch DC','Remarks'] },
    ]
  },

  injection_moulding: {
    name:'Injection Moulding', icon:'▸', color:'#1A5276', light:'#D6EAF8',
    desc:'Thermoplastic · Auto Components', prodType:'mould', mouldConcept:true,
    stages:[
      { id:'s1', name:'Material Drying',    icon:'▸', machine:'DRYER-01', fields:['Material Grade','Lot No.','Dryer Temp (°C)','Drying Time (hrs)','Moisture % Before','Moisture % After','Operator'] },
      { id:'s2', name:'Mould Setup',        icon:'▸', machine:'IMM-01',   fields:['Mould ID','Cavity Count','Machine Tonnage','Mould Temp (°C)','Purging Done','Setup By'], mouldSetup:true },
      { id:'s3', name:'Trial Shot',         icon:'▸', machine:'IMM-01',   fields:['Shot No.','Barrel Temp Z1 (°C)','Barrel Temp Z2 (°C)','Injection Pressure (bar)','Hold Pressure','Cooling Time (sec)','Shot Weight (g)','Short Shot?','Flash?','Approved By'] },
      { id:'s4', name:'Production Run',     icon:'▶', machine:'IMM-01',   fields:['Start Shot No.','End Shot No.','Shots Fired','Cycle Time (sec)','Barrel Temp (°C)','Mould Temp (°C)','Shot Weight (g)','Operator','Shift'], shotCounter:true },
      { id:'s5', name:'Inline QC',          icon:'▸', machine:'QC',       fields:['Sample Size','Dimension A (mm)','Dimension B (mm)','Weight (g)','Flash Check','Weld Line','Pass Qty','Fail Qty','QC Operator'] },
      { id:'s6', name:'Degating / Trimming',icon:'▸', machine:'TRIM-01',  fields:['Qty In','Gate Removed','Flash Trimmed','Qty Out','Rejection','Operator'] },
      { id:'s7', name:'Final Inspection',   icon:'▸', machine:'QC',       fields:['Total Qty Produced','Pass Qty','Fail Qty','Defect Type','Inspector','Approved By'] },
      { id:'s8', name:'Packing',            icon:'▸', machine:'PACK',     fields:['Qty Packed','Bag/Box Count','Label Applied','Mfg Date','Packer'] },
    ]
  },

  blow_moulding: {
    name:'Blow Moulding', icon:'🫧', color:'#117A65', light:'#D5F5E3',
    desc:'Bottles · Cans · Hollow Containers', prodType:'mould', mouldConcept:true,
    stages:[
      { id:'s1', name:'Material Preparation',  icon:'▸', machine:'STORE',   fields:['Material Grade','Lot No.','Qty Issued (Kg)','MFI Value','Issued By'] },
      { id:'s2', name:'Mould Setup',           icon:'▸', machine:'BM-01',   fields:['Mould ID','Cavity Count','Parison Die Size','Machine Tonnage','Setup By'], mouldSetup:true },
      { id:'s3', name:'Extrusion / Preform',   icon:'▸', machine:'BM-01',   fields:['Barrel Temp (°C)','Head Temp (°C)','Screw Speed (RPM)','Parison Weight (g)','Parison Wall Thickness'] },
      { id:'s4', name:'Blow / Stretch',        icon:'▸', machine:'BM-01',   fields:['Blow Pressure (bar)','Blow Time (sec)','Mould Temp (°C)','Cooling Time (sec)','Cycle Time (sec)'], shotCounter:true },
      { id:'s5', name:'Trimming / Deflashing', icon:'▸', machine:'TRIM-01', fields:['Qty In','Flash Removed','Tail Removed','Qty Out','Rejection','Operator'] },
      { id:'s6', name:'Leak / Quality Test',   icon:'▸', machine:'QC',      fields:['Test Pressure (bar)','Hold Time (sec)','Pass Qty','Fail Qty','Wall Thickness (mm)','Top Load (N)','Inspector'] },
      { id:'s7', name:'Packing',               icon:'▸', machine:'PACK',    fields:['Qty Packed','Carton Count','Label Applied','Packer'] },
    ]
  },

  rubber_moulding: {
    name:'Rubber Moulding', icon:'▸', color:'#4A235A', light:'#F4ECF7',
    desc:'Compression · Transfer · Extrusion', prodType:'mould', mouldConcept:true,
    stages:[
      { id:'s1', name:'Compound Preparation', icon:'▸', machine:'MIXER-01',  fields:['Compound Grade','Lot No.','Batch Wt (Kg)','Mooney Viscosity','Compound Date','Prepared By'] },
      { id:'s2', name:'Preform / Slug Prep',  icon:'▸', machine:'PREFORM-01',fields:['Preform Wt (g)','Preform Size','Qty Prepared','Operator'] },
      { id:'s3', name:'Moulding / Curing',    icon:'▸', machine:'PRESS-01',  fields:['Mould ID','Cavity Count','Curing Temp (°C)','Curing Time (min)','Press Tonnage','Shots Fired','Operator'], mouldSetup:true, shotCounter:true },
      { id:'s4', name:'Deflashing',           icon:'▸', machine:'TRIM-01',   fields:['Qty In','Flash Wt (g)','Deflash Method','Qty Out','Rejection','Operator'] },
      { id:'s5', name:'Post Cure (if req)',   icon:'▸', machine:'OVEN-01',   fields:['Temp (°C)','Duration (hrs)','Qty In','Qty Out','Technician'] },
      { id:'s6', name:'Inspection',           icon:'▸', machine:'QC',        fields:['Hardness (Shore A)','Tensile Strength','Elongation %','Pass Qty','Fail Qty','Inspector'] },
      { id:'s7', name:'Packing',              icon:'▸', machine:'PACK',      fields:['Qty Packed','Poly Bag','Label','Packer'] },
    ]
  },

  electroplating: {
    name:'Electroplating / Metal Finishing', icon:'▸', color:'#1F618D', light:'#EBF5FB',
    desc:'Nickel · Zinc · Chrome · Gold', prodType:'batch', batchConcept:'tank',
    stages:[
      { id:'s1', name:'Job Receipt',                icon:'▸', machine:'INWARD',        fields:['Job Card No.','Part Name','Material','Qty','Customer DC No.','Received By'] },
      { id:'s2', name:'Pre-Treatment',              icon:'▸', machine:'TANK-01',        fields:['Process','Chemical','Concentration %','Temp (°C)','Duration (min)','Batch No.'] },
      { id:'s3', name:'Acid Cleaning / Activation', icon:'▸', machine:'TANK-02',        fields:['Acid Type','Concentration %','Duration (sec)','Temperature (°C)','Operator'] },
      { id:'s4', name:'Plating',                    icon:'▸', machine:'PLATING-TANK',   fields:['Plating Type','Current (A)','Voltage (V)','Time (min)','Bath Temp (°C)','Part Area (dm²)','Calculated Thickness (µm)','Required Thickness (µm)','Pass/Fail'], amperHourCalc:true },
      { id:'s5', name:'Post Rinse',                 icon:'▸', machine:'RINSE-01',       fields:['Rinse Type','Water Temp (°C)','Duration (min)','pH','Operator'] },
      { id:'s6', name:'Drying',                     icon:'▸', machine:'DRYER-01',       fields:['Drying Method','Temp (°C)','Duration (min)','Qty Dried','Operator'] },
      { id:'s7', name:'Thickness / QC Check',       icon:'▸', machine:'QC',             fields:['Thickness Actual (µm)','Thickness Required (µm)','Adhesion Test','Salt Spray (hrs)','Pass Qty','Fail Qty','Inspector'], perJobInBatch:true },
      { id:'s8', name:'Dispatch',                   icon:'▸', machine:'DISPATCH',       fields:['Qty Dispatched','Test Report No.','DC No.','Dispatched By'] },
    ]
  },

  forging_casting: {
    name:'Forging / Casting Finishing', icon:'▸', color:'#784212', light:'#FEF5E7',
    desc:'Shot blast · Deburr · Trim · Inspect', prodType:'batch', batchConcept:'furnace',
    stages:[
      { id:'s1', name:'Incoming Inspection',     icon:'▸', machine:'INWARD',   fields:['Heat No.','Die No.','Material Grade','Qty (Nos)','Weight (Kg)','Defects Found','Inspector'] },
      { id:'s2', name:'Shot Blasting',           icon:'▸', machine:'BLAST-01', fields:['Media Type','Pressure (bar)','Duration (min)','Surface Cleanliness','Operator'] },
      { id:'s3', name:'Trimming / Flash Removal',icon:'▸', machine:'TRIM-01',  fields:['Flash Wt (Kg)','Qty Trimmed','Rejection','Operator'] },
      { id:'s4', name:'Machining (if req)',      icon:'▸', machine:'MCH-01',   fields:['Operation','Machine','Qty Machined','Tolerance','Rejection','Operator'] },
      { id:'s5', name:'Heat Treatment',          icon:'▸', machine:'FURNACE',  fields:['Furnace ID','Temp (°C)','Soak Time (min)','Quench Medium','HRC Reading','Pass/Fail'] },
      { id:'s6', name:'Dimensional Check',       icon:'▸', machine:'CMM-01',   fields:['Drawing No.','Dimension A','Dimension B','Tolerance','Pass Qty','Fail Qty','Inspector'] },
      { id:'s7', name:'Dispatch',                icon:'▸', machine:'DISPATCH', fields:['Qty Dispatched','Test Certificate','DC No.','Dispatched By'] },
    ]
  },

  printing: {
    name:'Printing Industries', icon:'▸', color:'#1B4F72', light:'#D6EAF8',
    desc:'Label · Packaging · Barcode · Offset', prodType:'discrete',
    stages:[
      { id:'s1', name:'Pre-Press / Artwork',       icon:'▸', machine:'DESIGN',  fields:['Job No.','Client','Artwork Ref','Colors','Proof Approved By','Date'] },
      { id:'s2', name:'Plate / Cylinder Making',   icon:'▸', machine:'CTP-01',  fields:['Plate Type','Resolution (dpi)','Plate No.','Cylinder ID','Approved By'] },
      { id:'s3', name:'Substrate Setup',           icon:'▸', machine:'PRESS-01',fields:['Stock Type','GSM','Roll Width (mm)','Core Dia (mm)','Lot No.','Qty (Meters/Sheets)'] },
      { id:'s4', name:'Printing Run',              icon:'▸', machine:'PRESS-01',fields:['Press Speed (m/min)','Impression Count','Color Registration','Ink Density','Waste Sheets','Operator','Shift'] },
      { id:'s5', name:'Lamination / Coating',      icon:'▸', machine:'LAM-01',  fields:['Lamination Type','Temp (°C)','Speed (m/min)','Qty (Meters)','Operator'] },
      { id:'s6', name:'Die Cutting / Slitting',    icon:'▸', machine:'DIE-01',  fields:['Die ID','Cut Size','Qty Cut','Waste %','Operator'] },
      { id:'s7', name:'Inspection & Packing',      icon:'▸', machine:'QC',      fields:['Print Quality Check','Color Match','Qty Passed','Qty Rejected','Packed Qty','Inspector'] },
    ]
  },

  assembly: {
    name:'Assembly Job Work', icon:'▸', color:'#117A65', light:'#D5F5E3',
    desc:'Mechanical · Electronic · Kitting', prodType:'discrete',
    stages:[
      { id:'s1', name:'Parts Incoming Check',        icon:'▸', machine:'STORE',   fields:['BOM Ref','Part Name','Part No.','Required Qty','Received Qty','Shortage','Store Keeper'] },
      { id:'s2', name:'Sub-Assembly',                icon:'▸', machine:'ASSY-01', fields:['Sub-Assembly Name','Parts Used','Qty Assembled','Torque (Nm)','Rejection','Operator'] },
      { id:'s3', name:'Main Assembly',               icon:'▸', machine:'ASSY-02', fields:['Assembly Level','BOM Explosion','Qty Assembled','Torque Points','Rejection','Assembler','Shift'] },
      { id:'s4', name:'Electrical / Functional Test',icon:'▸', machine:'TEST-01', fields:['Test Type','Voltage (V)','Current (A)','Pass Criteria','Pass Qty','Fail Qty','Tester'] },
      { id:'s5', name:'Final Inspection',            icon:'▸', machine:'QC',      fields:['Visual Check','Dimensional Check','Functional Check','Pass Qty','Fail Qty','Inspector'] },
      { id:'s6', name:'Packing & Labelling',         icon:'▸', machine:'PACK',    fields:['Pack Type','Qty Packed','Label Applied','Serial No. Range','Packer'] },
    ]
  },

  fabrication: {
    name:'Fabrication / Sheet Metal', icon:'▸', color:'#4D5656', light:'#EAECEE',
    desc:'Laser · Welding · Sheet Metal · Structure', prodType:'discrete',
    stages:[
      { id:'s1', name:'Drawing Issue',       icon:'▸', machine:'DESIGN',  fields:['Drawing No.','Rev No.','Part Name','Material Spec','Issued By','Date'] },
      { id:'s2', name:'Material Issue',      icon:'▸', machine:'STORE',   fields:['Material Code','Heat No.','Size (mm)','Qty Issued (Kg)','Mill Certificate No.','Store Keeper'] },
      { id:'s3', name:'Cutting / Laser',     icon:'▸', machine:'LASER-01',fields:['Machine','Program No.','Qty Cut','Scrap (Kg)','Cut Quality','Operator'] },
      { id:'s4', name:'Forming / Bending',   icon:'▸', machine:'PRESS-01',fields:['Bend Angle','Tonnage','Back Gauge (mm)','Qty Formed','Rejection','Operator'] },
      { id:'s5', name:'Welding',             icon:'▸', machine:'WLD-01',  fields:['Weld Process','WPS No.','Welder ID','Weld Length (mm)','NDT Required','Distortion'] },
      { id:'s6', name:'Grinding / Finishing',icon:'▸', machine:'GRD-01',  fields:['Process','Surface Finish (Ra)','Qty Done','Rejection','Operator'] },
      { id:'s7', name:'Dimensional / NDT',   icon:'▸', machine:'QC',      fields:['Drawing No.','Critical Dimensions','Pass Qty','Fail Qty','NDT Result','Inspector'] },
      { id:'s8', name:'Dispatch',            icon:'▸', machine:'DISPATCH',fields:['Qty Dispatched','Test Certificate','MTC No.','DC No.','Dispatched By'] },
    ]
  },

  textile: {
    name:'Textile / Spinning', icon:'▸', color:'#76448A', light:'#F4ECF7',
    desc:'Spinning · Weaving · Knitting', prodType:'continuous',
    stages:[
      { id:'s1', name:'Mixing & Blowroom',  icon:'▸', machine:'BLW-01', fields:['Input Qty (Kg)','Output Qty (Kg)','Waste (Kg)','Moisture %','Neps Count','Operator','Shift','Remarks'] },
      { id:'s2', name:'Carding',            icon:'▸', machine:'CD-01',  fields:['Sliver Weight (g/m)','Can No.','Cylinder Speed (RPM)','Flat Speed','Waste %','Operator'] },
      { id:'s3', name:'Drawing',            icon:'▸', machine:'DR-01',  fields:['Input Slivers','Output Qty (Kg)','Draft','Delivery Speed','Hank','Operator'] },
      { id:'s4', name:'Ring Spinning',      icon:'⭕', machine:'SPG-01', fields:['Count (Ne)','TPI','Spindle Speed','Breakage Rate','Output (Kg)','Waste (Kg)','Operator','Shift'] },
      { id:'s5', name:'Winding / Autoconer',icon:'▸', machine:'WND-01', fields:['Cone Weight (g)','Drum Speed','Efficiency %','Splices/hr','Output (Cones)','Operator'] },
      { id:'s6', name:'Packing & Dispatch', icon:'▸', machine:'PACK-01',fields:['Packing Type','Bale Weight (Kg)','No. of Bales','Net Weight','Gross Weight','Operator'] },
    ]
  },

  manufacturing: {
    name:'Metal Manufacturing', icon:'▸', color:'#1A5276', light:'#D6EAF8',
    desc:'Fabrication · Assembly · Machining', prodType:'discrete',
    stages:[
      { id:'s1', name:'Raw Material Issue',  icon:'▸', machine:'STORE',   fields:['Material Code','Description','Qty Issued (Kg/Nos)','Heat No.','Batch No.','Store Keeper'] },
      { id:'s2', name:'Cutting / Shearing',  icon:'▸', machine:'CUT-01',  fields:['Material','Size (mm)','Qty Cut','Scrap (Kg)','Blade Setting','Operator','Machine'] },
      { id:'s3', name:'Forming / Bending',   icon:'▸', machine:'PRS-01',  fields:['Part No.','Bend Angle','Tonnage','Qty Formed','Rejection','Operator'] },
      { id:'s4', name:'Welding / Joining',   icon:'▸', machine:'WLD-01',  fields:['Weld Type','Rod/Wire Used','Current (A)','Voltage (V)','Qty Welded','Distortion %','Welder ID'] },
      { id:'s5', name:'Machining / Drilling',icon:'▸', machine:'MCH-01',  fields:['Operation','Tool Used','RPM','Feed Rate','Qty Machined','Rejection','Operator'] },
      { id:'s6', name:'Surface Treatment',   icon:'▸', machine:'SFC-01',  fields:['Process','Chemical Used','Temperature','Time (min)','Qty Done','Rejection'] },
      { id:'s7', name:'Assembly',            icon:'▸', machine:'ASSY-01', fields:['Assembly Level','Parts Used','Qty Assembled','Torque (Nm)','Rejection','Assembler'] },
      { id:'s8', name:'Final Inspection',    icon:'▸', machine:'QC-DEPT', fields:['Inspection Type','Pass Qty','Fail Qty','Deviation','NCR No.','Inspector'] },
    ]
  },

  chemical: {
    name:'Chemical / Coating', icon:'▸', color:'#196F3D', light:'#E9F7EF',
    desc:'Paint · Coating · Chemical Process', prodType:'batch', batchConcept:'vessel',
    stages:[
      { id:'s1', name:'RM Weighing',         icon:'▸', machine:'SCALE-01',fields:['Batch No.','Material Code','Std. Qty (Kg)','Act. Qty (Kg)','Variance %','Chemist','Scale ID'] },
      { id:'s2', name:'Surface Preparation', icon:'▸', machine:'PREP-01', fields:['Method','Chemical Used','Concentration %','Temperature (°C)','Duration (min)','Surface Profile'] },
      { id:'s3', name:'Mixing / Blending',   icon:'▸', machine:'MXR-01',  fields:['Mixer Speed (RPM)','Mix Time (min)','Temperature (°C)','Viscosity (cP)','pH Value','Batch Size (L)'] },
      { id:'s4', name:'Primer / Base Coat',  icon:'▸', machine:'SPRAY-01',fields:['DFT Target (µm)','DFT Actual (µm)','WFT (µm)','Coverage (m²)','Batch No.','Applicator'] },
      { id:'s5', name:'Top Coat Application',icon:'▸', machine:'SPRAY-02',fields:['Coat No.','DFT (µm)','Gloss (GU)','Color Code','Flash Off Time','Applicator'] },
      { id:'s6', name:'Curing / Drying',     icon:'▸', machine:'OVEN-01', fields:['Cure Type','Temperature (°C)','Time (min)','Humidity %','Hardness (H)','Technician'] },
      { id:'s7', name:'Quality Testing',     icon:'▸', machine:'LAB-01',  fields:['Viscosity','Gloss','DFT','Adhesion','Salt Spray (hrs)','Result','Lab Tech'] },
    ]
  },

  food: {
    name:'Food Processing / FMCG', icon:'▸', color:'#784212', light:'#FEF5E7',
    desc:'Processing · Packaging · FMCG', prodType:'batch', batchConcept:'vessel',
    stages:[
      { id:'s1', name:'RM Receiving',        icon:'▸', machine:'RECEIVING',fields:['Material','Supplier','Qty Received (Kg)','Batch No.','Mfg Date','Exp Date','Temp (°C)','Inspector'] },
      { id:'s2', name:'Cleaning / Sorting',  icon:'▸', machine:'CLN-01',   fields:['Input Qty (Kg)','Output Qty (Kg)','Rejection (Kg)','Foreign Matter %','Water Usage (L)','Operator'] },
      { id:'s3', name:'Mixing / Formulation',icon:'▸', machine:'MXR-01',   fields:['Recipe No.','Ingredient A (Kg)','Ingredient B (Kg)','Additive (g)','Mix Time (min)','Batch Wt (Kg)'] },
      { id:'s4', name:'Cooking / Processing',icon:'▸', machine:'COOK-01',  fields:['Temperature (°C)','Time (min)','Pressure (bar)','pH','Brix (°Bx)','Operator'] },
      { id:'s5', name:'Cooling / Setting',   icon:'▸', machine:'COOL-01',  fields:['Target Temp (°C)','Act. Temp (°C)','Cooling Time (min)','Conveyor Speed','Operator'] },
      { id:'s6', name:'Filling / Packing',   icon:'▸', machine:'FILL-01',  fields:['Pack Size (g/ml)','Qty Packed','Fill Wt (g)','Seal Temp (°C)','Line Speed','Rejection','Packer'] },
      { id:'s7', name:'Labelling & Coding',  icon:'▸', machine:'LBL-01',   fields:['Mfg Date','Exp Date','Batch Code','Lot No.','Label Qty','MRP','Operator'] },
    ]
  },

  pharma: {
    name:'Pharma / Medicine', icon:'▸', color:'#6C3483', light:'#F4ECF7',
    desc:'Tablets · Capsules · Liquid', prodType:'batch', batchConcept:'bmr',
    stages:[
      { id:'s1', name:'Dispensing',           icon:'▸', machine:'DISPENSE',fields:['BMR No.','Material Name','Std Qty (Kg)','Act Qty (Kg)','A.R. No.','Mfg Date','Exp Date','Dispensed By','Checked By'] },
      { id:'s2', name:'Sifting / Milling',    icon:'▸', machine:'MILL-01', fields:['Sieve Mesh No.','Milling Time (min)','Qty In (Kg)','Qty Out (Kg)','Loss %','RPM','Operator'] },
      { id:'s3', name:'Granulation',          icon:'▸', machine:'GRN-01',  fields:['Granulation Type','Binder Used','Binder Conc %','Granulator Speed','End Point','Dry LOD %','Granule Size (µm)'] },
      { id:'s4', name:'Drying (FBD)',         icon:'▸', machine:'FBD-01',  fields:['Inlet Temp (°C)','Outlet Temp (°C)','Time (min)','Initial LOD %','Final LOD %','Batch Size (Kg)'] },
      { id:'s5', name:'Blending',             icon:'▸', machine:'BLD-01',  fields:['Blender Size (L)','RPM','Blend Time (min)','Blend Uniformity %','Bulk Density','Tapped Density'] },
      { id:'s6', name:'Compression / Filling',icon:'▸', machine:'CMP-01',  fields:['Machine Speed (TPM)','Avg Wt (mg)','Hardness (N)','Friability %','Disintegration (min)','Qty Produced','Rejection'] },
      { id:'s7', name:'Coating',              icon:'▸', machine:'CTR-01',  fields:['Coating Type','Inlet Temp (°C)','Spray Rate (ml/min)','Pan Speed (RPM)','Wt Gain %','Time (min)'] },
      { id:'s8', name:'Packing & Labelling',  icon:'▸', machine:'PCK-01',  fields:['Pack Type','Batch No.','Mfg Date','Exp Date','Qty Packed','MRP (₹)','Checked By'] },
    ]
  },
}

// ── ITEM MASTER ───────────────────────────────────────────────────────────────
// Routing is per ITEM — not per customer!
export const ITEMS = [
  { id:'ITM-001', code:'BRK-BRKT-001', name:'Brake Bracket',    uom:'Pieces', industry:'surface_treatment', prodType:'batch',  mouldId:null,   cavity:null, batchCapacity:500,
    stages:['Inward Inspection','Pre-Treatment / Degreasing','Rinsing','Phosphating','Powder Coating','Curing / Oven','DFT / QC Check','Outward / Dispatch'] },
  { id:'ITM-002', code:'CAP-PP-20ML',  name:'PP Cap 20ml',      uom:'Pieces', industry:'injection_moulding',prodType:'mould',  mouldId:'M-001',cavity:4,    batchCapacity:null,
    stages:['Material Drying','Mould Setup','Trial Shot','Production Run','Inline QC','Degating / Trimming','Final Inspection','Packing'] },
  { id:'ITM-003', code:'GEAR-HSG-A2',  name:'Gear Housing A2',  uom:'Pieces', industry:'heat_treatment',    prodType:'batch',  mouldId:null,   cavity:null, batchCapacity:300,
    stages:['Job Receipt & Check','Furnace Loading','Hardening / Heating','Quenching','Tempering','Hardness Testing','Shot Blasting / Cleaning','Final Dispatch'] },
  { id:'ITM-004', code:'BTL-500ML-PET',name:'PET Bottle 500ml', uom:'Pieces', industry:'blow_moulding',     prodType:'mould',  mouldId:'M-002',cavity:2,    batchCapacity:null,
    stages:['Material Preparation','Mould Setup','Extrusion / Preform','Blow / Stretch','Trimming / Deflashing','Leak / Quality Test','Packing'] },
  { id:'ITM-005', code:'ZNC-PLT-STD',  name:'Zinc Plated Part', uom:'Pieces', industry:'electroplating',    prodType:'batch',  mouldId:null,   cavity:null, batchCapacity:400,
    stages:['Job Receipt','Pre-Treatment','Acid Cleaning / Activation','Plating','Post Rinse','Drying','Thickness / QC Check','Dispatch'] },
  { id:'ITM-006', code:'ENG-MNT-B3',   name:'Engine Mount B3',  uom:'Pieces', industry:'surface_treatment', prodType:'batch',  mouldId:null,   cavity:null, batchCapacity:500,
    stages:['Inward Inspection','Pre-Treatment / Degreasing','Rinsing','Phosphating','Powder Coating','Curing / Oven','DFT / QC Check','Outward / Dispatch'] },
  { id:'ITM-007', code:'RBR-SEAL-K12', name:'Rubber Seal K12',  uom:'Pieces', industry:'rubber_moulding',   prodType:'mould',  mouldId:'M-003',cavity:8,    batchCapacity:null,
    stages:['Compound Preparation','Preform / Slug Prep','Moulding / Curing','Deflashing','Post Cure (if req)','Inspection','Packing'] },
  { id:'ITM-008', code:'LBL-SHRK-50MM',name:'Shrink Label 50mm',uom:'Meters', industry:'printing',          prodType:'discrete',mouldId:null,  cavity:null, batchCapacity:null,
    stages:['Pre-Press / Artwork','Plate / Cylinder Making','Substrate Setup','Printing Run','Lamination / Coating','Die Cutting / Slitting','Inspection & Packing'] },
]

// ── MOULD MASTER ──────────────────────────────────────────────────────────────
export const MOULDS = [
  { id:'M-001', name:'PP Cap Mould 20ml', industry:'injection_moulding', cavity:4,  machine:'IMM-150T', material:'P20 Steel', lastMaint:'2025-01-15', shots:245000, maxShots:500000, status:'Active' },
  { id:'M-002', name:'PET Bottle 500ml',  industry:'blow_moulding',      cavity:2,  machine:'BM-80T',   material:'H13 Steel', lastMaint:'2025-02-10', shots:180000, maxShots:400000, status:'Active' },
  { id:'M-003', name:'Rubber Seal K12',   industry:'rubber_moulding',    cavity:8,  machine:'PRESS-80T',material:'P20 Steel', lastMaint:'2025-01-28', shots:92000,  maxShots:300000, status:'Active' },
  { id:'M-004', name:'Auto Clip C5',      industry:'injection_moulding', cavity:16, machine:'IMM-150T', material:'H13 Steel', lastMaint:'2025-01-05', shots:310000, maxShots:500000, status:'Active' },
]

// ── WORK CENTERS ─────────────────────────────────────────────────────────────
export const WORK_CENTERS = [
  { id:'WC-001', name:'Pre-Treatment Tank',  process:'Pre-Treatment / Degreasing', capacity:500, unit:'Pieces/batch', shift:'General', status:'Active',             operator:'Rajan K.',   utilization:72 },
  { id:'WC-002', name:'Phosphating Tank',    process:'Phosphating',                capacity:500, unit:'Pieces/batch', shift:'General', status:'Active',             operator:'Murugan S.', utilization:68 },
  { id:'WC-003', name:'Powder Coat Booth 1', process:'Powder Coating',             capacity:400, unit:'Pieces/shift', shift:'Morning', status:'Active',             operator:'Arun M.',    utilization:91 },
  { id:'WC-004', name:'Powder Coat Booth 2', process:'Powder Coating',             capacity:400, unit:'Pieces/shift', shift:'Afternoon',status:'Active',            operator:'Karthik P.', utilization:55 },
  { id:'WC-005', name:'Curing Oven 1',       process:'Curing / Oven',              capacity:800, unit:'Pieces/shift', shift:'Morning', status:'Active',             operator:'Suresh V.',  utilization:78 },
  { id:'WC-006', name:'Curing Oven 2',       process:'Curing / Oven',              capacity:800, unit:'Pieces/shift', shift:'Afternoon',status:'Under Maintenance', operator:'—',          utilization:0 },
  { id:'WC-007', name:'Furnace F-001',       process:'Hardening / Heating',        capacity:500, unit:'Kg/batch',     shift:'General', status:'Active',             operator:'Selvam R.',  utilization:65 },
  { id:'WC-008', name:'IMM-150T',            process:'Production Run',             capacity:1,   unit:'Job/shift',    shift:'General', status:'Active',             operator:'Priya D.',   utilization:82 },
]

// ── CUSTOMERS — Rate card only, NO process config ─────────────────────────────
export const PP_CUSTOMERS = [
  { id:'CUST-001', name:'Kovai Auto Components',   entity:'Automotive',  contact:'Senthil K.', phone:'9944001144', chargeBy:'Per Piece',
    processes:['Inward Inspection','Pre-Treatment / Degreasing','Phosphating','Powder Coating','Curing / Oven','DFT / QC Check','Outward / Dispatch'] },
  { id:'CUST-002', name:'Sri Lakshmi Mills',       entity:'Textile',     contact:'Mani Kumar', phone:'9944001122', chargeBy:'Per Piece',
    processes:['Inward Inspection','Pre-Treatment / Degreasing','Powder Coating','Curing / Oven','Outward / Dispatch'] },
  { id:'CUST-003', name:'Delta Engineering Works', entity:'Engineering', contact:'Anand R.',   phone:'9944001155', chargeBy:'Per Batch',
    processes:['Job Receipt & Check','Furnace Loading','Hardening / Heating','Quenching','Tempering','Hardness Testing','Final Dispatch'] },
  { id:'CUST-004', name:'Apex Auto Parts',         entity:'Automotive',  contact:'Ravi S.',    phone:'9944001166', chargeBy:'Per Piece',
    processes:['Inward Inspection','Pre-Treatment / Degreasing','Phosphating','Powder Coating','Curing / Oven','Outward / Dispatch'] },
]

// ── RATE CARDS — Per customer × per process ───────────────────────────────────
export const RATE_CARDS = [
  { id:'RC-001', customerId:'CUST-001', process:'Pre-Treatment / Degreasing', rate:2.50,  unit:'Per Piece', status:'Active' },
  { id:'RC-002', customerId:'CUST-001', process:'Phosphating',                rate:4.50,  unit:'Per Piece', status:'Active' },
  { id:'RC-003', customerId:'CUST-001', process:'Powder Coating',             rate:10.00, unit:'Per Piece', status:'Active' },
  { id:'RC-004', customerId:'CUST-001', process:'Curing / Oven',              rate:2.00,  unit:'Per Piece', status:'Active' },
  { id:'RC-005', customerId:'CUST-002', process:'Pre-Treatment / Degreasing', rate:2.00,  unit:'Per Piece', status:'Active' },
  { id:'RC-006', customerId:'CUST-002', process:'Powder Coating',             rate:8.00,  unit:'Per Piece', status:'Active' },
]

// ── JOB CARDS ─────────────────────────────────────────────────────────────────
export const JOB_CARDS = [
  { id:'JC-0042', date:'2025-03-01', customerId:'CUST-001', customerName:'Kovai Auto Components', dcNo:'KAC/DC/2025/112', itemId:'ITM-001', item:'Brake Bracket', qty:500, unit:'Pieces', priority:'High',   status:'In Progress', currentStep:3 },
  { id:'JC-0041', date:'2025-03-01', customerId:'CUST-002', customerName:'Sri Lakshmi Mills',     dcNo:'SLM/DC/2025/088', itemId:'ITM-001', item:'Brake Bracket', qty:200, unit:'Pieces', priority:'Normal', status:'In Progress', currentStep:4 },
  { id:'JC-0040', date:'2025-02-28', customerId:'CUST-004', customerName:'Apex Auto Parts',       dcNo:'AAP/DC/2025/044', itemId:'ITM-006', item:'Engine Mount',  qty:300, unit:'Pieces', priority:'High',   status:'Pending',     currentStep:1 },
  { id:'JC-0039', date:'2025-02-28', customerId:'CUST-003', customerName:'Delta Engineering',     dcNo:'DEW/DC/2025/031', itemId:'ITM-003', item:'Gear Housing',  qty:150, unit:'Pieces', priority:'Normal', status:'Pending',     currentStep:1 },
]

// ── BATCHES ───────────────────────────────────────────────────────────────────
export const BATCHES = [
  { id:'BATCH-007', date:'2025-03-01', stage:'Phosphating', wcId:'WC-002', jobCards:['JC-0042','JC-0041'], totalQty:700, status:'Running', startTime:'10:30', endTime:'', operator:'Murugan S.' },
  { id:'BATCH-006', date:'2025-03-01', stage:'Pre-Treatment / Degreasing', wcId:'WC-001', jobCards:['JC-0042','JC-0041','JC-0040'], totalQty:1000, status:'Done', startTime:'08:00', endTime:'09:30', operator:'Rajan K.' },
]

// ── HELPERS ───────────────────────────────────────────────────────────────────
export const PRIORITY_COLORS = { High:'crm-badge-notq', Normal:'crm-badge-contacted', Low:'crm-badge-new' }
export const CHARGE_BASES    = ['Per Piece','Per Kg','Per Batch','Per Meter','Per Hour','Per Sqft','Per Litre','Per Set']
export const SHIFT_OPTIONS   = ['Morning (6AM-2PM)','Afternoon (2PM-10PM)','Night (10PM-6AM)','General (9AM-6PM)']
export const WC_STATUS       = ['Active','Inactive','Under Maintenance','Setup']
export const ENTITY_TYPES    = ['Automotive','Textile','Pharma','Engineering','Electronics','Chemical','Food & Beverage','Construction','General']

// Shot output calc — mould type
export const calcShotOutput = (jobQty, cavity) =>
  cavity > 0 ? { shots:Math.ceil(jobQty/cavity), output:Math.ceil(jobQty/cavity)*cavity, cavity } : null

// Ampere-hour thickness calc — electroplating
export const calcPlatingThickness = (currentA, timeMin, areaDm2) =>
  areaDm2 > 0 ? ((currentA * timeMin * 0.0195) / areaDm2).toFixed(2) : 0

// ── BACKWARD COMPAT — exports used by existing Job Work pages ─────────────────

// JOB_STEPS — step-by-step execution data per job card
export const JOB_STEPS = {
  'JC-0042': [
    { step:'Inward Inspection',          status:'Done',    wcId:'WC-009', operator:'Rajan K.',   startTime:'08:00', endTime:'08:30', qty:500, remarks:'All OK' },
    { step:'Pre-Treatment / Degreasing', status:'Done',    wcId:'WC-001', operator:'Rajan K.',   startTime:'08:30', endTime:'09:30', qty:500, remarks:'' },
    { step:'Rinsing',                    status:'Done',    wcId:'WC-001', operator:'Rajan K.',   startTime:'09:30', endTime:'10:00', qty:500, remarks:'' },
    { step:'Phosphating',                status:'Running', wcId:'WC-002', operator:'Murugan S.', startTime:'10:30', endTime:'',      qty:0,   remarks:'' },
    { step:'Powder Coating',             status:'Waiting', wcId:'WC-003', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Curing / Oven',              status:'Waiting', wcId:'WC-005', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'DFT / QC Check',             status:'Waiting', wcId:'WC-009', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Outward / Dispatch',         status:'Waiting', wcId:'',       operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
  ],
  'JC-0041': [
    { step:'Inward Inspection',          status:'Done',    wcId:'WC-009', operator:'Rajan K.',   startTime:'08:00', endTime:'08:20', qty:200, remarks:'' },
    { step:'Pre-Treatment / Degreasing', status:'Done',    wcId:'WC-001', operator:'Rajan K.',   startTime:'08:30', endTime:'09:30', qty:200, remarks:'' },
    { step:'Rinsing',                    status:'Done',    wcId:'WC-001', operator:'Rajan K.',   startTime:'09:30', endTime:'09:50', qty:200, remarks:'' },
    { step:'Phosphating',                status:'Running', wcId:'WC-002', operator:'Murugan S.', startTime:'10:30', endTime:'',      qty:0,   remarks:'' },
    { step:'Powder Coating',             status:'Waiting', wcId:'WC-004', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Curing / Oven',              status:'Waiting', wcId:'WC-005', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'DFT / QC Check',             status:'Waiting', wcId:'WC-009', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Outward / Dispatch',         status:'Waiting', wcId:'',       operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
  ],
  'JC-0040': [
    { step:'Inward Inspection',          status:'Done',    wcId:'WC-009', operator:'Kumar T.',   startTime:'07:50', endTime:'08:15', qty:300, remarks:'' },
    { step:'Pre-Treatment / Degreasing', status:'Waiting', wcId:'WC-001', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Rinsing',                    status:'Waiting', wcId:'WC-001', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Phosphating',                status:'Waiting', wcId:'WC-002', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Powder Coating',             status:'Waiting', wcId:'WC-003', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Curing / Oven',              status:'Waiting', wcId:'WC-005', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'DFT / QC Check',             status:'Waiting', wcId:'WC-009', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Outward / Dispatch',         status:'Waiting', wcId:'',       operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
  ],
  'JC-0039': [
    { step:'Job Receipt & Check',        status:'Done',    wcId:'WC-009', operator:'Kumar T.',   startTime:'08:00', endTime:'08:30', qty:150, remarks:'HRC target: 58' },
    { step:'Furnace Loading',            status:'Waiting', wcId:'WC-007', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Hardening / Heating',        status:'Waiting', wcId:'WC-007', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Quenching',                  status:'Waiting', wcId:'',       operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Tempering',                  status:'Waiting', wcId:'',       operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Hardness Testing',           status:'Waiting', wcId:'WC-009', operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Shot Blasting / Cleaning',   status:'Waiting', wcId:'',       operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
    { step:'Final Dispatch',             status:'Waiting', wcId:'',       operator:'',           startTime:'',      endTime:'',      qty:0,   remarks:'' },
  ],
}

// STEP_STATUS_COLORS — background color per step status
export const STEP_STATUS_COLORS = {
  Done:    '#E8F5E9',
  Running: '#FFF3E0',
  Waiting: '#F5F5F5',
  Blocked: '#FFEBEE',
  Skipped: '#F3E5F5',
}

// STEP_STATUS_TEXT — label text per status
export const STEP_STATUS_TEXT = {
  Done:    'Completed',
  Running: 'In Progress',
  Waiting: 'Pending',
  Blocked: 'Blocked',
  Skipped: 'Skipped',
}

// INDUSTRY_SUBTYPES — used by PPConfigurator
export const INDUSTRY_SUBTYPES = [
  { key:'surface_treatment', emoji:'', name:'Surface Treatment',      icon:'🎨', label:'Surface Treatment / Coating',    color:'var(--odoo-purple)',
    desc:'Powder coat · CED · Phosphating', chargeBy:['Per Piece','Per Batch','Per Kg'],
    processes:['Inward Inspection','Pre-Treatment / Degreasing','Rinsing','Phosphating','Powder Coating','Curing / Oven','DFT / QC Check','Outward / Dispatch'],
    defaultSequence:['Inward Inspection','Pre-Treatment / Degreasing','Phosphating','Powder Coating','Curing / Oven','DFT / QC Check','Outward / Dispatch'] },
  { key:'heat_treatment',    emoji:'', name:'Heat Treatment',          icon:'▸', label:'Heat Treatment',                 color:'#C0392B',
    desc:'Hardening · Annealing · Tempering', chargeBy:['Per Piece','Per Kg','Per Batch'],
    processes:['Job Receipt & Check','Furnace Loading','Hardening / Heating','Quenching','Tempering','Hardness Testing','Shot Blasting / Cleaning','Final Dispatch'],
    defaultSequence:['Job Receipt & Check','Furnace Loading','Hardening / Heating','Quenching','Tempering','Hardness Testing','Final Dispatch'] },
  { key:'cnc_jobwork',       emoji:'', name:'CNC Job Work',            icon:'▸', label:'CNC Job Work / Machining',       color:'#1A5276',
    desc:'Turning · Milling · Drilling', chargeBy:['Per Piece','Per Hour','Per Batch'],
    processes:['Drawing Receipt','Material Issue','Machine Setting','Turning','Milling','Drilling','Deburring','Inspection','Dispatch'],
    defaultSequence:['Drawing Receipt','Material Issue','Machine Setting','Turning','Inspection','Dispatch'] },
  { key:'textile_proc',      emoji:'', name:'Textile Processing',      icon:'▸', label:'Textile Processing',             color:'#76448A',
    desc:'Dyeing · Printing · Finishing', chargeBy:['Per Meter','Per Kg','Per Piece'],
    processes:['Grey Fabric Receipt','Scouring','Bleaching','Dyeing','Washing','Drying','Finishing','Quality Check','Dispatch'],
    defaultSequence:['Grey Fabric Receipt','Scouring','Dyeing','Drying','Finishing','Quality Check','Dispatch'] },
  { key:'forging_finish',    emoji:'', name:'Forging / Casting',       icon:'▸', label:'Forging / Casting Finishing',    color:'#784212',
    desc:'Shot blast · Trim · Inspect', chargeBy:['Per Piece','Per Kg'],
    processes:['Incoming Inspection','Shot Blasting','Trimming','Machining','Heat Treatment','Dimensional Check','Dispatch'],
    defaultSequence:['Incoming Inspection','Shot Blasting','Trimming','Dimensional Check','Dispatch'] },
  { key:'electroplating',    emoji:'', name:'Electroplating',          icon:'▸', label:'Electroplating / Metal Finishing',color:'#1F618D',
    desc:'Zinc · Nickel · Chrome · Gold', chargeBy:['Per Piece','Per Sqft','Per Batch'],
    processes:['Job Receipt','Pre-Treatment','Acid Cleaning / Activation','Plating','Post Rinse','Drying','Thickness / QC Check','Dispatch'],
    defaultSequence:['Job Receipt','Pre-Treatment','Activation','Plating','Rinse','Drying','QC','Dispatch'] },
  { key:'assembly_jobwork',  emoji:'', name:'Assembly Job Work',       icon:'▸', label:'Assembly Job Work',              color:'#117A65',
    desc:'Mechanical · Electronic · Kitting', chargeBy:['Per Piece','Per Set','Per Hour'],
    processes:['Parts Incoming Check','Sub-Assembly','Main Assembly','Electrical / Functional Test','Final Inspection','Packing & Labelling'],
    defaultSequence:['Parts Incoming Check','Sub-Assembly','Main Assembly','Final Inspection','Packing & Labelling'] },
  { key:'printing',          emoji:'', name:'Printing',                icon:'▸', label:'Printing Industries',            color:'#1B4F72',
    desc:'Label · Packaging · Offset', chargeBy:['Per Meter','Per Sheet','Per 1000 Pcs'],
    processes:['Pre-Press / Artwork','Plate / Cylinder Making','Substrate Setup','Printing Run','Lamination / Coating','Die Cutting / Slitting','Inspection & Packing'],
    defaultSequence:['Pre-Press / Artwork','Plate Making','Printing Run','Die Cutting','Inspection & Packing'] },
  { key:'injection_moulding',emoji:'', name:'Injection Moulding',      icon:'▸', label:'Injection Moulding',             color:'#1A5276',
    desc:'Thermoplastic · Auto parts', chargeBy:['Per Piece','Per Shot','Per Kg'],
    processes:['Material Drying','Mould Setup','Trial Shot','Production Run','Inline QC','Degating / Trimming','Final Inspection','Packing'],
    defaultSequence:['Material Drying','Mould Setup','Trial Shot','Production Run','Inline QC','Final Inspection','Packing'] },
  { key:'fabrication',       emoji:'', name:'Fabrication',             icon:'▸', label:'Fabrication / Sheet Metal',      color:'#4D5656',
    desc:'Laser · Welding · Sheet Metal', chargeBy:['Per Piece','Per Kg','Per Job'],
    processes:['Drawing Issue','Material Issue','Cutting / Laser','Forming / Bending','Welding','Grinding / Finishing','Dimensional / NDT','Dispatch'],
    defaultSequence:['Drawing Issue','Material Issue','Cutting','Welding','Inspection','Dispatch'] },
]

// ── INDUSTRY NAME → KEY MAP ───────────────────────────────────────────────────
// Maps COMPANY.industry (from _configData.js) → INDUSTRY_SUBTYPES key
// To switch: change COMPANY.industry in _configData.js → update _COMPANY_INDUSTRY below to match
const INDUSTRY_NAME_MAP = {
  'Surface Treatment / Coating':     'surface_treatment',
  'Injection Moulding':              'injection_moulding',
  'Heat Treatment':                  'heat_treatment',
  'CNC Job Work / Machining':        'cnc_jobwork',
  'Fabrication / Sheet Metal':       'fabrication',
  'Blow Moulding':                   'blow_moulding',
  'Rubber Moulding':                 'rubber_moulding',
  'Electroplating / Metal Finishing':'electroplating',
  'Assembly Job Work':               'assembly_jobwork',
  'Textile Processing':              'textile_proc',
  'Forging / Casting Finishing':     'forging_finish',
  'Printing Industries':             'printing',
}

// ── DEMO_COMPANY_CONFIG — single source of truth for active industry ──────────
// MUST be after INDUSTRY_SUBTYPES (references it)
// When onboarding a new client: change _COMPANY_INDUSTRY here + COMPANY.industry in _configData.js
const _COMPANY_INDUSTRY = 'Injection Moulding'  // ← sync with _configData.js COMPANY.industry
const _activeKey  = INDUSTRY_NAME_MAP[_COMPANY_INDUSTRY] || 'injection_moulding'
const _activeInd  = INDUSTRY_SUBTYPES.find(i => i.key === _activeKey)

export const DEMO_COMPANY_CONFIG = {
  subType:     _activeKey,                                  // 'injection_moulding'
  industryName:_COMPANY_INDUSTRY,                           // 'Injection Moulding'
  chargeBy:    _activeInd?.chargeBy?.[0] || 'Per Piece',   // 'Per Piece'
  processes:   _activeInd?.processes     || [],             // 7 injection moulding stages
  workCenters: WORK_CENTERS,
}