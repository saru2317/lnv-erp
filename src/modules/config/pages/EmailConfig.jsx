import React, { useState } from 'react'
import { EMAIL_CONFIG } from './_configData'

export default function EmailConfig() {
  const [config, setConfig]   = useState(EMAIL_CONFIG)
  const [tab,    setTab]      = useState('smtp')
  const [testing,setTesting]  = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }))

  const handleTest = () => {
    if (!testEmail) { alert('Enter a test email address'); return }
    setTesting(true)
    setTimeout(() => { setTesting(false); alert(`✅ Test email sent to ${testEmail}`) }, 1800)
  }

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const toggleTemplate = id => {
    setConfig(c => ({ ...c, templates: c.templates.map(t => t.id===id ? {...t, status:t.status==='Active'?'Inactive':'Active'} : t) }))
  }

  return (
    <div>
      <div className="fi-lv-hdr">
        <div className="fi-lv-title">Email Settings <small>SMTP · Templates · Triggers</small></div>
        <div className="fi-lv-actions">
          <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'4px 12px',borderRadius:'6px',
            background:config.status==='Connected'?'#E8F5E9':'#FFEBEE',
            color:config.status==='Connected'?'#2E7D32':'#C62828',fontSize:'12px',fontWeight:'700'}}>
            {config.status==='Connected'?'🟢':'🔴'} {config.status}
          </div>
          <button className="btn btn-p btn-s" onClick={handleSave}>{saved?'✅ Saved!':'💾 Save'}</button>
        </div>
      </div>

      <div style={{display:'flex',gap:0,marginBottom:'16px',borderBottom:'2px solid var(--odoo-border)'}}>
        {[['smtp','📧 SMTP Config'],['templates','📋 Templates'],['test','🧪 Test Email']].map(([k,l])=>(
          <div key={k} onClick={()=>setTab(k)}
            style={{padding:'8px 18px',cursor:'pointer',fontSize:'12px',fontWeight:'700',
              borderBottom:tab===k?'2px solid var(--odoo-purple)':'2px solid transparent',
              color:tab===k?'var(--odoo-purple)':'var(--odoo-gray)',marginBottom:'-2px'}}>{l}</div>
        ))}
      </div>

      {tab==='smtp' && (
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>📧 SMTP Server Configuration</h3></div>
          <div className="fi-panel-body">
            <div className="sd-form-grid">
              <div className="sd-field">
                <label>Provider</label>
                <select value={config.provider} onChange={e=>set('provider',e.target.value)}>
                  <option>SMTP</option><option>SendGrid</option><option>Mailgun</option><option>SES</option>
                </select>
              </div>
              <div className="sd-field"><label>SMTP Host</label><input value={config.host} onChange={e=>set('host',e.target.value)} placeholder="smtp.gmail.com" style={{fontFamily:'DM Mono,monospace'}} /></div>
              <div className="sd-field"><label>Port</label><input value={config.port} onChange={e=>set('port',e.target.value)} style={{fontFamily:'DM Mono,monospace'}} /></div>
              <div className="sd-field">
                <label>Encryption</label>
                <select value={config.encryption} onChange={e=>set('encryption',e.target.value)}>
                  <option>TLS</option><option>SSL</option><option>None</option>
                </select>
              </div>
              <div className="sd-field"><label>From Email</label><input value={config.fromEmail} onChange={e=>set('fromEmail',e.target.value)} type="email" /></div>
              <div className="sd-field"><label>From Name</label><input value={config.fromName} onChange={e=>set('fromName',e.target.value)} /></div>
              <div className="sd-field"><label>Username</label><input value={config.username} onChange={e=>set('username',e.target.value)} style={{fontFamily:'DM Mono,monospace'}} /></div>
              <div className="sd-field"><label>Password</label><input type="password" value={config.password} onChange={e=>set('password',e.target.value)} /></div>
            </div>
            <div style={{marginTop:'12px',padding:'10px 14px',background:'#F8F9FA',borderRadius:'6px',fontSize:'11px',color:'var(--odoo-gray)'}}>
              💡 For Gmail SMTP, use App Passwords (not your actual Gmail password). Go to Google Account → Security → 2FA → App Passwords.
            </div>
          </div>
        </div>
      )}

      {tab==='templates' && (
        <div>
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {config.templates.map(t => (
              <div key={t.id} style={{padding:'12px 16px',background:'#fff',borderRadius:'8px',
                border:'1px solid var(--odoo-border)',display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'8px',background:'#EDE0EA',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>📧</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{t.name}</div>
                  <div style={{fontSize:'11px',color:'var(--odoo-gray)'}}>Trigger: <strong>{t.trigger}</strong></div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{padding:'3px 8px',borderRadius:'8px',fontSize:'10px',fontWeight:'700',
                    background:t.status==='Active'?'#E8F5E9':'#F5F5F5',color:t.status==='Active'?'#2E7D32':'#757575'}}>
                    ● {t.status}
                  </span>
                  <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                    <div onClick={()=>toggleTemplate(t.id)}
                      style={{width:'36px',height:'20px',borderRadius:'10px',position:'relative',transition:'all .2s',
                        background:t.status==='Active'?'var(--odoo-purple)':'#DDD',cursor:'pointer'}}>
                      <div style={{position:'absolute',top:'2px',left:t.status==='Active'?'18px':'2px',width:'16px',height:'16px',
                        borderRadius:'50%',background:'#fff',transition:'all .2s'}}></div>
                    </div>
                  </label>
                  <button className="btn-act-edit" style={{fontSize:'10px',padding:'3px 7px'}}>✏️ Edit</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'12px',padding:'10px 14px',background:'#FFF3CD',borderRadius:'6px',fontSize:'12px',color:'#856404'}}>
            💡 Templates use placeholders like {'{{customer_name}}'}, {'{{invoice_no}}'}, {'{{amount}}'}. Click Edit to customise.
          </div>
        </div>
      )}

      {tab==='test' && (
        <div className="fi-panel">
          <div className="fi-panel-hdr"><h3>🧪 Send Test Email</h3></div>
          <div className="fi-panel-body">
            <div style={{marginBottom:'12px',fontSize:'12px',color:'var(--odoo-gray)'}}>
              Sends a test email using your current SMTP settings to verify the connection.
            </div>
            <div style={{display:'flex',gap:'10px',alignItems:'flex-end',maxWidth:'400px'}}>
              <div className="sd-field" style={{flex:1,marginBottom:0}}>
                <label>Test Email Address</label>
                <input type="email" value={testEmail} onChange={e=>setTestEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <button className="btn btn-p btn-s" onClick={handleTest} disabled={testing}
                style={{whiteSpace:'nowrap',flexShrink:0}}>
                {testing ? '⏳ Sending…' : '📤 Send Test'}
              </button>
            </div>
            <div style={{marginTop:'16px',padding:'12px 14px',background:'#F8F9FA',borderRadius:'6px',fontSize:'12px'}}>
              <div style={{fontWeight:'700',marginBottom:'6px'}}>Last Test Result</div>
              <div style={{color:'var(--odoo-green)',fontWeight:'600'}}>✅ Connected · Last tested: {config.lastTest}</div>
              <div style={{color:'var(--odoo-gray)',fontSize:'11px',marginTop:'2px'}}>Server: {config.host}:{config.port} ({config.encryption})</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
