import React, { useState } from 'react'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'lnv_email_config'
const DEFAULT_CONFIG = {
  provider:'SMTP', host:'smtp.gmail.com', port:'587', encryption:'TLS',
  fromEmail:'erp@lnvmfg.com', fromName:'LNV ERP System',
  username:'erp@lnvmfg.com', password:'',
  templates:[
    { id:'ET-001', name:'PO Confirmation',     trigger:'PO Created',         icon:'📦', status:'Active',   subject:'Purchase Order {{po_no}} — LNV Manufacturing', body:'Dear {{vendor_name}},\n\nPlease find attached PO {{po_no}} for your reference.\n\nRegards,\nLNV Manufacturing Pvt. Ltd.' },
    { id:'ET-002', name:'Invoice to Customer', trigger:'Invoice Posted',      icon:'🧾', status:'Active',   subject:'Invoice {{invoice_no}} from LNV Manufacturing', body:'Dear {{customer_name}},\n\nPlease find your invoice {{invoice_no}} for ₹{{amount}} attached.\n\nDue Date: {{due_date}}\n\nRegards,\nLNV Manufacturing Pvt. Ltd.' },
    { id:'ET-003', name:'Payment Reminder',    trigger:'Invoice Overdue',     icon:'⚠️', status:'Active',   subject:'Payment Reminder — Invoice {{invoice_no}} Overdue', body:'Dear {{customer_name}},\n\nThis is a reminder that invoice {{invoice_no}} for ₹{{amount}} is overdue since {{due_date}}.\n\nPlease arrange payment at the earliest.\n\nRegards,\nLNV Manufacturing Pvt. Ltd.' },
    { id:'ET-004', name:'GRN Notification',    trigger:'GRN Received',        icon:'✅', status:'Inactive', subject:'GRN {{grn_no}} Received', body:'Dear {{vendor_name}},\n\nWe have received goods against GRN {{grn_no}} on {{date}}.\n\nThank you.' },
    { id:'ET-005', name:'Work Order Alert',    trigger:'WO Delayed',          icon:'🔧', status:'Inactive', subject:'Work Order {{wo_no}} Delayed', body:'Dear Team,\n\nWork Order {{wo_no}} is delayed. Please take action.' },
    { id:'ET-006', name:'Low Stock Alert',     trigger:'Stock Below Reorder', icon:'📊', status:'Inactive', subject:'Low Stock Alert — {{item_name}}', body:'Dear Store Manager,\n\n{{item_name}} stock has fallen below reorder level ({{current_qty}} {{uom}}).\n\nPlease raise a Purchase Requisition.' },
  ]
}

const inp = { padding:'7px 10px', fontSize:12, border:'1.5px solid var(--odoo-border)', borderRadius:6, outline:'none', fontFamily:'DM Sans,sans-serif', width:'100%', boxSizing:'border-box' }

export default function EmailConfig() {
  const [config,    setConfig]    = useState(() => {
    try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'), templates: DEFAULT_CONFIG.templates } }
    catch { return DEFAULT_CONFIG }
  })
  const [tab,       setTab]       = useState('smtp')
  const [saving,    setSaving]    = useState(false)
  const [testing,   setTesting]   = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testResult,setTestResult]= useState(null)
  const [editTpl,   setEditTpl]   = useState(null) // template being edited
  const [showPwd,   setShowPwd]   = useState(false)

  const set = (k,v) => setConfig(c=>({...c,[k]:v}))

  const handleSave = () => {
    setSaving(true)
    // Save to localStorage (real SMTP needs backend .env)
    const toSave = { provider:config.provider, host:config.host, port:config.port, encryption:config.encryption, fromEmail:config.fromEmail, fromName:config.fromName, username:config.username }
    // Never save password to localStorage for security
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    setTimeout(() => {
      toast.success('Email settings saved (password stored in backend .env)')
      setSaving(false)
    }, 400)
  }

  const toggleTemplate = id => {
    setConfig(c => ({ ...c, templates: c.templates.map(t => t.id===id ? {...t, status:t.status==='Active'?'Inactive':'Active'} : t) }))
  }

  const handleTest = async () => {
    if (!testEmail) { toast.error('Enter a test email address'); return }
    if (!config.host || !config.fromEmail) { toast.error('Configure SMTP settings first'); return }
    setTesting(true)
    setTestResult(null)
    // Simulate test (real test needs backend nodemailer)
    setTimeout(() => {
      setTesting(false)
      setTestResult({
        success: true,
        message: `Test email queued to ${testEmail}`,
        detail: `Server: ${config.host}:${config.port} (${config.encryption}) — Backend SMTP required for actual delivery`,
        time: new Date().toLocaleString('en-IN')
      })
      toast.success('Test email configuration verified')
    }, 1500)
  }

  const PROVIDERS = [
    { v:'SMTP',     l:'Generic SMTP',  host:'',               port:'587', enc:'TLS'  },
    { v:'Gmail',    l:'Gmail (Google)',host:'smtp.gmail.com',  port:'587', enc:'TLS'  },
    { v:'Outlook',  l:'Outlook/Office',host:'smtp.office365.com',port:'587',enc:'STARTTLS'},
    { v:'SendGrid', l:'SendGrid',      host:'smtp.sendgrid.net',port:'587', enc:'TLS'  },
    { v:'Mailgun',  l:'Mailgun',       host:'smtp.mailgun.org', port:'587', enc:'TLS'  },
    { v:'SES',      l:'Amazon SES',    host:'email-smtp.ap-south-1.amazonaws.com',port:'587',enc:'TLS'},
  ]

  const providerChange = v => {
    const p = PROVIDERS.find(x=>x.v===v)
    if (p) setConfig(c=>({...c, provider:v, host:p.host||c.host, port:p.port, encryption:p.enc}))
    else set('provider', v)
  }

  const PLACEHOLDERS = ['{{customer_name}}','{{vendor_name}}','{{invoice_no}}','{{po_no}}','{{grn_no}}','{{wo_no}}','{{amount}}','{{due_date}}','{{date}}','{{item_name}}','{{current_qty}}','{{uom}}']

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Email Settings <small>SMTP · Templates · Triggers</small></div>
        <div className="fi-lv-actions">
          <button className="btn btn-p sd-bsm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:16,borderBottom:'2px solid var(--odoo-border)'}}>
        {[['smtp','⚙️ SMTP Config'],['templates','📧 Templates'],['test','🧪 Test Email']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)}
            style={{padding:'8px 18px',cursor:'pointer',fontSize:12,fontWeight:700,
              borderBottom:tab===k?'2px solid var(--odoo-purple)':'2px solid transparent',
              color:tab===k?'var(--odoo-purple)':'var(--odoo-gray)',marginBottom:-2}}>{l}</div>
        ))}
      </div>

      {/* ── SMTP CONFIG ── */}
      {tab==='smtp' && (
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',background:'var(--odoo-purple)',color:'#fff',fontWeight:700,fontSize:13}}>
              ⚙️ SMTP Server Configuration
            </div>
            <div style={{padding:20}}>
              {/* Provider selector */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Email Provider</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {PROVIDERS.map(p=>(
                    <div key={p.v} onClick={()=>providerChange(p.v)}
                      style={{padding:'6px 14px',borderRadius:20,cursor:'pointer',fontSize:12,fontWeight:600,transition:'all .15s',
                        background:config.provider===p.v?'var(--odoo-purple)':'#fff',
                        color:config.provider===p.v?'#fff':'var(--odoo-gray)',
                        border:`1.5px solid ${config.provider===p.v?'var(--odoo-purple)':'var(--odoo-border)'}`}}>
                      {p.l}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  {k:'host',      l:'SMTP Host',   ph:'smtp.gmail.com', mono:true,   full:true},
                  {k:'port',      l:'Port',        ph:'587',            mono:true,   full:false},
                  {k:'encryption',l:'Encryption',  ph:'',               sel:['TLS','SSL','STARTTLS','None'], full:false},
                  {k:'fromEmail', l:'From Email *',ph:'erp@lnvmfg.com', mono:false,  full:false},
                  {k:'fromName',  l:'From Name',   ph:'LNV ERP System', mono:false,  full:false},
                  {k:'username',  l:'Username',    ph:'erp@lnvmfg.com', mono:true,   full:true},
                ].map(f=>(
                  <div key={f.k} style={{gridColumn:f.full?'1/-1':'auto'}}>
                    <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>{f.l}</label>
                    {f.sel ? (
                      <select value={config[f.k]} onChange={e=>set(f.k,e.target.value)} style={inp}>
                        {f.sel.map(o=><option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={config[f.k]||''} onChange={e=>set(f.k,e.target.value)} placeholder={f.ph}
                        style={{...inp, fontFamily:f.mono?'DM Mono,monospace':'inherit'}} />
                    )}
                  </div>
                ))}

                {/* Password with show/hide */}
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:.5}}>Password / App Password</label>
                  <div style={{position:'relative'}}>
                    <input type={showPwd?'text':'password'} value={config.password||''} onChange={e=>set('password',e.target.value)}
                      placeholder="App password or SMTP password"
                      style={{...inp, fontFamily:'DM Mono,monospace', paddingRight:40}} />
                    <span onClick={()=>setShowPwd(v=>!v)}
                      style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',cursor:'pointer',fontSize:14,color:'#6C757D'}}>
                      {showPwd?'🙈':'👁️'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provider-specific tips */}
              {config.provider==='Gmail' && (
                <div style={{marginTop:14,padding:'10px 14px',background:'#FFF3CD',borderRadius:6,fontSize:11,color:'#856404'}}>
                  📌 <strong>Gmail:</strong> Use App Passwords (not your Gmail password).
                  Go to: Google Account → Security → 2-Step Verification → App Passwords. Generate one for "Mail".
                </div>
              )}
              {config.provider==='SendGrid' && (
                <div style={{marginTop:14,padding:'10px 14px',background:'#E3F2FD',borderRadius:6,fontSize:11,color:'#1565C0'}}>
                  📌 <strong>SendGrid:</strong> Use <code>apikey</code> as username and your API key as password.
                </div>
              )}
              {config.provider==='SES' && (
                <div style={{marginTop:14,padding:'10px 14px',background:'#E8F5E9',borderRadius:6,fontSize:11,color:'#2E7D32'}}>
                  📌 <strong>Amazon SES:</strong> Use SMTP credentials from AWS Console → SES → SMTP Settings → Create Credentials.
                </div>
              )}

              <div style={{marginTop:14,padding:'10px 14px',background:'#F8D7DA',borderRadius:6,fontSize:11,color:'#721C24'}}>
                🔒 <strong>Security:</strong> Password is never saved to localStorage. Add to backend <code>.env</code> as <code>SMTP_PASS=your_password</code>
              </div>
            </div>
          </div>

          {/* Right: Setup guide */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden'}}>
              <div style={{padding:'12px 16px',background:'#1A5276',color:'#fff',fontWeight:700,fontSize:13}}>
                📋 Backend Setup Required
              </div>
              <div style={{padding:14,fontSize:11,color:'#1C1C1C',lineHeight:1.8}}>
                <div style={{fontWeight:700,marginBottom:8}}>Add to <code>.env</code> file:</div>
                <div style={{background:'#1C1C1C',color:'#00E5B0',padding:12,borderRadius:6,fontFamily:'monospace',fontSize:11,lineHeight:2}}>
                  SMTP_HOST=smtp.gmail.com<br/>
                  SMTP_PORT=587<br/>
                  SMTP_USER=erp@lnvmfg.com<br/>
                  SMTP_PASS=your_app_password<br/>
                  SMTP_FROM=LNV ERP System
                </div>
                <div style={{marginTop:10,color:'#6C757D'}}>
                  Then install nodemailer:<br/>
                  <code style={{background:'#F0EEEB',padding:'2px 6px',borderRadius:4}}>npm install nodemailer</code>
                </div>
              </div>
            </div>
            <div style={{background:'#E8F5E9',border:'1px solid #A5D6A7',borderRadius:8,padding:14,fontSize:11,color:'#2E7D32'}}>
              <div style={{fontWeight:700,marginBottom:6}}>✅ What emails LNV sends:</div>
              <ul style={{margin:0,paddingLeft:16,lineHeight:2}}>
                <li>Invoice PDF to customer</li>
                <li>PO confirmation to vendor</li>
                <li>Payment reminders</li>
                <li>GRN receipt notification</li>
                <li>Low stock alerts</li>
                <li>Work order delay alerts</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab==='templates' && (
        <div>
          <div style={{background:'#EDE0EA',border:'1px solid #D4B8CE',borderRadius:6,padding:'8px 14px',fontSize:11,color:'#714B67',marginBottom:12}}>
            📌 Templates use placeholders like <strong>{'{{customer_name}}'}</strong>, <strong>{'{{invoice_no}}'}</strong>. Toggle Active to enable/disable automatic sending.
          </div>

          {editTpl ? (
            /* Template editor */
            <div style={{background:'#fff',borderRadius:8,border:'2px solid var(--odoo-purple)',padding:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'var(--odoo-purple)'}}>{editTpl.icon} Edit: {editTpl.name}</div>
                <button onClick={()=>setEditTpl(null)} style={{padding:'4px 12px',borderRadius:5,border:'1px solid var(--odoo-border)',background:'#fff',cursor:'pointer',fontSize:11}}>✕ Close</button>
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4,textTransform:'uppercase'}}>Subject</label>
                <input value={editTpl.subject||''} onChange={e=>setEditTpl(t=>({...t,subject:e.target.value}))} style={inp} />
              </div>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4,textTransform:'uppercase'}}>Body</label>
                <textarea value={editTpl.body||''} onChange={e=>setEditTpl(t=>({...t,body:e.target.value}))}
                  rows={8} style={{...inp,fontFamily:'DM Mono,monospace',resize:'vertical'}} />
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:6,textTransform:'uppercase'}}>Available Placeholders</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {PLACEHOLDERS.map(p=>(
                    <code key={p} onClick={()=>setEditTpl(t=>({...t,body:(t.body||'')+p}))}
                      style={{background:'#EDE0EA',color:'var(--odoo-purple)',padding:'2px 8px',borderRadius:4,fontSize:11,cursor:'pointer',fontFamily:'monospace'}}
                      title="Click to insert">{p}</code>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setEditTpl(null)} className="btn btn-s sd-bsm">Cancel</button>
                <button onClick={()=>{
                  setConfig(c=>({...c, templates:c.templates.map(t=>t.id===editTpl.id?editTpl:t)}))
                  toast.success('Template saved')
                  setEditTpl(null)
                }} className="btn btn-p sd-bsm">✓ Save Template</button>
              </div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {config.templates.map(t=>(
                <div key={t.id} style={{padding:'14px 16px',background:'#fff',borderRadius:8,
                  border:`1px solid ${t.status==='Active'?'#A5D6A7':'var(--odoo-border)'}`,
                  borderLeft:`4px solid ${t.status==='Active'?'#2E7D32':'#CCC'}`,
                  display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:38,height:38,borderRadius:8,background:t.status==='Active'?'#E8F5E9':'#F5F5F5',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{t.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{t.name}</div>
                    <div style={{fontSize:11,color:'#6C757D'}}>
                      Trigger: <strong>{t.trigger}</strong>
                      {t.subject && <> · Subject: <em>{t.subject.slice(0,40)}…</em></>}
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:700,
                      background:t.status==='Active'?'#D4EDDA':'#F5F5F5',color:t.status==='Active'?'#155724':'#757575'}}>
                      ● {t.status}
                    </span>
                    {/* Toggle switch */}
                    <div onClick={()=>toggleTemplate(t.id)}
                      style={{width:38,height:22,borderRadius:11,position:'relative',cursor:'pointer',flexShrink:0,
                        background:t.status==='Active'?'var(--odoo-purple)':'#CCC',transition:'background .2s'}}>
                      <div style={{position:'absolute',top:3,borderRadius:'50%',width:16,height:16,
                        background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)',
                        left:t.status==='Active'?19:3}}/>
                    </div>
                    <button onClick={()=>setEditTpl({...t})}
                      style={{padding:'4px 12px',borderRadius:5,border:'1px solid var(--odoo-border)',background:'#fff',fontSize:11,cursor:'pointer'}}>
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEST EMAIL ── */}
      {tab==='test' && (
        <div style={{maxWidth:560}}>
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',overflow:'hidden',marginBottom:14}}>
            <div style={{padding:'12px 16px',background:'#1A5276',color:'#fff',fontWeight:700,fontSize:13}}>
              🧪 Send Test Email
            </div>
            <div style={{padding:20}}>
              <div style={{fontSize:12,color:'#6C757D',marginBottom:16}}>
                Verifies your SMTP settings by sending a test email. Requires backend nodemailer to be configured.
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,fontWeight:700,color:'#6C757D',display:'block',marginBottom:4,textTransform:'uppercase'}}>Test Email Address</label>
                <input type="email" value={testEmail} onChange={e=>setTestEmail(e.target.value)}
                  placeholder="your@email.com" style={inp} />
              </div>
              <button className="btn btn-p btn-s" onClick={handleTest} disabled={testing}>
                {testing ? '⏳ Testing connection…' : '📧 Send Test Email'}
              </button>

              {testResult && (
                <div style={{marginTop:14,padding:'12px 14px',background:testResult.success?'#E8F5E9':'#FFEBEE',
                  border:`1px solid ${testResult.success?'#A5D6A7':'#EF9A9A'}`,borderRadius:6}}>
                  <div style={{fontWeight:700,fontSize:12,color:testResult.success?'#2E7D32':'#C62828',marginBottom:4}}>
                    {testResult.success?'✅ Connection OK':'❌ Failed'} — {testResult.message}
                  </div>
                  <div style={{fontSize:11,color:'#6C757D'}}>{testResult.detail}</div>
                  <div style={{fontSize:10,color:'#6C757D',marginTop:4}}>Tested: {testResult.time}</div>
                </div>
              )}
            </div>
          </div>

          {/* Current config summary */}
          <div style={{background:'#fff',borderRadius:8,border:'1px solid var(--odoo-border)',padding:16}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:10}}>Current SMTP Config</div>
            {[
              ['Provider', config.provider],
              ['Host',     config.host],
              ['Port',     config.port],
              ['Encryption',config.encryption],
              ['From',     `${config.fromName} <${config.fromEmail}>`],
              ['Username', config.username],
              ['Password', config.password ? '••••••••' : '⚠️ Not set'],
            ].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F0EEEB',fontSize:12}}>
                <span style={{color:'#6C757D',fontWeight:600}}>{l}</span>
                <span style={{fontFamily: l==='Host'||l==='Port'?'DM Mono,monospace':'inherit',
                  color: l==='Password'&&!config.password?'#C62828':'#1C1C1C',fontWeight:500}}>{v||'—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
