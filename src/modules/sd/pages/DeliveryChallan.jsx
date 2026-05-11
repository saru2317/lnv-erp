import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const DC_TYPES = [
  { key:'outward', label:'Outward DC', icon:'\u2b06\ufe0f', desc:'Goods sent to customer / job work', color:'#0C5460', bg:'#D1ECF1' },
  { key:'inward',  label:'Inward DC',  icon:'\u2b07\ufe0f', desc:'Goods received from customer',      color:'#155724', bg:'#D4EDDA' },
]
const DC_PURPOSES = ['Job Work','Sales Return','Goods on Approval','Exhibition','Repair & Return','Other']
const STATUS_CFG  = {
  OPEN:      { bg:'#CCE5FF', c:'#004085' },
  IN_TRANSIT:{ bg:'#FFF3CD', c:'#856404' },
  DELIVERED: { bg:'#D4EDDA', c:'#155724' },
  CLOSED:    { bg:'#E2E3E5', c:'#383D41' },
  CANCELLED: { bg:'#F8D7DA', c:'#721C24' },
}

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

const BLANK = {
  dcType:'outward', customerName:'', customerAddress:'', purpose:'Job Work',
  vehicleNo:'', driverName:'', driverPhone:'', soRef:'', ewbNo:'', remarks:'',
  lines:[{ itemName:'', qty:'', unit:'NOS', description:'' }]
}

export default function DeliveryChallan() {
  const navigate  = useNavigate()
  const [dcs,       setDcs]       = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(BLANK)
  const [saving,    setSaving]    = useState(false)
  const [filterType,setFilterType]= useState('')
  const [search,    setSearch]    = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/sd/delivery-challan`, { headers: hdr2() })
      const d = await r.json()
      setDcs(Array.isArray(d.data) ? d.data : [])
    } catch { setDcs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addLine    = () => setForm(p=>({...p, lines:[...p.lines,{itemName:'',qty:'',unit:'NOS',description:''}]}))
  const removeLine = i => setForm(p=>({...p, lines:p.lines.filter((_,j)=>j!==i)}))
  const updateLine = (i,k,v) => setForm(p=>({...p, lines:p.lines.map((l,j)=>j===i?{...l,[k]:v}:l)}))

  const save = async () => {
    if (!form.customerName) return toast.error('Customer name required')
    if (!form.vehicleNo)    return toast.error('Vehicle number required')
    if (!form.lines.some(l=>l.itemName)) return toast.error('Add at least one item')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/sd/delivery-challan`, {
        method:'POST', headers: hdr(), body: JSON.stringify(form)
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error||'Failed')
      toast.success(`DC ${d.data?.dcNo} created!`)
      setShowForm(false); setForm(BLANK); load()
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${BASE_URL}/sd/delivery-challan/${id}/status`, {
        method:'PATCH', headers: hdr(), body: JSON.stringify({ status })
      })
      toast.success(`Status updated to ${status}`)
      load()
    } catch { toast.error('Update failed') }
  }

  const filtered = dcs.filter(d =>
    (!filterType || d.dcType===filterType) &&
    (!search     || d.customerName?.toLowerCase().includes(search.toLowerCase()) || d.dcNo?.toLowerCase().includes(search.toLowerCase()))
  )

  // Stats
  const openCount    = dcs.filter(d=>d.status==='OPEN'||d.status==='IN_TRANSIT').length
  const closedCount  = dcs.filter(d=>d.status==='DELIVERED'||d.status==='CLOSED').length
  const outwardCount = dcs.filter(d=>d.dcType==='outward').length
  const inwardCount  = dcs.filter(d=>d.dcType==='inward').length

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Delivery Challan
            <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>DC Register · {dcs.length} records</small>
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            Outward DC (goods sent) · Inward DC (goods received) · e-Way Bill ready
          </div>
        </div>
        <button onClick={()=>{setShowForm(true);setForm(BLANK)}}
          style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + New DC
        </button>
      </div>

      {/* KPI chips */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[
          {l:'Outward', v:outwardCount, bg:'#D1ECF1', c:'#0C5460'},
          {l:'Inward',  v:inwardCount,  bg:'#D4EDDA', c:'#155724'},
          {l:'Open / In-Transit', v:openCount, bg:'#FFF3CD', c:'#856404'},
          {l:'Closed', v:closedCount, bg:'#E2E3E5', c:'#383D41'},
        ].map(k=>(
          <div key={k.l} style={{padding:'8px 16px',borderRadius:8,background:k.bg,border:`1px solid ${k.c}22`,textAlign:'center',minWidth:90}}>
            <div style={{fontSize:10,fontWeight:700,color:k.c,textTransform:'uppercase'}}>{k.l}</div>
            <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:20,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input placeholder="Search DC #, customer..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{...inp,width:260}}/>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          style={{...inp,width:160,cursor:'pointer'}}>
          <option value="">All Types</option>
          <option value="outward">Outward DC</option>
          <option value="inward">Inward DC</option>
        </select>
        <button onClick={load} style={{padding:'7px 14px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Refresh</button>
      </div>

      {/* New DC Form */}
      {showForm&&(
        <div style={{background:'#fff',border:'1.5px solid #714B67',borderRadius:10,padding:20,marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#714B67',marginBottom:14}}>New Delivery Challan</div>

          {/* DC Type */}
          <div style={{display:'flex',gap:10,marginBottom:14}}>
            {DC_TYPES.map(t=>(
              <div key={t.key} onClick={()=>setForm(p=>({...p,dcType:t.key}))}
                style={{flex:1,padding:'12px 16px',borderRadius:8,cursor:'pointer',textAlign:'center',
                  border:`2px solid ${form.dcType===t.key?t.color:'#E0D5E0'}`,
                  background:form.dcType===t.key?t.bg:'#fff'}}>
                <div style={{fontSize:24,marginBottom:4}}>{t.icon}</div>
                <div style={{fontWeight:700,fontSize:13,color:t.color}}>{t.label}</div>
                <div style={{fontSize:11,color:'#6C757D'}}>{t.desc}</div>
              </div>
            ))}
          </div>

          {/* Customer + Vehicle */}
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Customer / Party Name *</label>
              <input style={inp} value={form.customerName} onChange={e=>setForm(p=>({...p,customerName:e.target.value}))}
                placeholder="Company name" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Purpose</label>
              <select style={{...inp,cursor:'pointer'}} value={form.purpose} onChange={e=>setForm(p=>({...p,purpose:e.target.value}))}>
                {DC_PURPOSES.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>SO / PO Ref</label>
              <input style={inp} value={form.soRef} onChange={e=>setForm(p=>({...p,soRef:e.target.value}))}
                placeholder="SO-2026-0001" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Vehicle No *</label>
              <input style={inp} value={form.vehicleNo} onChange={e=>setForm(p=>({...p,vehicleNo:e.target.value.toUpperCase()}))}
                placeholder="TN 02 AB 1234" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Driver Name</label>
              <input style={inp} value={form.driverName} onChange={e=>setForm(p=>({...p,driverName:e.target.value}))}
                placeholder="Driver name" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Driver Phone</label>
              <input style={inp} value={form.driverPhone} onChange={e=>setForm(p=>({...p,driverPhone:e.target.value}))}
                placeholder="9876543210" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>e-Way Bill No.</label>
              <input style={inp} value={form.ewbNo} onChange={e=>setForm(p=>({...p,ewbNo:e.target.value}))}
                placeholder="421234567890" onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
              <div style={{fontSize:10,color:'#6C757D',marginTop:2}}>Required if value {'>'} ₹50,000</div>
            </div>
          </div>

          {/* Items */}
          <div style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <label style={{...lbl,display:'inline'}}>Items / Goods</label>
              <button onClick={addLine} style={{padding:'3px 12px',background:'#714B67',color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:700}}>+ Add Line</button>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:'#F8F4F8'}}>
                {['Item / Description','Qty','Unit','Remarks',''].map(h=>(
                  <th key={h} style={{padding:'6px 10px',textAlign:'left',fontWeight:700,fontSize:10,color:'#714B67'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {form.lines.map((l,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #F0EEEB'}}>
                    <td style={{padding:'4px 6px'}}><input style={inp} value={l.itemName} onChange={e=>updateLine(i,'itemName',e.target.value)} placeholder="Item name or description"/></td>
                    <td style={{padding:'4px 6px'}}><input type="number" style={{...inp,width:70}} value={l.qty} onChange={e=>updateLine(i,'qty',e.target.value)} placeholder="0"/></td>
                    <td style={{padding:'4px 6px'}}>
                      <select style={{...inp,width:80,cursor:'pointer'}} value={l.unit} onChange={e=>updateLine(i,'unit',e.target.value)}>
                        {['NOS','KGS','MTR','SQFT','SET','BOX','LOT'].map(u=><option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={{padding:'4px 6px'}}><input style={inp} value={l.description} onChange={e=>updateLine(i,'description',e.target.value)} placeholder="Additional details"/></td>
                    <td style={{padding:'4px 6px'}}>
                      {form.lines.length>1&&<button onClick={()=>removeLine(i)} style={{background:'#F8D7DA',border:'none',borderRadius:4,color:'#721C24',cursor:'pointer',padding:'3px 8px',fontSize:12,fontWeight:700}}>&times;</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{marginBottom:14}}>
            <label style={lbl}>Remarks</label>
            <input style={inp} value={form.remarks} onChange={e=>setForm(p=>({...p,remarks:e.target.value}))}
              placeholder="Additional instructions..." onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={save} disabled={saving}
              style={{padding:'8px 24px',background:'#714B67',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {saving?'Saving...':'Create DC'}
            </button>
            <button onClick={()=>{setShowForm(false);setForm(BLANK)}}
              style={{padding:'8px 16px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:7,fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}

      {/* DC Table */}
      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>
      : filtered.length===0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:28,marginBottom:8}}>\uD83D\uDE9A</div>
          <div style={{fontWeight:700}}>No delivery challans found</div>
          <div style={{fontSize:12,marginTop:4}}>Create DCs to track goods movement</div>
        </div>
      ) : (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{background:'#F8F4F8',borderBottom:'2px solid #E0D5E0'}}>
              {['DC #','Type','Customer','Purpose','Vehicle','EWB No.','Date','Status',''].map(h=>(
                <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:700,fontSize:11,color:'#714B67',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((d,i)=>{
                const dt = DC_TYPES.find(t=>t.key===d.dcType)||DC_TYPES[0]
                const sc = STATUS_CFG[d.status]||STATUS_CFG.OPEN
                return (
                  <tr key={d.id||i} style={{borderBottom:'1px solid #F0EEEB',background:i%2===0?'#fff':'#FAFAFA'}}>
                    <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontWeight:700,color:'#714B67',fontSize:11}}>{d.dcNo||`DC-${d.id}`}</td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:dt.bg,color:dt.color}}>{dt.icon} {dt.label}</span>
                    </td>
                    <td style={{padding:'9px 12px',fontWeight:600}}>{d.customerName}</td>
                    <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D'}}>{d.purpose}</td>
                    <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:700}}>{d.vehicleNo}</td>
                    <td style={{padding:'9px 12px',fontFamily:'DM Mono,monospace',fontSize:11,color:'#6C757D'}}>{d.ewbNo||'—'}</td>
                    <td style={{padding:'9px 12px',fontSize:11,color:'#6C757D'}}>
                      {d.createdAt?new Date(d.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'-'}
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,background:sc.bg,color:sc.c}}>{d.status||'OPEN'}</span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <div style={{display:'flex',gap:4}}>
                        {d.status==='OPEN'&&(
                          <button onClick={()=>updateStatus(d.id,'IN_TRANSIT')}
                            style={{padding:'3px 8px',background:'#FFF3CD',color:'#856404',border:'none',borderRadius:5,fontSize:10,cursor:'pointer',fontWeight:700}}>
                            Dispatch
                          </button>
                        )}
                        {d.status==='IN_TRANSIT'&&(
                          <button onClick={()=>updateStatus(d.id,'DELIVERED')}
                            style={{padding:'3px 8px',background:'#D4EDDA',color:'#155724',border:'none',borderRadius:5,fontSize:10,cursor:'pointer',fontWeight:700}}>
                            Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
