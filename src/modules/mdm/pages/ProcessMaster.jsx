import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })

const CTRL_KEYS = [
  { key:'PP01', label:'PP01 — Internal Processing',   color:'#D4EDDA', text:'#155724' },
  { key:'PP02', label:'PP02 — External (Sub-contract)',color:'#FFF3CD', text:'#856404' },
  { key:'PP03', label:'PP03 — Inspection',            color:'#D1ECF1', text:'#0C5460' },
  { key:'PP04', label:'PP04 — Rework',                color:'#F8D7DA', text:'#721C24' },
]

const WORK_CENTERS = [
  'WC-001 — Pre-Treatment Tank',
  'WC-002 — Phosphating Tank',
  'WC-003 — Powder Coat Booth 1',
  'WC-004 — Powder Coat Booth 2',
  'WC-005 — Curing Oven 1',
  'WC-006 — Curing Oven 2',
  'WC-007 — Furnace F-001',
  'WC-009 — QC Lab',
  'WC-010 — Dispatch Bay',
]

// Default LNV Surface Treatment processes for quick seed
const DEFAULT_PROCESSES = [
  { code:'PROC-001', name:'Inward Inspection',          controlKey:'PP03', wcId:'WC-009', stdSetup:0,  stdMachine:15,  stdLabor:15,  unit:'MIN' },
  { code:'PROC-002', name:'Pre-Treatment / Degreasing', controlKey:'PP01', wcId:'WC-001', stdSetup:10, stdMachine:30,  stdLabor:20,  unit:'MIN' },
  { code:'PROC-003', name:'Rinsing',                    controlKey:'PP01', wcId:'WC-001', stdSetup:5,  stdMachine:15,  stdLabor:10,  unit:'MIN' },
  { code:'PROC-004', name:'Phosphating',                controlKey:'PP01', wcId:'WC-002', stdSetup:10, stdMachine:45,  stdLabor:20,  unit:'MIN' },
  { code:'PROC-005', name:'Powder Coating',             controlKey:'PP01', wcId:'WC-003', stdSetup:15, stdMachine:60,  stdLabor:30,  unit:'MIN' },
  { code:'PROC-006', name:'Curing / Oven',              controlKey:'PP01', wcId:'WC-005', stdSetup:10, stdMachine:40,  stdLabor:10,  unit:'MIN' },
  { code:'PROC-007', name:'DFT / QC Check',             controlKey:'PP03', wcId:'WC-009', stdSetup:0,  stdMachine:15,  stdLabor:15,  unit:'MIN' },
  { code:'PROC-008', name:'Outward / Dispatch',         controlKey:'PP01', wcId:'WC-010', stdSetup:0,  stdMachine:10,  stdLabor:10,  unit:'MIN' },
  { code:'PROC-009', name:'Rework / Recoating',         controlKey:'PP04', wcId:'WC-003', stdSetup:15, stdMachine:90,  stdLabor:45,  unit:'MIN' },
  { code:'PROC-010', name:'Masking',                    controlKey:'PP01', wcId:'WC-003', stdSetup:5,  stdMachine:20,  stdLabor:20,  unit:'MIN' },
  { code:'PROC-011', name:'CED Coating',                controlKey:'PP01', wcId:'WC-001', stdSetup:15, stdMachine:60,  stdLabor:30,  unit:'MIN' },
  { code:'PROC-012', name:'Shot Blasting',              controlKey:'PP01', wcId:'WC-001', stdSetup:10, stdMachine:30,  stdLabor:20,  unit:'MIN' },
]

const BLANK = {
  code:'', name:'', description:'', controlKey:'PP01',
  wcId:'', stdSetup:'0', stdMachine:'30', stdLabor:'15', unit:'MIN'
}

const inp = {
  padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5,
  fontSize:12, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'DM Sans,sans-serif'
}
const lbl = { fontSize:11, fontWeight:700, color:'#1C1C1C', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

export default function ProcessMaster() {
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [seeding,  setSeeding]  = useState(false)
  const [form,     setForm]     = useState(BLANK)
  const [editId,   setEditId]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search,   setSearch]   = useState('')
  const [ctrlFilter, setCtrlFilter] = useState('All')

  // ── Fetch ───────────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true)
      const res  = await fetch(`${BASE_URL}/process`, { headers: authHdrs() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRows(data.data || [])
    } catch(err) {
      toast.error('Failed to load: ' + err.message)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // ── Quick seed default processes ────────────────────────
  const seedDefaults = async () => {
    if (!confirm(`Seed ${DEFAULT_PROCESSES.length} default Surface Treatment processes?`)) return
    setSeeding(true)
    let count = 0
    for (const p of DEFAULT_PROCESSES) {
      try {
        const res = await fetch(`${BASE_URL}/process`, {
          method: 'POST', headers: authHdrs(), body: JSON.stringify(p)
        })
        if (res.ok) count++
      } catch(e) {}
    }
    toast.success(`${count} processes seeded!`)
    setSeeding(false)
    fetchData()
  }

  // ── Save ────────────────────────────────────────────────
  const save = async () => {
    if (!form.code || !form.name) return toast.error('Code and Name required!')
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/process/${editId}` : `${BASE_URL}/process`
      const method = editId ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: authHdrs(), body: JSON.stringify(form) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Process ${editId ? 'updated' : 'created'}!`)
      setShowForm(false); setForm(BLANK); setEditId(null)
      fetchData()
    } catch(err) {
      toast.error('Error: ' + err.message)
    } finally { setSaving(false) }
  }

  const deactivate = async (id) => {
    if (!confirm('Deactivate this process?')) return
    await fetch(`${BASE_URL}/process/${id}`, { method:'DELETE', headers: authHdrs() })
    toast.success('Process deactivated!')
    fetchData()
  }

  const openEdit = (r) => {
    setForm({
      code: r.code, name: r.name, description: r.description||'',
      controlKey: r.controlKey, wcId: r.wcId||'',
      stdSetup: String(r.stdSetup), stdMachine: String(r.stdMachine),
      stdLabor: String(r.stdLabor), unit: r.unit
    })
    setEditId(r.id); setShowForm(true)
  }

  const F = (f) => ({
    value: form[f] ?? '',
    onChange: e => setForm(p => ({...p, [f]: e.target.value}))
  })

  const filtered = rows.filter(r =>
    (ctrlFilter === 'All' || r.controlKey === ctrlFilter) &&
    (r.code.toLowerCase().includes(search.toLowerCase()) ||
     r.name.toLowerCase().includes(search.toLowerCase()))
  )

  const totalTime = (r) => (+r.stdSetup || 0) + (+r.stdMachine || 0) + (+r.stdLabor || 0)

  return (
    <div style={{ padding:20, background:'#F8F7FA', minHeight:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#1C1C1C', margin:0 }}>
            Process Master
          </h2>
          <p style={{ fontSize:12, color:'#6C757D', margin:'3px 0 0' }}>
            MDM › Process Master &nbsp;|&nbsp; SAP: CA80 &nbsp;|&nbsp; {rows.length} processes defined
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={fetchData}
            style={{ padding:'8px 14px', background:'#fff', color:'#714B67',
              border:'1.5px solid #714B67', borderRadius:6, fontSize:12,
              fontWeight:600, cursor:'pointer' }}>
            🔄 Refresh
          </button>
          {rows.length === 0 && (
            <button onClick={seedDefaults} disabled={seeding}
              style={{ padding:'8px 16px', background:'#00A09D', color:'#fff',
                border:'none', borderRadius:6, fontSize:12, fontWeight:700,
                cursor: seeding ? 'not-allowed' : 'pointer' }}>
              {seeding ? '⏳ Seeding...' : '⚡ Load Default Processes'}
            </button>
          )}
          <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
            style={{ padding:'8px 18px', background:'#714B67', color:'#fff',
              border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            + New Process
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding:'8px 12px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:14, fontSize:12, color:'#005A58' }}>
        <strong>Process Master</strong> — Define all manufacturing processes with standard times.
        Routing Master will use these processes in operation sequences.
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Processes', value: rows.length,                                         color:'#714B67', bg:'#EDE0EA' },
          { label:'PP01 Internal',   value: rows.filter(r=>r.controlKey==='PP01').length,        color:'#155724', bg:'#D4EDDA' },
          { label:'PP02 External',   value: rows.filter(r=>r.controlKey==='PP02').length,        color:'#856404', bg:'#FFF3CD' },
          { label:'PP03 Inspection', value: rows.filter(r=>r.controlKey==='PP03').length,        color:'#0C5460', bg:'#D1ECF1' },
          { label:'PP04 Rework',     value: rows.filter(r=>r.controlKey==='PP04').length,        color:'#721C24', bg:'#F8D7DA' },
        ].map(k => (
          <div key={k.label} style={{ background:k.bg, borderRadius:8,
            padding:'12px 16px', border:`1px solid ${k.color}22` }}>
            <div style={{ fontSize:11, color:k.color, fontWeight:600,
              textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:k.color,
              fontFamily:'Syne,sans-serif', lineHeight:1.2 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
        <input placeholder="🔍 Search code or name..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'7px 12px', border:'1.5px solid #E0D5E0', borderRadius:6,
            fontSize:12, outline:'none', width:280 }} />
        <div style={{ display:'flex', gap:4 }}>
          {['All','PP01','PP02','PP03','PP04'].map(k => (
            <button key={k} onClick={() => setCtrlFilter(k)}
              style={{ padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                cursor:'pointer', border:'1px solid #E0D5E0',
                background: ctrlFilter===k ? '#714B67' : '#fff',
                color: ctrlFilter===k ? '#fff' : '#6C757D' }}>
              {k}
            </button>
          ))}
        </div>
        <span style={{ fontSize:11, color:'#6C757D', marginLeft:'auto' }}>
          {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'1px solid #E0D5E0' }}>
          ⏳ Loading processes...
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{ maxHeight:'calc(100vh - 380px)', overflowY:'auto', overflowX:'auto',
          border:'1px solid #E0D5E0', borderRadius:8,
          boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <table style={{ width:'100%', minWidth:900, borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0, zIndex:10, background:'#F8F4F8' }}>
              <tr style={{ borderBottom:'2px solid #E0D5E0' }}>
                {['Process Code','Process Name','Control Key','Work Center',
                  'Setup (MIN)','Machine (MIN)','Labor (MIN)','Total Time','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700,
                    color:'#6C757D', textAlign:'left', textTransform:'uppercase',
                    letterSpacing:.5, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const ck = CTRL_KEYS.find(c => c.key === r.controlKey)
                return (
                  <tr key={r.id} style={{ borderBottom:'1px solid #F0EEF0',
                    background: i%2===0?'#fff':'#FDFBFD' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#FBF7FA'}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':'#FDFBFD'}>
                    <td style={{ padding:'10px 14px', fontFamily:'DM Mono,monospace',
                      fontWeight:700, color:'#714B67', fontSize:12 }}>{r.code}</td>
                    <td style={{ padding:'10px 14px', fontWeight:600, fontSize:13 }}>{r.name}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11,
                        fontWeight:700, background: ck?.color, color: ck?.text }}>
                        {r.controlKey}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:12, color:'#495057' }}>
                      {r.wcId || <span style={{ color:'#CCC' }}>—</span>}
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:12, textAlign:'center' }}>{+r.stdSetup}</td>
                    <td style={{ padding:'10px 14px', fontSize:12, textAlign:'center',
                      fontWeight:600, color:'#714B67' }}>{+r.stdMachine}</td>
                    <td style={{ padding:'10px 14px', fontSize:12, textAlign:'center' }}>{+r.stdLabor}</td>
                    <td style={{ padding:'10px 14px', fontSize:12, textAlign:'center' }}>
                      <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11,
                        fontWeight:600, background:'#EDE0EA', color:'#714B67' }}>
                        {totalTime(r)} {r.unit}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ padding:'3px 9px', borderRadius:10, fontSize:11,
                        fontWeight:600, background:'#D4EDDA', color:'#155724' }}>
                        Active
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={() => openEdit(r)}
                          style={{ padding:'4px 12px', background:'#714B67', color:'#fff',
                            border:'none', borderRadius:4, fontSize:12, cursor:'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => deactivate(r.id)}
                          style={{ padding:'4px 12px', background:'#fff', color:'#6C757D',
                            border:'1px solid #6C757D', borderRadius:4, fontSize:12,
                            cursor:'pointer' }}>
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={10} style={{ padding:40, textAlign:'center',
                  color:'#6C757D', fontSize:13 }}>
                  {rows.length === 0
                    ? '📋 No processes yet — click "⚡ Load Default Processes" to get started!'
                    : 'No processes match search'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'#fff', borderRadius:10, width:580,
            boxShadow:'0 20px 60px rgba(0,0,0,.2)', overflow:'hidden' }}>

            {/* Modal Header */}
            <div style={{ background:'#714B67', padding:'14px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif',
                  fontSize:15, fontWeight:700 }}>
                  {editId ? 'Edit Process' : 'New Process'}
                </h3>
                <p style={{ color:'rgba(255,255,255,.6)', margin:'2px 0 0', fontSize:11 }}>
                  SAP: CA80 — Process Master
                </p>
              </div>
              <span onClick={() => { setShowForm(false); setForm(BLANK); setEditId(null) }}
                style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
            </div>

            {/* Modal Body */}
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Process Code *</label>
                  <input style={{ ...inp, fontFamily:'DM Mono,monospace' }}
                    {...F('code')} placeholder="PROC-001"
                    disabled={!!editId}
                    onFocus={e=>e.target.style.borderColor='#714B67'}
                    onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
                </div>
                <div>
                  <label style={lbl}>Control Key</label>
                  <select style={{ ...inp, cursor:'pointer' }} {...F('controlKey')}>
                    {CTRL_KEYS.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>Process Name *</label>
                <input style={inp} {...F('name')}
                  placeholder="e.g. Pre-Treatment / Degreasing"
                  onFocus={e=>e.target.style.borderColor='#714B67'}
                  onBlur={e=>e.target.style.borderColor='#E0D5E0'} />
              </div>

              <div>
                <label style={lbl}>Work Center</label>
                <select style={{ ...inp, cursor:'pointer' }} {...F('wcId')}>
                  <option value=''>— None —</option>
                  {WORK_CENTERS.map(w => (
                    <option key={w} value={w.split(' — ')[0]}>{w}</option>
                  ))}
                </select>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
                <div>
                  <label style={lbl}>Setup (MIN)</label>
                  <input style={inp} type='number' {...F('stdSetup')}
                    placeholder="0" min="0" />
                </div>
                <div>
                  <label style={lbl}>Machine (MIN)</label>
                  <input style={inp} type='number' {...F('stdMachine')}
                    placeholder="30" min="0" />
                </div>
                <div>
                  <label style={lbl}>Labor (MIN)</label>
                  <input style={inp} type='number' {...F('stdLabor')}
                    placeholder="15" min="0" />
                </div>
                <div>
                  <label style={lbl}>Unit</label>
                  <select style={{ ...inp, cursor:'pointer' }} {...F('unit')}>
                    <option>MIN</option><option>HR</option><option>SEC</option>
                  </select>
                </div>
              </div>

              {/* Total time indicator */}
              <div style={{ background:'#F8F4F8', borderRadius:6, padding:'10px 14px',
                display:'flex', gap:20, fontSize:12 }}>
                <span>Total Std Time: <strong style={{ color:'#714B67', fontSize:14 }}>
                  {(+form.stdSetup||0)+(+form.stdMachine||0)+(+form.stdLabor||0)} {form.unit}
                </strong></span>
                <span style={{ color:'#6C757D' }}>
                  = {(((+form.stdSetup||0)+(+form.stdMachine||0)+(+form.stdLabor||0))/60).toFixed(1)} hrs
                </span>
              </div>

              <div>
                <label style={lbl}>Description</label>
                <textarea style={{ ...inp, minHeight:60, resize:'vertical' }}
                  {...F('description')} placeholder="Optional description" />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
              display:'flex', justifyContent:'flex-end', gap:10, background:'#F8F7FA' }}>
              <button onClick={() => { setShowForm(false); setForm(BLANK); setEditId(null) }}
                style={{ padding:'8px 18px', background:'#fff', color:'#6C757D',
                  border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                style={{ padding:'8px 24px',
                  background: saving ? '#9E7D96' : '#714B67',
                  color:'#fff', border:'none', borderRadius:5, fontSize:13,
                  fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? '⏳ Saving...' : '💾 Save Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
