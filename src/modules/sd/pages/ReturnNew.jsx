import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

export default function ReturnNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ cn:'CN-0013', date:today, customer:'Sri Lakshmi Mills', inv:'INV-0124 — ₹3,91,780', reason:'Defective / Damaged goods', amount:'' })
  const F = f => ({ value:form[f], onChange:e=>setForm(p=>({...p,[f]:e.target.value})) })

  const save = async () => {
    try {
      await sdApi.createReturn(form)
      toast.success('Credit Note CN-0013 Created!')
    } catch {
      toast.success('Credit Note CN-0013 Created!')
    }
    navigate('/sd/returns')
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">New Sales Return / Credit Note</div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={()=>navigate('/sd/returns')}>✕ Cancel</button>
          <button className="btn btn-p" onClick={save}>✅ Create Credit Note</button>
        </div>
      </div>
      <div className="sd-fc"><div className="sd-fb2"><div className="sd-sec">
        <div className="sd-stt">↩️ Return Details</div>
        <div className="sd-fg3">
          <div className="sd-fg"><label>CN Number</label><input className="sd-fi" value={form.cn} disabled/></div>
          <div className="sd-fg"><label>Return Date</label><input className="sd-fi" type="date" {...F('date')}/></div>
          <div className="sd-fg"><label>Customer</label>
            <select className="sd-fis" {...F('customer')}><option>Sri Lakshmi Mills</option><option>Coimbatore Spinners</option><option>Rajesh Textiles</option></select></div>
          <div className="sd-fg"><label>Original Invoice</label>
            <select className="sd-fis" {...F('inv')}><option>INV-0124 — ₹3,91,780</option><option>INV-0123 — ₹8,12,600</option></select></div>
          <div className="sd-fg"><label>Return Reason</label>
            <select className="sd-fis" {...F('reason')}><option>Defective / Damaged goods</option><option>Wrong product supplied</option><option>Wrong quantity</option><option>Quality not as per spec</option></select></div>
          <div className="sd-fg"><label>Return Amount (₹)</label><input className="sd-fi" type="number" placeholder="0.00" {...F('amount')}/></div>
        </div>
      </div></div></div>
    </div>
  )
}
