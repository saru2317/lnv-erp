import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ITEMS, INDUSTRIES, PRODUCTION_TYPES, MOULDS, calcShotOutput } from './_ppConfig'

export default function ItemMaster() {
  const nav = useNavigate()
  const [items,    setItems]    = useState(ITEMS)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [search,   setSearch]   = useState('')
  const [indFilter,setIndFilter]= useState('All')
  const [form, setForm] = useState({ code:'', name:'', uom:'Pieces', industry:'surface_treatment', prodType:'batch', mouldId:'', cavity:'', batchCapacity:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const indList   = Object.entries(INDUSTRIES)
  const mouldInds = ['injection_moulding','blow_moulding','rubber_moulding']
  const isMould   = mouldInds.includes(form.industry) || form.prodType==='mould'

  const handleIndustryChange = k => {
    const ind = INDUSTRIES[k]
    set('industry', k)
    set('prodType', ind.prodType)
    if(!mouldInds.includes(k)){ set('mouldId',''); set('cavity','') }
  }

  const handleSave = () => {
    if(!form.code||!form.name){alert('Item code and name are required');return}
    const ind   = INDUSTRIES[form.industry]
    const stages= ind.stages.map(s=>s.name)
    if(editId){
      setItems(is=>is.map(i=>i.id===editId?{...i,...form,cavity:form.cavity?parseInt(form.cavity):null,batchCapacity:form.batchCapacity?parseInt(form.batchCapacity):null,stages}:i))
      setEditId(null)
    } else {
      const id=`ITM-${String(items.length+1).padStart(3,'0')}`
      setItems(is=>[...is,{id,...form,cavity:form.cavity?parseInt(form.cavity):null,batchCapacity:form.batchCapacity?parseInt(form.batchCapacity):null,stages,mouldId:form.mouldId||null}])
    }
    setForm({code:'',name:'',uom:'Pieces',industry:'surface_treatment',prodType:'batch',mouldId:'',cavity:'',batchCapacity:''})
    setShowForm(false)
  }

  const handleEdit = item => {
    setForm({code:item.code,name:item.name,uom:item.uom,industry:item.industry,prodType:item.prodType,mouldId:item.mouldId||'',cavity:item.cavity||'',batchCapacity:item.batchCapacity||''})
    setEditId(item.id); setShowForm(true)
  }

  const filtered = items.filter(i=>{
    const mS = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
    const mI = indFilter==='All' || i.industry===indFilter
    return mS&&mI
  })

  const prodTypeColor = t => ({job_work:'var(--odoo-purple)',batch:'var(--odoo-blue)',mould:'var(--odoo-orange)',continuous:'var(--odoo-green)',discrete:'var(--odoo-red)'}[t]||'var(--odoo-gray)')

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Item Master <small>{items.length} items · Routing linked per item</small></div>
        <div className="fi-lv-actions">
          <input className="sd-search" placeholder=" Item code / name…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:'180px'}} />
          <select className="sd-select" value={indFilter} onChange={e=>setIndFilter(e.target.value)}>
            <option value="All">All Industries</option>
            {indList.map(([k,v])=><option key={k} value={k}>{v.icon} {v.name}</option>)}
          </select>
          <button className="btn btn-p btn-s" onClick={()=>{setEditId(null);setShowForm(true)}}>+ New Item</button>
        </div>
      </div>

      {/* Form */}
      {showForm&&(
        <div className="fi-panel" style={{marginBottom:'16px',border:'2px solid var(--odoo-purple)'}}>
          <div className="fi-panel-hdr"><h3>{editId?' Edit Item':' New Item'}</h3></div>
          <div className="fi-panel-body">
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'20px'}}>
              <div>
                <div className="sd-form-grid" style={{marginBottom:'12px'}}>
                  <div className="sd-field"><label>Item Code *</label><input value={form.code} onChange={e=>set('code',e.target.value)} placeholder="e.g. BRK-BRKT-001" /></div>
                  <div className="sd-field"><label>Item Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Brake Bracket" /></div>
                  <div className="sd-field"><label>UOM</label>
                    <select value={form.uom} onChange={e=>set('uom',e.target.value)}>
                      {['Pieces','Kg','Nos','Meters','Litre','Sets'].map(u=><option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="sd-field"><label>Production Type</label>
                    <select value={form.prodType} onChange={e=>set('prodType',e.target.value)}>
                      {Object.entries(PRODUCTION_TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                  </div>
                  {form.prodType==='batch'&&(
                    <div className="sd-field"><label>Batch Capacity (qty/batch)</label><input type="number" value={form.batchCapacity} onChange={e=>set('batchCapacity',e.target.value)} placeholder="e.g. 500" /></div>
                  )}
                  {isMould&&(
                    <>
                      <div className="sd-field"><label>Mould ID</label>
                        <select value={form.mouldId} onChange={e=>{set('mouldId',e.target.value);const m=MOULDS.find(m=>m.id===e.target.value);if(m)set('cavity',m.cavity)}}>
                          <option value="">Select Mould</option>
                          {MOULDS.filter(m=>m.industry===form.industry||true).map(m=><option key={m.id} value={m.id}>{m.id} — {m.name} (C:{m.cavity})</option>)}
                        </select>
                      </div>
                      <div className="sd-field"><label>Cavity Count</label><input type="number" value={form.cavity} onChange={e=>set('cavity',e.target.value)} placeholder="e.g. 4" /></div>
                    </>
                  )}
                </div>
              </div>

              {/* Industry selector */}
              <div>
                <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',textTransform:'uppercase',marginBottom:'8px'}}>Industry *</div>
                <div style={{display:'flex',flexDirection:'column',gap:'4px',maxHeight:'280px',overflow:'auto'}}>
                  {indList.map(([k,v])=>(
                    <div key={k} onClick={()=>handleIndustryChange(k)}
                      style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 10px',borderRadius:'6px',cursor:'pointer',
                        border:'1px solid',borderColor:form.industry===k?'var(--odoo-purple)':'var(--odoo-border)',
                        background:form.industry===k?'#EDE0EA':'#F8F9FA'}}>
                      <span style={{fontSize:'16px'}}>{v.icon}</span>
                      <div>
                        <div style={{fontSize:'11px',fontWeight:'700',color:form.industry===k?'var(--odoo-purple)':'var(--odoo-text)'}}>{v.name}</div>
                        <div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{v.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-route preview */}
            {form.industry&&(
              <div style={{marginTop:'12px',padding:'12px',background:'#F8F9FA',borderRadius:'8px',border:'1px solid var(--odoo-border)'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'var(--odoo-gray)',marginBottom:'8px'}}> AUTO-ASSIGNED ROUTE (from industry stages)</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'0',alignItems:'center'}}>
                  {INDUSTRIES[form.industry]?.stages.map((s,i)=>(
                    <React.Fragment key={s.id}>
                      <div style={{padding:'3px 8px',background:'var(--odoo-purple)',color:'#fff',borderRadius:'4px',fontSize:'10px',fontWeight:'700'}}>{i+1}. {s.name}</div>
                      {i<INDUSTRIES[form.industry].stages.length-1&&<span style={{fontSize:'14px',color:'var(--odoo-gray)',padding:'0 3px'}}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{marginTop:'6px',fontSize:'10px',color:'var(--odoo-gray)'}}>You can customize this route in Item Routing page after saving.</div>
              </div>
            )}

            {/* Mould calc preview */}
            {isMould&&form.cavity>0&&(
              <div style={{marginTop:'10px',padding:'10px 14px',background:'#FFF3CD',borderRadius:'6px',fontSize:'12px',color:'#856404'}}>
                 <strong>Shot Calculator:</strong> For 1000 pcs with cavity {form.cavity} → <strong>{Math.ceil(1000/parseInt(form.cavity||1))} shots</strong> needed. Output = {Math.ceil(1000/parseInt(form.cavity||1))*parseInt(form.cavity||1)} pcs
              </div>
            )}

            <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
              <button className="btn btn-p btn-s" onClick={handleSave}> {editId?'Update':'Save'} Item</button>
              <button className="btn btn-s sd-bsm" onClick={()=>{setShowForm(false);setEditId(null)}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Items list */}
      <div className="sd-table-wrap">
        <table className="sd-table">
          <thead>
            <tr><th>Item Code</th><th>Name</th><th>Industry</th><th>Prod. Type</th><th>UOM</th><th>Mould/Batch</th><th>Stages</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(item=>{
              const ind  = INDUSTRIES[item.industry]
              const pt   = PRODUCTION_TYPES[item.prodType]
              const mld  = MOULDS.find(m=>m.id===item.mouldId)
              return (
                <tr key={item.id}>
                  <td><strong style={{fontFamily:'DM Mono,monospace',color:'var(--odoo-purple)',fontSize:'12px'}}>{item.code}</strong></td>
                  <td><div style={{fontWeight:'700',fontSize:'13px'}}>{item.name}</div><div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{item.id}</div></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'16px'}}>{ind?.icon}</span>
                      <span style={{fontSize:'11px',fontWeight:'600'}}>{ind?.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{padding:'3px 8px',borderRadius:'8px',fontSize:'10px',fontWeight:'700',
                      background:prodTypeColor(item.prodType)+'22',color:prodTypeColor(item.prodType)}}>
                      {pt?.icon} {pt?.label}
                    </span>
                  </td>
                  <td style={{fontSize:'12px'}}>{item.uom}</td>
                  <td style={{fontSize:'11px'}}>
                    {item.prodType==='mould'&&item.cavity
                      ? <div>
                          <div style={{fontWeight:'700',color:'var(--odoo-orange)'}}> Cavity: {item.cavity}</div>
                          {mld&&<div style={{fontSize:'10px',color:'var(--odoo-gray)'}}>{mld.name}</div>}
                        </div>
                      : item.batchCapacity
                        ? <div style={{fontWeight:'700',color:'var(--odoo-blue)'}}>🪣 {item.batchCapacity} {item.uom}/batch</div>
                        : <span style={{color:'var(--odoo-gray)'}}>—</span>
                    }
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'2px',flexWrap:'wrap',maxWidth:'240px'}}>
                      {(item.stages||[]).slice(0,3).map((s,i)=>(
                        <span key={i} style={{padding:'1px 5px',background:'#EDE0EA',borderRadius:'3px',fontSize:'9px',fontWeight:'600',color:'var(--odoo-purple)'}}>{i+1}.{s.split(' ')[0]}</span>
                      ))}
                      {(item.stages||[]).length>3&&<span style={{fontSize:'10px',color:'var(--odoo-gray)'}}>+{item.stages.length-3} more</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex',gap:'4px'}}>
                      <button className="btn-act-edit" onClick={()=>handleEdit(item)}></button>
                      <button className="btn-act-view" onClick={()=>nav(`/pp/item-routing?id=${item.id}`)}> Route</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginTop:'14px'}}>
        {[
          {l:'Total Items',       v:items.length,                                    c:'var(--odoo-purple)',i:''},
          {l:'Batch Process',     v:items.filter(i=>i.prodType==='batch').length,    c:'var(--odoo-blue)',  i:'🪣'},
          {l:'Mould Type',        v:items.filter(i=>i.prodType==='mould').length,    c:'var(--odoo-orange)',i:''},
          {l:'Discrete',          v:items.filter(i=>i.prodType==='discrete').length, c:'var(--odoo-green)', i:''},
          {l:'Industries Covered',v:[...new Set(items.map(i=>i.industry))].length,  c:'var(--odoo-red)',   i:''},
        ].map(k=>(
          <div key={k.l} className="crm-kpi-card" style={{borderLeftColor:k.c}}>
            <div className="crm-kpi-icon">{k.i}</div>
            <div className="crm-kpi-val" style={{color:k.c}}>{k.v}</div>
            <div className="crm-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
