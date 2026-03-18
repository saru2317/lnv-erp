import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'

const HCMDashboard       = lazy(() => import('./HCMDashboard'))
const JobOpenings        = lazy(() => import('./JobOpenings'))
const CandidateTracker   = lazy(() => import('./CandidateTracker'))
const EmployeeList       = lazy(() => import('./EmployeeList'))
const EmployeeNew        = lazy(() => import('./EmployeeNew'))
const EmployeeProfile    = lazy(() => import('./EmployeeProfile'))
const ExitManagement     = lazy(() => import('./ExitManagement'))
const ShiftMaster        = lazy(() => import('./ShiftMaster'))
const AttendanceRegister = lazy(() => import('./AttendanceRegister'))
const OvertimeRegister   = lazy(() => import('./OvertimeRegister'))
const ManpowerPlanning   = lazy(() => import('./ManpowerPlanning'))
const LeavePolicy        = lazy(() => import('./LeavePolicy'))
const LeaveRegister      = lazy(() => import('./LeaveRegister'))
const LeaveApproval      = lazy(() => import('./LeaveApproval'))
const PayComponents      = lazy(() => import('./PayComponents'))
const SalaryMaster       = lazy(() => import('./SalaryMaster'))
const PayrollProcess     = lazy(() => import('./PayrollProcess'))
const Payslip            = lazy(() => import('./Payslip'))
const PayBillControl     = lazy(() => import('./PayBillControl'))
const PFESIRegister      = lazy(() => import('./PFESIRegister'))
const StatutoryCompliance= lazy(() => import('./StatutoryCompliance'))
const ComplianceCalendar = lazy(() => import('./ComplianceCalendar'))
const CanteenRegister    = lazy(() => import('./CanteenRegister'))
const HousekeepingLog    = lazy(() => import('./HousekeepingLog'))
const SecurityLog        = lazy(() => import('./SecurityLog'))
const EmployeePortal     = lazy(() => import('./EmployeePortal'))
const HRPolicy           = lazy(() => import('./HRPolicy'))
const HCMReport          = lazy(() => import('./HCMReport'))

const SIDEBAR_GROUPS = [
  { label:'Recruitment', icon:'🤝', items:[
    {to:'/hcm',                label:'HCM Dashboard'},
    {to:'/hcm/jobs',           label:'Job Openings'},
    {to:'/hcm/candidates',     label:'Candidate Tracker'},
  ]},
  { label:'Employee Management', icon:'👤', items:[
    {to:'/hcm/employees',      label:'Employee Register'},
    {to:'/hcm/employees/new',  label:'New Employee (Onboard)'},
    {to:'/hcm/profile',        label:'Employee Profile'},
    {to:'/hcm/exit',           label:'Exit Management'},
  ]},
  { label:'Time & Attendance', icon:'⏱️', items:[
    {to:'/hcm/shifts',         label:'Shift Master'},
    {to:'/hcm/attendance',     label:'Attendance Register'},
    {to:'/hcm/overtime',       label:'Overtime Register'},
    {to:'/hcm/manpower',       label:'Manpower Planning'},
  ]},
  { label:'Leave Management', icon:'📅', items:[
    {to:'/hcm/leave/policy',   label:'Leave & Week-Off Policy'},
    {to:'/hcm/leave/register', label:'Leave Register'},
    {to:'/hcm/leave/approval', label:'Leave Approval'},
  ]},
  { label:'Payroll', icon:'💰', items:[
    {to:'/hcm/pay/components',  label:'Pay Components & CTC'},
    {to:'/hcm/pay/master',      label:'Salary Master'},
    {to:'/hcm/pay/process',     label:'Payroll Processing'},
    {to:'/hcm/pay/payslip',     label:'Payslip'},
    {to:'/hcm/pay/billcontrol', label:'Pay Bill Control'},
  ]},
  { label:'Statutory', icon:'🏛️', items:[
    {to:'/hcm/statutory/pfesi',    label:'PF & ESI Register'},
    {to:'/hcm/statutory/others',   label:'PT / TDS / LWF'},
    {to:'/hcm/statutory/calendar', label:'Compliance Calendar'},
  ]},
  { label:'Facilities', icon:'🏢', items:[
    {to:'/hcm/canteen',        label:'Canteen Register'},
    {to:'/hcm/housekeeping',   label:'Housekeeping Log'},
    {to:'/hcm/security',       label:'Security & Gate Log'},
  ]},
  { label:'Portal & Reports', icon:'📊', items:[
    {to:'/hcm/portal',         label:'Employee Self-Service'},
    {to:'/hcm/policy',         label:'HR Policies'},
    {to:'/hcm/report',         label:'HR Analytics Report'},
  ]},
]

export default function HCMLayout() {
  return (
    <ModuleLayout moduleName="HCM" sidebarGroups={SIDEBAR_GROUPS}>
      <Suspense fallback={<PageLoader text="Loading HCM page…"/>}>
        <Routes>
          <Route index                        element={<HCMDashboard />} />
          <Route path="jobs"                  element={<JobOpenings />} />
          <Route path="candidates"            element={<CandidateTracker />} />
          <Route path="employees"             element={<EmployeeList />} />
          <Route path="employees/new"         element={<EmployeeNew />} />
          <Route path="profile"               element={<EmployeeProfile />} />
          <Route path="exit"                  element={<ExitManagement />} />
          <Route path="shifts"                element={<ShiftMaster />} />
          <Route path="attendance"            element={<AttendanceRegister />} />
          <Route path="overtime"              element={<OvertimeRegister />} />
          <Route path="manpower"              element={<ManpowerPlanning />} />
          <Route path="leave/policy"          element={<LeavePolicy />} />
          <Route path="leave/register"        element={<LeaveRegister />} />
          <Route path="leave/approval"        element={<LeaveApproval />} />
          <Route path="pay/components"        element={<PayComponents />} />
          <Route path="pay/master"            element={<SalaryMaster />} />
          <Route path="pay/process"           element={<PayrollProcess />} />
          <Route path="pay/payslip"           element={<Payslip />} />
          <Route path="pay/billcontrol"       element={<PayBillControl />} />
          <Route path="statutory/pfesi"       element={<PFESIRegister />} />
          <Route path="statutory/others"      element={<StatutoryCompliance />} />
          <Route path="statutory/calendar"    element={<ComplianceCalendar />} />
          <Route path="canteen"               element={<CanteenRegister />} />
          <Route path="housekeeping"          element={<HousekeepingLog />} />
          <Route path="security"              element={<SecurityLog />} />
          <Route path="portal"               element={<EmployeePortal />} />
          <Route path="policy"               element={<HRPolicy />} />
          <Route path="report"               element={<HCMReport />} />
          <Route path="*"                    element={<Navigate to="/hcm" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
