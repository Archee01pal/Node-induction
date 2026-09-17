'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChefHat,
  PackageCheck,
  MapPin,
  Utensils,
  Trash2,
  XCircle,
  Flame,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Order, OrderStatus } from '@/types';
import { getRestaurantOrdersApi, updateOrderStatusApi } from '@/lib/api-client';

type FilterType = 'ALL' | 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED';

export default function KitchenDashboardPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load dismissed order IDs on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDismissed = localStorage.getItem('dismissed_kitchen_orders');
        if (savedDismissed) {
          setDismissedIds(JSON.parse(savedDismissed));
        }
      } catch (e) {
        console.error('Failed to parse dismissed orders', e);
      }
    }
  }, []);

  const normalizeStatus = (statusStr: string): OrderStatus => {
    const uppercase = (statusStr || '').toUpperCase();
    if (uppercase === 'CONFIRMED' || uppercase === 'PENDING' || uppercase === 'PLACED') return 'PENDING';
    if (uppercase === 'PREPARING' || uppercase === 'COOKING' || uppercase === 'IN_PROGRESS') return 'PREPARING';
    if (uppercase === 'READY' || uppercase === 'COMPLETED' || uppercase === 'PICKUP') return 'READY';
    if (uppercase === 'IN_TRANSIT' || uppercase === 'DELIVERING') return 'IN_TRANSIT';
    return 'DELIVERED';
  };

  const fetchKitchenOrders = async () => {
    setLoading(true);
    let loadedOrders: Order[] = [];
    let apiSuccess = false;

    // Dynamically retrieve restaurantId from authenticated user context
    const currentUser = user as any;
    const targetRestaurantId = currentUser?.restaurantId || currentUser?.id || currentUser?.restaurant?.id;

    // 1. Central API Client fetch
    if (targetRestaurantId) {
      try {
        const res = await getRestaurantOrdersApi(targetRestaurantId);
        if (res?.data && Array.isArray(res.data)) {
          loadedOrders = res.data;
          apiSuccess = true;
          setErrorMsg(null);
        }
      } catch (error) {
        console.warn('[Kitchen Dashboard] Primary API call failed, attempting fallback endpoints...');
      }
    }

    // 2. Direct Backend Endpoints Fallback
    if (!apiSuccess) {
      try {
        const authToken = token || localStorage.getItem('accessToken') || localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

        const endpoints = targetRestaurantId
          ? [
              `http://localhost:3001/orders/restaurant/${targetRestaurantId}`,
              `http://localhost:3001/api/orders/restaurant/${targetRestaurantId}`,
              'http://localhost:3001/orders',
              'http://localhost:3001/api/orders',
            ]
          : ['http://localhost:3001/orders', 'http://localhost:3001/api/orders'];

        for (const url of endpoints) {
          try {
            const res = await fetch(url, { headers });
            if (res.ok) {
              const data = await res.json();
              const rawOrders = Array.isArray(data) ? data : data.data || data.orders || [];

              loadedOrders = rawOrders.map((ord: any, index: number) => {
                const mappedItems = (ord.items || ord.orderItems || []).map((item: any, idx: number) => ({
                  id: item.id || item._id || `item-${index}-${idx}`,
                  name: item.menuItem?.name || item.name || item.title || 'Food Item',
                  quantity: Number(item.quantity || item.qty || 1),
                  price: Number(item.price || item.menuItem?.price || 0),
                }));

                const originalStatus = ord.status || 'PENDING';
                const cleanId = String(ord.orderNumber || ord.id || ord._id || `ORD-${536391 + index}`).toUpperCase();

                return {
                  id: cleanId,
                  orderNumber: cleanId.startsWith('ORD-') ? cleanId : `ORD-${cleanId}`,
                  restaurantId: ord.restaurantId || ord.restaurant?.id || targetRestaurantId,
                  restaurantName: ord.restaurantName || ord.restaurant?.name || 'Kitchen Order',
                  customerName: ord.customerName || ord.user?.name || ord.user?.email || 'Customer',
                  deliveryAddress: ord.deliveryAddress || ord.address || 'Standard Delivery',
                  subtotal: Number(ord.totalAmount || ord.total || ord.price || 0),
                  deliveryFee: 0,
                  discount: 0,
                  totalAmount: Number(ord.totalAmount || ord.total || ord.price || 0),
                  status: normalizeStatus(originalStatus),
                  paymentStatus: ord.paymentStatus || 'SUCCESSFUL',
                  items: mappedItems,
                  createdAt: ord.createdAt || new Date().toISOString(),
                };
              });

              apiSuccess = true;
              setErrorMsg(null);
              break;
            }
          } catch (e) {
            // Scan next endpoint
          }
        }
      } catch (err) {
        console.error('[Kitchen Dashboard] Fetch failed:', err);
      }
    }

    // 3. LocalStorage Realtime Sync
    if (typeof window !== 'undefined') {
      const localOrders: Order[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('latest_order_') || key.startsWith('order_')) && !key.startsWith('order_status_')) {
          try {
            const rawData = localStorage.getItem(key);
            if (!rawData) continue;

            const parsed = JSON.parse(rawData);
            const orderId = parsed.id || key.replace('latest_order_', '').replace('order_', '');
            const savedStatus = (localStorage.getItem(`order_status_${orderId}`) as OrderStatus) || parsed.status || 'PENDING';
            const cleanId = String(orderId).toUpperCase();

            localOrders.push({
              id: cleanId,
              orderNumber: cleanId.startsWith('ORD-') ? cleanId : `ORD-${cleanId}`,
              restaurantId: parsed.restaurantId || targetRestaurantId,
              restaurantName: parsed.restaurantName || 'Kitchen Order',
              customerName: parsed.customerName || parsed.user?.name || 'Customer',
              deliveryAddress: parsed.deliveryAddress || parsed.address || 'Standard Delivery',
              subtotal: Number(parsed.totalAmount || parsed.total || 0),
              deliveryFee: 0,
              discount: 0,
              totalAmount: Number(parsed.totalAmount || parsed.total || 0),
              status: normalizeStatus(savedStatus),
              paymentStatus: parsed.paymentStatus || 'SUCCESSFUL',
              items: parsed.items || [],
              createdAt: parsed.createdAt || new Date().toISOString(),
            });
          } catch (e) {
            // Ignore invalid JSON
          }
        }
      }

      const orderMap = new Map<string, Order>();
      [...loadedOrders, ...localOrders].forEach((o) => {
        if (!orderMap.has(o.id)) {
          orderMap.set(o.id, o);
        } else {
          const existing = orderMap.get(o.id)!;
          const localStatus = localStorage.getItem(`order_status_${o.id}`) as OrderStatus;
          if (localStatus) {
            existing.status = normalizeStatus(localStatus);
          }
        }
      });

      loadedOrders = Array.from(orderMap.values());
    }

    if (!apiSuccess && loadedOrders.length === 0) {
      setErrorMsg('Showing local cached orders. Connect to backend API to sync live orders.');
    }

    loadedOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setOrders(loadedOrders);
    setLoading(false);
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`order_status_${orderId}`, newStatus);
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      await updateOrderStatusApi(orderId, newStatus);
    } catch (err) {
      try {
        const authToken = token || localStorage.getItem('accessToken') || localStorage.getItem('token');
        await fetch(`http://localhost:3001/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authToken ? `Bearer ${authToken}` : '',
          },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (fallbackErr) {
        console.warn(`[Kitchen Dashboard] API update failed for ${orderId}. Saved locally.`);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const dismissOrder = (orderId: string) => {
    const updated = [...dismissedIds, orderId];
    setDismissedIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissed_kitchen_orders', JSON.stringify(updated));
    }
  };

  const clearAllCompleted = () => {
    const completedIds = orders
      .filter((o) => o.status === 'DELIVERED' || o.status === 'IN_TRANSIT')
      .map((o) => o.id);
    const updated = Array.from(new Set([...dismissedIds, ...completedIds]));
    setDismissedIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissed_kitchen_orders', JSON.stringify(updated));
    }
  };

  const visibleOrders = useMemo(() => {
    return orders.filter((o) => {
      if (dismissedIds.includes(o.id)) return false;

      if (filter === 'PENDING') return o.status === 'PENDING';
      if (filter === 'PREPARING') return o.status === 'PREPARING';
      if (filter === 'READY') return o.status === 'READY';
      if (filter === 'DELIVERED') return o.status === 'DELIVERED' || o.status === 'IN_TRANSIT';

      return true;
    });
  }, [orders, dismissedIds, filter]);

  return (
    <div className="min-h-screen bg-[#F2F7F4] text-emerald-950 pb-20 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Card */}
        <div className="bg-white border border-[#CCE3D4] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2D5A27] text-emerald-50 flex items-center justify-center shadow-md shadow-emerald-900/10 shrink-0">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1C3E2F] tracking-tight">
                Kitchen Display Dashboard
              </h1>
              <p className="text-[#4A6B5D] text-xs md:text-sm font-medium mt-0.5">
                Newest orders appear first. Manage preparation status in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="bg-[#E4EFE8] p-1 rounded-2xl border border-[#D0E2D6] flex items-center gap-1 overflow-x-auto">
              {(['ALL', 'PENDING', 'PREPARING', 'READY', 'DELIVERED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider transition uppercase cursor-pointer ${
                    filter === f
                      ? 'bg-[#2D5A27] text-white shadow-sm'
                      : 'text-[#3B5E4F] hover:text-[#1C3E2F] hover:bg-[#D4E6DC]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearAllCompleted}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-3.5 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Clear Completed
              </button>

              <button
                onClick={fetchKitchenOrders}
                disabled={loading}
                className="bg-[#E4EFE8] hover:bg-[#D4E6DC] border border-[#CCE3D4] text-[#1C3E2F] p-2 rounded-2xl transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Refresh Kitchen Orders"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2D5A27]' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-amber-50 text-amber-900 p-4 rounded-2xl border border-amber-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Kitchen Orders Grid */}
        {loading && visibleOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#CCE3D4] shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-[#2D5A27] mx-auto mb-3" />
            <p className="text-[#4A6B5D] font-medium text-xs">Loading incoming orders...</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#CCE3D4] shadow-sm space-y-3">
            <Utensils className="w-10 h-10 text-[#A2C4B3] mx-auto" />
            <h3 className="text-base font-bold text-[#1C3E2F]">No active orders in kitchen queue</h3>
            <p className="text-xs text-[#5C7E70]">Incoming orders will show up automatically here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {visibleOrders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-3xl border border-[#CCE3D4] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="bg-[#1C3E2F] text-emerald-50 p-4 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-black text-[#85E0AD] uppercase tracking-wide block">
                          ORDER #{order.orderNumber || order.id}
                        </span>
                        <span className="text-[11px] text-[#A3C8B7] font-semibold flex items-center gap-1 mt-0.5">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '00:00 pm'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === 'PENDING' && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> PENDING
                          </span>
                        )}
                        {order.status === 'PREPARING' && (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                            <Flame className="w-3 h-3" /> PREPARING
                          </span>
                        )}
                        {order.status === 'READY' && (
                          <span className="bg-emerald-500/20 text-[#85E0AD] border border-emerald-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> READY
                          </span>
                        )}
                        {(order.status === 'DELIVERED' || order.status === 'IN_TRANSIT') && (
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                            <Truck className="w-3 h-3" /> {order.status === 'IN_TRANSIT' ? 'IN TRANSIT' : 'DELIVERED'}
                          </span>
                        )}

                        <button
                          onClick={() => dismissOrder(order.id)}
                          className="text-[#87A899] hover:text-rose-300 transition cursor-pointer p-0.5"
                          title="Dismiss"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Customer Details */}
                    <div className="p-5 pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[11px] font-medium text-[#5C7E70] block">Customer</span>
                          <span className="font-bold text-[#1C3E2F] text-sm">{order.customerName}</span>
                        </div>
                        <span className="text-base font-extrabold text-[#1C3E2F]">
                          ${Number(order.totalAmount || order.subtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#5C7E70] font-medium mb-4">
                        <MapPin className="w-3.5 h-3.5 text-[#87A899] shrink-0" />
                        <span className="truncate">{order.deliveryAddress}</span>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-black text-[#5C7E70] tracking-wider">
                          ITEMS TO PREPARE
                        </h4>
                        <div className="bg-[#F2F7F4] rounded-2xl p-4 space-y-2.5 border border-[#E0EFE6] max-h-48 overflow-y-auto">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((rawItem: any, idx: number) => {
                              const itemName = rawItem.name || rawItem.menuItem?.name || rawItem.title || 'Food Item';
                              const itemQty = rawItem.quantity || rawItem.qty || 1;
                              return (
                                <div key={rawItem.id || `item-${order.id}-${idx}`} className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-[#1C3E2F]">
                                    <span className="text-[#2D5A27] font-black mr-2">x{itemQty}</span>
                                    {itemName}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-[#87A899] italic">No item details specified</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-3">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                        disabled={updatingId === order.id}
                        className="w-full bg-[#EAB308] hover:bg-[#D97706] text-slate-950 font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <ChefHat className="w-4 h-4" /> Start Preparing
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'READY')}
                        disabled={updatingId === order.id}
                        className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <PackageCheck className="w-4 h-4" /> Mark Ready for Pickup
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'IN_TRANSIT')}
                        disabled={updatingId === order.id}
                        className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Truck className="w-4 h-4" /> Hand to Driver
                      </button>
                    )}

                    {(order.status === 'DELIVERED' || order.status === 'IN_TRANSIT') && (
                      <button
                        onClick={() => dismissOrder(order.id)}
                        className="w-full bg-[#E4EFE8] hover:bg-[#D4E6DC] text-[#1C3E2F] font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 border border-[#CCE3D4]"
                      >
                        <Trash2 className="w-4 h-4 text-[#5C7E70]" /> Remove from Board
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}