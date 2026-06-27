import React,{useState,useEffect}from 'react'
import toast from 'react-hot-toast'
const BASE=import.meta.env.VITE_API_URL||'/api'
const tok=()=>localStorage.getItem('lnv_token')||''
const hdr=()=>({'Content-Type':'application/json',Authorization:`Bearer ${tok()}`})
const hdr2=()=>({Authorization:`Bearer ${tok()}`})
const fmtC=n=>'₹'+Number(n||0).toLocaleString('en-IN')
const inp={padding:'8px 10px',border:'1.5px solid #DDD',borderRadius:5,fontSize:12,outline:'none',width:'100%',boxSizing:'border-box'}
const lbl={fontSize:10,fontWeight:700,color:'#6C757D',display:'block',marginBottom:3,textTransform:'uppercase'}

export default function FeeStructure(){
  const [classes,setClasses]=useState([])
  const [feeTypes,setFeeTypes]=useState([])
  const [structure,setStructure]=useState([])
  const [selClass,setSelClass]=useState('')
  const [loading,setLoading]=useState(false)
  const [showAdd,setShowAdd]=useState(false)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState({feeTypeId:'',amount:'',dueDay:'10',lateFeePerDay:'10'})
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))
  const instId=localStorage.getItem('lnv_edu_inst')||''

  useEffect(()=>{
    fetch(`${BASE}/edu/classes?institutionId=${instId}`,{headers:hdr2()}).then(r=>r.json()).then(d=>setClasses(d.data||[]))
    fetch(`${BASE}/edu/fee-types`,{headers:hdr2()}).then(r=>r.json()).then(d=>setFeeTypes(d.data||[]))
  },[])

  useEffect(()=>{
    if(!selClass)return
    setLoading(true)
    fetch(`${BASE}/edu/fee-structure?classId=${selClass}`,{headers:hdr2()})
      .then(r=>r.json()).then(d=>{setStructure(d.data||[]);setLoading(false)}).catch(()=>setLoading(false))
  },[selClass])

  const save=async()=>{
    if(!selClass)return toast.error('Select class first')
    if(!form.feeTypeId)return toast.error('Select fee type')
    if(!form.amount)return toast.error('Enter amount')
    setSaving(true)
    try{
      const r=await fetch(`${BASE}/edu/fee-structure`,{method:'POST',headers:hdr(),
        body:JSON.stringify({classId:parseInt(selClass),feeTypeId:parseInt(form.feeTypeId),
          amount:parseFloat(form.amount),dueDay:parseInt(form.dueDay||10),lateFeePerDay:parseFloat(form.lateFeePerDay||0)})})
      const d=await r.json()
      if(d.error)return toast.error(d.error)
      toast.success('✅ Fee structure saved!')
      setShowAdd(false);setForm({feeTypeId:'',amount:'',dueDay:'10',lateFeePerDay:'10'})
      // reload
      const r2=await fetch(`${BASE}/edu/fee-structure?classId=${selClass}`,{headers:hdr2()})
      const d2=await r2.json();setStructure(d2.data||[])
    }catch{toast.error('Failed')}finally{setSaving(false)}
  }

  const selCls=classes.find(c=>String(c.id)===selClass)
  const totalAnnual=structure.reduce((s,f)=>{
    const amt=Number(f.amount||0)
    return s+(f.feeType?.frequency==='MONTHLY'?amt*12:amt)
  },0)

  return(
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📋 Fee Structure</div>
        {selClass&&<button onClick={()=>setShowAdd(true)}
          style={{padding:'7px 16px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700,fontSize:12}}>
          + Add Fee
        </button>}
      </div>

      {/* Class Selector */}
      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:'12px 16px',marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:'#555',marginBottom:8}}>Select Class to View / Edit Fee Structure:</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {classes.map(c=>(
            <button key={c.id} onClick={()=>setSelClass(String(c.id))}
              style={{padding:'6px 14px',border:`1.5px solid ${String(c.id)===selClass?'#6E2C00':'#ddd'}`,
                borderRadius:20,cursor:'pointer',fontSize:11,fontWeight:700,
                background:String(c.id)===selClass?'#6E2C00':'#fff',
                color:String(c.id)===selClass?'#fff':'#555'}}>
              {c.className}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Structure Table */}
      {selClass&&(
        <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,overflow:'hidden'}}>
          <div style={{background:'#6E2C00',padding:'10px 16px',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700}}>{selCls?.className} — Fee Structure</div>
            <div style={{fontSize:12}}>Annual Total: {fmtC(totalAnnual)}</div>
          </div>
          {loading?<div style={{padding:30,textAlign:'center',color:'#aaa'}}>⏳ Loading...</div>:
          structure.length===0?
            <div style={{padding:40,textAlign:'center'}}>
              <div style={{fontSize:36,marginBottom:8}}>💰</div>
              <div style={{fontSize:14,fontWeight:600,color:'#6E2C00',marginBottom:4}}>No fee structure</div>
              <div style={{fontSize:12,color:'#888',marginBottom:16}}>Add fee types for this class</div>
              <button onClick={()=>setShowAdd(true)} style={{padding:'8px 20px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>+ Add Fee</button>
            </div>:
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'#FDF2E9'}}>
                {['Fee Type','Category','Frequency','Amount','Due Day','Late Fee/Day','Annual Total'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:'#6E2C00'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {structure.map((f,i)=>(
                <tr key={f.id} style={{background:i%2===0?'#fff':'#FDF9F7',borderBottom:'1px solid #F5EDE0'}}>
                  <td style={{padding:'9px 12px',fontWeight:700}}>{f.feeType?.feeName||'—'}</td>
                  <td style={{padding:'9px 12px',color:'#555',fontSize:11}}>{f.feeType?.category||'—'}</td>
                  <td style={{padding:'9px 12px'}}>
                    <span style={{padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,
                      background:f.feeType?.frequency==='MONTHLY'?'#EBF5FB':f.feeType?.frequency==='ANNUAL'?'#E8F5E9':'#FEF9E7',
                      color:f.feeType?.frequency==='MONTHLY'?'#1A5276':f.feeType?.frequency==='ANNUAL'?'#1E8449':'#B8860B'}}>
                      {f.feeType?.frequency}
                    </span>
                  </td>
                  <td style={{padding:'9px 12px',fontWeight:700,color:'#6E2C00'}}>{fmtC(f.amount)}</td>
                  <td style={{padding:'9px 12px',textAlign:'center'}}>{f.dueDay}th</td>
                  <td style={{padding:'9px 12px',color:Number(f.lateFeePerDay)>0?'#C0392B':'#aaa'}}>
                    {Number(f.lateFeePerDay)>0?`${fmtC(f.lateFeePerDay)}/day`:'—'}
                  </td>
                  <td style={{padding:'9px 12px',fontWeight:700,color:'#1E8449'}}>
                    {fmtC(f.feeType?.frequency==='MONTHLY'?Number(f.amount)*12:Number(f.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'#6E2C00',color:'#fff'}}>
                <td colSpan={6} style={{padding:'10px 12px',fontWeight:700}}>TOTAL ANNUAL FEE</td>
                <td style={{padding:'10px 12px',fontWeight:800,fontSize:14}}>{fmtC(totalAnnual)}</td>
              </tr>
            </tfoot>
          </table>}
        </div>
      )}

      {!selClass&&classes.length>0&&(
        <div style={{textAlign:'center',padding:60,background:'#fff',borderRadius:8,border:'1px solid #E8E0E8'}}>
          <div style={{fontSize:48,marginBottom:12}}>📋</div>
          <div style={{fontSize:14,color:'#888'}}>Select a class above to view fee structure</div>
        </div>
      )}

      {/* Add Fee Modal */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:440,boxShadow:'0 16px 48px rgba(0,0,0,.25)'}}>
            <div style={{fontSize:16,fontWeight:800,color:'#6E2C00',marginBottom:4}}>💰 Add Fee to {selCls?.className}</div>
            <div style={{fontSize:12,color:'#888',marginBottom:18}}>Fee will apply to all students in this class</div>
            <div style={{display:'grid',gap:14}}>
              <div><label style={lbl}>Fee Type *</label>
                <select value={form.feeTypeId} onChange={e=>set('feeTypeId',e.target.value)} style={inp}>
                  <option value=''>Select Fee Type</option>
                  {feeTypes.map(f=><option key={f.id} value={f.id}>{f.feeName} ({f.frequency})</option>)}
                </select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={lbl}>Amount (₹) *</label>
                  <input type='number' defaultValue={form.amount} onBlur={e=>set('amount',e.target.value)} placeholder='0' style={inp}/></div>
                <div><label style={lbl}>Due Day (of month)</label>
                  <input type='number' defaultValue={form.dueDay} onBlur={e=>set('dueDay',e.target.value)} placeholder='10' min='1' max='31' style={inp}/></div>
              </div>
              <div><label style={lbl}>Late Fee per Day (₹)</label>
                <input type='number' defaultValue={form.lateFeePerDay} onBlur={e=>set('lateFeePerDay',e.target.value)} placeholder='10' style={inp}/></div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:18}}>
              <button onClick={()=>setShowAdd(false)} style={{padding:'7px 16px',background:'#f0f0f0',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Cancel</button>
              <button onClick={save} disabled={saving} style={{padding:'7px 22px',background:'#6E2C00',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:700}}>
                {saving?'⏳...':'💾 Save Fee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
