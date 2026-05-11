import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const COMP_TYPES = [
  'Direct Competitor','Indirect Competitor','Potential Competitor',
  'Regional Player','National Player','Multinational',
  'In-house (Customer)','Import / Foreign','New Entrant','Other',
]
const PRICE_POSITIONS = ['Budget / Low-cost','Mid-range','Premium','Ultra-premium','Variable / Flexible']
const EMPLOYEE_BANDS  = ['1-10','11-50','51-200','201-500','501-1000','1000-5000','5000+']

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }
const sec = { fontWeight:700, fontSize:11, color:'#495057', marginBottom:10, textTransform:'uppercase', letterSpacing:'.05em' }

const BLANK = {
  name:'', type:'Direct Competitor', location:'', website:'',
  products:'', pricePositioning:'', priceMin:'', priceMax:'', currency:'INR',
  strengths:'', weaknesses:'', opportunities:'', threats:'',
  targetSegments:'', certifications:'', yearFounded:'', employeeCount:'', notes:'',
}

export default function CompetitorMaster() {
  const [comps,     setComps]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(BLANK)
  const [saving,    setSaving]    = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [sel,       setSel]       = useState(null)
  const [search,    setSearch]    = useState('')
  const [typeFilter,setTypeFilter]= useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/crm/competitors`, { headers: hdr2() })
      const d = await r.json()
      setComps(Array.isArray(d.data) ? d.data : [])
    } catch { setComps([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const F = k => ({
    value: form[k]??'',
    onChange: e => setForm(p=>({...p,[k]:e.target.value})),
    onFocus: e => e.target.style.borderColor='#714B67',
    onBlur:  e => e.target.style.borderColor='#E0D5E0',
  })

  const save = async () => {
    if (!form.name) return toast.error('Competitor name required')
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/crm/competitors/${editId}` : `${BASE_URL}/crm/competitors`
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify(form) })
      const d      = await res.json()
      if (!res.ok) throw new Error(d.error||'Save failed')
      toast.success(editId ? 'Updated' : `${form.name} added`)
      setShowForm(false); setForm(BLANK); setEditId(null); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!window.confirm('Delete this competitor?')) return
    try {
      await fetch(`${BASE_URL}/crm/competitors/${id}`, { method:'DELETE', headers: hdr2() })
      toast.success('Deleted'); setSel(null); load()
    } catch { toast.error('Delete failed') }
  }

  const wr       = c => c.totalDeals>0 ? Math.round((c.wonDeals||0)/c.totalDeals*100) : null
  const wrColor  = r => r>=60?'#155724':r>=40?'#856404':'#721C24'
  const wrBg     = r => r>=60?'#D4EDDA':r>=40?'#FFF3CD':'#F8D7DA'
  const priceBadgeStyle = p => ({
    padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700,
    background: p==='Budget / Low-cost'?'#D1ECF1': p==='Premium'||p==='Ultra-premium'?'#EDE0EA':'#FFF3CD',
    color:      p==='Budget / Low-cost'?'#0C5460': p==='Premium'||p==='Ultra-premium'?'#714B67':'#856404',
  })

  const filtered = comps.filter(c =>
    (!search     || [c.name,c.products,c.location].some(v=>v?.toLowerCase().includes(search.toLowerCase()))) &&
    (!typeFilter || c.type===typeFilter)
  )

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'#714B67'}}>
            Competitor Intelligence
            <small style={{fontSize:12,fontWeight:400,color:'#6C757D',marginLeft:8}}>{comps.length} competitors</small>
          </div>
          <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
            Universal competitor database — works for any industry
          </div>
        </div>
        <button onClick={()=>{setShowForm(true);setForm(BLANK);setEditId(null);setSel(null)}}
          style={{padding:'7px 16px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + Add Competitor
        </button>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <input placeholder="Search name, products, location..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{...inp,width:300}}/>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
          style={{...inp,width:200,cursor:'pointer'}}>
          <option value="">All Types</option>
          {COMP_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <button onClick={load} style={{padding:'7px 14px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:6,fontSize:12,cursor:'pointer'}}>Refresh</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{background:'#fff',border:'1.5px solid #714B67',borderRadius:10,padding:20,marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#714B67',marginBottom:16}}>
            {editId?'Edit Competitor':'New Competitor'}
          </div>

          {/* Identity */}
          <div style={{background:'#F8F9FA',borderRadius:8,padding:14,marginBottom:12}}>
            <div style={sec}>Identity</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:10}}>
              <div>
                <label style={lbl}>Competitor Name *</label>
                <input style={inp} {...F('name')} placeholder="Company or brand name"/>
              </div>
              <div>
                <label style={lbl}>Type</label>
                <select style={{...inp,cursor:'pointer'}} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                  {COMP_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Location / Region</label>
                <input style={inp} {...F('location')} placeholder="City, State or Country"/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
              <div><label style={lbl}>Website</label><input style={inp} {...F('website')} placeholder="www.competitor.com"/></div>
              <div>
                <label style={lbl}>Year Founded</label>
                <input type="number" style={inp} {...F('yearFounded')} placeholder="e.g. 2005"/>
              </div>
              <div>
                <label style={lbl}>Employee Count</label>
                <select style={{...inp,cursor:'pointer'}} value={form.employeeCount} onChange={e=>setForm(p=>({...p,employeeCount:e.target.value}))}>
                  <option value="">Unknown</option>
                  {EMPLOYEE_BANDS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Products & Pricing */}
          <div style={{background:'#F8F9FA',borderRadius:8,padding:14,marginBottom:12}}>
            <div style={sec}>Products / Services & Pricing</div>
            <div style={{marginBottom:10}}>
              <label style={lbl}>What Products / Services Do They Offer?</label>
              <textarea style={{...inp,height:60,resize:'none'}}
                value={form.products} onChange={e=>setForm(p=>({...p,products:e.target.value}))}
                placeholder="Free text — any industry. e.g. ERP software for SMEs / Powder coating services / Cotton yarn spinning / Ready-mix concrete supply"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12}}>
              <div>
                <label style={lbl}>Price Positioning</label>
                <select style={{...inp,cursor:'pointer'}} value={form.pricePositioning} onChange={e=>setForm(p=>({...p,pricePositioning:e.target.value}))}>
                  <option value="">Unknown</option>
                  {PRICE_POSITIONS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Currency</label>
                <select style={{...inp,cursor:'pointer'}} value={form.currency} onChange={e=>setForm(p=>({...p,currency:e.target.value}))}>
                  {['INR','USD','EUR','AED','GBP','SGD'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Price From</label><input type="number" style={inp} {...F('priceMin')} placeholder="Min"/></div>
              <div><label style={lbl}>Price To</label><input type="number" style={inp} {...F('priceMax')} placeholder="Max"/></div>
            </div>
          </div>

          {/* SWOT */}
          <div style={{background:'#F8F9FA',borderRadius:8,padding:14,marginBottom:12}}>
            <div style={sec}>SWOT Analysis</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
              <div>
                <label style={{...lbl,color:'#155724'}}>Their Strengths</label>
                <textarea style={{...inp,height:65,resize:'none',borderColor:'#C3E6CB'}}
                  value={form.strengths} onChange={e=>setForm(p=>({...p,strengths:e.target.value}))}
                  placeholder="Where do they outperform us? Price, speed, brand, features..."
                  onFocus={e=>e.target.style.borderColor='#155724'} onBlur={e=>e.target.style.borderColor='#C3E6CB'}/>
              </div>
              <div>
                <label style={{...lbl,color:'#721C24'}}>Their Weaknesses</label>
                <textarea style={{...inp,height:65,resize:'none',borderColor:'#F5C6CB'}}
                  value={form.weaknesses} onChange={e=>setForm(p=>({...p,weaknesses:e.target.value}))}
                  placeholder="Where do they fall short? Customer complaints? Service gaps?"
                  onFocus={e=>e.target.style.borderColor='#721C24'} onBlur={e=>e.target.style.borderColor='#F5C6CB'}/>
              </div>
              <div>
                <label style={{...lbl,color:'#0C5460'}}>Our Opportunities vs Them</label>
                <textarea style={{...inp,height:65,resize:'none',borderColor:'#BEE5EB'}}
                  value={form.opportunities} onChange={e=>setForm(p=>({...p,opportunities:e.target.value}))}
                  placeholder="Where can we beat them? What advantage do we have?"
                  onFocus={e=>e.target.style.borderColor='#0C5460'} onBlur={e=>e.target.style.borderColor='#BEE5EB'}/>
              </div>
              <div>
                <label style={{...lbl,color:'#856404'}}>Threats They Pose</label>
                <textarea style={{...inp,height:65,resize:'none',borderColor:'#FFEEBA'}}
                  value={form.threats} onChange={e=>setForm(p=>({...p,threats:e.target.value}))}
                  placeholder="Where could they take our customers? Are they expanding?"
                  onFocus={e=>e.target.style.borderColor='#856404'} onBlur={e=>e.target.style.borderColor='#FFEEBA'}/>
              </div>
            </div>
          </div>

          {/* Market Info */}
          <div style={{background:'#F8F9FA',borderRadius:8,padding:14,marginBottom:12}}>
            <div style={sec}>Market Information</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={lbl}>Target Customer Segments</label>
                <input style={inp} {...F('targetSegments')} placeholder="Who are their primary customers?"/>
              </div>
              <div>
                <label style={lbl}>Certifications / Standards</label>
                <input style={inp} {...F('certifications')} placeholder="ISO 9001, BIS, FDA, CE, IATF, CMMI..."/>
              </div>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <label style={lbl}>Internal Notes</label>
            <textarea style={{...inp,height:50,resize:'none'}}
              value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
              placeholder="Source of info, date gathered, any other notes..."/>
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={save} disabled={saving}
              style={{padding:'8px 24px',background:'#714B67',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {saving?'Saving...':editId?'Update':'Add Competitor'}
            </button>
            <button onClick={()=>{setShowForm(false);setForm(BLANK);setEditId(null)}}
              style={{padding:'8px 16px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:7,fontSize:13,cursor:'pointer'}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {loading ? <div style={{padding:40,textAlign:'center',color:'#6C757D'}}>Loading...</div>
      : filtered.length===0 ? (
        <div style={{padding:60,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:32,marginBottom:10}}>🎯</div>
          <div style={{fontWeight:700,fontSize:15}}>No competitors tracked yet</div>
          <div style={{fontSize:12,marginTop:4}}>Add competitors to build your competitive intelligence database</div>
          <button onClick={()=>setShowForm(true)}
            style={{marginTop:16,padding:'8px 20px',background:'#714B67',color:'#fff',border:'none',borderRadius:7,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            + Add First Competitor
          </button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {filtered.map(c => {
            const rate = wr(c)
            const isSel= sel?.id===c.id
            return (
              <div key={c.id} onClick={()=>setSel(isSel?null:c)}
                style={{background:'#fff',border:`2px solid ${isSel?'#714B67':'#E0D5E0'}`,
                  borderRadius:10,padding:16,cursor:'pointer',transition:'all .15s',
                  boxShadow:isSel?'0 4px 16px rgba(113,75,103,.2)':'none'}}
                onMouseOver={e=>{ if(!isSel) e.currentTarget.style.borderColor='#C8B8C8' }}
                onMouseOut={e=>{ if(!isSel) e.currentTarget.style.borderColor='#E0D5E0' }}>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                    <div style={{fontSize:11,color:'#6C757D'}}>{c.type}{c.location?` · ${c.location}`:''}</div>
                  </div>
                  {rate!==null&&(
                    <div style={{textAlign:'center',background:wrBg(rate),borderRadius:8,
                      padding:'4px 8px',marginLeft:8,flexShrink:0}}>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:16,color:wrColor(rate)}}>{rate}%</div>
                      <div style={{fontSize:9,color:wrColor(rate),fontWeight:700}}>WIN</div>
                    </div>
                  )}
                </div>

                {c.products&&(
                  <div style={{fontSize:11,color:'#495057',background:'#F8F9FA',borderRadius:5,
                    padding:'5px 8px',marginBottom:8,
                    display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                    {c.products}
                  </div>
                )}

                {c.pricePositioning&&<div style={{marginBottom:8}}><span style={priceBadgeStyle(c.pricePositioning)}>{c.pricePositioning}</span></div>}

                {c.totalDeals>0&&(
                  <>
                    <div style={{display:'flex',gap:10,fontSize:11,marginBottom:5}}>
                      <span style={{color:'#155724',fontWeight:700}}>Won: {c.wonDeals||0}</span>
                      <span style={{color:'#721C24',fontWeight:700}}>Lost: {c.lostDeals||0}</span>
                      <span style={{color:'#6C757D'}}>Total: {c.totalDeals}</span>
                    </div>
                    <div style={{background:'#F8D7DA',borderRadius:4,height:5,overflow:'hidden',marginBottom:8}}>
                      <div style={{height:'100%',width:`${rate}%`,background:'#155724',borderRadius:4}}/>
                    </div>
                  </>
                )}

                {c.strengths&&<div style={{fontSize:10,color:'#155724',background:'#D4EDDA',borderRadius:4,padding:'3px 7px',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>+ {c.strengths}</div>}
                {c.weaknesses&&<div style={{fontSize:10,color:'#721C24',background:'#F8D7DA',borderRadius:4,padding:'3px 7px',marginBottom:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>- {c.weaknesses}</div>}

                <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>{setForm({...BLANK,...c});setEditId(c.id);setShowForm(true);setSel(null)}}
                    style={{flex:1,padding:'5px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>Edit</button>
                  <button onClick={()=>del(c.id)}
                    style={{padding:'5px 10px',background:'#F8D7DA',color:'#721C24',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontWeight:600}}>Del</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Panel */}
      {sel&&(
        <div style={{marginTop:14,background:'#fff',border:'1.5px solid #714B67',borderRadius:10,padding:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'#714B67'}}>{sel.name}</div>
              <div style={{fontSize:12,color:'#6C757D'}}>{sel.type} · {sel.location||'Location unknown'} {sel.yearFounded?`· Est. ${sel.yearFounded}`:''}</div>
            </div>
            <button onClick={()=>setSel(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:'#6C757D'}}>&times;</button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            {/* Identity + Products */}
            <div>
              <div style={{fontWeight:700,fontSize:11,color:'#495057',marginBottom:8,textTransform:'uppercase'}}>Company Info</div>
              {[['Website',sel.website],['Employees',sel.employeeCount],['Certifications',sel.certifications],['Target Segments',sel.targetSegments]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                  <span style={{color:'#6C757D',fontWeight:600}}>{k}</span>
                  <span style={{color:'#333',textAlign:'right',maxWidth:'60%'}}>{v}</span>
                </div>
              ))}
              {sel.pricePositioning&&<div style={{marginTop:8}}><span style={priceBadgeStyle(sel.pricePositioning)}>{sel.pricePositioning}</span></div>}
              {sel.products&&(
                <div style={{marginTop:10}}>
                  <div style={{fontWeight:600,fontSize:11,color:'#495057',marginBottom:4}}>Products / Services</div>
                  <div style={{fontSize:12,color:'#333',background:'#F8F9FA',borderRadius:6,padding:8,lineHeight:1.6}}>{sel.products}</div>
                </div>
              )}
            </div>

            {/* SWOT */}
            <div>
              <div style={{fontWeight:700,fontSize:11,color:'#495057',marginBottom:8,textTransform:'uppercase'}}>SWOT</div>
              {[['Strengths',sel.strengths,'#155724','#D4EDDA'],['Weaknesses',sel.weaknesses,'#721C24','#F8D7DA'],
                ['Opportunities',sel.opportunities,'#0C5460','#D1ECF1'],['Threats',sel.threats,'#856404','#FFF3CD']].filter(([,v])=>v).map(([k,v,c,bg])=>(
                <div key={k} style={{marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:c,textTransform:'uppercase',marginBottom:3}}>{k}</div>
                  <div style={{fontSize:12,color:'#333',background:bg,borderRadius:6,padding:'6px 10px',lineHeight:1.6}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Win/Loss */}
            <div>
              <div style={{fontWeight:700,fontSize:11,color:'#495057',marginBottom:8,textTransform:'uppercase'}}>Win / Loss Record</div>
              {sel.totalDeals>0?(
                <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
                    {[['Won',sel.wonDeals||0,'#155724','#D4EDDA'],['Lost',sel.lostDeals||0,'#721C24','#F8D7DA'],['Total',sel.totalDeals,'#714B67','#EDE0EA']].map(([l,v,c,bg])=>(
                      <div key={l} style={{textAlign:'center',background:bg,borderRadius:8,padding:'10px 6px'}}>
                        <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:20,color:c}}>{v}</div>
                        <div style={{fontSize:9,fontWeight:700,color:c,textTransform:'uppercase'}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:700,marginBottom:4}}>
                    <span>Win rate</span><span style={{color:wrColor(wr(sel))}}>{wr(sel)}%</span>
                  </div>
                  <div style={{background:'#F8D7DA',borderRadius:6,height:8,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${wr(sel)}%`,background:'#155724',borderRadius:6}}/>
                  </div>
                </>
              ):(
                <div style={{color:'#6C757D',fontSize:12,fontStyle:'italic',textAlign:'center',padding:20,border:'1px dashed #E0D5E0',borderRadius:8}}>
                  No deal data yet.<br/>Add competitors to leads to<br/>track win/loss records.
                </div>
              )}
              {sel.notes&&(
                <div style={{marginTop:10,background:'#FFF3CD',borderRadius:6,padding:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:'#856404',marginBottom:4}}>Notes</div>
                  <div style={{fontSize:12,color:'#856404'}}>{sel.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
