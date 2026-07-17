import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const fmtC = n => '₹' + Number(n||0).toLocaleString('en-IN')

export default function RoomAddonRates() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState({}) // { [code]: { ratePerSqft, areaFactor } }
  const [saving, setSaving] = useState({})

  const load = () => {
    setLoading(true)
    fetch(`${BASE}/civil/room-addon-master`, { headers:hdr2() })
      .then(r=>r.json()).then(d => setRows(d.data||[]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const startEdit = (row) => setEditing(p => ({ ...p, [row.code]: { ratePerSqft: row.ratePerSqft, areaFactor: row.areaFactor } }))
  const cancelEdit = (code) => setEditing(p => { const n = {...p}; delete n[code]; return n })
  const updateField = (code, field, val) => setEditing(p => ({ ...p, [code]: { ...p[code], [field]: val } }))

  const save = async (row) => {
    const edit = editing[row.code]
    if (!edit) return
    setSaving(p => ({ ...p, [row.code]: true }))
    try {
      const r = await fetch(`${BASE}/civil/room-addon-master/${row.code}`, { method:'PATCH', headers:hdr(),
        body: JSON.stringify({ ratePerSqft: edit.ratePerSqft, areaFactor: edit.areaFactor }) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success('Rate updated')
      cancelEdit(row.code)
      load()
    } catch { toast.error('Could not save') }
    finally { setSaving(p => ({ ...p, [row.code]: false })) }
  }

  const grouped = rows.reduce((acc, r) => {
    if (!acc[r.addonName]) acc[r.addonName] = []
    acc[r.addonName].push(r)
    return acc
  }, {})

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'14px 20px',marginBottom:16}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>🎨 Room Add-on Rates</div>
        <div style={{fontSize:12,color:'#888',marginTop:2}}>
          Rates for Modular Kitchen, False Ceiling, Wardrobe etc. Update these as market rates change — no code changes needed.
          Changing a rate here only affects <b>future</b> selections — rooms that already have an upgrade selected keep their original snapshotted price, so past costs never silently shift.
        </div>
      </div>

      <div style={{padding:'0 20px 20px'}}>
        {loading ? (
          <div style={{padding:40,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{padding:40,textAlign:'center',color:'#aaa'}}>No add-ons seeded yet — open Manage Rooms → Add-ons once to seed the catalog.</div>
        ) : Object.entries(grouped).map(([addonName, items]) => (
          <div key={addonName} style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:'#6E2C00',marginBottom:8}}>{addonName}</div>
            <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#FDF2E9'}}>
                  <th style={{padding:'8px 12px',textAlign:'left',fontSize:10.5,color:'#6E2C00',fontWeight:700}}>Grade</th>
                  <th style={{padding:'8px 12px',textAlign:'right',fontSize:10.5,color:'#6E2C00',fontWeight:700}}>Rate (₹/sqft)</th>
                  <th style={{padding:'8px 12px',textAlign:'right',fontSize:10.5,color:'#6E2C00',fontWeight:700}}>Area Factor</th>
                  <th style={{padding:'8px 12px',textAlign:'center',fontSize:10.5,color:'#6E2C00',fontWeight:700}}></th>
                </tr></thead>
                <tbody>
                  {items.map((row,i) => {
                    const isEditing = !!editing[row.code]
                    return (
                      <tr key={row.code} style={{background:i%2===0?'#fff':'#FDF9F7',borderTop:'1px solid #F5EDE0'}}>
                        <td style={{padding:'8px 12px',fontWeight:700,color:'#B8860B'}}>{row.grade}</td>
                        <td style={{padding:'6px 10px',textAlign:'right'}}>
                          {isEditing ? (
                            <input type='number' value={editing[row.code].ratePerSqft}
                              onChange={e=>updateField(row.code,'ratePerSqft',e.target.value)}
                              style={{width:90,padding:'4px 8px',border:'1.5px solid #6E2C00',borderRadius:4,textAlign:'right',fontSize:12}} />
                          ) : (
                            <span style={{fontWeight:700,color:'#1A5276'}}>{fmtC(row.ratePerSqft)}</span>
                          )}
                        </td>
                        <td style={{padding:'6px 10px',textAlign:'right'}}>
                          {isEditing ? (
                            <input type='number' step='0.05' value={editing[row.code].areaFactor}
                              onChange={e=>updateField(row.code,'areaFactor',e.target.value)}
                              style={{width:70,padding:'4px 8px',border:'1.5px solid #6E2C00',borderRadius:4,textAlign:'right',fontSize:12}} />
                          ) : (
                            <span>{Number(row.areaFactor).toFixed(2)}×</span>
                          )}
                        </td>
                        <td style={{padding:'6px 10px',textAlign:'center'}}>
                          {isEditing ? (
                            <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                              <button onClick={()=>save(row)} disabled={saving[row.code]}
                                style={{padding:'4px 10px',background:'#1E8449',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:700}}>
                                {saving[row.code] ? '...' : 'Save'}
                              </button>
                              <button onClick={()=>cancelEdit(row.code)}
                                style={{padding:'4px 10px',background:'#eee',color:'#555',border:'none',borderRadius:4,cursor:'pointer',fontSize:11}}>✕</button>
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
