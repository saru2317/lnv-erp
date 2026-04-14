import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

// ── Recruitment ───────────────────────────────────────────
const HCMDashboard        = lazy(() => import('./HCMDashboard'))
const JobOpenings         = lazy(() => import('./JobOpenings'))
const CandidateTracker    = lazy(() => import('./CandidateTracker'))
const ManpowerRequisition = lazy(() => import('./ManpowerRequisition'))

// ── Employee Management ───────────────────────────────────
const EmployeeList        = lazy(() => import('./EmployeeList'))
const EmployeeNew         = lazy(() => import('./EmployeeNew'))
const EmployeeProfile     = lazy(() => import('./EmployeeProfile'))
const ExitManagement      = lazy(() => import('./ExitManagement'))

// ── Time & Attendance ─────────────────────────────────────
const ShiftMaster         = lazy(() => import('./ShiftMaster'))
const AttendanceRegister  = lazy(() => import('./AttendanceRegister'))
const AttendanceReport    = lazy(() => import('./AttendanceReport'))
const OvertimeRegister    = lazy(() => import('./OvertimeRegister'))
const ManpowerPlanning    = lazy(() => import('./ManpowerPlanning'))

// ── Leave Management ──────────────────────────────────────
const LeavePolicy         = lazy(() => import('./LeavePolicy'))
const LeaveRegister       = lazy(() => import('./LeaveRegister'))
const LeaveApproval       = lazy(() => import('./LeaveApproval'))

// ── HR Policy & Payroll (moved from MDM) ─────────────────
const HRPolicyMaster      = lazy(() => import('./HRPolicyMaster'))
const PayComponents       = lazy(() => import('./PayComponents'))
const StatutoryConfig     = lazy(() => import('./StatutoryConfig'))
const IncrementPolicy     = lazy(() => import('./IncrementPolicy'))
const IncrementProposals  = lazy(() => import('./IncrementProposals'))
const PerformanceRating   = lazy(() => import('./PerformanceRating'))
const MDApprovalDashboard = lazy(() => import('./MDApprovalDashboard'))

// ── Payroll ───────────────────────────────────────────────
const SalaryMaster        = lazy(() => import('./SalaryMaster'))
const PayrollProcess      = lazy(() => import('./PayrollProcess'))
const Payslip             = lazy(() => import('./Payslip'))
const PayBillControl      = lazy(() => import('./PayBillControl'))

// ── Statutory ─────────────────────────────────────────────
const PFESIRegister       = lazy(() => import('./PFESIRegister'))
const StatutoryCompliance = lazy(() => import('./StatutoryCompliance'))
const ComplianceCalendar  = lazy(() => import('./ComplianceCalendar'))

// ── Facilities ────────────────────────────────────────────
const CanteenRegister     = lazy(() => import('./CanteenRegister'))
const HousekeepingLog     = lazy(() => import('./HousekeepingLog'))
const SecurityLog         = lazy(() => import('./SecurityLog'))

// ── Portal & Reports ──────────────────────────────────────
const EmployeePortal      = lazy(() => import('./EmployeePortal'))
const HRPolicy            = lazy(() => import('./HRPolicy'))
const HCMReport           = lazy(() => import('./HCMReport'))

// ── SIDEBAR ───────────────────────────────────────────────
const SIDEBAR_GROUPS = [
  { label:'Recruitment', icon:'🎯', items:[
    { to:'/hcm',              label:'HCM Dashboard'         },
    { to:'/hcm/mrf',          label:'Manpower Requisition'  },
    { to:'/hcm/jobs',         label:'Job Openings'          },
    { to:'/hcm/candidates',   label:'Candidate Tracker'     },
  ]},
  { label:'Employee Management', icon:'👤', items:[
    { to:'/hcm/employees',    label:'Employee Register'     },
    { to:'/hcm/employees/new',label:'New Employee (Onboard)'},
    { to:'/hcm/profile',      label:'Employee Profile'      },
    { to:'/hcm/exit',         label:'Exit Management'       },
  ]},
  { label:'Time & Attendance', icon:'⏱', items:[
    { to:'/hcm/shifts',       label:'Shift Master'          },
    { to:'/hcm/attendance',   label:'Attendance Register'   },
    { to:'/hcm/attendance-report', label:'Attendance Report'},
    { to:'/hcm/overtime',     label:'Overtime Register'     },
    { to:'/hcm/manpower',     label:'Manpower Planning'     },
  ]},
  { label:'Leave Management', icon:'🌴', items:[
    { to:'/hcm/leave/policy', label:'Leave & Week-Off Policy'},
    { to:'/hcm/leave/register',label:'Leave Register'       },
    { to:'/hcm/leave/approval',label:'Leave Approval'       },
  ]},
  { label:'HR Policy', icon:'📋', items:[
    { to:'/hcm/hr-policy',    label:'HR Policy Engine'      },
    { to:'/hcm/performance-rating', label:'Performance Rating'},
  ]},
  { label:'Increment Management', icon:'📈', items:[
    { to:'/hcm/increment',          label:'Increment Policy'    },
    { to:'/hcm/increment-proposals',label:'Increment Proposals' },
    { to:'/hcm/md-approval',        label:'MD Approval Dashboard'},
  ]},
  { label:'Payroll', icon:'💰', items:[
    { to:'/hcm/pay/components',  label:'Pay Components & CTC'  },
    { to:'/hcm/pay/statutory',   label:'Statutory Config'       },
    { to:'/hcm/pay/master',      label:'Salary Master'          },
    { to:'/hcm/pay/process',     label:'Payroll Processing'     },
    { to:'/hcm/pay/payslip',     label:'Payslip'                },
    { to:'/hcm/pay/billcontrol', label:'Pay Bill Control'       },
  ]},
  { label:'Statutory', icon:'🏛️', items:[
    { to:'/hcm/statutory/pfesi',    label:'PF & ESI Register'   },
    { to:'/hcm/statutory/others',   label:'PT / TDS / LWF'      },
    { to:'/hcm/statutory/calendar', label:'Compliance Calendar' },
  ]},
  { label:'Facilities', icon:'🏭', items:[
    { to:'/hcm/canteen',      label:'Canteen Register'      },
    { to:'/hcm/housekeeping', label:'Housekeeping Log'      },
    { to:'/hcm/security',     label:'Security & Gate Log'   },
  ]},
  { label:'Portal & Reports', icon:'📊', items:[
    { to:'/hcm/portal',       label:'Employee Self-Service' },
    { to:'/hcm/policy',       label:'HR Policies'           },
    { to:'/hcm/report',       label:'HR Analytics Report'   },
  ]},
]

export default function HCMLayout() {
  return (
    <ModuleLayout moduleName="HCM" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading HCM page…"/>}>
        <Routes>
          {/* Dashboard */}
          <Route index                          element={<HCMDashboard />}         />

          {/* Recruitment */}
          <Route path="mrf"                     element={<ManpowerRequisition />}  />
          <Route path="jobs"                    element={<JobOpenings />}          />
          <Route path="candidates"              element={<CandidateTracker />}     />

          {/* Employee Management */}
          <Route path="employees"               element={<EmployeeList />}         />
          <Route path="employees/new"           element={<EmployeeNew />}          />
          <Route path="employees/edit/:empCode" element={<EmployeeNew />}          />
          <Route path="profile"                 element={<EmployeeProfile />}      />
          <Route path="profile/:empCode"        element={<EmployeeProfile />}      />
          <Route path="exit"                    element={<ExitManagement />}       />

          {/* Time & Attendance */}
          <Route path="shifts"                  element={<ShiftMaster />}          />
          <Route path="attendance"              element={<AttendanceRegister />}   />
          <Route path="attendance-report"       element={<AttendanceReport />}     />
          <Route path="overtime"                element={<OvertimeRegister />}     />
          <Route path="manpower"                element={<ManpowerPlanning />}     />

          {/* Leave Management */}
          <Route path="leave/policy"            element={<LeavePolicy />}          />
          <Route path="leave/register"          element={<LeaveRegister />}        />
          <Route path="leave/approval"          element={<LeaveApproval />}        />

          {/* HR Policy (moved from MDM) */}
          <Route path="hr-policy"               element={<HRPolicyMaster />}       />
          <Route path="performance-rating"      element={<PerformanceRating />}    />

          {/* Increment Management (moved from MDM) */}
          <Route path="increment"               element={<IncrementPolicy />}      />
          <Route path="increment-proposals"     element={<IncrementProposals />}   />
          <Route path="md-approval"             element={<MDApprovalDashboard />}  />

          {/* Payroll (moved from MDM) */}
          <Route path="pay/components"          element={<PayComponents />}        />
          <Route path="pay/statutory"           element={<StatutoryConfig />}      />
          <Route path="pay/master"              element={<SalaryMaster />}         />
          <Route path="pay/process"             element={<PayrollProcess />}       />
          <Route path="pay/payslip"             element={<Payslip />}              />
          <Route path="pay/billcontrol"         element={<PayBillControl />}       />

          {/* Statutory */}
          <Route path="statutory/pfesi"         element={<PFESIRegister />}        />
          <Route path="statutory/others"        element={<StatutoryCompliance />}  />
          <Route path="statutory/calendar"      element={<ComplianceCalendar />}   />

          {/* Facilities */}
          <Route path="canteen"                 element={<CanteenRegister />}      />
          <Route path="housekeeping"            element={<HousekeepingLog />}      />
          <Route path="security"                element={<SecurityLog />}          />

          {/* Portal & Reports */}
          <Route path="portal"                  element={<EmployeePortal />}       />
          <Route path="policy"                  element={<HRPolicy />}             />
          <Route path="report"                  element={<HCMReport />}            />

          <Route path="*"                       element={<Navigate to="/hcm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
