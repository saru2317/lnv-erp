import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function SubjectMaster() {
  const nav = useNavigate()
  const labels = {
    StudentNew:'New Admission',StudentDetail:'Student Detail',
    AdmissionEnquiry:'Admission Enquiry',StaffMaster:'Staff Master',
    StaffNew:'Add Staff',StaffAttendance:'Staff Attendance',
    StaffLeave:'Leave Register',ClassMaster:'Class & Section',
    SubjectMaster:'Subject Master',AcademicYear:'Academic Year',
    Timetable:'Timetable',ExamMaster:'Exam Master',
    MarkEntry:'Mark Entry',ResultView:'Results',
    ReportCard:'Report Cards',HallTicket:'Hall Tickets',
    FeeType:'Fee Types',FeeStructure:'Fee Structure',
    FeeReport:'Fee Reports',BusRoute:'Bus Routes',
    BusTracking:'Live Bus Tracking',HostelMaster:'Hostel Master',
    LibraryMaster:'Book Master',LibraryIssue:'Issue / Return',
    NoticeBoard:'Notice Board',SMSLog:'SMS / WhatsApp Log',
    EduReports:'Reports',EduSettings:'Settings',
  }
  const icons = {
    StudentNew:'➕',StudentDetail:'👨‍🎓',AdmissionEnquiry:'📋',
    StaffMaster:'👩‍🏫',StaffNew:'➕',StaffAttendance:'👤',
    StaffLeave:'🗓️',ClassMaster:'🏫',SubjectMaster:'📚',
    AcademicYear:'📅',Timetable:'⏰',ExamMaster:'📝',
    MarkEntry:'📊',ResultView:'🏆',ReportCard:'📄',
    HallTicket:'🎫',FeeType:'💰',FeeStructure:'📋',
    FeeReport:'📊',BusRoute:'🚌',BusTracking:'📍',
    HostelMaster:'🏠',LibraryMaster:'📚',LibraryIssue:'📖',
    NoticeBoard:'📢',SMSLog:'💬',EduReports:'📊',EduSettings:'⚙️',
  }
  const name = 'SubjectMaster'
  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>
          {icons[name]} {labels[name]}
        </div>
      </div>
      <div style={{textAlign:'center',padding:60,background:'#fff',
        borderRadius:10,border:'1px solid #E8E0E8'}}>
        <div style={{fontSize:60,marginBottom:16}}>{icons[name]}</div>
        <div style={{fontSize:18,fontWeight:700,color:'#6E2C00',marginBottom:8}}>
          {labels[name]}
        </div>
        <div style={{fontSize:13,color:'#888',marginBottom:20}}>
          This page is under construction — coming in next session!
        </div>
        <button onClick={()=>nav('/edu')}
          style={{padding:'9px 22px',background:'#6E2C00',color:'#fff',border:'none',
            borderRadius:6,cursor:'pointer',fontWeight:700}}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
