import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListView } from '@hooks/useListView'
import ListViewToggle from '@components/ui/ListViewToggle'
import toast from 'react-hot-toast'
import { mmApi } from '../services/mmApi'

const fmtC = n => '₹'+Number(n||0).toLocaleString('en-IN')

function VendorDetailModal({ vendor, onClose }) {
  const nav = useNavigate()
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
      <div style={{ background:'#fff', borderRadius:10, width:580,
        maxHeight:'90vh', overflow:'hidden', display:'flex',
        flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        {/* Header */}
        <div style={{ background:'#714B67', padding:'14px 20px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ color:'#fff', margin:0, fontFamily:'Syne,sans-serif',
              fontSize:15, fontWeight:700 }}>🏢 {vendor.vendorName}</h3>
            <p style={{ color:'rgba(255,255,255,.7)', margin:'2px 0 0',
              fontSize:11 }}>{vendor.vendorCode} · Vendor Details</p>
          </div>
          <span onClick={onClose}
            style={{ color:'#fff', cursor:'pointer', fontSize:20 }}>✕</span>
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', flex:1, padding:20 }}>
          {/* Status */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <span style={{ padding:'4px 12px', borderRadius:10,
              fontSize:11, fontWeight:700,
              background: vendor.isActive?'#D4EDDA':'#E9ECEF',
              color: vendor.isActive?'#155724':'#6C757D' }}>
              {vendor.isActive?'✅ Active':'❌ Inactive'}
            </span>
            {vendor.gstin && (
              <span style={{ padding:'4px 12px', borderRadius:10,
                fontSize:11, fontWeight:600,
                background:'#D1ECF1', color:'#0C5460' }}>
                GST: {vendor.gstin}
              </span>
            )}
          </div>

          {/* Details grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:1, background:'#E0D5E0', borderRadius:8, overflow:'hidden' }}>
            {[
              ['Vendor Code',    vendor.vendorCode           ],
              ['Vendor Name',    vendor.vendorName           ],
              ['GSTIN',          vendor.gstin||'—'           ],
              ['PAN No.',        vendor.panNo||'—'           ],
              ['City',           vendor.city||'—'            ],
              ['State',          vendor.state||'—'           ],
              ['Payment Terms',  vendor.paymentTerms||'—'    ],
              ['Credit Days',    vendor.creditDays||'—'      ],
              ['Contact Person', vendor.contactPerson||'—'   ],
              ['Phone',          vendor.phone||'—'           ],
              ['Email',          vendor.email||'—'           ],
              ['Category',       vendor.vendorCategory||'—'  ],
              ['Bank Name',      vendor.bankName||'—'        ],
              ['Account No.',    vendor.accountNo||'—'       ],
              ['IFSC',           vendor.ifsc||'—'            ],
              ['MSME Registered',vendor.msmeRegistered?'Yes':'No'],
            ].map(([label, value])=>(
              <div key={label} style={{ background:'#fff',
                padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:'#6C757D',
                  fontWeight:700, textTransform:'uppercase',
                  letterSpacing:.3, marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600,
                  color:'#1C1C1C' }}>{value}</div>
              </div>
            ))}
          </div>

          {vendor.address && (
            <div style={{ marginTop:12, background:'#F8F7FA',
              padding:'10px 14px', borderRadius:8,
              border:'1px solid #E0D5E0' }}>
              <div style={{ fontSize:10, color:'#6C757D', fontWeight:700,
                textTransform:'uppercase', marginBottom:4 }}>Address</div>
              <div style={{ fontSize:12, color:'#495057' }}>
                {vendor.address}
                {vendor.city && `, ${vendor.city}`}
                {vendor.state && `, ${vendor.state}`}
                {vendor.pincode && ` - ${vendor.pincode}`}
              </div>
            </div>
          )}

          {/* Info note */}
          <div style={{ marginTop:12, background:'#FFF3CD',
            padding:'8px 12px', borderRadius:6,
            fontSize:11, color:'#856404' }}>
            ℹ️ To edit vendor details, go to MDM → Vendor Master
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #E0D5E0',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', background:'#F8F7FA' }}>
          <button onClick={onClose}
            style={{ padding:'8px 20px', background:'#fff', color:'#6C757D',
              border:'1.5px solid #E0D5E0', borderRadius:6,
              fontSize:13, cursor:'pointer' }}>Close</button>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>nav('/mm/vendors/ledger')}
              style={{ padding:'8px 16px', background:'#D1ECF1',
                color:'#0C5460', border:'1px solid #0C5460',
                borderRadius:6, fontSize:12, cursor:'pointer',
                fontWeight:600 }}>
              📒 Ledger
            </button>
            <button onClick={()=>nav('/mdm/vendors')}
              style={{ padding:'8px 16px', background:'#714B67',
                color:'#fff', border:'none', borderRadius:6,
                fontSize:12, cursor:'pointer', fontWeight:700 }}>
              ✏️ Edit in MDM →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VendorList() {
  const nav = useNavigate()
  const { viewMode, toggleView } = useListView('MM-VendorList')
  const [vendors,   setVendors]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [selVendor, setSelVendor] = useState(null)

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const data = await mmApi.getVendors()
      setVendors(data.data||[])
    } catch(e){ toast.error(e.message) } finally { setLoading(false) }
  }, [])

  useEffect(()=>{ fetchVendors() }, [])

  const filtered = vendors.filter(v =>
    !search ||
    v.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    v.gstin?.toLowerCase().includes(search.toLowerCase()) ||
    v.vendorCode?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">
          Vendor Master <small>MK03 · All Vendors</small>
        </div>
        <div className="lv-acts">
          <ListViewToggle viewMode={viewMode} onToggle={toggleView} />
          <button className="btn btn-s sd-bsm">Export</button>
          <button className="btn btn-p sd-bsm"
            onClick={()=>nav('/mdm/vendors')}>＋ New Vendor</button>
        </div>
      </div>

      <div className="mm-filt">
        <div className="mm-fs-input">
          <input placeholder="Search vendor name, GSTIN, code..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="mm-fsel">
          <option>All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      {/* KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
        gap:10, marginBottom:14 }}>
        {[
          { l:'Total Vendors', v:vendors.length,
            c:'#714B67', bg:'#EDE0EA' },
          { l:'Active',
            v:vendors.filter(v=>v.isActive).length,
            c:'#155724', bg:'#D4EDDA' },
          { l:'Inactive',
            v:vendors.filter(v=>!v.isActive).length,
            c:'#6C757D', bg:'#E9ECEF' },
        ].map(k=>(
          <div key={k.l} style={{ background:k.bg, borderRadius:8,
            padding:'10px 14px', border:`1px solid ${k.c}22` }}>
            <div style={{ fontSize:10, color:k.c, fontWeight:700,
              textTransform:'uppercase' }}>{k.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:k.c,
              fontFamily:'Syne,sans-serif' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>
          ⏳ Loading vendors...
        </div>
      ) : filtered.length===0 ? (
        <div style={{ padding:60, textAlign:'center', color:'#6C757D',
          background:'#fff', borderRadius:8, border:'2px dashed #E0D5E0' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🏢</div>
          <div style={{ fontWeight:700 }}>No vendors found</div>
          <div style={{ fontSize:12, marginTop:4 }}>
            Add vendors in MDM → Vendor Master
          </div>
          <button className="btn btn-p sd-bsm"
            style={{ marginTop:12 }}
            onClick={()=>nav('/mdm/vendors')}>
            Go to Vendor Master →
          </button>
        </div>
      ) : (
        <table className="mm-tbl">
          <thead>
            <tr>
              <th><input type="checkbox"/></th>
              <th>Code</th>
              <th>Vendor Name</th>
              <th>GSTIN</th>
              <th>City</th>
              <th>Payment Terms</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v=>(
              <tr key={v.vendorCode}
                onClick={()=>setSelVendor(v)}
                style={{ cursor:'pointer' }}>
                <td onClick={e=>e.stopPropagation()}>
                  <input type="checkbox"/></td>
                <td style={{ fontFamily:'DM Mono,monospace',
                  fontSize:12, color:'var(--odoo-purple)' }}>
                  {v.vendorCode}
                </td>
                <td><strong>{v.vendorName}</strong></td>
                <td style={{ fontFamily:'DM Mono,monospace',
                  fontSize:11, color:'#6C757D' }}>
                  {v.gstin||'—'}
                </td>
                <td style={{ fontSize:12 }}>{v.city||'—'}</td>
                <td style={{ fontSize:12, color:'#6C757D' }}>
                  {v.paymentTerms||'—'}
                </td>
                <td>
                  <span style={{ padding:'2px 8px', borderRadius:10,
                    fontSize:11, fontWeight:700,
                    background:v.isActive?'#D4EDDA':'#E9ECEF',
                    color:v.isActive?'#155724':'#6C757D' }}>
                    {v.isActive?'Active':'Inactive'}
                  </span>
                </td>
                <td onClick={e=>e.stopPropagation()}>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="btn-xs"
                      onClick={()=>setSelVendor(v)}>
                      👁 View
                    </button>
                    <button className="btn-xs"
                      onClick={()=>nav('/mm/vendors/ledger')}>
                      Ledger
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selVendor && (
        <VendorDetailModal
          vendor={selVendor}
          onClose={()=>setSelVendor(null)} />
      )}
    </div>
  )
}
