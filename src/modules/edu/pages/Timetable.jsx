import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const sel  = { padding:'5px 6px', border:'1.5px solid #DDD', borderRadius:4, fontSize:11, outline:'none', width:'100%', boxSizing:'border-box' }
const timeInp = { padding:'4px 5px', border:'1.5px solid #DDD', borderRadius:4, fontSize:11, outline:'none', width:70 }

const DAYS = [
  { n:1, label:'Mon' }, { n:2, label:'Tue' }, { n:3, label:'Wed' },
  { n:4, label:'Thu' }, { n:5, label:'Fri' }, { n:6, label:'Sat' },
]

const TYPE_LABELS = { REGULAR:'Period', BREAK:'Break', LUNCH:'Lunch', ASSEMBLY:'Assembly', ACTIVITY:'Activity' }
const TYPE_COLORS = { REGULAR:'#6E2C00', BREAK:'#B8860B', LUNCH:'#1A5276', ASSEMBLY:'#1E8449', ACTIVITY:'#714B67' }

const DEFAULT_TEMPLATE = [
  { periodNo:1, startTime:'09:00', endTime:'09:40', periodType:'REGULAR' },
  { periodNo:2, startTime:'09:40', endTime:'10:20', periodType:'REGULAR' },
  { periodNo:3, startTime:'10:20', endTime:'10:35', periodType:'BREAK'   },
  { periodNo:4, startTime:'10:35', endTime:'11:15', periodType:'REGULAR' },
  { periodNo:5, startTime:'11:15', endTime:'11:55', periodType:'REGULAR' },
  { periodNo:6, startTime:'11:55', endTime:'12:35', periodType:'LUNCH'   },
  { periodNo:7, startTime:'12:35', endTime:'13:15', periodType:'REGULAR' },
  { periodNo:8, startTime:'13:15', endTime:'13:55', periodType:'REGULAR' },
]

export default function Timetable() {
  const [instId,   setInstId]   = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [classes,  setClasses]  = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [staff,    setStaff]    = useState([])
  const [selClass, setSelClass] = useState('')
  const [selSec,   setSelSec]   = useState('')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [grid,     setGrid]     = useState({}) // `${day}_${periodNo}` -> {subjectId, staffId}
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [importing,setImporting]= useState(false)
  const fileInputRef = React.useRef(null)

  const downloadTemplate = async () => {
    if (!instId) return toast.error('No institution selected')
    try {
      const r = await fetch(`${BASE}/edu/timetable/template?institutionId=${instId}`, { headers:hdr2() })
      if (!r.ok) { const d = await r.json().catch(()=>({})); return toast.error(d.error || 'Download failed') }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'Timetable_Import_Template.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const importTemplate = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('institutionId', instId)
      const r = await fetch(`${BASE}/edu/timetable/import`, { method:'POST', headers:hdr2(), body:fd })
      const d = await r.json()
      if (d.error) { toast.error(d.error); return }
      toast.success(`✅ ${d.data.totalRows} periods imported across ${d.data.sectionsAffected} section(s)`)
      if (d.data.errorCount) {
        console.warn('Timetable import — skipped rows:', d.data.errors)
        toast.error(`${d.data.errorCount} row(s) skipped — check browser console for details`)
      }
      if (selSec) loadTimetable(selSec) // refresh grid if a section is currently open
    } catch { toast.error('Import failed') }
    finally { setImporting(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    fetch(`${BASE}/edu/classes?institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setClasses(d.data||[]))
    fetch(`${BASE}/edu/staff?type=TEACHING&limit=200&institutionId=${instId}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setStaff(d.data||[]))
    setSelClass(''); setSelSec('')
  }, [instId])

  useEffect(() => {
    if (!selClass) { setSections([]); setSelSec(''); setSubjects([]); return }
    const cls = classes.find(c => String(c.id) === selClass)
    setSections(cls?.sections || [])
    setSelSec('')
    // Subjects are scoped to the class, not the whole institution — a college
    // running Arts + Science + Commerce under one roof needs this, not just
    // an institution-wide list (see Subject Master → Class Mapping)
    fetch(`${BASE}/edu/class-subjects?classId=${selClass}`, { headers:hdr2() })
      .then(r=>r.json())
      .then(d => setSubjects((d.data||[]).map(cs => cs.subject)))
  }, [selClass, classes])

  useEffect(() => {
    if (!selSec) { setGrid({}); setTemplate(DEFAULT_TEMPLATE); return }
    loadTimetable(selSec)
  }, [selSec])

  const loadTimetable = async (sectionId) => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE}/edu/timetable?sectionId=${sectionId}`, { headers:hdr2() })
      const d = await r.json()
      const rows = d.data || []
      if (rows.length === 0) { setTemplate(DEFAULT_TEMPLATE); setGrid({}); return }

      // Rebuild the shared bell-schedule template from whichever day has the most complete data
      const byPeriod = {}
      rows.forEach(row => { if (!byPeriod[row.periodNo]) byPeriod[row.periodNo] = row })
      const periodNos = Object.keys(byPeriod).map(Number).sort((a,b)=>a-b)
      const newTemplate = periodNos.map(pNo => ({
        periodNo: pNo,
        startTime: byPeriod[pNo].startTime,
        endTime:   byPeriod[pNo].endTime,
        periodType: byPeriod[pNo].periodType,
      }))
      setTemplate(newTemplate.length ? newTemplate : DEFAULT_TEMPLATE)

      const newGrid = {}
      rows.forEach(row => {
        if (row.periodType === 'REGULAR') {
          newGrid[`${row.dayOfWeek}_${row.periodNo}`] = { subjectId: row.subjectId||'', staffId: row.staffId||'' }
        }
      })
      setGrid(newGrid)
    } catch { toast.error('Failed to load timetable') }
    finally { setLoading(false) }
  }

  const updateTemplateRow = (periodNo, field, value) => {
    setTemplate(t => t.map(p => p.periodNo===periodNo ? { ...p, [field]:value } : p))
  }
  const addPeriodRow = () => {
    const maxNo = Math.max(0, ...template.map(p=>p.periodNo))
    setTemplate(t => [...t, { periodNo:maxNo+1, startTime:'', endTime:'', periodType:'REGULAR' }])
  }
  const removePeriodRow = (periodNo) => {
    setTemplate(t => t.filter(p => p.periodNo !== periodNo))
    setGrid(g => { const n={...g}; DAYS.forEach(d=>delete n[`${d.n}_${periodNo}`]); return n })
  }

  const setCell = (day, periodNo, field, value) => {
    const key = `${day}_${periodNo}`
    setGrid(g => ({ ...g, [key]: { ...(g[key]||{}), [field]: value } }))
  }

  const save = async () => {
    if (!selSec) return toast.error('Select a class and section first')
    if (template.some(p => !p.startTime || !p.endTime)) return toast.error('Every period needs a start and end time')
    setSaving(true)
    try {
      const periods = []
      DAYS.forEach(day => {
        template.forEach(p => {
          if (p.periodType === 'REGULAR') {
            const cell = grid[`${day.n}_${p.periodNo}`] || {}
            periods.push({
              dayOfWeek: day.n, periodNo: p.periodNo, startTime: p.startTime, endTime: p.endTime,
              subjectId: cell.subjectId || null, staffId: cell.staffId || null, periodType: 'REGULAR',
            })
          } else {
            periods.push({
              dayOfWeek: day.n, periodNo: p.periodNo, startTime: p.startTime, endTime: p.endTime,
              subjectId: null, staffId: null, periodType: p.periodType,
            })
          }
        })
      })
      const r = await fetch(`${BASE}/edu/timetable/bulk`, { method:'POST', headers:hdr(),
        body: JSON.stringify({ sectionId: parseInt(selSec), periods }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(`✅ Timetable saved — ${d.data.saved} periods across the week`)
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const copyMondayToAll = () => {
    setGrid(g => {
      const n = { ...g }
      template.filter(p=>p.periodType==='REGULAR').forEach(p => {
        const monCell = g[`1_${p.periodNo}`]
        if (monCell) DAYS.forEach(d => { if (d.n!==1) n[`${d.n}_${p.periodNo}`] = { ...monCell } })
      })
      return n
    })
    toast.success('Monday copied to Tue–Sat — review and save')
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>⏰ Timetable</div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button onClick={downloadTemplate}
            style={{padding:'7px 12px',background:'#fff',color:'#1A5276',border:'1.5px solid #1A5276',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>
            📥 Download Template (All Classes)
          </button>
          <button onClick={()=>fileInputRef.current?.click()} disabled={importing}
            style={{padding:'7px 12px',background:'#fff',color:'#1E8449',border:'1.5px solid #1E8449',
              borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>
            {importing ? '⏳ Importing...' : '📤 Import Filled Template'}
          </button>
          <input ref={fileInputRef} type='file' accept='.xlsx,.xls' onChange={importTemplate} style={{display:'none'}} />
          <select value={selClass} onChange={e=>setSelClass(e.target.value)} style={{...sel,width:170}}>
            <option value=''>Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
          </select>
          <select value={selSec} onChange={e=>setSelSec(e.target.value)} style={{...sel,width:130}} disabled={!selClass}>
            <option value=''>Select Section</option>
            {sections.map(s => <option key={s.id} value={s.id}>Section {s.sectionName}</option>)}
          </select>
          {selSec && (
            <>
              <button onClick={copyMondayToAll}
                style={{padding:'7px 12px',background:'#fff',color:'#6E2C00',border:'1.5px solid #6E2C00',
                  borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:11}}>
                📋 Copy Mon → All
              </button>
              <button onClick={save} disabled={saving}
                style={{padding:'7px 18px',background:'#6E2C00',color:'#fff',border:'none',
                  borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
                {saving ? '⏳...' : '💾 Save Timetable'}
              </button>
            </>
          )}
        </div>
      </div>

      {!selSec ? (
        <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:48,marginBottom:12}}>⏰</div>
          <div style={{fontSize:15,fontWeight:600,color:'#6E2C00'}}>Select a class and section to build its timetable</div>
        </div>
      ) : loading ? (
        <div style={{textAlign:'center',padding:40,color:'#aaa'}}>⏳ Loading...</div>
      ) : (
        <>
          {/* Bell schedule editor */}
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:14,marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:'#6E2C00',marginBottom:10}}>⚙️ Bell Schedule (shared across all days)</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {template.map(p => (
                <div key={p.periodNo} style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{width:60,fontSize:11,color:'#888',fontWeight:700}}>#{p.periodNo}</div>
                  <input type='time' value={p.startTime} onChange={e=>updateTemplateRow(p.periodNo,'startTime',e.target.value)} style={timeInp} />
                  <span style={{fontSize:11,color:'#aaa'}}>to</span>
                  <input type='time' value={p.endTime} onChange={e=>updateTemplateRow(p.periodNo,'endTime',e.target.value)} style={timeInp} />
                  <select value={p.periodType} onChange={e=>updateTemplateRow(p.periodNo,'periodType',e.target.value)} style={{...sel,width:120}}>
                    {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                  <button onClick={()=>removePeriodRow(p.periodNo)}
                    style={{padding:'3px 8px',background:'#fdecea',color:'#C0392B',border:'none',
                      borderRadius:4,cursor:'pointer',fontSize:11}}>✕</button>
                </div>
              ))}
              <button onClick={addPeriodRow}
                style={{alignSelf:'flex-start',padding:'5px 12px',background:'transparent',color:'#6E2C00',
                  border:'1px dashed #6E2C00',borderRadius:5,cursor:'pointer',fontSize:11,marginTop:4}}>
                + Add Period
              </button>
            </div>
          </div>

          {/* Weekly grid */}
          <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:900}}>
              <thead>
                <tr style={{background:'#FDF2E9'}}>
                  <th style={{padding:'8px 10px',fontSize:11,color:'#6E2C00',textAlign:'left',borderBottom:'2px solid #E8E0E8',width:110}}>Period</th>
                  {DAYS.map(d => (
                    <th key={d.n} style={{padding:'8px 10px',fontSize:11,color:'#6E2C00',textAlign:'center',borderBottom:'2px solid #E8E0E8'}}>{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {template.map(p => (
                  <tr key={p.periodNo} style={{borderBottom:'1px solid #F0F0F0'}}>
                    <td style={{padding:'8px 10px',fontSize:11,color:'#888'}}>
                      <div style={{fontWeight:700,color:TYPE_COLORS[p.periodType]}}>#{p.periodNo} {TYPE_LABELS[p.periodType]}</div>
                      <div>{p.startTime}–{p.endTime}</div>
                    </td>
                    {p.periodType !== 'REGULAR' ? (
                      <td colSpan={DAYS.length} style={{padding:'8px 10px',textAlign:'center',
                        background:`${TYPE_COLORS[p.periodType]}0c`,color:TYPE_COLORS[p.periodType],fontSize:11,fontWeight:700}}>
                        {TYPE_LABELS[p.periodType]} — all days
                      </td>
                    ) : DAYS.map(d => {
                      const key = `${d.n}_${p.periodNo}`
                      const cell = grid[key] || {}
                      return (
                        <td key={d.n} style={{padding:'6px 8px',verticalAlign:'top'}}>
                          <select value={cell.subjectId||''} onChange={e=>setCell(d.n,p.periodNo,'subjectId',e.target.value)}
                            style={{...sel,marginBottom:4}}>
                            <option value=''>— Subject —</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
                          </select>
                          <select value={cell.staffId||''} onChange={e=>setCell(d.n,p.periodNo,'staffId',e.target.value)} style={sel}>
                            <option value=''>— Teacher —</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
