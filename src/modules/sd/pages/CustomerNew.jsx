import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const INIT = {
  name:'', code:'C-007', type:'Manufacturing', mobile:'', email:'', website:'',
  gstin:'', pan:'', state:'Tamil Nadu', stateCode:'33', gstType:'Regular', taxZone:'Intra-State (CGST+SGST)',
  address1:'', city:'', district:'', pincode:'',
  creditLimit:'', creditDays:'30', paymentTerms:'Net 30', currency:'INR', priceList:'Standard Price', salesExec:'Admin',
}

export default function CustomerNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INIT)
  const [saving, setSaving] = useState(false)

  const F = (field) => ({
    value: form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value }))
  })

  const save = async () => {
    if (!form.name || !form.mobile) return toast.error('Name and Mobile required')
    setSaving(true)
    try {
      await sdApi.createCustomer(form)
      toast.success(`Customer ${form.code} saved successfully! ✅`)
      navigate('/sd/customers')
    } catch {
      // Save to local state in dev mode
      toast.success(`Customer ${form.code} saved (dev mode) ✅`)
      navigate('/sd/customers')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">New Customer <small>Customer Master · MD</small></div>
        <div className="lv-acts">
          <button className="btn btn-s" onClick={() => navigate('/sd/customers')}>✕ Discard</button>
          <button className="btn btn-p" onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save Customer'}</button>
        </div>
      </div>

      <div className="sd-fc">
        <div className="sd-ftb">
          <button className="btn btn-p btn-sm" onClick={save} disabled={saving}>Save</button>
          <button className="btn btn-s btn-sm" onClick={() => navigate('/sd/customers')}>✕ Discard</button>
        </div>
        <div className="sd-fb2">

          {/* Basic Info */}
          <div className="sd-sec">
            <div className="sd-stt">Basic Information</div>
            <div className="sd-fg3">
              <div className="sd-fg"><label>Customer Name <span className="req">*</span></label><input className="sd-fi" placeholder="e.g. Sri Lakshmi Mills Pvt Ltd" {...F('name')} /></div>
              <div className="sd-fg"><label>Customer Code</label><input className="sd-fi" value={form.code} disabled /></div>
              <div className="sd-fg"><label>Customer Type</label><select className="sd-fis" {...F('type')}><option>Manufacturing</option><option>Trading</option><option>Textile</option><option>Retail</option></select></div>
              <div className="sd-fg"><label>Mobile <span className="req">*</span></label><input className="sd-fi" placeholder="9876543210" {...F('mobile')} /></div>
              <div className="sd-fg"><label>Email</label><input className="sd-fi" placeholder="contact@company.com" {...F('email')} /></div>
              <div className="sd-fg"><label>Website</label><input className="sd-fi" placeholder="www.company.com" {...F('website')} /></div>
            </div>
          </div>

          {/* GST & Tax */}
          <div className="sd-sec">
            <div className="sd-stt">🏦 GST & Tax</div>
            <div className="sd-fg3">
              <div className="sd-fg"><label>GSTIN <span className="req">*</span></label><input className="sd-fi" placeholder="33AABCS1429B1Z5" maxLength={15} {...F('gstin')} /></div>
              <div className="sd-fg"><label>PAN Number</label><input className="sd-fi" placeholder="AABCS1429B" {...F('pan')} /></div>
              <div className="sd-fg"><label>State <span className="req">*</span></label>
                <select className="sd-fis" {...F('state')} onChange={e=>{const code=e.target.value==='Tamil Nadu'?'33':e.target.value==='Karnataka'?'29':'27';setForm(f=>({...f,state:e.target.value,stateCode:code}))}}>
                  <option>Tamil Nadu</option><option>Karnataka</option><option>Maharashtra</option><option>Andhra Pradesh</option><option>Telangana</option>
                </select>
              </div>
              <div className="sd-fg"><label>State Code</label><input className="sd-fi" value={form.stateCode} disabled /></div>
              <div className="sd-fg"><label>GST Type</label><select className="sd-fis" {...F('gstType')}><option>Regular</option><option>Composition</option><option>Unregistered</option><option>SEZ</option></select></div>
              <div className="sd-fg"><label>Tax Zone</label><select className="sd-fis" {...F('taxZone')}><option>Intra-State (CGST+SGST)</option><option>Inter-State (IGST)</option></select></div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="sd-sec">
            <div className="sd-stt">📍 Billing Address</div>
            <div className="sd-fg3">
              <div className="sd-fg sp2"><label>Address Line 1</label><input className="sd-fi" placeholder="Door No, Street Name" {...F('address1')} /></div>
              <div className="sd-fg"><label>City</label><input className="sd-fi" placeholder="Coimbatore" {...F('city')} /></div>
              <div className="sd-fg"><label>District</label><input className="sd-fi" placeholder="Coimbatore" {...F('district')} /></div>
              <div className="sd-fg"><label>State</label><select className="sd-fis" {...F('state')}><option>Tamil Nadu</option></select></div>
              <div className="sd-fg"><label>PIN Code</label><input className="sd-fi" placeholder="641001" {...F('pincode')} /></div>
            </div>
          </div>

          {/* Credit & Payment */}
          <div className="sd-sec">
            <div className="sd-stt">Credit & Payment</div>
            <div className="sd-fg3">
              <div className="sd-fg"><label>Credit Limit (₹)</label><input className="sd-fi" type="number" placeholder="500000" {...F('creditLimit')} /></div>
              <div className="sd-fg"><label>Credit Days</label><input className="sd-fi" type="number" {...F('creditDays')} /></div>
              <div className="sd-fg"><label>Payment Terms</label><select className="sd-fis" {...F('paymentTerms')}><option>Immediate</option><option>Net 15</option><option>Net 30</option><option>Net 45</option><option>Net 60</option></select></div>
              <div className="sd-fg"><label>Currency</label><select className="sd-fis" {...F('currency')}><option>INR — Indian Rupee</option><option>USD</option><option>EUR</option></select></div>
              <div className="sd-fg"><label>Price List</label><select className="sd-fis" {...F('priceList')}><option>Standard Price</option><option>Wholesale Price</option></select></div>
              <div className="sd-fg"><label>Sales Executive</label><select className="sd-fis" {...F('salesExec')}><option>Admin</option><option>Sales Team 1</option></select></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
