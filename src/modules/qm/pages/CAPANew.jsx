import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const hdr  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` })
const hdr2 = () => ({ Authorization: `Bearer ${getToken()}` })

const DEPTS       = ['QC Dept','Production','Maintenance','Purchase','Admin','Engineering','Stores']
const PRIORITIES  = ['Critical','High','Medium','Low']
const VERIFY_MTHD = ['Re-inspection of next 3 lots','Process audit','Machine calibration report','Supplier certificate','Customer feedback','Internal audit','Statistical analysis']

const INIT = {
  type:'Corrective', ncrNo:'', ncrId:'',
  issue:'', rootCause:'', action:'',
  owner:'QC Dept', priority:'High',
  dueDate:'', effectivenessDate:'',
  verifyMethod:'Re-inspection of next 3 lots',
  progress:0, status:'Open', remarks:'',
}

const inp = { padding:'8px 10px', border:'1.5px solid #E0D5E0', borderRadius:5, fontSize:13, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:11, fontWeight:700, color:'#495057', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.3 }

export default function CAPANew() {
  const nav       = useNavigate()
  const { id }    = useParams()
  const [form,    setForm]   = useState(INIT)
  const [ncrs,    setNCRs]   = useState([])
  const [capaNo,  setCapaNo] = useState('Auto-generated')
  const [saving,  setSaving] = useState(false)
  const [loading, setLoading]= useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rN, rC] = await Promise.all([
        fetch(`${BASE_URL}/qm/ncr?status=Open,CAPA_OPEN`,    { headers: hdr2() }),
        fetch(`${BASE_URL}/qm/capa/next-no`,                  { headers: hdr2() }),
      ])
      const [dN, dC] = await Promise.all([rN.json(), rC.json()])
      setNCRs(dN.data || [])
      setCapaNo(dC.capaNo || 'CAPA-AUTO')

      // If editing — load existing
      if (id) {
        const rE  = await fetch(`${BASE_URL}/qm/capa/${id}`, { headers: hdr2() })
        const dE  = await rE.json()
        if (dE.data) {
          setForm({ ...INIT, ...dE.data })
          setCapaNo(dE.data.capaNo || capaNo)
        }
      }
    } catch (e) { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const fSet = k => e => setForm(f => ({ ...f, [k]: typeof e === 'object' ? e.target.value : e }))

  const onNcrSelect = e => {
    const ncr = ncrs.find(n => n.id === parseInt(e.target.value))
    setForm(f => ({
      ...f,
      ncrId:  ncr?.id   || '',
      ncrNo:  ncr?.ncrNo || '',
      issue:  ncr?.description || f.issue,
    }))
  }

  const save = async () => {
    if (!form.rootCause) return toast.error('Root Cause Analysis is required')
    if (!form.action)    return toast.error('Corrective / Preventive Action is required')
    if (!form.owner)     return toast.error('Owner / Department is required')
    if (!form.dueDate)   return toast.error('Target completion date is required')
    setSaving(true)
    try {
      const url    = id ? `${BASE_URL}/qm/capa/${id}` : `${BASE_URL}/qm/capa`
      const method = id ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method, headers: hdr(),
        body: JSON.stringify({ ...form, capaNo })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(id ? 'CAPA updated' : `${data.data?.capaNo || capaNo} created!`)
      nav('/qm/capa')
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const SHdr = ({ title }) => (
    <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)', padding:'8px 16px' }}>
      <span style={{ color:'#fff', fontSize:13, fontWeight:700, fontFamily:'Syne,sans-serif' }}>{title}</span>
    </div>
  )

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>Loading...</div>

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">
          {id ? `Edit CAPA: ${capaNo}` : 'New CAPA'}
          <small>Corrective / Preventive Action</small>
        </div>
        <div className="fi-lv-actions">
          {/* Status flow */}
          <div style={{ display:'flex', gap:0, marginRight:8 }}>
            {['Open','In Progress','Verified','Closed'].map((s, i) => (
              <div key={s} style={{ display:'flex', alignItems:'center' }}>
                <span style={{ padding:'3px 10px', fontSize:10, fontWeight:700, cursor:'pointer',
                  background: form.status === s ? '#714B67' : '#E0D5E0',
                  color:      form.status === s ? '#fff'    : '#6C757D',
                  borderRadius: i === 0 ? '10px 0 0 10px' : i === 3 ? '0 10px 10px 0' : '0' }}
                  onClick={() => fSet('status')(s)}>
                  {s}
                </span>
                {i < 3 && <span style={{ color:'#CCC', fontSize:10 }}>›</span>}
              </div>
            ))}
          </div>
          <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa')}>Cancel</button>
          <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : id ? 'Update CAPA' : 'Save CAPA'}
          </button>
        </div>
      </div>

      {/* CAPA Details */}
      <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
        <SHdr title="CAPA Details" />
        <div style={{ padding:16, background:'#fff' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>CAPA No.</label>
              <input style={{ ...inp, background:'#F8F4F8', color:'#714B67', fontWeight:700, fontFamily:'DM Mono,monospace' }} value={capaNo} readOnly />
            </div>
            <div>
              <label style={lbl}>Type *</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.type} onChange={fSet('type')}>
                <option>Corrective</option>
                <option>Preventive</option>
              </select>
            </div>
            <div>
              <label style={lbl}>NCR Reference</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.ncrId} onChange={onNcrSelect}>
                <option value="">— No NCR (Standalone / Preventive) —</option>
                {ncrs.map(n => (
                  <option key={n.id} value={n.id}>{n.ncrNo} · {n.itemName} · {n.severity}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>Owner / Department *</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.owner} onChange={fSet('owner')}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Priority</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.priority} onChange={fSet('priority')}>
                {PRIORITIES.map(p => (
                  <option key={p} style={{ color: p==='Critical'?'#DC3545':p==='High'?'#856404':p==='Medium'?'#0056b3':'#6C757D' }}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Target Completion Date *</label>
              <input type="date" style={inp} value={form.dueDate} onChange={fSet('dueDate')} />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Issue Description</label>
            <input style={inp} value={form.issue} onChange={fSet('issue')} placeholder="Describe the quality issue / non-conformance..." />
          </div>
        </div>
      </div>

      {/* Root Cause & Action */}
      <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
        <SHdr title="Root Cause Analysis &amp; Action Plan" />
        <div style={{ padding:16, background:'#fff' }}>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Root Cause Analysis *
              <span style={{ marginLeft:6, fontSize:10, fontWeight:400, color:'#999', textTransform:'none' }}>
                (5-Why / Fishbone — describe root cause identified)
              </span>
            </label>
            <textarea style={{ ...inp, resize:'vertical' }} rows={3}
              value={form.rootCause} onChange={fSet('rootCause')}
              placeholder="Why 1: Machine not calibrated → Why 2: No PM schedule → Why 3: No PM policy → Root Cause: Absence of preventive maintenance policy" />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Corrective / Preventive Action *</label>
            <textarea style={{ ...inp, resize:'vertical' }} rows={3}
              value={form.action} onChange={fSet('action')}
              placeholder="Describe the specific action steps, responsible person, and how this prevents recurrence..." />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={lbl}>Verification Method</label>
              <select style={{ ...inp, cursor:'pointer' }} value={form.verifyMethod} onChange={fSet('verifyMethod')}>
                {VERIFY_MTHD.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Effectiveness Check Date</label>
              <input type="date" style={inp} value={form.effectivenessDate} onChange={fSet('effectivenessDate')} />
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Status */}
      <div style={{ border:'1px solid #E0D5E0', borderRadius:8, overflow:'hidden', marginBottom:14 }}>
        <SHdr title="Progress Tracking" />
        <div style={{ padding:16, background:'#fff' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <div>
              <label style={lbl}>Progress % — {form.progress}%</label>
              <input type="range" min={0} max={100} step={5}
                value={form.progress}
                onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value) }))}
                style={{ width:'100%', accentColor:'#714B67' }} />
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#999', marginTop:2 }}>
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
              {/* Progress bar */}
              <div style={{ height:8, background:'#E0D5E0', borderRadius:4, marginTop:8, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:4, width:`${form.progress}%`,
                  background: form.progress === 100 ? '#28A745' : form.progress >= 70 ? '#FFC107' : '#714B67',
                  transition:'width .3s' }} />
              </div>
            </div>
            <div>
              <label style={lbl}>Remarks</label>
              <textarea style={{ ...inp, resize:'vertical' }} rows={3}
                value={form.remarks} onChange={fSet('remarks')}
                placeholder="Additional notes, updates, evidence attached..." />
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'8px 0 20px' }}>
        <button className="btn btn-s sd-bsm" onClick={() => nav('/qm/capa')}>Cancel</button>
        {form.status !== 'Closed' && (
          <button className="btn btn-s sd-bsm"
            onClick={() => { setForm(f => ({ ...f, progress:100, status:'Closed' })); setTimeout(save, 100) }}
            style={{ background:'#28A745', color:'#fff', border:'none' }}>
            Mark Closed
          </button>
        )}
        <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
          {saving ? 'Saving...' : id ? 'Update CAPA' : 'Save CAPA'}
        </button>
      </div>
    </div>
  )
}
