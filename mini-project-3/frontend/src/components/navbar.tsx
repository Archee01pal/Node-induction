'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { ShoppingBag, Truck, History, Utensils, Store, ShieldCheck, Clock } from 'lucide-react';
import NotificationDropdown from './notification-dropdown';
import RoleSelector from './RoleSelector';

export function Navbar() {
  const { user, role, logout, isLoading } = useAuth();
  const cartContext = useCart();

  const items = cartContext?.items || cartContext?.cart?.items || [];
  const itemCount =
    typeof cartContext?.totalItems === 'number'
      ? cartContext.totalItems
      : items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

  // Normalized Role checks to handle enum/string variations across components
  const normalizedRole = (role || '').toString().toUpperCase();
  const isCustomer = normalizedRole === 'CUSTOMER' || !role;
  const isDriver = normalizedRole === 'DRIVER';
  const isRestaurantManager =
    normalizedRole === 'RESTAURANT_MANAGER' || normalizedRole === 'RESTAURANT_ADMIN';
  const isAdmin = normalizedRole === 'SYSTEM_ADMIN' || normalizedRole === 'ADMIN';

  return (
    <nav className="sticky top-0 z-50 transition-colors duration-200 border-b bg-white/95 border-slate-100 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Fixed Brand Header */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-white shadow-md shadow-amber-500/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
            <Utensils className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
            Bistro<span className="text-amber-500">Byte</span>
          </span>
        </Link>

        {/* Dynamic Role Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* CUSTOMER LINKS */}
          {isCustomer && (
            <div className="flex items-center gap-2">
              <Link 
                href="/restaurants" 
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-amber-600 hover:bg-amber-50/80 rounded-xl transition-all"
              >
                Restaurants
              </Link>
              <Link 
                href="/orders" 
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl font-bold text-xs transition-all border border-amber-200/80"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden md:inline">My Orders</span>
              </Link>
              <Link 
                href="/cart" 
                className="relative p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all duration-200 shadow-xs group" 
                title="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          )}

          {/* RESTAURANT MANAGER LINKS */}
          {isRestaurantManager && (
            <div className="flex items-center gap-2">
              <Link
                href="/restaurants/dashboard"
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-800 text-white hover:bg-emerald-900 rounded-2xl font-black text-xs transition-all shadow-xs"
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Kitchen Orders</span>
              </Link>
              <Link
                href="/restaurants/history"
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-2xl font-black text-xs transition-all border border-emerald-200 shadow-xs"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Manager History</span>
              </Link>
            </div>
          )}

          {/* DRIVER LINKS */}
          {isDriver && (
            <div className="flex items-center gap-2">
              <Link
                href="/driver"
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:from-amber-500 hover:to-orange-500 hover:text-white rounded-2xl font-black text-xs transition-all border border-amber-200"
              >
                <Truck className="w-4 h-4" />
                <span>Active Runs</span>
              </Link>
              <Link
                href="/driver/history"
                className="flex items-center gap-2 px-3.5 py-2 bg-amber-100/60 text-amber-900 hover:bg-amber-200/70 rounded-2xl font-black text-xs transition-all border border-amber-300/60"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Driver History</span>
              </Link>
            </div>
          )}

          {/* SYSTEM ADMIN LINKS */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-2xl font-black text-xs transition-all border border-purple-200"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-2 px-3.5 py-2 bg-purple-900 text-purple-50 hover:bg-purple-950 rounded-2xl font-black text-xs transition-all shadow-xs border border-purple-800"
              >
                <History className="w-4 h-4 text-purple-300" />
                <span>Admin History</span>
              </Link>
            </div>
          )}

          {/* Authenticated Controls */}
          {isLoading ? (
            <div className="w-16 h-8 bg-slate-100 animate-pulse rounded-xl" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-0.5 rounded-2xl transition-all bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white">
                <NotificationDropdown />
              </div>

              {/* Role Selector Dropdown */}
              <RoleSelector />

              {/* User Identity Pill */}
              <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 border rounded-2xl text-xs font-bold bg-slate-100/80 border-slate-200/80 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[110px] truncate">
                  {(user as any)?.email || (user as any)?.name || 'Account'}
                </span>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;