import React,{lazy,Suspense} from 'react'
import {Routes,Route,Navigate} from 'react-router-dom'
import ModuleLayout from '@components/layout/ModuleLayout'
import PageLoader from '@components/ui/PageLoader'
const CNDashboard=lazy(()=>import('./CNDashboard'))
const MealCoupon=lazy(()=>import('./MealCoupon'))
const CanteenBilling=lazy(()=>import('./CanteenBilling'))
const NAV_ITEMS=[{to:'/cn',label:' Home'},{to:'/cn/coupon',label:' Coupons'},{to:'/cn/billing',label:' Billing'}]
const SIDEBAR_GROUPS=[{label:'Canteen Management',icon:'🍽️',items:[{to:'/cn',label:'Dashboard'},{to:'/cn/coupon',label:'Meal Coupons'},{to:'/cn/billing',label:'Billing & Recovery'},{to:'/cn/menu',label:'Menu & Rates'},{to:'/cn/vendor',label:'Canteen Vendor'}]}]
export default function CNLayout(){return(<ModuleLayout moduleName="CN" navItems={NAV_ITEMS} sidebarGroups={SIDEBAR_GROUPS}><Suspense fallback={<PageLoader text="Loading Canteen…"/>}><Routes><Route index element={<CNDashboard/>}/><Route path="coupon" element={<MealCoupon/>}/><Route path="billing" element={<CanteenBilling/>}/><Route path="*" element={<Navigate to="/cn" replace/>}/></Routes></Suspense></ModuleLayout>)}
