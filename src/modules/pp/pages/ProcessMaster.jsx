import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const tok  = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })

const CHARGE_BASES = ['Per Piece','Per Kg','Per Hour','Per Minute','Per Batch','Lumpsum']
const TIME_UNITS   = ['Minutes','Hours','Seconds']

const EMPTY = {
  name:'', stdTime:30, timeUnit:'Minutes',
  chargeBy:'Per Piece', defaultRate:'',
  mandatory:true, canParallel:false, canSkip:false
}

export default function ProcessMaster() {
  const nav = useNavigate()
  const [processes, setProcesses] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [dragging,  setDragging]  = useState(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [editing,   setEditing]   = useState(null)  // id of row being edited inline
  const [newProc,   setNewProc]   = useState(EMPTY)
  const set = (k,v) => setNewProc(f => ({ ...f, [k]:v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE}/pp/process-master`, { headers: hdr2() })
      const data = await res.json()
      setProcesses(data.data || [])
    } catch { toast.error('Failed to load processes') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Add new process ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newProc.name.trim()) return toast.error('Process name required!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE}/pp/process-master`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({
          ...newProc,
          stdTime:     parseFloat(newProc.stdTime||30),
          defaultRate: parseFloat(newProc.defaultRate||0),
          seq:         processes.length + 1,
          status:      'Active',
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${newProc.name} added!`)
      setNewProc(EMPTY)
      setShowAdd(false)
      load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // ── Toggle field ──────────────────────────────────────────────────────────
  const toggleField = async (proc, field) => {
    const updated = { ...proc, [field]: !proc[field] }
    try {
      await fetch(`${BASE}/pp/process-master/${proc.id}`, {
        method:'PATCH', headers: hdr(),
        body: JSON.stringify({ [field]: !proc[field] })
      })
      setProcesses(ps => ps.map(p => p.id === proc.id ? updated : p))
    } catch { toast.error('Update failed') }
  }

  // ── Delete process ────────────────────────────────────────────────────────
  const deleteProc = async (proc) => {
    if (!window.confirm(`Delete "${proc.name}"?`)) return
    try {
      const res = await fetch(`${BASE}/pp/process-master/${proc.id}`, {
        method:'DELETE', headers: hdr2()
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Deleted!')
      load()
    } catch(e) { toast.error(e.message) }
  }

  // ── Drag to reorder ──────────────────────────────────────────────────────
  const handleDragStart = idx => setDragging(idx)
  const handleDragOver  = (e, idx) => {
    e.preventDefault()
    if (dragging === null || dragging === idx) return
    const reordered = [...processes]
    const [moved] = reordered.splice(dragging, 1)
    reordered.splice(idx, 0, moved)
    reordered.forEach((p, i) => p.seq = i + 1)
    setProcesses(reordered)
    setDragging(idx)
  }
  const handleDragEnd = async () => {
    setDragging(null)
    // Save new seq order to backend
    try {
      await Promise.all(processes.map((p, i) =>
        fetch(`${BASE}/pp/process-master/${p.id}`, {
          method:'PATCH', headers: hdr(),
          body: JSON.stringify({ seq: i + 1 })
        })
      ))
    } catch { /* non-critical */ }
  }

  const moveSeq = (id, dir) => {
    const ps  = [...processes]
    const idx = ps.findIndex(p => p.id === id)
    if (dir === 'up' && idx > 0) { [ps[idx-1], ps[idx]] = [ps[idx], ps[idx-1]] }
    if (dir === 'dn' && idx < ps.length-1) { [ps[idx], ps[idx+1]] = [ps[idx+1], ps[idx]] }
    ps.forEach((p, i) => { p.seq = i + 1 })
    setProcesses(ps)
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          Process Master
          <small>{processes.length} processes · Drag to reorder</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-s sd-bsm"
            onClick={() => nav('/pp/routing-master')}>
            Routing Master →
          </button>
          <button className="btn btn-p sd-bsm"
            onClick={() => setShowAdd(true)}>
            + Add Process
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background:'#EDE0EA', borderRadius:8, padding:'10px 16px',
        marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>⚙️</span>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:'#714B67' }}>
            LNV Manufacturing — Process Configuration
          </div>
          <div style={{ fontSize:11, color:'#6C757D' }}>
            Drag rows to reorder sequence · Toggle mandatory/parallel/skip per process
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div style={{ background:'#fff', border:'2px solid #714B67',
          borderRadius:8, padding:'16px 20px', marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'#714B67',
            marginBottom:12 }}>
            Add New Process
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',
            gap:10, marginBottom:10 }}>
            {[
              ['name',        'Process Name *', 'text',   'e.g. Material Drying'],
              ['stdTime',     'Std. Time',       'number', '30'],
              ['timeUnit',    'Time Unit',       'select', ''],
              ['defaultRate', 'Default Rate (₹)','number', '0'],
              ['chargeBy',    'Charge By',       'select', ''],
            ].map(([k,l,type,ph]) => (
              <div key={k}>
                <label style={{ fontSize:10, fontWeight:700, color:'#495057',
                  display:'block', marginBottom:3, textTransform:'uppercase' }}>
                  {l}
                </label>
                {type === 'select' ? (
                  <select value={newProc[k]}
                    onChange={e => set(k, e.target.value)}
                    style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                      borderRadius:5, fontSize:12, width:'100%', outline:'none' }}>
                    {(k === 'timeUnit' ? TIME_UNITS : CHARGE_BASES).map(v => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input type={type}
                    value={newProc[k]}
                    onChange={e => set(k, e.target.value)}
                    placeholder={ph}
                    style={{ padding:'7px 10px', border:'1.5px solid #E0D5E0',
                      borderRadius:5, fontSize:12, width:'100%',
                      boxSizing:'border-box', outline:'none' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:16, marginBottom:10, fontSize:12 }}>
            {[
              ['mandatory',   'Mandatory (cannot skip)'],
              ['canParallel', 'Can run parallel'],
              ['canSkip',     'Customer can opt-out'],
            ].map(([k,l]) => (
              <label key={k} style={{ display:'flex', alignItems:'center',
                gap:6, cursor:'pointer' }}>
                <input type="checkbox"
                  checked={!!newProc[k]}
                  onChange={e => set(k, e.target.checked)} />
                {l}
              </label>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-p sd-bsm"
              disabled={saving} onClick={handleAdd}>
              {saving ? '⏳' : '✅ Add Process'}
            </button>
            <button className="btn btn-s sd-bsm"
              onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Process Table */}
      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          Loading processes...
        </div>
      ) : processes.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'1.5px solid #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⚙️</div>
          No processes found.
          <button className="btn-xs pri" style={{ marginLeft:8 }}
            onClick={() => setShowAdd(true)}>
            + Add First Process
          </button>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:8,
          border:'1.5px solid #E0D5E0', overflow:'hidden' }}>
          <table className="fi-data-table">
            <thead>
              <tr>
                <th style={{ width:32 }}></th>
                <th>Seq</th>
                <th>Process Name</th>
                <th>Std. Time</th>
                <th>Charge By</th>
                <th style={{ textAlign:'right' }}>Default Rate</th>
                <th style={{ textAlign:'center' }}>Mandatory</th>
                <th style={{ textAlign:'center' }}>Parallel OK</th>
                <th style={{ textAlign:'center' }}>Can Skip</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p, idx) => (
                <tr key={p.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    background: dragging === idx ? '#EDE0EA' : idx%2===0 ? '#fff' : '#FAFAFA',
                    cursor:'grab',
                  }}>
                  <td style={{ textAlign:'center', color:'#6C757D',
                    fontSize:16, cursor:'grab' }}>⠿</td>
                  <td>
                    <span style={{ width:24, height:24, borderRadius:'50%',
                      background:'#714B67', color:'#fff',
                      display:'inline-flex', alignItems:'center',
                      justifyContent:'center', fontSize:11, fontWeight:700 }}>
                      {p.seq || idx+1}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize:12 }}>{p.name}</strong>
                    <div style={{ fontSize:10, color:'#6C757D',
                      fontFamily:'DM Mono,monospace' }}>
                      {p.processCode || p.code || `PROC-${String(idx+1).padStart(3,'0')}`}
                    </div>
                  </td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:12 }}>
                    {p.stdTime} {p.timeUnit || 'Min'}
                  </td>
                  <td style={{ fontSize:12, color:'#6C757D' }}>{p.chargeBy}</td>
                  <td style={{ fontFamily:'DM Mono,monospace', fontSize:12,
                    fontWeight:700, color:'#714B67', textAlign:'right' }}>
                    ₹{parseFloat(p.defaultRate||0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span onClick={() => toggleField(p,'mandatory')}
                      style={{ cursor:'pointer', fontSize:16 }}>
                      {p.mandatory ? '✅' : '⬜'}
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span onClick={() => toggleField(p,'canParallel')}
                      style={{ cursor:'pointer', fontSize:16 }}>
                      {p.canParallel ? '✅' : '⬜'}
                    </span>
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <span onClick={() => toggleField(p,'canSkip')}
                      style={{ cursor:'pointer', fontSize:16 }}>
                      {p.canSkip ? '✅' : '⬜'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding:'2px 8px', borderRadius:10, fontSize:11,
                      fontWeight:700,
                      background: p.status==='Active' ? '#D4EDDA' : '#F8D7DA',
                      color:      p.status==='Active' ? '#155724' : '#721C24',
                    }}>
                      {p.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      <button style={{ border:'none', background:'none',
                        cursor:'pointer', fontSize:14, padding:'2px' }}
                        onClick={() => moveSeq(p.id,'up')}>▲</button>
                      <button style={{ border:'none', background:'none',
                        cursor:'pointer', fontSize:14, padding:'2px' }}
                        onClick={() => moveSeq(p.id,'dn')}>▼</button>
                      <button className="btn-xs"
                        onClick={() => deleteProc(p)}
                        style={{ background:'#F8D7DA', color:'#721C24',
                          border:'none', borderRadius:3,
                          padding:'2px 6px', cursor:'pointer',
                          fontSize:11 }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sequence Visual */}
      {processes.length > 0 && (
        <div style={{ background:'#fff', border:'1.5px solid #E0D5E0',
          borderRadius:8, padding:'14px 18px', marginTop:14 }}>
          <div style={{ fontWeight:700, fontSize:12, color:'#714B67',
            marginBottom:10 }}>
            🔗 Current Process Sequence
          </div>
          <div style={{ display:'flex', flexWrap:'wrap',
            gap:0, alignItems:'center' }}>
            {processes.map((p, i) => (
              <React.Fragment key={p.id}>
                <div style={{
                  padding:'6px 12px', borderRadius:4, fontSize:12,
                  fontWeight:600,
                  background: p.mandatory ? '#714B67' : '#E0D5E0',
                  color:      p.mandatory ? '#fff'    : '#6C757D',
                }}>
                  {p.seq || i+1}. {p.name}
                  {p.canParallel && (
                    <span style={{ fontSize:9, marginLeft:4, opacity:.8 }}>‖</span>
                  )}
                </div>
                {i < processes.length-1 && (
                  <div style={{ fontSize:18, color:'#6C757D', padding:'0 4px' }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop:8, fontSize:11, color:'#6C757D',
            display:'flex', gap:16 }}>
            <span>🟣 Purple = Mandatory</span>
            <span>⬜ Gray = Optional</span>
            <span>‖ = Can run parallel</span>
          </div>
        </div>
      )}
    </div>
  )
}
