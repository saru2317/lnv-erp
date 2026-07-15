import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || '/api'
const tok  = () => localStorage.getItem('lnv_token') || ''
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` })
const hdr2 = () => ({ Authorization:`Bearer ${tok()}` })
const inp  = { padding:'7px 9px', border:'1.5px solid #DDD', borderRadius:5, fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' }
const sel  = { ...inp }
const th   = { padding:'8px 10px', fontSize:11, color:'#6E2C00', textAlign:'left', borderBottom:'2px solid #E8E0E8' }
const td   = { padding:'7px 10px', fontSize:12, borderBottom:'1px solid #F0F0F0' }
const btnPrimary   = { padding:'7px 16px', background:'#6E2C00', color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:12 }
const btnSecondary = { padding:'6px 12px', background:'#fff', color:'#6E2C00', border:'1.5px solid #6E2C00', borderRadius:5, cursor:'pointer', fontWeight:700, fontSize:11 }
const btnDanger    = { padding:'4px 9px', background:'#fdecea', color:'#C0392B', border:'none', borderRadius:4, cursor:'pointer', fontSize:11 }

const CATEGORIES = ['Text','Reference','Fiction','Magazine']
const emptyForm = { accessionNo:'', isbn:'', title:'', author:'', publisher:'', publishYear:'',
  edition:'', category:'Text', subject:'', language:'English', totalCopies:1, purchaseDate:'', purchasePrice:'', location:'' }

export default function LibraryMaster() {
  const [instId,   setInstId]   = useState(localStorage.getItem('lnv_edu_inst') || '')
  const [books,    setBooks]    = useState([])
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId,setEditingId]= useState(null)
  const [form,     setForm]     = useState(emptyForm)

  useEffect(() => {
    const onStorage = () => setInstId(localStorage.getItem('lnv_edu_inst') || '')
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const load = () => {
    const q = search ? `&search=${encodeURIComponent(search)}` : ''
    fetch(`${BASE}/edu/books?institutionId=${instId}${q}`, { headers:hdr2() }).then(r=>r.json()).then(d=>setBooks(d.data||[]))
  }
  useEffect(() => { load() }, [instId])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [search])

  const openNew = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  const openEdit = (b) => {
    setForm({
      accessionNo:b.accessionNo, isbn:b.isbn||'', title:b.title, author:b.author||'',
      publisher:b.publisher||'', publishYear:b.publishYear||'', edition:b.edition||'',
      category:b.category||'Text', subject:b.subject||'', language:b.language||'English',
      totalCopies:b.totalCopies, purchaseDate:b.purchaseDate?b.purchaseDate.slice(0,10):'',
      purchasePrice:b.purchasePrice||'', location:b.location||'',
    })
    setEditingId(b.id); setShowForm(true)
  }
  const save = async () => {
    if (!form.title || (!editingId && !form.accessionNo)) return toast.error('Accession No and Title are required')
    try {
      const url = editingId ? `${BASE}/edu/books/${editingId}` : `${BASE}/edu/books`
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? form : { ...form, institutionId: instId }
      const r = await fetch(url, { method, headers:hdr(), body:JSON.stringify(body) })
      const d = await r.json()
      if (d.error) return toast.error(d.error)
      toast.success(editingId ? '✅ Book updated' : '✅ Book added')
      setShowForm(false); load()
    } catch { toast.error('Save failed') }
  }
  const toggleActive = async (b) => {
    await fetch(`${BASE}/edu/books/${b.id}`, { method:'PATCH', headers:hdr(), body:JSON.stringify({ isActive: !b.isActive }) })
    load()
  }

  return (
    <div style={{fontFamily:'DM Sans,sans-serif'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:'#fff',borderBottom:'1px solid #E8E0E8',padding:'10px 16px',marginBottom:12,flexWrap:'wrap',gap:10}}>
        <div style={{fontSize:18,fontWeight:800,color:'#6E2C00'}}>📚 Library — Books</div>
        <div style={{display:'flex',gap:8}}>
          <input placeholder='🔍 Search title/author/accession no' value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,width:260}} />
          <button onClick={openNew} style={btnPrimary}>+ New Book</button>
        </div>
      </div>

      <div style={{background:'#fff',border:'1px solid #E8E0E8',borderRadius:8,padding:16,overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={th}>Accession No</th><th style={th}>Title</th><th style={th}>Author</th>
            <th style={th}>Category</th><th style={th}>Subject</th><th style={th}>Copies (Total/Avail)</th>
            <th style={th}>Location</th><th style={th}>Status</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {books.map(b => (
              <tr key={b.id}>
                <td style={td}>{b.accessionNo}</td>
                <td style={td}>{b.title}</td>
                <td style={td}>{b.author||'—'}</td>
                <td style={td}>{b.category}</td>
                <td style={td}>{b.subject||'—'}</td>
                <td style={td}>{b.totalCopies} / <span style={{color:b.availableCopies===0?'#C0392B':'#1E8449',fontWeight:700}}>{b.availableCopies}</span></td>
                <td style={td}>{b.location||'—'}</td>
                <td style={td}>
                  <span style={{color:b.isActive?'#1E8449':'#C0392B',fontWeight:700,fontSize:11}}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={()=>openEdit(b)} style={{...btnSecondary,marginRight:6,padding:'4px 10px'}}>Edit</button>
                  <button onClick={()=>toggleActive(b)} style={btnDanger}>{b.isActive?'Deactivate':'Activate'}</button>
                </td>
              </tr>
            ))}
            {books.length===0 && <tr><td colSpan={9} style={{...td,textAlign:'center',color:'#aaa'}}>No books found</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,width:480,maxHeight:'85vh',overflow:'auto'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#6E2C00',marginBottom:14}}>
              {editingId ? 'Edit Book' : 'New Book'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {!editingId && (
                <div>
                  <label style={{fontSize:11,color:'#888'}}>Accession No *</label>
                  <input value={form.accessionNo} onChange={e=>setForm({...form,accessionNo:e.target.value})} style={inp} placeholder='LIB-0016' />
                </div>
              )}
              <div>
                <label style={{fontSize:11,color:'#888'}}>Title *</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={inp} />
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Author</label>
                  <input value={form.author} onChange={e=>setForm({...form,author:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Publisher</label>
                  <input value={form.publisher} onChange={e=>setForm({...form,publisher:e.target.value})} style={inp} />
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>ISBN</label>
                  <input value={form.isbn} onChange={e=>setForm({...form,isbn:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Edition</label>
                  <input value={form.edition} onChange={e=>setForm({...form,edition:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Publish Year</label>
                  <input value={form.publishYear} onChange={e=>setForm({...form,publishYear:e.target.value})} style={inp} />
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Category</label>
                  <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={sel}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Subject</label>
                  <input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Language</label>
                  <input value={form.language} onChange={e=>setForm({...form,language:e.target.value})} style={inp} />
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Total Copies</label>
                  <input type='number' min={1} value={form.totalCopies} onChange={e=>setForm({...form,totalCopies:e.target.value})} style={inp} />
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,color:'#888'}}>Location (Shelf/Rack)</label>
                  <input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} style={inp} />
                </div>
              </div>
              {!editingId && (
                <div style={{display:'flex',gap:8}}>
                  <div style={{flex:1}}>
                    <label style={{fontSize:11,color:'#888'}}>Purchase Date</label>
                    <input type='date' value={form.purchaseDate} onChange={e=>setForm({...form,purchaseDate:e.target.value})} style={inp} />
                  </div>
                  <div style={{flex:1}}>
                    <label style={{fontSize:11,color:'#888'}}>Purchase Price (₹)</label>
                    <input value={form.purchasePrice} onChange={e=>setForm({...form,purchasePrice:e.target.value})} style={inp} />
                  </div>
                </div>
              )}
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}>
              <button onClick={()=>setShowForm(false)} style={btnSecondary}>Cancel</button>
              <button onClick={save} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
