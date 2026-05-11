// ═══════════════════════════════════════════════════════════
// DealCompetitor.jsx
// Add to LeadView.jsx as a "Competitors" tab
// Usage: <DealCompetitor leadId={id} leadName={lead.company} />
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const INR  = v => '\u20b9' + parseFloat(v||0).toLocaleString('en-IN',{minimumFractionDigits:0})

const LOSE_REASONS = [
  'Price too high', 'Relationship / existing vendor', 'Faster delivery by competitor',
  'Better quality offered', 'No CED / process not available', 'Customer doing in-house',
  'Budget cut / project cancelled', 'Other'
]
const WIN_REASONS = [
  'Better price', 'Better quality', 'Faster delivery', 'Existing relationship',
  'Technical capability (CED/Special process)', 'After-sales support', 'Other'
]

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }

export default function DealCompetitor({ leadId, leadName }) {
  const [dealComps, setDealComps]   = useState([])
  const [allComps,  setAllComps]    = useState([])
  const [loading,   setLoading]     = useState(true)
  const [showForm,  setShowForm]    = useState(false)
  const [saving,    setSaving]      = useState(false)
  const [form,      setForm]        = useState({
    competitorId:'', competitorName:'', theirPrice:'', ourPrice:'',
    result:'', winReason:'', loseReason:'', notes:''
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dc, ac] = await Promise.all([
        fetch(`${BASE_URL}/crm/leads/${leadId}/competitors`, { headers: hdr2() }).then(r=>r.json()),
        fetch(`${BASE_URL}/crm/competitors`, { headers: hdr2() }).then(r=>r.json()),
      ])
      setDealComps(Array.isArray(dc.data) ? dc.data : [])
      setAllComps(Array.isArray(ac.data) ? ac.data : [])
    } catch { setDealComps([]); setAllComps([]) }
    finally { setLoading(false) }
  }, [leadId])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.competitorName) return toast.error('Select a competitor')
    setSaving(true)
    try {
      const res = await fetch(`${BASE_URL}/crm/leads/${leadId}/competitors`, {
        method:'POST', headers: hdr(),
        body: JSON.stringify({ ...form, leadId:+leadId, leadName })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Competitor added to this deal')
      setShowForm(false)
      setForm({ competitorId:'', competitorName:'', theirPrice:'', ourPrice:'', result:'', winReason:'', loseReason:'', notes:'' })
      load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const priceDiff = form.theirPrice && form.ourPrice
    ? parseFloat(form.ourPrice) - parseFloat(form.theirPrice)
    : null

  if (loading) return <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading competitors...</div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,color:'#714B67'}}>
          Competing on this deal ({dealComps.length})
        </div>
        <button onClick={()=>setShowForm(!showForm)}
          style={{padding:'6px 14px',background:'#714B67',color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer'}}>
          + Add Competitor
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{background:'#F8F4F8',border:'1px solid #E0D5E0',borderRadius:8,padding:16,marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Competitor *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.competitorId}
                onChange={e=>{
                  const comp = allComps.find(c=>String(c.id)===e.target.value)
                  setForm(p=>({...p, competitorId:e.target.value, competitorName:comp?.name||''}))
                }}>
                <option value="">-- Select competitor --</option>
                {allComps.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="other">Other (not in list)</option>
              </select>
              {form.competitorId==='other'&&(
                <input style={{...inp,marginTop:6}} placeholder="Competitor name"
                  value={form.competitorName} onChange={e=>setForm(p=>({...p,competitorName:e.target.value}))}/>
              )}
            </div>
            <div>
              <label style={lbl}>Their Price (₹)</label>
              <input type="number" style={inp} value={form.theirPrice}
                onChange={e=>setForm(p=>({...p,theirPrice:e.target.value}))}
                placeholder="Their quoted price"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
            <div>
              <label style={lbl}>Our Price (₹)</label>
              <input type="number" style={inp} value={form.ourPrice}
                onChange={e=>setForm(p=>({...p,ourPrice:e.target.value}))}
                placeholder="Our quoted price"
                onFocus={e=>e.target.style.borderColor='#714B67'} onBlur={e=>e.target.style.borderColor='#E0D5E0'}/>
            </div>
          </div>

          {/* Price gap indicator */}
          {priceDiff !== null && (
            <div style={{marginBottom:12,padding:'8px 14px',borderRadius:6,
              background:priceDiff>0?'#F8D7DA':'#D4EDDA',
              border:`1px solid ${priceDiff>0?'#F5C6CB':'#C3E6CB'}`}}>
              <div style={{fontSize:12,fontWeight:700,color:priceDiff>0?'#721C24':'#155724'}}>
                {priceDiff>0
                  ? `⚠ We are ₹${Math.abs(priceDiff).toFixed(2)} MORE expensive than competitor`
                  : `✓ We are ₹${Math.abs(priceDiff).toFixed(2)} CHEAPER than competitor`}
              </div>
              <div style={{fontSize:11,color:'#6C757D',marginTop:2}}>
                Price gap: {priceDiff>0?'+':''}{((priceDiff/parseFloat(form.theirPrice||1))*100).toFixed(1)}%
              </div>
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Result</label>
              <select style={{...inp,cursor:'pointer'}} value={form.result}
                onChange={e=>setForm(p=>({...p,result:e.target.value}))}>
                <option value="">Pending (deal not closed)</option>
                <option value="WON">Won against this competitor</option>
                <option value="LOST">Lost to this competitor</option>
                <option value="TIED">Both shortlisted</option>
              </select>
            </div>
            {form.result==='WON'&&(
              <div>
                <label style={lbl}>Why We Won</label>
                <select style={{...inp,cursor:'pointer'}} value={form.winReason}
                  onChange={e=>setForm(p=>({...p,winReason:e.target.value}))}>
                  <option value="">Select reason...</option>
                  {WIN_REASONS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
            )}
            {form.result==='LOST'&&(
              <div>
                <label style={lbl}>Why We Lost</label>
                <select style={{...inp,cursor:'pointer'}} value={form.loseReason}
                  onChange={e=>setForm(p=>({...p,loseReason:e.target.value}))}>
                  <option value="">Select reason...</option>
                  {LOSE_REASONS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{marginBottom:12}}>
            <label style={lbl}>Notes</label>
            <textarea style={{...inp,height:55,resize:'none'}}
              value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
              placeholder="Customer feedback, competitor strategy, any intel gathered..."/>
          </div>

          <div style={{display:'flex',gap:8}}>
            <button onClick={save} disabled={saving}
              style={{padding:'7px 20px',background:'#714B67',color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {saving?'Saving...':'Add to Deal'}
            </button>
            <button onClick={()=>setShowForm(false)}
              style={{padding:'7px 14px',background:'#fff',border:'1px solid #E0D5E0',borderRadius:7,fontSize:12,cursor:'pointer'}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Deal competitors list */}
      {dealComps.length===0 ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D',border:'2px dashed #E0D5E0',borderRadius:8}}>
          <div style={{fontSize:22,marginBottom:6}}>\uD83C\uDFAF</div>
          <div style={{fontWeight:600}}>No competitors tracked for this deal</div>
          <div style={{fontSize:12,marginTop:4}}>Track who else is bidding on this job</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {dealComps.map((dc,i)=>{
            const resultColor = dc.result==='WON'?'#155724':dc.result==='LOST'?'#721C24':'#856404'
            const resultBg    = dc.result==='WON'?'#D4EDDA':dc.result==='LOST'?'#F8D7DA':'#FFF3CD'
            const priceDiff2  = dc.ourPrice && dc.theirPrice ? parseFloat(dc.ourPrice) - parseFloat(dc.theirPrice) : null
            return (
              <div key={i} style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,
                padding:14,borderLeft:`4px solid ${resultColor}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{dc.competitorName}</div>
                    {dc.notes&&<div style={{fontSize:11,color:'#6C757D',marginTop:2}}>{dc.notes}</div>}
                  </div>
                  {dc.result&&(
                    <span style={{padding:'3px 12px',borderRadius:10,fontSize:11,fontWeight:700,
                      background:resultBg,color:resultColor}}>
                      {dc.result==='WON'?'🏆 Won':dc.result==='LOST'?'✗ Lost':'⚡ Tied'}
                    </span>
                  )}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                  {dc.theirPrice&&(
                    <div style={{textAlign:'center',background:'#F8F9FA',borderRadius:6,padding:'8px 6px'}}>
                      <div style={{fontSize:10,color:'#6C757D',fontWeight:600,textTransform:'uppercase'}}>Their Price</div>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:15,color:'#721C24'}}>
                        {INR(dc.theirPrice)}
                      </div>
                    </div>
                  )}
                  {dc.ourPrice&&(
                    <div style={{textAlign:'center',background:'#F8F9FA',borderRadius:6,padding:'8px 6px'}}>
                      <div style={{fontSize:10,color:'#6C757D',fontWeight:600,textTransform:'uppercase'}}>Our Price</div>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:15,color:'#155724'}}>
                        {INR(dc.ourPrice)}
                      </div>
                    </div>
                  )}
                  {priceDiff2!==null&&(
                    <div style={{textAlign:'center',
                      background:priceDiff2>0?'#F8D7DA':'#D4EDDA',borderRadius:6,padding:'8px 6px'}}>
                      <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase',
                        color:priceDiff2>0?'#721C24':'#155724'}}>Price Gap</div>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:800,fontSize:15,
                        color:priceDiff2>0?'#721C24':'#155724'}}>
                        {priceDiff2>0?'+':''}{INR(priceDiff2)}
                      </div>
                    </div>
                  )}
                  {(dc.winReason||dc.loseReason)&&(
                    <div style={{background:'#F8F4F8',borderRadius:6,padding:'8px 6px'}}>
                      <div style={{fontSize:10,color:'#714B67',fontWeight:600,textTransform:'uppercase'}}>
                        {dc.result==='WON'?'Won because':'Lost because'}
                      </div>
                      <div style={{fontSize:11,color:'#333',marginTop:2,fontWeight:600}}>
                        {dc.winReason||dc.loseReason}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
