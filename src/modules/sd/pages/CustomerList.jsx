import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from '@components/ui/Badge'
import { sdApi } from '../services/sdApi'
import toast from 'react-hot-toast'

const STATIC_CUSTOMERS = [
  { id:'C-001', name:'Sri Lakshmi Mills Pvt Ltd',  gstin:'33AABCS1429B1Z5', city:'Coimbatore, TN', mobile:'9876543210', creditLimit:'₹5,00,000',  outstanding:'₹3,91,680', status:'active'   },
  { id:'C-002', name:'Coimbatore Spinners Ltd',     gstin:'33AABCC2341B1Z1', city:'Coimbatore, TN', mobile:'9865432101', creditLimit:'₹10,00,000', outstanding:'₹8,12,160', status:'active'   },
  { id:'C-003', name:'Rajesh Textiles',             gstin:'33AABCR4521B1Z8', city:'Tirupur, TN',    mobile:'9845671234', creditLimit:'₹3,00,000',  outstanding:'₹1,42,800', status:'active'   },
  { id:'C-004', name:'ARS Cotton Mills',            gstin:'33AABCA5631B1Z2', city:'Salem, TN',      mobile:'9876541230', creditLimit:'₹4,00,000',  outstanding:'₹4,63,510', status:'overdue'  },
  { id:'C-005', name:'Vijay Fabrics',               gstin:'33AABCV6741B1Z9', city:'Erode, TN',      mobile:'9845123456', creditLimit:'₹2,00,000',  outstanding:'₹0',        status:'active'   },
  { id:'C-006', name:'MEC Spinning Systems',        gstin:'33AABCM7851B1Z3', city:'Chennai, TN',    mobile:'9876512345', creditLimit:'₹8,00,000',  outstanding:'₹0',        status:'active'   },
  { id:'C-007', name:'Karthik Weavers',              gstin:'33AABCK8961B1Z6', city:'Karur, TN',      mobile:'9845098765', creditLimit:'₹1,00,000',  outstanding:'₹0',        status:'inactive' },
]

export default function CustomerList() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('list') // list | detail
  const [customers, setCustomers] = useState(STATIC_CUSTOMERS)
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('Tamil Nadu')
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    sdApi.getCustomers({ search, state: stateFilter })
      .then(r => { if (r.data?.length) setCustomers(r.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, stateFilter])

  const filtered = customers.filter(c =>
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.gstin.includes(search) || c.city.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === '' || c.status === statusFilter)
  )

  return (
    <div>
      <div className="lv-hdr">
        <div className="lv-ttl">Customer Master <small>{filtered.length} records</small></div>
        <div className="lv-acts">
          {/* View toggle */}
          <div style={{display:'flex',gap:0,border:'1px solid var(--odoo-border)',borderRadius:6,overflow:'hidden'}}>
            <button onClick={()=>setViewMode('list')}
              style={{padding:'5px 12px',fontSize:11,fontWeight:600,cursor:'pointer',border:'none',
                background:viewMode==='list'?'var(--odoo-purple)':'#fff',
                color:viewMode==='list'?'#fff':'var(--odoo-gray)'}}>
               List
            </button>
            <button onClick={()=>setViewMode('detail')}
              style={{padding:'5px 12px',fontSize:11,fontWeight:600,cursor:'pointer',border:'none',
                background:viewMode==='detail'?'var(--odoo-purple)':'#fff',
                color:viewMode==='detail'?'#fff':'var(--odoo-gray)'}}>
              ⊞ Detail
            </button>
          </div>
          <button className="btn btn-s btn-sm">Export</button>
          <button className="btn btn-p" onClick={() => navigate('/sd/customers/new')}>New Customer</button>
        </div>
      </div>

      <div className="sd-fb">
        <div className="sd-fs">
           <input type="text" placeholder="Search name, GSTIN, city…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="sd-fsel" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
          <option value="">All States</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Maharashtra">Maharashtra</option>
        </select>
        <select className="sd-fsel">
          <option>All Categories</option>
          <option>Manufacturing</option>
          <option>Textile</option>
        </select>
        <select className="sd-fsel" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value=''>All Status</option>
          <option value='active'>Active</option>
          <option value='overdue'>Overdue</option>
          <option value='inactive'>Inactive</option>
        </select>
      </div>

      <div className="dc">
        <div className="dc-hd">
          <h4>Customer List</h4>
          <button className="btn btn-p btn-sm" onClick={() => navigate('/sd/customers/new')}>+ New</button>
        </div>
        <table className="sd-tbl">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>Code</th>
              <th>Customer Name</th>
              <th>GSTIN</th>
              <th>City</th>
              {viewMode==='detail'&&<><th>Mobile</th><th>Email</th><th>Type</th><th>GST Type</th><th>Pay Terms</th><th>Price List</th><th>Sales Exec</th><th>Job Work</th></>}
              <th>Credit Limit</th>
              <th>Outstanding</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} onClick={() => navigate(`/sd/customers/${c.id}`)}>
                <td onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px',color:'#714B67'}}>{c.id}</td>
                <td><strong>{c.name}</strong></td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'11px'}}>{c.gstin}</td>
                <td>{c.city}</td>
                {viewMode==='detail'&&<>
                  <td>{c.mobile}</td>
                  <td style={{fontSize:11}}>{c.email||'—'}</td>
                  <td><span style={{padding:'2px 7px',borderRadius:8,fontSize:10,fontWeight:600,background:'#EBF2F8',color:'#1A5276'}}>{c.type||'Manufacturing'}</span></td>
                  <td style={{fontSize:11}}>{c.gstType||'Regular'}</td>
                  <td style={{fontSize:11}}>{c.paymentTerms||'Net 30'}</td>
                  <td style={{fontSize:11}}>{c.priceList||'Standard'}</td>
                  <td style={{fontSize:11}}>{c.salesExec||'Admin'}</td>
                  <td style={{textAlign:'center'}}>{c.jobWork?'':'—'}</td>
                </>}
                <td>{c.creditLimit}</td>
                <td><strong style={{color: c.status === 'overdue' ? '#B03A37' : '#212529'}}>{c.outstanding}</strong></td>
                <td><Badge status={c.status}>{c.status.toUpperCase()}</Badge></td>
                <td onClick={e => e.stopPropagation()} style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                  <button style={{padding:'3px 10px',fontSize:'11px',fontWeight:'700',borderRadius:'4px',border:'1px solid #DEE2E6',background:'#fff',color:'#714B67',cursor:'pointer'}} onClick={() => navigate(`/sd/customers/${c.id}`)}>View</button>
                  <button style={{padding:'3px 10px',fontSize:'11px',fontWeight:'700',borderRadius:'4px',border:'1px solid #714B67',background:'#EDE0EA',color:'#714B67',cursor:'pointer'}}
                    onClick={() => navigate(`/sd/customers/${c.id}?edit=true`)}>Edit</button>
                  <button style={{padding:'3px 10px',fontSize:'11px',fontWeight:'700',borderRadius:'4px',border:'none',
                    background: c.status==='inactive'?'#00A09D':'#6C757D',color:'#fff',cursor:'pointer'}}
                    onClick={() => {
                      setCustomers(cs => cs.map(x => x.id===c.id ? {...x, status: x.status==='inactive'?'active':'inactive'} : x))
                      toast.success(`${c.name} marked as ${c.status==='inactive'?'Active':'Inactive'}`)
                    }}>
                    {c.status==='inactive' ? 'Activate' : 'Deactivate'}
                  </button>
                  {c.status !== 'inactive' && (
                    <button style={{padding:'3px 10px',fontSize:'11px',fontWeight:'700',borderRadius:'4px',border:'none',background:'#714B67',color:'#fff',cursor:'pointer'}} onClick={() => navigate('/sd/invoices/new')}>Invoice</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sd-pgn">
          <span>Showing 1–{filtered.length} of {customers.length}</span>
          <div className="sd-pbs">
            <div className="sd-pb">‹</div>
            <div className="sd-pb" style={{background:'#714B67',color:'#fff',borderColor:'#714B67'}}>1</div>
            <div className="sd-pb">2</div>
            <div className="sd-pb">›</div>
          </div>
        </div>
      </div>
    </div>
  )
}
