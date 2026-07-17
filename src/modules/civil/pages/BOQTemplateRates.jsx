import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN')

export default function BOQTemplateRates() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState({}) // { [id]: { qtyPerSqft, suggestedRate } }
  const [saving, setSaving] = useState({})

  const load = () => {
    setLoading(true)
    fetch(`${BASE}/civil-ext/boq-template`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setRows(d.data||[]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const startEdit = (row) => setEditing(p => ({ ...p, [row.id]: { qtyPerSqft: row.qtyPerSqft, suggestedRate: row.suggestedRate } }))
  const cancelEdit = (id) => setEditing(p => { const n = {...p}; delete n[id]; return n })
  const updateField = (id, field, val) => setEditing(p => ({ ...p, [id]: { ...p[id], [field]: val } }))

  const save = async (row) => {
    const edit = editing[row.id]
    if (!edit) return
    setSaving(p => ({ ...p, [row.id]: true }))
    try {
      const r = await fetch(`${BASE}/civil-ext/boq-template/${row.id}`, { method:'PATCH', headers:hdr(),
        body: JSON.stringify({ qtyPerSqft: edit.qtyPerSqft, suggestedRate: edit.suggestedRate }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success('Rate updated')
      cancelEdit(row.id)
      load()
    } catch { toast.error('Could not save') }
    finally { setSaving(p => ({ ...p, [row.id]: false })) }
  }

  const [seeding, setSeeding] = useState(false)
  const runSeed = async () => {
    setSeeding(true)
    try {
      const r = await fetch(`${BASE}/civil-ext/boq-template/seed-defaults`, { method:'POST', headers:hdr() })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(d.message || 'Seeded successfully')
      load()
    } catch { toast.error('Could not seed') }
    finally { setSeeding(false) }
  }

  const grouped = rows.reduce((acc, r) => {
    if (!acc[r.projectType]) acc[r.projectType] = []
    acc[r.projectType].push(r)
    return acc
  }, {})

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'14px 20px',marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>💰 BOQ Template Rates</div>
        <div style={{fontSize:12,color:'#888',marginTop:2}}>
          These rates and quantity ratios drive the "Load Standard Template" auto-BOQ feature.
          Update them here as market rates change — no code changes needed.
        </div>
      </div>

      <div style={{padding:'0 20px 20px'}}>
        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{padding:60,textAlign:'center',color:'#aaa'}}>
            <div style={{fontSize:36,marginBottom:10}}>💰</div>
            <div style={{marginBottom:14,color:'#6E2C00',fontWeight:600}}>No templates seeded yet</div>
            <button onClick={runSeed} disabled={seeding}
              style={{padding:'10px 24px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,
                cursor:seeding?'default':'pointer',fontWeight:700,fontSize:13}}>
              {seeding ? '⏳ Seeding...' : '🌱 Seed Standard Rates (Apartment Building)'}
            </button>
          </div>
        ) : Object.entries(grouped).map(([projectType, items]) => (
          <div key={projectType} style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:8}}>🏗️ {projectType}</div>
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#FDF2E9'}}>
                  <th style={{padding:'8px 12px',textAlign:'left',fontSize:10.5,color:'#6E2C00',fontWeight:700}}>Activity</th>
                  <th style={{padding:'8px 12px',textAlign:'left',fontSize:10.5,color:'#6E2C00',fontWeight:700}}>Category</th>
                  <th style={{padding:'8px 12px',textAlign:'center',fontSize:10.5,color:'#6E2C00',fontWeight:700}}>Unit</th>
                  <th style={{padding:'8px 12px',textAlign:'right',fontSize:10.5,color:'#6E2C00',fontWeight:700}}>Qty Ratio (per sqft)</th>
                  <th style={{padding:'8px 12px',textAlign:'right',fontSize:10.5,color:'#6E2C00',fontWeight:700}}>Rate (₹)</th>
                  <th style={{padding:'8px 12px',textAlign:'center',fontSize:10.5,color:'#6E2C00',fontWeight:700}}></th>
                </tr></thead>
                <tbody>
                  {items.map((row,i) => {
                    const isEditing = !!editing[row.id]
                    return (
                      <tr key={row.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderTop:'1px solid #F5EDE0'}}>
                        <td style={{padding:'8px 12px',fontWeight:700,color:'#333'}}>{row.activityName}</td>
                        <td style={{padding:'8px 12px',color:'#888'}}>{row.category}</td>
                        <td style={{padding:'8px 12px',textAlign:'center',color:'#555'}}>
                          {row.isLumpSum ? 'LS' : row.unit}
                        </td>
                        <td style={{padding:'6px 10px',textAlign:'right'}}>
                          {row.isLumpSum ? (
                            <span style={{color:'#aaa'}}>— (lump sum)</span>
                          ) : isEditing ? (
                            <input type='number' step='0.001' value={editing[row.id].qtyPerSqft}
                              onChange={e=>updateField(row.id,'qtyPerSqft',e.target.value)}
                              style={{width:80,padding:'4px 8px',border:'1.5px solid #6E2C00',borderRadius:4,textAlign:'right',fontSize:12}} />
                          ) : (
                            <span>{Number(row.qtyPerSqft).toFixed(3)}</span>
                          )}
                        </td>
                        <td style={{padding:'6px 10px',textAlign:'right'}}>
                          {isEditing ? (
                            <input type='number' value={editing[row.id].suggestedRate}
                              onChange={e=>updateField(row.id,'suggestedRate',e.target.value)}
                              style={{width:90,padding:'4px 8px',border:'1.5px solid #6E2C00',borderRadius:4,textAlign:'right',fontSize:12}} />
                          ) : (
                            <span style={{fontWeight:700,color:'#1A5276'}}>{fmtC(row.suggestedRate)}</span>
                          )}
                        </td>
                        <td style={{padding:'6px 10px',textAlign:'center'}}>
                          {isEditing ? (
                            <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                              <button onClick={()=>save(row)} disabled={saving[row.id]}
                                style={{padding:'4px 10px',background:'#1E8449',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>
                                {saving[row.id] ? '...' : 'Save'}
                              </button>
                              <button onClick={()=>cancelEdit(row.id)}
                                style={{padding:'4px 10px',background:'#eee',color:'#555',border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button onClick={()=>startEdit(row)}
                              style={{padding:'4px 10px',background:'#FEF9E7',color:'#B8860B',border:'1px solid #F9E79F',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>
                              ✏️ Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
