import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization:`Bearer ${getToken()}` })

const INIT = {
  customer:'', contactPerson:'', contactEmail:'', contactPhone:'',
  partName:'', partNo:'', batchNo:'', supplyDate:'',
  complaintDate: new Date().toISOString().split('T')[0],
  severity:'Major', category:'Quality',
  issue:'', customerExpectation:'', quantityAffected:'', unitOfMeasure:'Nos',
  immediateRequest:'', samplesRequired:false,
  owner:'QC Dept', assignedTo:'', dueDate:'',
  ncrRef:'', capaRef:'', _8dRef:'',
  status:'Open', remarks:'',
}

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase' }
const SHdr = ({title,sub}) => (
  <div style={{background:'linear-gradient(135deg,#714B67,#4A3050)',padding:'8px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
    <span style={{color:'#fff',fontSize:13,fontWeight:700,fontFamily:'Syne,sans-serif'}}>{title}</span>
    {sub && <span style={{color:'rgba(255,255,255,.6)',fontSize:11}}>{sub}</span>}
  </div>
)

export default function CustomerComplaintNew() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form,       setForm]       = useState(INIT)
  const [complaintNo,setComplaintNo]= useState('Auto-generated')
  const [saving,     setSaving]     = useState(false)
  const [customers,  setCustomers]  = useState([])

  const load = useCallback(async () => {
    try {
      const [rC, rN] = await Promise.all([
        fetch(`${BASE_URL}/mdm/customer`, { headers:hdr2() }),
        fetch(`${BASE_URL}/qm/complaint/next-no`, { headers:hdr2() }),
      ])
      const [dC, dN] = await Promise.all([rC.json(), rN.json()])
      setCustomers(dC.data || [])
      setComplaintNo(dN.complaintNo || 'CC-AUTO')
      if (id) {
        const rE = await fetch(`${BASE_URL}/qm/customer-complaints/${id}`, { headers:hdr2() })
        const dE = await rE.json()
        if (dE.data) { setForm({...INIT,...dE.data}); setComplaintNo(dE.data.complaintNo||complaintNo) }
      }
    } catch {}
  }, [id])
  useEffect(() => { load() }, [load])

  const fSet  = k => e => setForm(f => ({ ...f, [k]: typeof e === 'object' ? e.target.value : e }))
  const fBool = k => e => setForm(f => ({ ...f, [k]: e.target.checked }))

  const save = async () => {
    if (!form.customer) return toast.error('Customer is required')
    if (!form.issue)    return toast.error('Issue description is required')
    setSaving(true)
    try {
      const url    = id ? `${BASE_URL}/qm/customer-complaints/${id}` : `${BASE_URL}/qm/customer-complaints`
      const method = id ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers:hdr(), body:JSON.stringify({...form,complaintNo}) })
      const data   = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(id ? 'Updated' : `${data.data?.complaintNo||complaintNo} registered!`)
      nav('/qm/complaint')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const F = ({label,k,rows,ph,type='text',readOnly}) => (
    <div>
      <label style={lbl}>{label}</label>
      {rows
        ? <textarea style={{...inp,resize:'vertical'}} rows={rows} value={form[k]||''} onChange={fSet(k)} placeholder={ph}/>
        : <input type={type} style={{...inp,background:readOnly?'#F8F9FA':'#fff'}} value={form[k]||''} onChange={fSet(k)} placeholder={ph} readOnly={readOnly}/>
      }
    </div>
  )

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          {id ? `Edit: ${complaintNo}` : 'New Customer Complaint'}
          <small style={{fontFamily:'DM Mono,monospace',color:'#714B67',marginLeft:8}}>{complaintNo}</small>
        </div>
        <div className="fi-lv-actions">
          {/* Status flow */}
          <div style={{display:'flex',gap:0,marginRight:8}}>
            {['Open','In Progress','CAPA Issued','Closed'].map((s,i)=>(
              <span key={s} onClick={()=>fSet('status')(s)} style={{
                padding:'3px 10px',fontSize:10,fontWeight:700,cursor:'pointer',
                background:form.status===s?'#714B67':'#E0D5E0',
                color:form.status===s?'#fff':'#6C757D',
                borderRadius:i===0?'10px 0 0 10px':i===3?'0 10px 10px 0':'0'
              }}>{s}</span>
            ))}
          </div>
          <button className="btn btn-s sd-bsm" onClick={()=>nav('/qm/complaint')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving?'Saving...':id?'Update':'Register Complaint'}
          </button>
        </div>
      </div>

      {/* Customer & Part */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
        <SHdr title="Customer &amp; Part Information" />
        <div style={{padding:16,background:'#fff'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Customer *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.customer} onChange={fSet('customer')}>
                <option value="">-- Select Customer --</option>
                {customers.map(c=><option key={c.id} value={c.name||c.code}>{c.name||c.code}</option>)}
                <option value="ABC Textiles">ABC Textiles</option>
                <option value="DEF Exports">DEF Exports</option>
                <option value="GHI Spinners">GHI Spinners</option>
              </select>
            </div>
            <F label="Contact Person" k="contactPerson" ph="John / Rajesh" />
            <F label="Contact Email"  k="contactEmail"  ph="john@abc.com" />
            <F label="Contact Phone"  k="contactPhone"  ph="+91 98765..." />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:12}}>
            <F label="Part Name *"  k="partName"   ph="Ring Yarn 30s" />
            <F label="Part No."     k="partNo"     ph="PY-BH-6001" />
            <F label="Batch No."    k="batchNo"    ph="BTH-2026-042" />
            <F label="Supply Date"  k="supplyDate" type="date" />
            <F label="Complaint Date" k="complaintDate" type="date" />
          </div>
        </div>
      </div>

      {/* Complaint Details */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
        <SHdr title="Complaint Details" />
        <div style={{padding:16,background:'#fff'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Severity *</label>
              <select style={{...inp,cursor:'pointer'}} value={form.severity} onChange={fSet('severity')}>
                {['Critical','Major','Minor'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Complaint Category</label>
              <select style={{...inp,cursor:'pointer'}} value={form.category} onChange={fSet('category')}>
                {['Quality','Delivery','Quantity','Packaging','Documentation','Other'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:8}}>
              <F label="Quantity Affected" k="quantityAffected" type="number" ph="100" />
              <div>
                <label style={lbl}>UOM</label>
                <select style={{...inp,cursor:'pointer'}} value={form.unitOfMeasure} onChange={fSet('unitOfMeasure')}>
                  {['Nos','Kg','Metre','Box','Lot'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <F label="Issue Description *" k="issue" rows={3} ph="Detailed description of the quality problem reported by customer..." />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <F label="Customer Expectation / Requirement" k="customerExpectation" rows={2} ph="What the customer expects as resolution..." />
            <F label="Immediate Request from Customer"    k="immediateRequest"    rows={2} ph="e.g. Replace lot immediately, credit note, 100% inspection certificate..." />
          </div>
          <label style={{display:'flex',alignItems:'center',gap:8,marginTop:10,cursor:'pointer',fontSize:13}}>
            <input type="checkbox" checked={!!form.samplesRequired} onChange={fBool('samplesRequired')} style={{accentColor:'#714B67',width:15,height:15}}/>
            <span>Samples / rejected parts to be returned by customer</span>
          </label>
        </div>
      </div>

      {/* Assignment */}
      <div style={{border:'1px solid #E0D5E0',borderRadius:8,overflow:'hidden',marginBottom:14}}>
        <SHdr title="Assignment &amp; Action Links" />
        <div style={{padding:16,background:'#fff'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Owner Department</label>
              <select style={{...inp,cursor:'pointer'}} value={form.owner} onChange={fSet('owner')}>
                {['QC Dept','Production','Purchase','Admin','Engineering'].map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
            <F label="Assigned To"  k="assignedTo" ph="Engineer name" />
            <F label="Response Due" k="dueDate"    type="date" />
            <div></div>
          </div>
          {/* Links to NCR / CAPA / 8D */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <div>
              <F label="NCR Reference" k="ncrRef" ph="NCR-2026-001" />
              <button onClick={()=>nav('/qm/ncr/new')} style={{marginTop:4,padding:'4px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                + Create NCR
              </button>
            </div>
            <div>
              <F label="CAPA Reference" k="capaRef" ph="CAPA-2026-001" />
              <button onClick={()=>nav('/qm/capa/new')} style={{marginTop:4,padding:'4px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                + Create CAPA
              </button>
            </div>
            <div>
              <F label="8D Report Reference" k="_8dRef" ph="8D-2026-001" />
              <button onClick={()=>nav('/qm/8d/new')} style={{marginTop:4,padding:'4px 10px',background:'#EDE0EA',color:'#714B67',border:'none',borderRadius:4,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                + Create 8D
              </button>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <F label="Remarks / Follow-up Notes" k="remarks" rows={2} ph="Internal notes, customer communication summary..." />
          </div>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'8px 0 20px'}}>
        <button className="btn btn-s sd-bsm" onClick={()=>nav('/qm/complaint')}>Cancel</button>
        <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
          {saving?'Saving...':id?'Update Complaint':'Register Complaint'}
        </button>
      </div>
    </div>
  )
}
