import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import UniversalSearch from '@components/ui/UniversalSearch'
import NotificationsPanel from '@components/ui/NotificationsPanel'
import styles from './AppShell.module.css'

const ALL_MODULES = [
  { key:'home',    label:'Home',        icon:'' },
  { key:'sd',      label:'Sales',       icon:'' },
  { key:'mm',      label:'Purchase',    icon:'' },
  { key:'wm',      label:'Warehouse',   icon:'' },
  { key:'fi',      label:'Finance',     icon:'' },
  { key:'pp',      label:'Production',  icon:'' },
  { key:'qm',      label:'Quality',     icon:'' },
  { key:'pm',      label:'Maintenance', icon:'' },
  { key:'hcm',     label:'HR',          icon:'' },
  { key:'crm',     label:'CRM',         icon:'' },
  { key:'admin',   label:'Admin',       icon:'' },
  { key:'config',  label:'Config',      icon:'' },
  { key:'tm',      label:'Transport',   icon:'' },
  { key:'am',      label:'Assets',      icon:'' },
  { key:'civil',   label:'Civil',       icon:'' },
  { key:'vm',      label:'Visitor',     icon:'🪪' },
  { key:'cn',      label:'Canteen',     icon:'' },
  { key:'reports', label:'Reports',     icon:'' },
  { key:'kpi',     label:'KPI / KRA',   icon:'' },
  { key:'mdm',     label:'MDM',         icon:'' },
]

const ROLE_COLORS = {
  admin:'#714B67', manager:'#017E84', accounts:'#E06F39',
  operations:'#00A09D', hr:'#8E44AD', sales:'#2980B9',
  transport:'#E06F39', civil:'#1B4F72', viewer:'#6C757D',
}

export default function AppShell() {
  const { user, logout, hasAccess } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const currentMod = location.pathname.split('/')[1] || 'home'
  const now = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })

  return (
    <div className={styles.shell}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}>LNV</div>
            <div>
              <span className={styles.logoName}>LNV ERP</span>
              <span className={styles.logoSub}>v2.0</span>
            </div>
          </div>
        </div>

        <UniversalSearch />

        <div className={styles.topRight}>
          <div className={styles.shellDate}>{now}</div>
          <NotificationsPanel />
          <button className={styles.iconBtn} onClick={() => navigate('/config')}></button>
          <span className={styles.roleBadge} style={{ borderColor: ROLE_COLORS[user?.role] }}>
            {user?.role?.toUpperCase()}
          </span>
          <div className={styles.userPill} onClick={logout} title="Click to logout">
            <div className={styles.userAvatar} style={{ background: ROLE_COLORS[user?.role] || '#714B67' }}>
              {user?.name?.[0] || 'U'}
            </div>
            <div>
              <div className={styles.userTextName}>{user?.name}</div>
              <div className={styles.userTextRole}>LNV Manufacturing</div>
            </div>
          </div>
        </div>
      </header>

      {/* Module Nav Bar — flat, scrollable */}
      <nav className={styles.modNav}>
        {ALL_MODULES.map(m => {
          if (!hasAccess(m.key)) return null
          return (
            <div key={m.key}
              className={`${styles.navItem} ${currentMod === m.key ? styles.active : ''}`}
              onClick={() => navigate('/' + m.key)}>
              <span className={styles.modIcon}>{m.icon}</span>
              {m.label}
            </div>
          )
        })}
      </nav>

      {/* Body */}
      <div className={styles.body}>
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      {/* Toast Notifications — SharePoint style bottom center */}
      <Toaster
        position="bottom-center"
        gutter={12}
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            padding: '12px 20px',
            borderRadius: '8px',
            minWidth: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,.25)',
          },
          success: {
            style: {
              background: '#1C1C1C',
              color: '#fff',
            },
            iconTheme: { primary:'#4CAF50', secondary:'#fff' },
          },
          error: {
            style: {
              background: '#DC3545',
              color: '#fff',
            },
            iconTheme: { primary:'#fff', secondary:'#DC3545' },
          },
        }}
      />
    </div>
  )
}
