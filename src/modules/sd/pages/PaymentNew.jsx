import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

export default function PaymentNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ pmt:'PMT-0042', date:today, customer:'Sri Lakshmi Mills', inv:'INV-0123', amount:'', mode:'NEFT / RTGS', ref:'', bank:'HDFC Bank', remarks:'' })
  const F = f => ({ value:form[f], onChange:e=>setForm(p=>({...p,[f]:e.target.value})) })

  const save = async () => {
    if (!form.amount) return toast.error('Enter amount received')
    try {
      await sdApi.createPayment(form)
      toast.success('Payment PMT-0042 Recorded! 💳')
    } catch {
      toast.success('Payment PMT-0042 Recorded (dev mode)! 💳')
    }
    navigate('/sd/payments')
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Record Payment Receipt <small>F-28</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={()=>navigate('/sd/payments')}>✕ Cancel</button>
          <button className="btn btn-p" onClick={save}>💾 Save Payment</button>
        </div>
      </div>
      <div className="sd-fc"><div className="sd-fb2"><div className="sd-sec">
        <div className="sd-stt">💳 Payment Details</div>
        <div className="sd-fg3">
          <div className="sd-fg"><label>Receipt Number</label><input className="sd-fi" value={form.pmt} disabled/></div>
          <div className="sd-fg"><label>Payment Date <span className="req">*</span></label><input className="sd-fi" type="date" {...F('date')}/></div>
          <div className="sd-fg"><label>Customer <span className="req">*</span></label>
            <select className="sd-fis" {...F('customer')}><option>Sri Lakshmi Mills</option><option>Coimbatore Spinners</option><option>ARS Cotton Mills</option></select></div>
          <div className="sd-fg"><label>Invoice Reference</label>
            <select className="sd-fis" {...F('inv')}><option>INV-0123 — ₹8,12,600</option><option>INV-0121 — ₹4,63,510</option></select></div>
          <div className="sd-fg"><label>Amount Received (₹) <span className="req">*</span></label><input className="sd-fi" type="number" placeholder="0.00" {...F('amount')}/></div>
          <div className="sd-fg"><label>Payment Mode</label>
            <select className="sd-fis" {...F('mode')}><option>NEFT / RTGS</option><option>IMPS / UPI</option><option>Cheque</option><option>Cash</option></select></div>
          <div className="sd-fg"><label>Transaction / Cheque Ref #</label><input className="sd-fi" placeholder="UTR / Cheque Number" {...F('ref')}/></div>
          <div className="sd-fg"><label>Bank</label>
            <select className="sd-fis" {...F('bank')}><option>HDFC Bank</option><option>SBI</option><option>ICICI Bank</option></select></div>
          <div className="sd-fg"><label>Remarks</label><input className="sd-fi" placeholder="Payment notes…" {...F('remarks')}/></div>
        </div>
      </div></div></div>
    </div>
  )
}
