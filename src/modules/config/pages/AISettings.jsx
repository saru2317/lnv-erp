// ═══════════════════════════════════════════════════════════════════
// LNV ERP — Config / AISettings.jsx
// Tier 3 feature — Admin configures AI Assistant on/off per module
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const hdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })
const hdr2 = () => ({ Authorization:`Bearer ${localStorage.getItem('lnv_token')}` })

const MODULES = [
  { key:'SD',  label:'Sales & Distribution', icon:'🧾', color:'#714B67' },
  { key:'MM',  label:'Purchase & Materials',  icon:'📦', color:'#196F3D' },
  { key:'PP',  label:'Production',            icon:'⚙️',  color:'#6C3483' },
  { key:'FI',  label:'Finance',               icon:'💰', color:'#784212' },
  { key:'QM',  label:'Quality',               icon:'✅', color:'#117864' },
  { key:'WM',  label:'Warehouse',             icon:'🏭', color:'#1F618D' },
  { key:'HCM', label:'HR & Payroll',          icon:'👥', color:'#2E86C1' },
  { key:'CRM', label:'CRM',                   icon:'🤝', color:'#1A5276' },
  { key:'EDU', label:'Education',             icon:'🎓', color:'#6E2C00' },
  { key:'CIVIL', label:'Civil',               icon:'🏗️', color:'#B8860B' },
]

export default function AISettings() {
  const [config,  setConfig]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState({
    aiEnabled:     false,
    aiModules:     ['SD','MM','PP','FI','QM','WM','HCM'],
    assistantName: 'LNV Claude',
    quickPrompts:  {},
  })

  useEffect(() => {
    fetch(`${BASE}/ai/settings`, { headers:hdr2() })
      .then(r=>r.json())
      .then(d => {
        setConfig(d.data)
        setForm({
          aiEnabled:     d.data.aiEnabled     || false,
          aiModules:     d.data.aiModules      || ['SD','MM','PP','FI'],
          assistantName: d.data.assistantName  || 'LNV Claude',
          quickPrompts:  d.data.quickPrompts   || {},
        })
      })
      .catch(()=>toast.error('Failed to load AI settings'))
      .finally(()=>setLoading(false))
  }, [])

  const toggleModule = (key) => {
    setForm(f => ({
      ...f,
      aiModules: f.aiModules.includes(key)
        ? f.aiModules.filter(m => m !== key)
        : [...f.aiModules, key]
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const r = await fetch(`${BASE}/ai/settings`, {
        method:'POST', headers:hdr(), body:JSON.stringify(form)
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      toast.success(form.aiEnabled ? '🤖 AI Assistant enabled! Navigate to any module.' : 'AI Assistant disabled.')
      // Store in localStorage — AppShell picks it up instantly
      localStorage.setItem('lnv_ai_config', JSON.stringify(form))
      // Dispatch custom event for same-tab AppShell update
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'lnv_ai_config',
        newValue: JSON.stringify(form)
      }))
    } catch(e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#6C757D' }}>Loading...</div>

  const sec  = { background:'#fff', border:'1px solid #E8E0E8', borderRadius:8, marginBottom:16, overflow:'hidden' }
  const secH = { background:'linear-gradient(135deg,#714B67,#8B5E7E)', color:'#fff', padding:'10px 16px', fontSize:13, fontWeight:700 }
  const secB = { padding:'20px' }

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>

      {/* Page Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#714B67' }}>
            🤖 LNV Claude — AI Assistant Settings
          </h2>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#6C757D' }}>
            Tier 3 Feature — Configure the AI assistant for your company
          </p>
        </div>
        <button onClick={save} disabled={saving}
          style={{ padding:'9px 24px', background:'#714B67', color:'#fff',
            border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
          {saving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {/* Main Toggle */}
      <div style={sec}>
        <div style={secH}>⚡ Master Switch</div>
        <div style={secB}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'16px 20px', background: form.aiEnabled ? '#D4EDDA' : '#F8F9FA',
            border:`2px solid ${form.aiEnabled ? '#C3E6CB' : '#E0E0E0'}`,
            borderRadius:8, transition:'all .2s' }}>
            <div>
              <div style={{ fontWeight:800, fontSize:15,
                color: form.aiEnabled ? '#155724' : '#6C757D' }}>
                {form.aiEnabled ? '🟢 AI Assistant is ENABLED' : '⚫ AI Assistant is DISABLED'}
              </div>
              <div style={{ fontSize:12, color:'#6C757D', marginTop:4 }}>
                {form.aiEnabled
                  ? 'Floating chat button visible to all users on enabled modules'
                  : 'No AI button shown anywhere — users cannot access AI features'}
              </div>
            </div>
            {/* Toggle Switch */}
            <div onClick={() => setForm(f=>({...f, aiEnabled:!f.aiEnabled}))}
              style={{ width:52, height:28, borderRadius:14, cursor:'pointer',
                background: form.aiEnabled ? '#28A745' : '#CCC',
                position:'relative', transition:'background .2s', flexShrink:0 }}>
              <div style={{ width:22, height:22, background:'#fff', borderRadius:'50%',
                position:'absolute', top:3, transition:'left .2s',
                left: form.aiEnabled ? 27 : 3,
                boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>

          {/* API Key status */}
          <div style={{ marginTop:14, padding:'10px 14px',
            background: config?.apiKeyConfigured ? '#D4EDDA' : '#FFF3CD',
            border:`1px solid ${config?.apiKeyConfigured ? '#C3E6CB' : '#FFEAA7'}`,
            borderRadius:6, fontSize:12,
            color: config?.apiKeyConfigured ? '#155724' : '#856404' }}>
            {config?.apiKeyConfigured
              ? `✅ ${config?.aiEngine || 'AI'} API key configured in server .env`
              : '⚠️ No AI API key found — add GEMINI_API_KEY to .env'}
            <div style={{ marginTop:4, fontFamily:'DM Mono,monospace', fontSize:11, opacity:.7 }}>
              GEMINI_API_KEY=AIza... (add to C:\LNV\lnv-erp-backend\.env)
            </div>
          </div>
        </div>
      </div>

      {/* Assistant Name */}
      <div style={sec}>
        <div style={secH}>✏️ Assistant Branding</div>
        <div style={secB}>
          <label style={{ fontSize:11, fontWeight:700, color:'#6C757D',
            textTransform:'uppercase', display:'block', marginBottom:6 }}>
            Assistant Name
          </label>
          <input value={form.assistantName}
            onChange={e => setForm(f=>({...f, assistantName:e.target.value}))}
            style={{ padding:'9px 12px', border:'1.5px solid #DDD', borderRadius:6,
              fontSize:14, fontWeight:700, color:'#714B67', outline:'none', width:300 }}
            placeholder="LNV Claude" />
          <div style={{ fontSize:11, color:'#6C757D', marginTop:4 }}>
            This name appears on the floating button and chat header
          </div>
        </div>
      </div>

      {/* Module Enable/Disable */}
      <div style={sec}>
        <div style={secH}>📦 Enable per Module</div>
        <div style={secB}>
          <div style={{ fontSize:12, color:'#6C757D', marginBottom:14 }}>
            Select which modules show the AI assistant button.
            Disable for modules not relevant to your subscription tier.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {MODULES.map(m => {
              const enabled = form.aiModules.includes(m.key)
              return (
                <div key={m.key} onClick={() => toggleModule(m.key)}
                  style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'12px 14px', borderRadius:8, cursor:'pointer',
                    border:`2px solid ${enabled ? m.color : '#E0E0E0'}`,
                    background: enabled ? `${m.color}10` : '#F8F9FA',
                    transition:'all .15s' }}>
                  <span style={{ fontSize:20 }}>{m.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:12,
                      color: enabled ? m.color : '#6C757D' }}>{m.key}</div>
                    <div style={{ fontSize:11, color:'#999' }}>{m.label}</div>
                  </div>
                  <div style={{ width:18, height:18, borderRadius:4,
                    background: enabled ? m.color : '#E0E0E0',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontSize:12 }}>
                    {enabled ? '✓' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div style={sec}>
        <div style={secH}>👁️ Preview</div>
        <div style={secB}>
          <div style={{ position:'relative', height:120, background:'#F8F9FA',
            borderRadius:8, border:'1px dashed #DDD', overflow:'hidden' }}>
            <div style={{ position:'absolute', bottom:16, right:16,
              display:'flex', alignItems:'center', gap:8 }}>
              {form.aiEnabled && (
                <>
                  <div style={{ background:'#1C1C1C', color:'#fff', padding:'6px 12px',
                    borderRadius:20, fontSize:11, fontWeight:700, opacity:.9 }}>
                    Hi! I'm {form.assistantName} 👋
                  </div>
                  <div style={{ width:48, height:48, borderRadius:'50%',
                    background:'linear-gradient(135deg,#714B67,#9B59B6)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:22, boxShadow:'0 4px 16px rgba(113,75,103,0.4)',
                    cursor:'pointer' }}>
                    🤖
                  </div>
                </>
              )}
              {!form.aiEnabled && (
                <div style={{ fontSize:12, color:'#CCC' }}>AI button hidden when disabled</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save footer */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingBottom:20 }}>
        <button onClick={save} disabled={saving}
          style={{ padding:'10px 28px', background:'#714B67', color:'#fff',
            border:'none', borderRadius:6, fontWeight:700, fontSize:14,
            cursor:'pointer', opacity:saving?0.6:1 }}>
          {saving ? '⏳ Saving...' : '💾 Save AI Settings'}
        </button>
      </div>
    </div>
  )
}
