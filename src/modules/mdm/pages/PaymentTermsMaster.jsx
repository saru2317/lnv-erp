import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const BLANK = { code:'', description:'', dueDays:30, discountDays:0, discountPct:0, isActive:true }

const inp = { width:'100%', padding:'7px 10px', fontSize:12, border:'1px solid #E0D5E0',
  borderRadius:5, outline:'none', boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057', display:'block',
  marginBottom:4, textTransform:'uppercase', letterSpacing:.4 }

export default function PaymentTermsMaster() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [form,    setForm]    = useState(BLANK)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [showForm,setShowForm]= useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`${BASE_URL}/fi/payment-terms`, { headers: hdr2() })
      const d = await r.json()
      setRows(d.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const F = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  const openNew = () => { setForm(BLANK); setEditId(null); setShowForm(true) }
  const openEdit = r => { setForm({ ...r }); setEditId(r.id); setShowForm(true) }
  const close = () => { setShowForm(false); setForm(BLANK); setEditId(null) }

  const save = async () => {
    if (!form.code || !form.description) return toast.error('Code and description required')
    setSaving(true)
    try {
      const url    = editId ? `${BASE_URL}/fi/payment-terms/${editId}` : `${BASE_URL}/fi/payment-terms`
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, { method, headers: hdr(), body: JSON.stringify({
        ...form,
        dueDays:      parseInt(form.dueDays)      || 0,
        discountDays: parseInt(form.discountDays) || 0,
        discountPct:  parseFloat(form.discountPct)|| 0,
      }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(editId ? 'Updated' : 'Created')
      close(); load()
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  // Due date preview
  const previewDue = () => {
    const d = new Date()
    d.setDate(d.getDate() + parseInt(form.dueDays || 0))
    return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  }

  return (
    <div>
      {/* Header */}
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Payment Terms Master
          <small> Configure invoice due dates &amp; early payment discounts</small>
        </div>
        <div className="fi-lv-actions">
          <button className="btn btn-s sd-bsm" onClick={load}>Refresh</button>
          <button className="btn btn-p sd-bsm" onClick={openNew}>+ New Term</button>
        </div>
      </div>

      {/* Info bar */}
      <div className="fi-alert info" style={{marginBottom:14}}>
        Payment terms auto-populate due dates on Sales Invoices and GRNs. Once linked to a customer/vendor, they apply to every new transaction.
      </div>

      {/* Form panel */}
      {showForm && (
        <div style={{background:'#fff',border:'1px solid #E0D5E0',borderRadius:8,padding:20,marginBottom:16}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#714B67',marginBottom:16}}>
            {editId ? 'Edit Payment Term' : 'New Payment Term'}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr',gap:12,marginBottom:12}}>
            <div>
              <label style={lbl}>Code *</label>
              <input style={inp} {...F('code')} placeholder="NET30"
                readOnly={!!editId}
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}
              />
            </div>
            <div>
              <label style={lbl}>Description *</label>
              <input style={inp} {...F('description')} placeholder="Net 30 Days"
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}
              />
            </div>
            <div>
              <label style={lbl}>Due Days</label>
              <input style={inp} type="number" min="0" max="365" {...F('dueDays')}
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}
              />
            </div>
            <div>
              <label style={lbl}>Discount Days</label>
              <input style={inp} type="number" min="0" {...F('discountDays')}
                placeholder="0"
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}
              />
            </div>
            <div>
              <label style={lbl}>Discount %</label>
              <input style={inp} type="number" min="0" max="100" step="0.5" {...F('discountPct')}
                placeholder="0"
                onFocus={e=>e.target.style.borderColor='#714B67'}
                onBlur={e=>e.target.style.borderColor='#E0D5E0'}
              />
            </div>
          </div>

          {/* Preview */}
          <div style={{background:'#EDE0EA',borderRadius:6,padding:'8px 14px',marginBottom:12,fontSize:12,display:'flex',gap:24}}>
            <span>Today's invoice due date: <strong>{previewDue()}</strong></span>
            {parseFloat(form.discountPct)>0 && parseInt(form.discountDays)>0 && (
              <span style={{color:'#155724'}}>
                {form.discountPct}% discount if paid within {form.discountDays} days
              </span>
            )}
            {parseInt(form.dueDays)===0 && <span style={{color:'#856404'}}>Immediate / Cash payment</span>}
            {parseInt(form.dueDays)===-1 && <span style={{color:'#004085'}}>100% Advance — due before supply</span>}
          </div>

          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-p sd-bsm" disabled={saving} onClick={save}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
            <button className="btn btn-s sd-bsm" onClick={close}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{padding:30,textAlign:'center',color:'#6C757D'}}>Loading payment terms...</div>
      ) : (
        <table className="fi-data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th style={{textAlign:'center'}}>Due Days</th>
              <th style={{textAlign:'center'}}>Discount Days</th>
              <th style={{textAlign:'center'}}>Discount %</th>
              <th>Example (from today)</th>
              <th style={{textAlign:'center'}}>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#6C757D'}}>
                No payment terms — click &quot;+ New Term&quot; or refresh to auto-seed standard terms
              </td></tr>
            ) : rows.map(r => {
              const dueEx = (() => {
                if (r.dueDays < 0) return 'Before supply'
                const d = new Date(); d.setDate(d.getDate()+r.dueDays)
                return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})
              })()
              return (
                <tr key={r.id} onClick={() => openEdit(r)} style={{cursor:'pointer'}}>
                  <td>
                    <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,
                      color:'var(--odoo-purple)',fontSize:12}}>
                      {r.code}
                    </span>
                  </td>
                  <td style={{fontWeight:600}}>{r.description}</td>
                  <td style={{textAlign:'center',fontFamily:'DM Mono,monospace',fontWeight:700}}>
                    {r.dueDays < 0 ? 'Advance' : r.dueDays === 0 ? 'Immediate' : `${r.dueDays}d`}
                  </td>
                  <td style={{textAlign:'center',color:'#6C757D'}}>
                    {r.discountDays > 0 ? `${r.discountDays}d` : '—'}
                  </td>
                  <td style={{textAlign:'center'}}>
                    {r.discountPct > 0 ? (
                      <span style={{background:'#D4EDDA',color:'#155724',padding:'2px 8px',
                        borderRadius:10,fontSize:11,fontWeight:700}}>
                        {r.discountPct}%
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{fontSize:12,color:'#6C757D'}}>{dueEx}</td>
                  <td style={{textAlign:'center'}}>
                    <span style={{background:r.isActive?'#D4EDDA':'#F8D7DA',
                      color:r.isActive?'#155724':'#721C24',
                      padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700}}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <button className="btn-xs" onClick={()=>openEdit(r)}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Usage note */}
      <div style={{marginTop:14,padding:12,background:'#F8F4F8',borderRadius:6,fontSize:11,color:'#714B67'}}>
        <strong>How it works:</strong> Set default payment term on Customer / Vendor master.
        When a Sales Invoice or GRN is created, due date auto-calculates.
        AR Aging and AP Aging use these due dates to bucket overdue amounts.
      </div>
    </div>
  )
}
