import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'7px 9px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const sel  = { ...inp }
const th   = { padding:'8px 10px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'7px 10px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const btnPrimary   = { padding:'7px 16px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:12 }
const btnSecondary = { padding:'6px 12px', background:'#fff', color:'#6E2C00', border:'1.5px solid #6E2C00', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:11 }

export default function HallTicket() {
  const [instId,   setInstId]   = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [classes,  setClasses]  = useState([])
  const [exams,    setExams]    = useState([])
  const [selClass, setSelClass] = useState('')
  const [sections, setSections] = useState([])
  const [selSec,   setSelSec]   = useState('')
  const [selExam,  setSelExam]  = useState('')
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(false)
  const [generating, setGenerating] = useState(false)

  const company = JSON.parse(localStorage.getItem('lnv_company') || '{}')

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    fetch(`${BASE}/edu/classes?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setClasses(d.data||[]))
    fetch(`${BASE}/edu/exams?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setExams(d.data||[]))
    setSelClass(''); setSelSec(''); setSelExam(''); setRows([])
  }, [instId])

  useEffect(() => {
    if (!selClass) { setSections([]); setSelSec(''); return }
    const cls = classes.find(c => String(c.id) === selClass)
    setSections(cls?.sections || [])
    setSelSec('')
  }, [selClass, classes])

  const loadRows = async () => {
    if (!selExam || !selSec) { setRows([]); return }
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/edu/hall-tickets?examId=${selExam}&sectionId=${selSec}`, { headers:hdr2() })
      const d = await r.json()
      setRows(d.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { loadRows() }, [selExam, selSec])

  const generate = async () => {
    if (!selExam || !selSec) return toast.error('Select an exam, class and section first')
    setGenerating(true)
    try {
      const r = await fetch(`${BASE}/edu/hall-tickets/bulk-generate`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ examId:selExam, sectionId:selSec }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message)
      loadRows()
    } catch { toast.error('Generate failed') }
    finally { setGenerating(false) }
  }

  const updateField = async (hallTicketId, field, value) => {
    setRows(rs => rs.map(r => r.hallTicket?.id===hallTicketId ? { ...r, hallTicket:{ ...r.hallTicket, [field]:value } } : r))
    await fetch(`${BASE}/edu/hall-tickets/${hallTicketId}`, { method:'PATCH', headers:hdr(), body:JSON.stringify({ [field]:value }) })
  }

  const generatedRows = rows.filter(r => r.hallTicket)
  const selExamData = exams.find(e => String(e.id) === selExam)
  const selClassData = classes.find(c => String(c.id) === selClass)
  const selSecData = sections.find(s => String(s.id) === selSec)

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <style>{`
        @media print {
          body * { visibility:hidden; }
          #hall-tickets-print, #hall-tickets-print * { visibility:visible; }
          #hall-tickets-print { position:fixed;left:0;top:0;width:100%; }
          .no-print { display:none !important; }
          .hall-ticket-page { page-break-after:always; }
        }
      `}</style>

      <div className="no-print" style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🎫 Hall Tickets</div>
        {generatedRows.length>0 && (
          <button onClick={()=>window.print()} style={btnPrimary}>🖨️ Print All ({generatedRows.length})</button>
        )}
      </div>

      <div className="no-print" style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginBottom:14}}>
        <div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>Exam</div>
            <select value={selExam} onChange={e=>setSelExam(e.target.value)} style={{...sel,width:200}}>
              <option value=''>Select Exam</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.examName}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>Class</div>
            <select value={selClass} onChange={e=>setSelClass(e.target.value)} style={{...sel,width:170}}>
              <option value=''>Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'#888',marginBottom:4,textTransform:'uppercase'}}>Section</div>
            <select value={selSec} onChange={e=>setSelSec(e.target.value)} style={{...sel,width:130}} disabled={!selClass}>
              <option value=''>Select Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>Section {s.sectionName}</option>)}
            </select>
          </div>
          <button onClick={generate} disabled={generating||!selExam||!selSec} style={btnPrimary}>
            {generating ? '⏳ Generating...' : '🎫 Generate Hall Tickets'}
          </button>
        </div>
      </div>

      {!selExam || !selSec ? (
        <div className="no-print" style={{textAlign:'center',padding:50,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8',color:'#aaa'}}>
          Select an exam, class and section to view or generate hall tickets
        </div>
      ) : loading ? (
        <div className="no-print" style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>
      ) : (
        <div className="no-print" style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>Roll No</th><th style={th}>Name</th><th style={th}>Admission No</th>
              <th style={th}>Hall Ticket No</th><th style={th}>Centre</th><th style={th}>Room</th><th style={th}>Seat</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.studentId}>
                  <td style={td}>{r.rollNo||'—'}</td>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.admissionNo}</td>
                  <td style={td}>
                    {r.hallTicket ? r.hallTicket.hallTicketNo : <span style={{color:'#C0392B'}}>Not generated</span>}
                  </td>
                  <td style={td}>
                    {r.hallTicket && <input value={r.hallTicket.centreNo||''} onChange={e=>updateField(r.hallTicket.id,'centreNo',e.target.value)} style={{...inp,width:80}} />}
                  </td>
                  <td style={td}>
                    {r.hallTicket && <input value={r.hallTicket.roomNo||''} onChange={e=>updateField(r.hallTicket.id,'roomNo',e.target.value)} style={{...inp,width:70}} />}
                  </td>
                  <td style={td}>
                    {r.hallTicket && <input value={r.hallTicket.seatNo||''} onChange={e=>updateField(r.hallTicket.id,'seatNo',e.target.value)} style={{...inp,width:70}} />}
                  </td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={7} style={{...td,textAlign:'center',color:'#aaa'}}>No students in this section</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable hall tickets — one per page, hidden until print */}
      <div id="hall-tickets-print" style={{display:'none'}}>
        <div style={{display:'block'}}>
          {generatedRows.map(r => (
            <div key={r.studentId} className="hall-ticket-page" style={{padding:30,fontFamily:'Arial,sans-serif'}}>
              <div style={{border:'2px solid #333',padding:20,maxWidth:650,margin:'0 auto'}}>
                <div style={{textAlign:'center',borderBottom:'2px solid #333',paddingBottom:10,marginBottom:14}}>
                  <div style={{fontSize:18,fontWeight:800}}>{company.name || 'LNV Educational Institution'}</div>
                  <div style={{fontSize:11,color:'#555'}}>{company.address || ''}</div>
                  <div style={{fontSize:15,fontWeight:700,marginTop:8,textDecoration:'underline'}}>HALL TICKET</div>
                  <div style={{fontSize:12,marginTop:4}}>{selExamData?.examName}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20}}>
                  <div>
                    <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
                      <tbody>
                        <tr><td style={{padding:'4px 0',fontWeight:700,width:140}}>Hall Ticket No</td><td>: {r.hallTicket?.hallTicketNo}</td></tr>
                        <tr><td style={{padding:'4px 0',fontWeight:700}}>Student Name</td><td>: {r.name}</td></tr>
                        <tr><td style={{padding:'4px 0',fontWeight:700}}>Admission No</td><td>: {r.admissionNo}</td></tr>
                        <tr><td style={{padding:'4px 0',fontWeight:700}}>Roll No</td><td>: {r.rollNo||'—'}</td></tr>
                        <tr><td style={{padding:'4px 0',fontWeight:700}}>Class / Section</td><td>: {r.className} - {r.sectionName}</td></tr>
                        <tr><td style={{padding:'4px 0',fontWeight:700}}>Exam Centre</td><td>: {r.hallTicket?.centreNo||'—'}</td></tr>
                        <tr><td style={{padding:'4px 0',fontWeight:700}}>Room No</td><td>: {r.hallTicket?.roomNo||'—'}</td></tr>
                        <tr><td style={{padding:'4px 0',fontWeight:700}}>Seat No</td><td>: {r.hallTicket?.seatNo||'—'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{border:'1px solid #999',width:100,height:120,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#999'}}>
                    {r.photo ? <img src={r.photo} alt='' style={{width:'100%',height:'100%',objectFit:'cover'}} /> : 'Photo'}
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:40,fontSize:11}}>
                  <div>_______________________<br/>Student Signature</div>
                  <div>_______________________<br/>Principal / HM Signature</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
