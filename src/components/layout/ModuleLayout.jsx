import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styles from './ModuleLayout.module.css'

export default function ModuleLayout({ navItems = [], sidebarGroups = [], children }) {
  return (
    <div className={styles.wrap}>
      <nav className={styles.subnav}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
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
          {group.items.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `${styles.si} ${isActive ? styles.active : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
