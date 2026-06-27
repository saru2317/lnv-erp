import React, { Suspense, lazy, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ModuleLayout from '../../../components/layout/ModuleLayout'

// ── Lazy imports ──
const EduDashboard      = lazy(() => import('./EduDashboard'))
const StudentMaster     = lazy(() => import('./StudentMaster'))
const StudentNew        = lazy(() => import('./StudentNew'))
const StudentDetail     = lazy(() => import('./StudentDetail'))
const AdmissionEnquiry  = lazy(() => import('./AdmissionEnquiry'))
const StaffMaster       = lazy(() => import('./StaffMaster'))
const StaffNew          = lazy(() => import('./StaffNew'))
const ClassMaster       = lazy(() => import('./ClassMaster'))
const SubjectMaster     = lazy(() => import('./SubjectMaster'))
const AcademicYear      = lazy(() => import('./AcademicYear'))
const Timetable         = lazy(() => import('./Timetable'))
const StudentAttendance = lazy(() => import('./StudentAttendance'))
const StaffAttendance   = lazy(() => import('./StaffAttendance'))
const StaffLeave        = lazy(() => import('./StaffLeave'))
const ExamMaster        = lazy(() => import('./ExamMaster'))
const MarkEntry         = lazy(() => import('./MarkEntry'))
const ResultView        = lazy(() => import('./ResultView'))
const ReportCard        = lazy(() => import('./ReportCard'))
const HallTicket        = lazy(() => import('./HallTicket'))
const FeeType           = lazy(() => import('./FeeType'))
const FeeStructure      = lazy(() => import('./FeeStructure'))
const FeeCollection     = lazy(() => import('./FeeCollection'))
const FeeReport         = lazy(() => import('./FeeReport'))
const BusRoute          = lazy(() => import('./BusRoute'))
const BusTracking       = lazy(() => import('./BusTracking'))
const HostelMaster      = lazy(() => import('./HostelMaster'))
const LibraryMaster     = lazy(() => import('./LibraryMaster'))
const LibraryIssue      = lazy(() => import('./LibraryIssue'))
const NoticeBoard       = lazy(() => import('./NoticeBoard'))
const SMSLog            = lazy(() => import('./SMSLog'))
const EduReports        = lazy(() => import('./EduReports'))
const EduSettings       = lazy(() => import('./EduSettings'))

const BASE = import.meta.env.VITE_API_URL || '/api'
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')||''}` })

// ── SCHOOL SIDEBAR ──
const SCHOOL_SIDEBAR = [
  { label:'Overview', items:[
    { to:'/edu',                    label:'🏫 School Dashboard' },
  ]},
  { label:'Admissions', items:[
    { to:'/edu/enquiry',            label:'📋 Enquiry Register' },
    { to:'/edu/students',           label:'👨‍🎓 Student Master' },
    { to:'/edu/students/new',       label:'➕ New Admission' },
  ]},
  { label:'Staff', items:[
    { to:'/edu/staff',              label:'👩‍🏫 Staff Master' },
    { to:'/edu/staff/new',          label:'➕ Add Staff' },
    { to:'/edu/staff/leave',        label:'🗓️ Leave Register' },
  ]},
  { label:'Academic', items:[
    { to:'/edu/academic-year',      label:'📅 Academic Year' },
    { to:'/edu/classes',            label:'🏫 Class & Section' },
    { to:'/edu/subjects',           label:'📚 Subject Master' },
    { to:'/edu/timetable',          label:'⏰ Timetable' },
  ]},
  { label:'Attendance', items:[
    { to:'/edu/attendance/student', label:'✅ Student Attendance' },
    { to:'/edu/attendance/staff',   label:'👤 Staff Attendance' },
  ]},
  { label:'Examination', items:[
    { to:'/edu/exams',              label:'📝 Exam Master' },
    { to:'/edu/marks',              label:'📊 Mark Entry' },
    { to:'/edu/results',            label:'🏆 Results' },
    { to:'/edu/report-card',        label:'📄 Report Cards' },
    { to:'/edu/hall-ticket',        label:'🎫 Hall Tickets' },
  ]},
  { label:'Fee Management', items:[
    { to:'/edu/fee-types',          label:'💰 Fee Types' },
    { to:'/edu/fee-structure',      label:'📋 Fee Structure' },
    { to:'/edu/fee-collection',     label:'💵 Fee Collection' },
    { to:'/edu/fee-reports',        label:'📊 Fee Reports' },
  ]},
  { label:'Transport', items:[
    { to:'/edu/bus-routes',         label:'🚌 Bus Routes' },
    { to:'/edu/bus-tracking',       label:'📍 Live Tracking' },
  ]},
  { label:'Hostel', items:[
    { to:'/edu/hostel',             label:'🏠 Hostel Master' },
  ]},
  { label:'Library', items:[
    { to:'/edu/library',            label:'📚 Book Master' },
    { to:'/edu/library/issue',      label:'📖 Issue / Return' },
  ]},
  { label:'Communication', items:[
    { to:'/edu/notices',            label:'📢 Notice Board' },
    { to:'/edu/sms-log',            label:'💬 SMS / WhatsApp' },
  ]},
  { label:'Reports', items:[
    { to:'/edu/reports',            label:'📊 All Reports' },
  ]},
  { label:'Settings', items:[
    { to:'/edu/settings',           label:'⚙️ Configuration' },
  ]},
]

// ── COLLEGE SIDEBAR ──
const COLLEGE_SIDEBAR = [
  { label:'Overview', items:[
    { to:'/edu',                    label:'🎓 College Dashboard' },
  ]},
  { label:'Admissions', items:[
    { to:'/edu/enquiry',            label:'📋 Enquiry Register' },
    { to:'/edu/students',           label:'👨‍🎓 Student Master' },
    { to:'/edu/students/new',       label:'➕ New Admission' },
  ]},
  { label:'Faculty', items:[
    { to:'/edu/staff',              label:'👩‍🏫 Faculty Master' },
    { to:'/edu/staff/new',          label:'➕ Add Faculty' },
    { to:'/edu/staff/leave',        label:'🗓️ Leave Register' },
  ]},
  { label:'Academic', items:[
    { to:'/edu/academic-year',      label:'📅 Academic Year' },
    { to:'/edu/classes',            label:'🏫 Department & Course' },
    { to:'/edu/subjects',           label:'📚 Subject Master' },
    { to:'/edu/timetable',          label:'⏰ Timetable' },
  ]},
  { label:'Attendance', items:[
    { to:'/edu/attendance/student', label:'✅ Student Attendance' },
    { to:'/edu/attendance/staff',   label:'👤 Staff Attendance' },
  ]},
  { label:'Examination', items:[
    { to:'/edu/exams',              label:'📝 Semester Exam Master' },
    { to:'/edu/marks',              label:'📊 CIA / Mark Entry' },
    { to:'/edu/results',            label:'🏆 Results' },
    { to:'/edu/report-card',        label:'📄 Grade Sheet' },
    { to:'/edu/hall-ticket',        label:'🎫 Hall Tickets' },
  ]},
  { label:'Fee Management', items:[
    { to:'/edu/fee-types',          label:'💰 Fee Types' },
    { to:'/edu/fee-structure',      label:'📋 Fee Structure' },
    { to:'/edu/fee-collection',     label:'💵 Fee Collection' },
    { to:'/edu/fee-reports',        label:'📊 Fee Reports' },
  ]},
  { label:'Transport', items:[
    { to:'/edu/bus-routes',         label:'🚌 Bus Routes' },
    { to:'/edu/bus-tracking',       label:'📍 Live Tracking' },
  ]},
  { label:'Hostel', items:[
    { to:'/edu/hostel',             label:'🏠 Hostel Master' },
  ]},
  { label:'Library', items:[
    { to:'/edu/library',            label:'📚 Book Master' },
    { to:'/edu/library/issue',      label:'📖 Issue / Return' },
  ]},
  { label:'Placements', items:[
    { to:'/edu/placements',         label:'💼 Company Register' },
    { to:'/edu/placements/drives',  label:'🏢 Placement Drives' },
    { to:'/edu/placements/placed',  label:'✅ Students Placed' },
  ]},
  { label:'NAAC / Accreditation', items:[
    { to:'/edu/naac',               label:'📋 NAAC Criteria' },
    { to:'/edu/naac/reports',       label:'📊 Accreditation Reports' },
  ]},
  { label:'Communication', items:[
    { to:'/edu/notices',            label:'📢 Notice Board' },
    { to:'/edu/sms-log',            label:'💬 SMS / WhatsApp' },
  ]},
  { label:'Reports', items:[
    { to:'/edu/reports',            label:'📊 All Reports' },
  ]},
  { label:'Settings', items:[
    { to:'/edu/settings',           label:'⚙️ Configuration' },
  ]},
]

// ── COACHING SIDEBAR ──
const COACHING_SIDEBAR = [
  { label:'Overview', items:[
    { to:'/edu',                    label:'📚 Coaching Dashboard' },
  ]},
  { label:'Students', items:[
    { to:'/edu/enquiry',            label:'📋 Enquiry Register' },
    { to:'/edu/students',           label:'👨‍🎓 Student Master' },
    { to:'/edu/students/new',       label:'➕ New Enrollment' },
  ]},
  { label:'Faculty', items:[
    { to:'/edu/staff',              label:'👩‍🏫 Faculty' },
    { to:'/edu/staff/new',          label:'➕ Add Faculty' },
  ]},
  { label:'Batches', items:[
    { to:'/edu/classes',            label:'📋 Batch Master' },
    { to:'/edu/subjects',           label:'📚 Subject / Topic' },
    { to:'/edu/timetable',          label:'⏰ Batch Schedule' },
  ]},
  { label:'Attendance', items:[
    { to:'/edu/attendance/student', label:'✅ Student Attendance' },
  ]},
  { label:'Tests', items:[
    { to:'/edu/exams',              label:'📝 Test Master' },
    { to:'/edu/marks',              label:'📊 Mark Entry' },
    { to:'/edu/results',            label:'🏆 Results' },
  ]},
  { label:'Fee Management', items:[
    { to:'/edu/fee-types',          label:'💰 Fee Types' },
    { to:'/edu/fee-collection',     label:'💵 Fee Collection' },
    { to:'/edu/fee-reports',        label:'📊 Fee Reports' },
  ]},
  { label:'Communication', items:[
    { to:'/edu/notices',            label:'📢 Notice Board' },
    { to:'/edu/sms-log',            label:'💬 SMS / WhatsApp' },
  ]},
  { label:'Reports', items:[
    { to:'/edu/reports',            label:'📊 Reports' },
  ]},
  { label:'Settings', items:[
    { to:'/edu/settings',           label:'⚙️ Configuration' },
  ]},
]

const Spinner = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300}}>
    <div style={{fontSize:13,color:'#888'}}>⏳ Loading...</div>
  </div>
)

// ── Placeholder for college-only pages ──
const PlaceholderPage = ({ title, icon }) => (
  <div style={{fontFamily:'DM Sans,sans-serif'}}>
    <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:20}}>
      <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>{icon} {title}</div>
    </div>
    <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:10,border:'1px solid #E8E0E8'}}>
      <div style={{fontSize:60,marginBottom:16}}>{icon}</div>
      <div style={{fontSize:16,fontWeight:700,color:'#6E2C00',marginBottom:8}}>{title}</div>
      <div style={{fontSize:13,color:'#888'}}>Coming in next session!</div>
    </div>
  </div>
)

export default function EduLayout() {
  const [instType, setInstType] = useState('SCHOOL')

  useEffect(() => {
    const instId = localStorage.getItem('lnv_edu_inst')
    if (!instId) return
    fetch(`${BASE}/edu/institutions/${instId}`, { headers:hdr2() })
      .then(r=>r.json())
      .then(d => {
        if (d.data?.type) setInstType(d.data.type)
      }).catch(()=>{})

    // Listen for institution change
    const onStorage = () => {
      const newInstId = localStorage.getItem('lnv_edu_inst')
      if (newInstId) {
        fetch(`${BASE}/edu/institutions/${newInstId}`, { headers:hdr2() })
          .then(r=>r.json()).then(d=>{ if(d.data?.type) setInstType(d.data.type) }).catch(()=>{})
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Pick sidebar based on institution type
  const sidebarGroups =
    instType === 'COLLEGE'  ? COLLEGE_SIDEBAR  :
    instType === 'COACHING' ? COACHING_SIDEBAR :
    SCHOOL_SIDEBAR

  return (
    <ModuleLayout sidebarGroups={sidebarGroups}>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route index             element={<EduDashboard />} />
          {/* Admissions */}
          <Route path="enquiry"    element={<AdmissionEnquiry />} />
          <Route path="students"   element={<StudentMaster />} />
          <Route path="students/new" element={<StudentNew />} />
          <Route path="students/:id" element={<StudentDetail />} />
          {/* Staff / Faculty */}
          <Route path="staff"      element={<StaffMaster />} />
          <Route path="staff/new"  element={<StaffNew />} />
          <Route path="staff/leave" element={<StaffLeave />} />
          {/* Academic */}
          <Route path="academic-year" element={<AcademicYear />} />
          <Route path="classes"    element={<ClassMaster />} />
          <Route path="subjects"   element={<SubjectMaster />} />
          <Route path="timetable"  element={<Timetable />} />
          {/* Attendance */}
          <Route path="attendance/student" element={<StudentAttendance />} />
          <Route path="attendance/staff"   element={<StaffAttendance />} />
          {/* Examination */}
          <Route path="exams"      element={<ExamMaster />} />
          <Route path="marks"      element={<MarkEntry />} />
          <Route path="results"    element={<ResultView />} />
          <Route path="report-card" element={<ReportCard />} />
          <Route path="hall-ticket" element={<HallTicket />} />
          {/* Fees */}
          <Route path="fee-types"      element={<FeeType />} />
          <Route path="fee-structure"  element={<FeeStructure />} />
          <Route path="fee-collection" element={<FeeCollection />} />
          <Route path="fee-reports"    element={<FeeReport />} />
          {/* Transport */}
          <Route path="bus-routes"     element={<BusRoute />} />
          <Route path="bus-tracking"   element={<BusTracking />} />
          {/* Hostel */}
          <Route path="hostel"         element={<HostelMaster />} />
          {/* Library */}
          <Route path="library"        element={<LibraryMaster />} />
          <Route path="library/issue"  element={<LibraryIssue />} />
          {/* Communication */}
          <Route path="notices"        element={<NoticeBoard />} />
          <Route path="sms-log"        element={<SMSLog />} />
          {/* College Only */}
          <Route path="placements"         element={<PlaceholderPage title="Company Register"   icon="💼" />} />
          <Route path="placements/drives"  element={<PlaceholderPage title="Placement Drives"  icon="🏢" />} />
          <Route path="placements/placed"  element={<PlaceholderPage title="Students Placed"   icon="✅" />} />
          <Route path="naac"               element={<PlaceholderPage title="NAAC Criteria"     icon="📋" />} />
          <Route path="naac/reports"       element={<PlaceholderPage title="Accreditation Reports" icon="📊" />} />
          {/* Reports & Settings */}
          <Route path="reports"        element={<EduReports />} />
          <Route path="settings"       element={<EduSettings />} />
          <Route path="*"              element={<Navigate to="/edu" replace />} />
        </Routes>
      </Suspense>
    </ModuleLayout>
  )
}
