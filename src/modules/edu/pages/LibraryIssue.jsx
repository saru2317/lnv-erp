import React, { useState } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'8px 10px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const th   = { padding:'8px 10px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'7px 10px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const btnPrimary   = { padding:'7px 16px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:12 }
const btnSecondary = { padding:'6px 12px', background:'#fff', color:'#6E2C00', border:'1.5px solid #6E2C00', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:11 }

export default function LibraryIssue() {
  const instId = localStorage.getItem('lnv_edu_inst') || ''

  // Student / card side
  const [studentSearch, setStudentSearch] = useState('')
  const [students,  setStudents]  = useState([])
  const [student,   setStudent]   = useState(null)
  const [card,      setCard]      = useState(null)
  const [loadingCard, setLoadingCard] = useState(false)

  // Book side
  const [bookSearch, setBookSearch] = useState('')
  const [books,      setBooks]      = useState([])

  const searchStudents = async (q) => {
    setStudentSearch(q)
    if (q.length < 2) { setStudents([]); return }
    const r = await fetch(`${BASE}/edu/students?institutionId=${instId}&search=${encodeURIComponent(q)}`, { headers:hdr2() })
    const d = await r.json()
    setStudents((d.data||[]).slice(0,8))
  }

  const selectStudent = async (s) => {
    setStudent(s); setStudents([]); setStudentSearch(s.name)
    setLoadingCard(true)
    try {
      let r = await fetch(`${BASE}/edu/library-cards?studentId=${s.id}`, { headers:hdr2() })
      let d = await r.json()
      if (!d.data) {
        // No card yet — issue one automatically, same as StaffNew auto-generating codes
        r = await fetch(`${BASE}/edu/library-cards`, { method:'POST', headers:hdr(), body:JSON.stringify({ studentId:s.id }) })
        d = await r.json()
        toast.success(`New library card issued: ${d.data.cardNo}`)
        d = { data: { ...d.data, issues:[] } }
      }
      setCard(d.data)
    } catch { toast.error('Failed to load library card') }
    finally { setLoadingCard(false) }
  }

  const searchBooks = async (q) => {
    setBookSearch(q)
    if (q.length < 2) { setBooks([]); return }
    const r = await fetch(`${BASE}/edu/books?institutionId=${instId}&search=${encodeURIComponent(q)}`, { headers:hdr2() })
    const d = await r.json()
    setBooks((d.data||[]).slice(0,8))
  }

  const issueBook = async (book) => {
    if (!card) return toast.error('Select a student first')
    try {
      const r = await fetch(`${BASE}/edu/library-issues`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ bookId:book.id, cardId:card.id }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message)
      setBookSearch(''); setBooks([])
      selectStudent(student) // refresh card's current issues
    } catch { toast.error('Issue failed') }
  }

  const returnBook = async (issue) => {
    try {
      const r = await fetch(`${BASE}/edu/library-issues/${issue.id}/return`, { method:'POST', headers:hdr() })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message)
      selectStudent(student)
    } catch { toast.error('Return failed') }
  }

  const isOverdue = (dueDate) => new Date(dueDate) < new Date()
  const daysLate = (dueDate) => Math.max(0, Math.floor((new Date() - new Date(dueDate)) / (1000*60*60*24)))

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📖 Library — Issue / Return</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {/* Student search + card */}
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>1. Find Student</div>
          <div style={{position:'relative'}}>
            <input placeholder='Search by name or admission no...' value={studentSearch}
              onChange={e=>searchStudents(e.target.value)} style={inp} />
            {students.length>0 && (
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',
                border:'1px solid #E8E0E8',borderRadius:5,zIndex:10,maxHeight:220,overflow:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                {students.map(s => (
                  <div key={s.id} onClick={()=>selectStudent(s)}
                    style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid #F0F0F0',fontSize:12}}
                    onMouseEnter={e=>e.currentTarget.style.background='#FAF8FA'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                    <b>{s.name}</b> — {s.admissionNo}
                  </div>
                ))}
              </div>
            )}
          </div>

          {loadingCard && <div style={{marginTop:14,color:'#aaa',fontSize:12}}>⏳ Loading card...</div>}

          {card && !loadingCard && (
            <div style={{marginTop:14,padding:12,background:'#FAF8FA',borderRadius:6}}>
              <div style={{fontSize:13,fontWeight:700,color:'#333'}}>{student?.name}</div>
              <div style={{fontSize:11,color:'#888',marginBottom:6}}>Card: {card.cardNo} · Limit: {card.issueLimit} books</div>
              <div style={{fontSize:11,fontWeight:700,color: (card.issues?.length||0) >= card.issueLimit ? '#C0392B' : '#1E8449'}}>
                {(card.issues?.length||0)} / {card.issueLimit} books currently issued
              </div>
            </div>
          )}
        </div>

        {/* Book search */}
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:8}}>2. Issue a Book</div>
          <input placeholder={card ? 'Search by title, author, or accession no...' : 'Select a student first'}
            value={bookSearch} onChange={e=>searchBooks(e.target.value)} style={inp} disabled={!card} />
          <div style={{marginTop:8,maxHeight:220,overflow:'auto'}}>
            {books.map(b => (
              <div key={b.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'8px 10px',borderBottom:'1px solid #F0F0F0'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700}}>{b.title}</div>
                  <div style={{fontSize:10,color:'#888'}}>{b.accessionNo} · {b.author||'—'} · {b.availableCopies} available</div>
                </div>
                <button onClick={()=>issueBook(b)} disabled={b.availableCopies<1}
                  style={{...btnPrimary,padding:'5px 12px',opacity:b.availableCopies<1?0.4:1,
                    cursor:b.availableCopies<1?'not-allowed':'pointer'}}>Issue</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Currently issued books for this student */}
      {card && (
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,marginTop:14}}>
          <div style={{fontSize:13,fontWeight:800,color:'#6E2C00',marginBottom:10}}>Currently Issued</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={th}>Book</th><th style={th}>Issue Date</th><th style={th}>Due Date</th>
              <th style={th}>Status</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {(card.issues||[]).map(iss => (
                <tr key={iss.id}>
                  <td style={td}>{iss.book?.title}</td>
                  <td style={td}>{new Date(iss.issueDate).toLocaleDateString('en-IN')}</td>
                  <td style={td}>{new Date(iss.dueDate).toLocaleDateString('en-IN')}</td>
                  <td style={td}>
                    {isOverdue(iss.dueDate)
                      ? <span style={{color:'#C0392B',fontWeight:700}}>Overdue — {daysLate(iss.dueDate)} day(s), ₹{daysLate(iss.dueDate)*parseFloat(iss.finePerDay)} fine</span>
                      : <span style={{color:'#1E8449',fontWeight:700}}>On time</span>}
                  </td>
                  <td style={td}><button onClick={()=>returnBook(iss)} style={btnSecondary}>Return</button></td>
                </tr>
              ))}
              {(card.issues||[]).length===0 && <tr><td colSpan={5} style={{...td,textAlign:'center',color:'#aaa'}}>No books currently issued</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
