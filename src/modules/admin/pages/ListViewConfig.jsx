/**
 * ListViewConfig — Admin page to configure which columns
 * show in List View vs Detail View for each module
 * Route: /admin/listview
 */
import React, { useState } from 'react'
import { useListView, DEFAULT_CONFIGS } from '@context/ListViewContext'
import toast from 'react-hot-toast'

const MODULE_COLORS = {
  SD:'#714B67', MM:'#1A5276', PP:'#784212',
  FI:'#196F3D', QM:'#6C3483', WM:'#1F618D',
  PM:'#117A65', HCM:'#6C3483', TM:'#E06F39',
}

const TYPE_ICONS = {
  mono:'#',  bold:'B',  text:'T',  amount:'₹',
  date:'', status:'●', badge:'', bool:'',
}

export default function ListViewConfig() {
  const { configs, saveConfig } = useListView()
  const [activeScreen, setActiveScreen] = useState('SD_CUSTOMERS')
  const [localCols, setLocalCols] = useState(null)
  const [changed, setChanged] = useState(false)
  const [preview, setPreview] = useState('list') // list | detail

  const screenKeys = Object.keys(DEFAULT_CONFIGS)
  const cfg = localCols
    ? { ...configs[activeScreen], allColumns: localCols }
    : configs[activeScreen]

  const cols = cfg?.allColumns || []

  const switchScreen = (key) => {
    if (changed) {
      if (!window.confirm('Unsaved changes. Switch anyway?')) return
    }
    setActiveScreen(key)
    setLocalCols(null)
    setChanged(false)
  }

  const toggleCol = (idx, field) => {
    const updated = cols.map((c, i) =>
      i === idx ? { ...c, [field]: !c[field] } : c
    )
    setLocalCols(updated)
    setChanged(true)
  }

  const moveCol = (idx, dir) => {
    const updated = [...cols]
    const swap = idx + dir
    if (swap < 0 || swap >= updated.length) return
    ;[updated[idx], updated[swap]] = [updated[swap], updated[idx]]
    setLocalCols(updated)
    setChanged(true)
  }

  const resetDefaults = () => {
    setLocalCols([...DEFAULT_CONFIGS[activeScreen].allColumns])
    setChanged(true)
    toast('Reset to defaults — click Save to apply')
  }

  const save = () => {
    saveConfig(activeScreen, cols)
    setLocalCols(null)
    setChanged(false)
    toast.success(`Column settings saved for ${cfg.label}!`)
  }

  const visibleList   = cols.filter(c => c.visible)
  const visibleDetail = cols.filter(c => c.visible || c.detail)

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          List View Configuration
          <small>Configure columns for List View and Detail View per screen</small>
        </div>
        <div className="fi-lv-actions">
          {changed && (
            <>
              <button className="btn btn-s sd-bsm" onClick={resetDefaults}>Reset</button>
              <button className="btn btn-p" onClick={save}>Save Settings</button>
            </>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div style={{ padding:'10px 14px', background:'#E6F7F7', border:'1px solid #00A09D',
        borderRadius:6, marginBottom:16, fontSize:12, color:'#005A58' }}>
        <strong>List View</strong> shows compact columns for quick scanning.
        <strong> Detail View</strong> shows all selected columns including extended fields.
        Users toggle between views using the <strong> / ⊞</strong> buttons on each list screen.
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16 }}>

        {/* Left: Screen selector */}
        <div style={{ background:'#fff', border:'1px solid var(--odoo-border)',
          borderRadius:8, overflow:'hidden', height:'fit-content' }}>
          <div style={{ padding:'10px 14px', background:'var(--odoo-purple)',
            fontSize:12, fontWeight:700, color:'#fff' }}>
            Select Screen
          </div>
          {screenKeys.map(key => {
            const c = DEFAULT_CONFIGS[key]
            const mc = MODULE_COLORS[c.module] || '#555'
            return (
              <div key={key} onClick={() => switchScreen(key)}
                style={{ padding:'10px 14px', cursor:'pointer', fontSize:12,
                  borderBottom:'1px solid var(--odoo-border)',
                  background: activeScreen===key ? 'var(--odoo-purple-lt)' : '#fff',
                  borderLeft: activeScreen===key ? '3px solid var(--odoo-purple)' : '3px solid transparent',
                  display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ padding:'2px 6px', borderRadius:4, fontSize:10,
                  fontWeight:700, background:mc, color:'#fff', minWidth:28, textAlign:'center' }}>
                  {c.module}
                </span>
                <span style={{ fontWeight: activeScreen===key ? 700 : 400,
                  color: activeScreen===key ? 'var(--odoo-purple)' : 'var(--odoo-dark)' }}>
                  {c.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Right: Column configurator */}
        <div>
          {cfg && (
            <>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700 }}>
                    {cfg.label}
                  </div>
                  <div style={{ fontSize:12, color:'var(--odoo-gray)', marginTop:2 }}>
                    List View: <strong>{visibleList.length} columns</strong> &nbsp;·&nbsp;
                    Detail View: <strong>{visibleDetail.length} columns</strong> &nbsp;·&nbsp;
                    Total: {cols.length} available
                  </div>
                </div>
                {/* Preview toggle */}
                <div style={{ display:'flex', gap:0, border:'1px solid var(--odoo-border)',
                  borderRadius:6, overflow:'hidden' }}>
                  {[['list',' List'],['detail','⊞ Detail']].map(([m, l]) => (
                    <button key={m} onClick={() => setPreview(m)}
                      style={{ padding:'6px 14px', fontSize:11, fontWeight:600,
                        cursor:'pointer', border:'none',
                        background: preview===m ? 'var(--odoo-purple)' : '#fff',
                        color: preview===m ? '#fff' : 'var(--odoo-gray)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview strip */}
              <div style={{ background:'#fff', border:'1px solid var(--odoo-border)',
                borderRadius:6, padding:'10px 14px', marginBottom:14,
                overflowX:'auto' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--odoo-gray)',
                  textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>
                  {preview==='list' ? 'List View Preview' : 'Detail View Preview'}
                </div>
                <div style={{ display:'flex', gap:0 }}>
                  {(preview==='list' ? visibleList : visibleDetail).map(c => (
                    <div key={c.key} style={{ padding:'6px 10px', fontSize:11, fontWeight:600,
                      background:'var(--odoo-purple)', color:'#fff', borderRight:'1px solid #5A3A56',
                      minWidth: c.width, whiteSpace:'nowrap' }}>
                      {c.label}
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:0 }}>
                  {(preview==='list' ? visibleList : visibleDetail).map(c => (
                    <div key={c.key} style={{ padding:'6px 10px', fontSize:11,
                      borderRight:'1px solid var(--odoo-border)',
                      minWidth: c.width, color:'var(--odoo-gray)',
                      fontFamily: ['mono','amount'].includes(c.type) ? 'DM Mono,monospace' : 'inherit',
                      fontStyle:'italic', whiteSpace:'nowrap' }}>
                      {c.type==='amount' ? '₹1,23,456' :
                       c.type==='status' ? '●  Active' :
                       c.type==='date'   ? '17 Mar 26' :
                       c.type==='bool'   ? 'Yes' :
                       c.type==='mono'   ? 'CODE-001' : 'Sample text'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Column table */}
              <div style={{ background:'#fff', border:'1px solid var(--odoo-border)',
                borderRadius:8, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--odoo-purple)' }}>
                      {['Order','Field Key','Column Label','Type','List View','Detail View','Width (px)'].map(h => (
                        <th key={h} style={{ padding:'9px 12px', color:'#fff', fontSize:11,
                          fontWeight:700, textAlign: h==='Order'?'center':'left',
                          border:'1px solid #5A3A56' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cols.map((col, idx) => (
                      <tr key={col.key} style={{ background: idx%2===0?'#fff':'#FAFAFA',
                        borderBottom:'1px solid var(--odoo-border)',
                        opacity: (!col.visible && !col.detail) ? .5 : 1 }}>

                        {/* Order controls */}
                        <td style={{ padding:'6px 10px', textAlign:'center', whiteSpace:'nowrap' }}>
                          <button onClick={() => moveCol(idx, -1)} disabled={idx===0}
                            style={{ border:'none', background:'none', cursor:'pointer',
                              color:'var(--odoo-gray)', fontSize:14, padding:'0 4px',
                              opacity: idx===0 ? .3 : 1 }}>↑</button>
                          <span style={{ fontSize:11, fontFamily:'DM Mono,monospace',
                            color:'var(--odoo-gray)', margin:'0 4px' }}>{idx+1}</span>
                          <button onClick={() => moveCol(idx, 1)} disabled={idx===cols.length-1}
                            style={{ border:'none', background:'none', cursor:'pointer',
                              color:'var(--odoo-gray)', fontSize:14, padding:'0 4px',
                              opacity: idx===cols.length-1 ? .3 : 1 }}>↓</button>
                        </td>

                        {/* Key */}
                        <td style={{ padding:'8px 12px', fontFamily:'DM Mono,monospace',
                          fontSize:11, color:'var(--odoo-purple)', fontWeight:600 }}>
                          {col.key}
                        </td>

                        {/* Label — editable */}
                        <td style={{ padding:'6px 10px' }}>
                          <input value={col.label}
                            onChange={e => {
                              const u = cols.map((c,i)=>i===idx?{...c,label:e.target.value}:c)
                              setLocalCols(u); setChanged(true)
                            }}
                            style={{ padding:'4px 8px', border:'1px solid var(--odoo-border)',
                              borderRadius:4, fontSize:12, width:140, outline:'none',
                              fontFamily:'DM Sans,sans-serif' }} />
                        </td>

                        {/* Type badge */}
                        <td style={{ padding:'8px 12px' }}>
                          <span style={{ padding:'2px 8px', borderRadius:8, fontSize:10,
                            fontWeight:600, background:'var(--odoo-purple-lt)',
                            color:'var(--odoo-purple)', fontFamily:'DM Mono,monospace' }}>
                            {TYPE_ICONS[col.type]||'?'} {col.type}
                          </span>
                        </td>

                        {/* List View toggle */}
                        <td style={{ padding:'8px 12px', textAlign:'center' }}>
                          <label style={{ cursor:'pointer', display:'flex',
                            alignItems:'center', justifyContent:'center', gap:6 }}>
                            <div onClick={() => toggleCol(idx,'visible')}
                              style={{ width:36, height:20, borderRadius:10, cursor:'pointer',
                                background: col.visible ? 'var(--odoo-purple)' : '#ccc',
                                position:'relative', transition:'all .2s' }}>
                              <div style={{ width:16, height:16, borderRadius:'50%',
                                background:'#fff', position:'absolute', top:2,
                                left: col.visible ? 18 : 2, transition:'left .2s',
                                boxShadow:'0 1px 3px rgba(0,0,0,.3)' }} />
                            </div>
                            <span style={{ fontSize:11, fontWeight:600,
                              color: col.visible ? 'var(--odoo-purple)' : 'var(--odoo-gray)' }}>
                              {col.visible ? 'ON' : 'OFF'}
                            </span>
                          </label>
                        </td>

                        {/* Detail View toggle */}
                        <td style={{ padding:'8px 12px', textAlign:'center' }}>
                          <label style={{ cursor:'pointer', display:'flex',
                            alignItems:'center', justifyContent:'center', gap:6 }}>
                            <div onClick={() => toggleCol(idx,'detail')}
                              style={{ width:36, height:20, borderRadius:10, cursor:'pointer',
                                background: col.detail ? 'var(--odoo-green)' : '#ccc',
                                position:'relative', transition:'all .2s' }}>
                              <div style={{ width:16, height:16, borderRadius:'50%',
                                background:'#fff', position:'absolute', top:2,
                                left: col.detail ? 18 : 2, transition:'left .2s',
                                boxShadow:'0 1px 3px rgba(0,0,0,.3)' }} />
                            </div>
                            <span style={{ fontSize:11, fontWeight:600,
                              color: col.detail ? 'var(--odoo-green)' : 'var(--odoo-gray)' }}>
                              {col.detail ? 'ON' : 'OFF'}
                            </span>
                          </label>
                        </td>

                        {/* Width — editable */}
                        <td style={{ padding:'6px 10px' }}>
                          <input type="number" value={col.width}
                            onChange={e => {
                              const u = cols.map((c,i)=>i===idx?{...c,width:Number(e.target.value)}:c)
                              setLocalCols(u); setChanged(true)
                            }}
                            style={{ padding:'4px 8px', border:'1px solid var(--odoo-border)',
                              borderRadius:4, fontSize:12, width:70, outline:'none',
                              fontFamily:'DM Mono,monospace', textAlign:'right' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{ marginTop:12, display:'flex', gap:20, fontSize:11,
                color:'var(--odoo-gray)', flexWrap:'wrap' }}>
                <span><strong style={{color:'var(--odoo-purple)'}}>List View ON</strong> — shows in compact list (default view)</span>
                <span><strong style={{color:'var(--odoo-green)'}}>Detail View ON</strong> — shows only in detail view (additional fields)</span>
                <span>Both OFF — column hidden in all views</span>
                <span>↑↓ — drag column order</span>
              </div>

              {/* Save bar */}
              {changed && (
                <div style={{ marginTop:14, padding:'12px 16px', background:'#FFF3CD',
                  border:'1px solid #F5C518', borderRadius:6,
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#856404' }}>
                    Unsaved changes — {visibleList.length} list cols, {visibleDetail.length} detail cols
                  </span>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={resetDefaults}
                      style={{ padding:'6px 16px', borderRadius:6, border:'1px solid var(--odoo-border)',
                        background:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      Reset Defaults
                    </button>
                    <button onClick={save}
                      style={{ padding:'6px 20px', borderRadius:6, border:'none',
                        background:'var(--odoo-purple)', color:'#fff',
                        fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
