import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import UniversalSearch from '@components/ui/UniversalSearch'
import NotificationsPanel from '@components/ui/NotificationsPanel'
import styles from './AppShell.module.css'
import {
  Home, ShoppingCart, Package, Warehouse, DollarSign,
  Factory, CheckCircle, Wrench, Users, Handshake,
  ShieldCheck, Settings, Truck, Building2, HardHat,
  BadgeCheck, UtensilsCrossed, BarChart2, Target, Database
} from 'lucide-react'

const ALL_MODULES = [
  { key:'home',    label:'Home',        icon: Home },
  { key:'sd',      label:'Sales',       icon: ShoppingCart },
  { key:'mm',      label:'Purchase',    icon: Package },
  { key:'wm',      label:'Warehouse',   icon: Warehouse },
  { key:'fi',      label:'Finance',     icon: DollarSign },
  { key:'pp',      label:'Production',  icon: Factory },
  { key:'qm',      label:'Quality',     icon: CheckCircle },
  { key:'pm',      label:'Maintenance', icon: Wrench },
  { key:'hcm',     label:'HR',          icon: Users },
  { key:'crm',     label:'CRM',         icon: Handshake },
  { key:'admin',   label:'Admin',       icon: ShieldCheck },
  { key:'config',  label:'Config',      icon: Settings },
  { key:'tm',      label:'Transport',   icon: Truck },
  { key:'am',      label:'Assets',      icon: Building2 },
  { key:'civil',   label:'Civil',       icon: HardHat },
  { key:'vm',      label:'Visitor',     icon: BadgeCheck },
  { key:'cn',      label:'Canteen',     icon: UtensilsCrossed },
  { key:'reports', label:'Reports',     icon: BarChart2 },
  { key:'kpi',     label:'KPI / KRA',   icon: Target },
  { key:'mdm',     label:'MDM',         icon: Database },
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
          <button className={styles.iconBtn} onClick={() => navigate('/config')}>
            <Settings size={15} />
          </button>
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

      {/* Module Nav Bar */}
      <nav className={styles.modNav}>
        {ALL_MODULES.map(m => {
          if (!hasAccess(m.key)) return null
          const Icon = m.icon
          return (
            <div key={m.key}
              className={`${styles.navItem} ${currentMod === m.key ? styles.active : ''}`}
              onClick={() => navigate('/' + m.key)}>
              <Icon size={13} className={styles.modIcon} />
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
    </div>
  )
}
