// ── LNV ERP — KPI / KRA MODULE DATA ─────────────────────

export const MONTHS_FY = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
export const MONTH_FULL = {
  Apr:'April', May:'May', Jun:'June', Jul:'July', Aug:'August', Sep:'September',
  Oct:'October', Nov:'November', Dec:'December', Jan:'January', Feb:'February', Mar:'March'
}

// ── KPI MASTER ───────────────────────────────────────────
export const KPI_MASTER_DEFAULT = [
  {code:'MJ01',cat:'Major',desc:'Sales ABP Vs Actual',            uom:'%',   dir:'up',  wt:10, tgt:100,   threshold:70, maxOver:30, scope:'sales'},
  {code:'MJ02',cat:'Major',desc:'Employee Cost',                  uom:'%',   dir:'down',wt:10, tgt:15,    threshold:70, maxOver:30, scope:'hr'},
  {code:'MJ03',cat:'Major',desc:'COGM - ED',                      uom:'Rs',  dir:'down',wt:10, tgt:3.50,  threshold:70, maxOver:30, scope:'plant'},
  {code:'MJ04',cat:'Major',desc:'COGM - PC',                      uom:'Rs',  dir:'down',wt:10, tgt:6.20,  threshold:70, maxOver:30, scope:'plant'},
  {code:'MJ05',cat:'Major',desc:'COGM - LP',                      uom:'Rs',  dir:'down',wt:10, tgt:12.85, threshold:70, maxOver:30, scope:'plant'},
  {code:'MJ06',cat:'Major',desc:'Debit Notes',                    uom:'%',   dir:'down',wt:5,  tgt:0.5,   threshold:70, maxOver:30, scope:'all'},
  {code:'MJ07',cat:'Major',desc:'Receivables > 90 Days',          uom:'Lac', dir:'down',wt:5,  tgt:0,     threshold:70, maxOver:30, scope:'accounts'},
  {code:'MJ08',cat:'Major',desc:'Sales Realisation',              uom:'%',   dir:'up',  wt:10, tgt:100,   threshold:70, maxOver:30, scope:'sales'},
  {code:'MJ09',cat:'Major',desc:'COPQ - Cost of Poor Quality',    uom:'%',   dir:'down',wt:10, tgt:5,     threshold:70, maxOver:30, scope:'plant'},
  {code:'MJ10',cat:'Major',desc:'Fulfilment of TSR',              uom:'%',   dir:'up',  wt:10, tgt:100,   threshold:70, maxOver:30, scope:'all'},
  {code:'MJ11',cat:'Major',desc:'Calendar Adherence - Operation', uom:'%',   dir:'up',  wt:5,  tgt:100,   threshold:70, maxOver:30, scope:'production'},
  {code:'MJ12',cat:'Major',desc:'Calendar Adherence - Admin',     uom:'%',   dir:'up',  wt:5,  tgt:100,   threshold:70, maxOver:30, scope:'admin'},
  {code:'MR01',cat:'Minor',desc:'COGM',                           uom:'%',   dir:'down',wt:0,  tgt:100,   threshold:70, maxOver:30, scope:'all'},
  {code:'MR02',cat:'Minor',desc:'MSR ED, Casting',                uom:'Rs',  dir:'down',wt:0,  tgt:12,    threshold:70, maxOver:30, scope:'all'},
  {code:'MR03',cat:'Minor',desc:'MSR ED, Aluminium',              uom:'Rs',  dir:'down',wt:0,  tgt:26,    threshold:70, maxOver:30, scope:'all'},
  {code:'MR04',cat:'Minor',desc:'Customer Complaints',            uom:'Nos', dir:'down',wt:0,  tgt:0,     threshold:70, maxOver:30, scope:'all'},
  {code:'MR05',cat:'Minor',desc:'OTD - On Time Delivery',         uom:'%',   dir:'up',  wt:0,  tgt:95,    threshold:70, maxOver:30, scope:'all'},
]

// ── ACTUALS (monthly data from spreadsheet) ──────────────
export const ACTUALS_DEFAULT = {
  MJ01:{Apr:60,  May:53,    Jun:57,    Jul:65,    Aug:58,    Sep:61,    Oct:51,    Nov:55,    Dec:59,    Jan:52,    Feb:null,Mar:null},
  MJ02:{Apr:28,  May:28.34, Jun:27.28, Jul:27.57, Aug:29.17, Sep:25.61, Oct:31.28, Nov:26.05, Dec:31.20, Jan:29.20, Feb:null,Mar:null},
  MJ03:{Apr:6.28,May:6.17,  Jun:6.03,  Jul:6.52,  Aug:5.58,  Sep:4.79,  Oct:7.02,  Nov:5.49,  Dec:7.31,  Jan:6.29,  Feb:null,Mar:null},
  MJ04:{Apr:6.63,May:8.87,  Jun:6.53,  Jul:5.78,  Aug:7.58,  Sep:7.13,  Oct:9.78,  Nov:8.18,  Dec:7.63,  Jan:6.20,  Feb:null,Mar:null},
  MJ05:{Apr:16.66,May:18.23,Jun:17.32, Jul:17.07, Aug:16.15, Sep:16.30, Oct:18.12, Nov:15.94, Dec:15.86, Jan:16.88, Feb:null,Mar:null},
  MJ06:{Apr:0.12,May:0.12,  Jun:0.11,  Jul:0.60,  Aug:0.60,  Sep:0.22,  Oct:0.79,  Nov:0.18,  Dec:0.79,  Jan:0.07,  Feb:null,Mar:null},
  MJ07:{Apr:29.53,May:33.87,Jun:29.30, Jul:21.86, Aug:29.27, Sep:23.33, Oct:27.10, Nov:26.83, Dec:24.96, Jan:22.84, Feb:null,Mar:null},
  MJ08:{Apr:92,  May:96,    Jun:90,    Jul:93,    Aug:100,   Sep:98,    Oct:100,   Nov:100,   Dec:100,   Jan:100,   Feb:null,Mar:null},
  MJ09:{Apr:1.61,May:1.40,  Jun:1.44,  Jul:1.43,  Aug:1.52,  Sep:1.86,  Oct:1.35,  Nov:0.88,  Dec:1.22,  Jan:1.00,  Feb:null,Mar:null},
  MJ10:{Apr:null,May:0.003, Jun:null,  Jul:null,  Aug:36,    Sep:38,    Oct:39,    Nov:42,    Dec:45,    Jan:46,    Feb:null,Mar:null},
  MJ11:{Apr:null,May:null,  Jun:null,  Jul:null,  Aug:null,  Sep:null,  Oct:null,  Nov:null,  Dec:null,  Jan:null,  Feb:null,Mar:null},
  MJ12:{Apr:null,May:null,  Jun:null,  Jul:null,  Aug:null,  Sep:null,  Oct:null,  Nov:null,  Dec:null,  Jan:null,  Feb:null,Mar:null},
  MR01:{Apr:100, May:100,   Jun:100,   Jul:100,   Aug:100,   Sep:100,   Oct:100,   Nov:100,   Dec:100,   Jan:100,   Feb:null,Mar:null},
  MR02:{Apr:12.14,May:12.06,Jun:null,  Jul:10.95, Aug:11.61, Sep:12.11, Oct:11.81, Nov:10.93, Dec:11.30, Jan:10.95, Feb:null,Mar:null},
  MR03:{Apr:64.52,May:64.52,Jun:64.52, Jul:54.73, Aug:64.52, Sep:49.68, Oct:41.76, Nov:41.57, Dec:43.38, Jan:64.52, Feb:null,Mar:null},
  MR04:{Apr:0,   May:0,     Jun:0,     Jul:1,     Aug:0,     Sep:0,     Oct:0,     Nov:0,     Dec:1,     Jan:0,     Feb:null,Mar:null},
  MR05:{Apr:88,  May:90,    Jun:87,    Jul:91,    Aug:89,    Sep:92,    Oct:94,    Nov:91,    Dec:95,    Jan:96,    Feb:null,Mar:null},
}

export const EMPLOYEES_DEFAULT = [
  {code:'EMP001', name:'Ramesh Kumar',  role:'plant',      dept:'Production', sal:85000, incElig:true },
  {code:'EMP002', name:'Priya Sharma',  role:'accounts',   dept:'Finance',    sal:65000, incElig:true },
  {code:'EMP003', name:'Raj Kumar',     role:'sales',      dept:'Sales',      sal:55000, incElig:true },
  {code:'EMP004', name:'Kavitha Devi',  role:'hr',         dept:'HR',         sal:60000, incElig:true },
  {code:'EMP005', name:'Suresh Kumar',  role:'production', dept:'Production', sal:45000, incElig:false},
]

export const ASSIGNMENTS_DEFAULT = [
  {name:'Plant Manager KPIs',          type:'role',       target:'plant',      kpis:['MJ01','MJ03','MJ04','MJ05','MJ09','MJ10','MJ11'], incLinked:true },
  {name:'Accounts KPIs',               type:'role',       target:'accounts',   kpis:['MJ06','MJ07','MJ08'],                              incLinked:true },
  {name:'Sales Officer KPIs',          type:'role',       target:'sales',      kpis:['MJ01','MJ08','MJ10'],                              incLinked:true },
  {name:'All Employees — Company KPIs',type:'department', target:'All',        kpis:['MJ01','MJ09','MJ10'],                              incLinked:false},
]

export const INC_TIERS_DEFAULT = [
  {minScore:95, maxScore:100, label:'Excellent',  incPct:15, color:'#00A09D'},
  {minScore:85, maxScore:94,  label:'Very Good',  incPct:10, color:'#017E84'},
  {minScore:75, maxScore:84,  label:'Good',       incPct:7,  color:'#1A5276'},
  {minScore:65, maxScore:74,  label:'Average',    incPct:4,  color:'#E06F39'},
  {minScore:0,  maxScore:64,  label:'Below Avg',  incPct:0,  color:'#D9534F'},
]

// ── SCORING ENGINE ────────────────────────────────────────
export const SCORE = {
  calc(dir, target, actual, wt, threshold = 70, maxOver = 30) {
    if (actual === null || actual === undefined || target === null) return null
    const pct = this.pct(dir, target, actual)
    if (pct === null) return null
    if (pct < threshold) return 0
    if (dir === 'up') {
      if (actual >= target) return wt
      return parseFloat(((pct - threshold) / (100 - threshold) * wt).toFixed(3))
    } else {
      if (actual <= target) return wt
      const maxAllowed = target * (1 + maxOver / 100)
      if (actual >= maxAllowed) return 0
      const ratio = (maxAllowed - actual) / (maxAllowed - target)
      return parseFloat((ratio * wt).toFixed(3))
    }
  },
  pct(dir, target, actual) {
    if (!target && dir === 'up') return actual === 0 ? 0 : null
    if (target === 0) return actual === 0 ? 100 : dir === 'down' ? 0 : null
    if (dir === 'up') return Math.round(actual / target * 100)
    return Math.round(target / actual * 100)
  },
  color(pct) {
    if (pct === null || pct === undefined) return 'zero'
    if (pct >= 90) return 'hi'
    if (pct >= 70) return 'md'
    return 'lo'
  },
  colorStyle(cls) {
    if (cls === 'hi')   return { background:'#D4EDDA', color:'#155724', fontWeight:700 }
    if (cls === 'md')   return { background:'#FFF3CD', color:'#856404', fontWeight:700 }
    if (cls === 'lo')   return { background:'#F8D7DA', color:'#721C24', fontWeight:700 }
    return { color:'#CCC' }
  }
}
