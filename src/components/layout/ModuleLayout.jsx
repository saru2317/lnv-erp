import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styles from './ModuleLayout.module.css'

export default function ModuleLayout({ navItems = [], sidebarGroups = [], children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Auto-close the mobile sidebar overlay whenever the route changes —
  // otherwise it stays open covering the page after navigating, which
  // defeats the point of it being an overlay in the first place.
  React.useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  // One single hamburger button, always in normal document flow — not
  // position:fixed. Previously had two separate implementations (one
  // inside the subnav row, one floating) that could drift out of sync;
  // the floating one ended up rendering underneath the app's sticky top
  // bar (z-index 1000 vs its 210), invisible on any module without a
  // subnav row. This one button works identically for every module.
  const toggle = (
    <button className={styles.mobileToggle} onClick={()=>setSidebarOpen(v=>!v)} aria-label="Toggle menu">☰ Menu</button>
  )

  return (
    <div className={styles.wrap}>
      {navItems.length > 0 && (
        <nav className={styles.subnav}>
          {navItems.map((item,idx) => (
            <NavLink key={`nav-${idx}-${item.to}`} to={item.to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
      {sidebarGroups.length > 0 && toggle}
      <div className={styles.body}>
        <div className={`${styles.backdrop} ${sidebarOpen ? styles.backdropOpen : ''}`} onClick={()=>setSidebarOpen(false)} />
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          {sidebarGroups.map(g => <SidebarGroup key={g.label} group={g} />)}
        </aside>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}

function SidebarGroup({ group }) {
  const [open, setOpen] = useState(true)
  return (
    <div className={styles.sgrp}>
      <div className={styles.sghd} onClick={() => setOpen(v => !v)}>
        <span>{group.icon}</span>{group.label}
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}>›</span>
      </div>
      {open && (
        <div className={styles.sitems}>
          {group.items.map((item,idx) => (
            <NavLink key={`si-${idx}-${item.to}-${item.label}`} to={item.to}
              className={({ isActive }) => `${styles.si} ${isActive ? styles.active : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
