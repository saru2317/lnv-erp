import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getToken = () => localStorage.getItem('lnv_token')
const authHdrs = () => ({ 'Content-Type':'application/json',
  Authorization:`Bearer ${getToken()}` })
const authHdrs2= () => ({ Authorization:`Bearer ${getToken()}` })

const inp = { padding:'7px 10px', border:'1.5px solid #E0D5E0',
  borderRadius:5, fontSize:12, outline:'none', width:'100%',
  boxSizing:'border-box', fontFamily:'DM Sans,sans-serif' }
const lbl = { fontSize:10, fontWeight:700, color:'#495057',
  display:'block', marginBottom:3, textTransform:'uppercase',
  letterSpacing:.3 }

export default function VendorNew() {
  const nav = useNavigate()
  const [saving,  setSaving]  = useState(false)
  const [vendCode,setVendCode]= useState('Auto-generated')
  const [form, setForm] = useState({
    name:'', type:'Company', gstin:'', panNo:'',
    vendorCategory:'Raw Material',
    address:'', city:'', state:'Tamil Nadu', pincode:'',
    contactPerson:'', phone:'', email:'',
    paymentTerms:'Net 30 Days', creditLimit:'',
    bankName:'', accountNo:'', ifsc:'', branch:'',
    msmeRegistered:false, msmeNumber:'', msmeType:'',
    tcsApplicable:false, remarks:''
  })

  useEffect(()=>{
    // Get next vendor code
    fetch(`${BASE_URL}/mm/vendors/next-code`,
      { headers:authHdrs2() })
      .then(r=>r.json())
      .then(d=>setVendCode(d.code||'Auto'))
      .catch(()=>{})
  },[])

  const setF = (field, val) =>
    setForm(p=>({...p,[field]:val}))

  const save = async () => {
    if (!form.name)  return toast.error('Vendor Name required!')
    if (!form.gstin) return toast.error('GSTIN required!')
    setSaving(true)
    try {
      const res  = await fetch(`${BASE_URL}/mm/vendors/create`,
        { method:'POST', headers:authHdrs(),
          body:JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      nav('/mm/vendors')
    } catch(e){ toast.error(e.message) } finally { setSaving(false) }
  }

  const section = (title, icon, children) => (
    <div style={{ border:'1px solid #E0D5E0', borderRadius:8,
      overflow:'hidden', marginBottom:14 }}>
      <div style={{ background:'linear-gradient(135deg,#714B67,#4A3050)',
        padding:'8px 16px', display:'flex', gap:8,
        alignItems:'center' }}>
        <span>{icon}</span>
        <span style={{ color:'#fff', fontSize:13,
          fontWeight:700, fontFamily:'Syne,sans-serif' }}>
          {title}
        </span>
      </div>
      <div style={{ padding:16, background:'#fff' }}>
        {children}
      </div>
    </div>
  )

  const grid3 = { display:'grid',
    gridTemplateColumns:'1fr 1fr 1fr', gap:12 }
  const grid2 = { display:'grid',
    gridTemplateColumns:'1fr 1fr', gap:12 }

  const field = (label, key, type='text', ph='',
    opts=null) => (
    <div>
      <label style={lbl}>{label}</label>
      {opts ? (
        <select style={{ ...inp, cursor:'pointer' }}
          value={form[key]}
          onChange={e=>setF(key,e.target.value)}>
          {opts.map(o=><option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} style={inp}
          value={form[key]} placeholder={ph}
          onChange={e=>setF(key,e.target.value)} />
      )}
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column',
      height:'100%', overflow:'hidden' }}>

      {/* Sticky Header */}
      <div style={{ flexShrink:0, position:'sticky', top:0,
        zIndex:100, background:'#F8F4F8',
        borderBottom:'2px solid #E0D5E0',
        boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
        <div className="lv-hdr">
          <div className="lv-ttl">
            New Vendor
            <small style={{ fontFamily:'DM Mono,monospace',
              color:'#714B67', marginLeft:8 }}>
              {vendCode}
            </small>
            <small>MK01 · Create Vendor Master</small>
          </div>
          <div className="lv-acts">
            <button className="btn btn-s sd-bsm"
              onClick={()=>nav('/mm/vendors')}>
              ✕ Cancel
            </button>
            <button className="btn btn-p sd-bsm"
              disabled={saving} onClick={save}>
              {saving?'⏳ Saving...':'💾 Save Vendor'}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div style={{ flex:1, overflowY:'auto',
        padding:'14px 0', paddingBottom:40 }}>

        {/* Basic Details */}
        {section('Basic Details', '🏢', (
          <>
            <div style={{ ...grid3, marginBottom:12 }}>
              <div>
                <label style={lbl}>Vendor Code</label>
                <input style={{ ...inp, background:'#F8F4F8',
                  color:'#714B67', fontWeight:700 }}
                  value={vendCode} readOnly />
              </div>
              {field('Vendor Name *',    'name',
                'text', 'Company / Individual Name')}
              {field('Vendor Type',     'type', 'text', '',
                ['Company','Individual','Partnership','LLP','Trust'])}
            </div>
            <div style={grid3}>
              {field('GSTIN *',         'gstin',
                'text', '33XXXXX0000X1Z5')}
              {field('PAN No.',         'panNo',
                'text', 'XXXXX0000X')}
              {field('Purchase Category','vendorCategory',
                'text', '',
                ['Raw Material','Spares & Consumables',
                  'Packing Material','Chemicals',
                  'Services','Capital Goods','Others'])}
            </div>
          </>
        ))}

        {/* Address & Contact */}
        {section('Address & Contact', '📍', (
          <>
            <div style={{ ...grid2, marginBottom:12 }}>
              <div>
                <label style={lbl}>Address *</label>
                <textarea style={{ ...inp, resize:'vertical' }}
                  rows={3} value={form.address}
                  placeholder="Street, Area..."
                  onChange={e=>setF('address',e.target.value)} />
              </div>
              <div style={{ display:'grid', gap:10 }}>
                {field('City',    'city',    'text','City')}
                {field('State',   'state',   'text', '',
                  ['Tamil Nadu','Maharashtra','Karnataka',
                    'Gujarat','Delhi','Rajasthan','Others'])}
                {field('Pincode', 'pincode', 'text', '641001')}
              </div>
            </div>
            <div style={grid3}>
              {field('Contact Person', 'contactPerson',
                'text', 'Name')}
              {field('Phone / Mobile', 'phone',
                'tel', '+91 98xxx xxxxx')}
              {field('Email',          'email',
                'email', 'vendor@example.com')}
            </div>
          </>
        ))}

        {/* Payment & Banking */}
        {section('Payment & Banking', '🏦', (
          <>
            <div style={{ ...grid3, marginBottom:12 }}>
              {field('Payment Terms', 'paymentTerms',
                'text', '',
                ['Net 30 Days','Net 45 Days','Net 60 Days',
                  'Advance','Against Delivery','LC'])}
              {field('Credit Limit (₹)','creditLimit',
                'number', '0')}
              {field('Bank Name',      'bankName',
                'text', 'Bank Name')}
            </div>
            <div style={grid3}>
              {field('Account No.',  'accountNo',
                'text', 'Account Number')}
              {field('IFSC Code',    'ifsc',
                'text', 'SBIN0001234')}
              {field('Branch',       'branch',
                'text', 'Branch Name')}
            </div>
          </>
        ))}

        {/* MSME & Other */}
        {section('MSME & Compliance', '📋', (
          <div style={grid3}>
            <div>
              <label style={lbl}>MSME Registered</label>
              <div style={{ display:'flex', gap:16,
                marginTop:6 }}>
                {['Yes','No'].map(v=>(
                  <label key={v} style={{ display:'flex',
                    alignItems:'center', gap:6,
                    fontSize:12, cursor:'pointer' }}>
                    <input type="radio"
                      name="msme"
                      checked={form.msmeRegistered===(v==='Yes')}
                      onChange={()=>setF('msmeRegistered',
                        v==='Yes')} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            {form.msmeRegistered && (
              <>
                {field('MSME No.',  'msmeNumber',
                  'text', 'UDYAM-XXXX-00-0000000')}
                {field('MSME Type', 'msmeType',
                  'text', '',
                  ['Micro','Small','Medium'])}
              </>
            )}
            <div>
              <label style={lbl}>TCS Applicable</label>
              <div style={{ display:'flex', gap:16,
                marginTop:6 }}>
                {['Yes','No'].map(v=>(
                  <label key={v} style={{ display:'flex',
                    alignItems:'center', gap:6,
                    fontSize:12, cursor:'pointer' }}>
                    <input type="radio"
                      name="tcs"
                      checked={form.tcsApplicable===(v==='Yes')}
                      onChange={()=>setF('tcsApplicable',
                        v==='Yes')} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>Remarks</label>
              <textarea style={{ ...inp, resize:'vertical' }}
                rows={2} value={form.remarks}
                placeholder="Any notes..."
                onChange={e=>setF('remarks',e.target.value)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
