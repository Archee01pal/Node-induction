'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderByIdApi } from '@/lib/api-client';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  History, 
  CheckCircle2, 
  Clock, 
  UtensilsCrossed, 
  PackageCheck, 
  Truck, 
  Home, 
  ShieldCheck, 
  ArrowLeft,
  Phone,
  Bike
} from 'lucide-react';

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
}

const STATUS_STAGES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'IN_TRANSIT',
  'DELIVERED',
];

const STEP_ICONS: Record<string, any> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  PREPARING: UtensilsCrossed,
  READY: PackageCheck,
  IN_TRANSIT: Truck,
  DELIVERED: Home,
  CANCELLED: Clock,
};

// Custom Hover Animation Variants for Progress Step Icons
const ICON_ANIMATIONS: Record<string, any> = {
  PENDING: {
    hover: {
      rotate: [0, -20, 20, -20, 0],
      transition: { duration: 0.5, repeat: Infinity },
    },
  },
  CONFIRMED: {
    hover: {
      scale: [1, 1.25, 1],
      transition: { duration: 0.4 },
    },
  },
  PREPARING: {
    hover: {
      rotate: [0, -14, 14, -14, 14, 0],
      transition: { duration: 0.4, repeat: Infinity },
    },
  },
  READY: {
    hover: {
      y: [0, -6, 0],
      transition: { duration: 0.4, repeat: Infinity },
    },
  },
  IN_TRANSIT: {
    hover: {
      x: [-3, 6, -3],
      transition: { duration: 0.4, repeat: Infinity },
    },
  },
  DELIVERED: {
    hover: {
      scale: [1, 1.15, 1],
      transition: { duration: 0.4, repeat: Infinity },
    },
  },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id || params?.orderId;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [order, setOrder] = useState<Order | null>(null);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);

    if (typeof window !== 'undefined') {
      const driverName = localStorage.getItem(`assigned_driver_name_${id}`);
      if (driverName) {
        setDriver({
          id: 'drv-alex',
          name: driverName,
          phone: '+1 (555) 019-2834',
          vehicle: 'Toyota Prius (White - #7AB2)',
          rating: 4.9,
        });
      }
    }

    try {
      const res = await getOrderByIdApi(id);
      if (res?.data) {
        setOrder(res.data);
        setRefreshing(false);
        return;
      }
    } catch (error) {
      console.warn(`API fetch failed for order ${id}, reading from local storage fallback:`, error);
    }

    let storedStatus: OrderStatus = 'CONFIRMED';
    let storedOrderData: string | null = null;

    if (typeof window !== 'undefined') {
      storedStatus = (localStorage.getItem(`order_status_${id}`) as OrderStatus) || 'CONFIRMED';
      storedOrderData = localStorage.getItem(`latest_order_${id}`);
    }

    let parsedItems: any[] = [];
    let parsedTotal = 0;
    let parsedAddress = 'Delivery Address';
    let parsedRestaurantId = '';
    let parsedRestaurantName = '';
    let parsedCustomerName = 'Customer';
    let parsedCreatedAt = new Date().toISOString();
    let parsedPaymentStatus: any = 'SUCCESSFUL'; // FIX: Allowed flexible type conversion

    if (storedOrderData) {
      try {
        const parsed = JSON.parse(storedOrderData);
        parsedItems = parsed.items || [];
        parsedTotal = parsed.totalAmount || 0;
        parsedAddress = parsed.deliveryAddress || parsedAddress;
        parsedRestaurantId = parsed.restaurantId || parsed.restaurant?.id || '';
        parsedRestaurantName = parsed.restaurantName || parsed.restaurant?.name || 'Restaurant';
        parsedCustomerName = parsed.customerName || parsedCustomerName;
        parsedCreatedAt = parsed.createdAt || parsedCreatedAt;
        parsedPaymentStatus = parsed.paymentStatus || 'SUCCESSFUL';
      } catch (e) {
        console.error('Error parsing stored order details', e);
      }
    }

    const cleanId = String(id).toUpperCase();
    const stages: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED'];
    const targetIdx = stages.indexOf(storedStatus);
    const activeStages = targetIdx !== -1 ? stages.slice(0, targetIdx + 1) : stages;

    setOrder({
      id: cleanId,
      orderNumber: cleanId.startsWith('ORD-') ? cleanId : `ORD-${cleanId}`,
      restaurantId: parsedRestaurantId,
      restaurantName: parsedRestaurantName,
      customerName: parsedCustomerName,
      deliveryAddress: parsedAddress,
      subtotal: parsedTotal,
      deliveryFee: 0,
      discount: 0,
      totalAmount: parsedTotal,
      status: storedStatus,
      paymentStatus: parsedPaymentStatus as PaymentStatus, // FIX: Explicit Type Cast prevents TS2322 Error
      items: parsedItems,
      statusHistory: activeStages.map((st, i) => ({
        status: st,
        timestamp: new Date(Date.now() - (activeStages.length - i) * 600000).toISOString(),
      })),
      createdAt: parsedCreatedAt,
    });

    setRefreshing(false);
  }, [id]);

  useEffect(() => {
    fetchOrder();

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && id) {
        const driverName = localStorage.getItem(`assigned_driver_name_${id}`);
        const liveStatus = localStorage.getItem(`order_status_${id}`) as OrderStatus;

        if (driverName && (!driver || driver.name !== driverName)) {
          setDriver({
            id: 'drv-alex',
            name: driverName,
            phone: '+1 (555) 019-2834',
            vehicle: 'Toyota Prius (White - #7AB2)',
            rating: 4.9,
          });
        }

        if (liveStatus) {
          setOrder((prev) => {
            if (prev && prev.status !== liveStatus) {
              return { ...prev, status: liveStatus };
            }
            return prev;
          });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, fetchOrder]);

  if (!order) {
    return (
      <div className="min-h-screen bg-culinary-pattern flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600 font-medium bg-white/80 backdrop-blur-xs px-5 py-3 rounded-2xl border border-amber-100 shadow-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-600" /> Loading order details...
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STAGES.indexOf(order.status);

  return (
    <div className="min-h-screen bg-culinary-pattern text-slate-800 pb-16">
      <div className="bg-slate-900 text-white py-2.5 px-4 shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center text-xs gap-2">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="font-bold text-amber-400 uppercase tracking-wider">
              Live Order Status:
            </span>
            <span className="font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40">
              {order.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="text-slate-400">Assigned Driver:</span>
              {driver ? (
                <span className="font-bold text-sky-300 flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5" />
                  <span>{driver.name}</span>
                </span>
              ) : (
                <span className="text-amber-400 italic">Assigning nearby driver...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/restaurants')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-100/50 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Restaurants
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-amber-100/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Order #{order.orderNumber || order.id}
            </h1>
            {order.restaurantName && (
              <p className="text-sm font-bold text-amber-700 mt-1">
                {order.restaurantName}
              </p>
            )}
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {order.paymentStatus && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold ${
                  order.paymentStatus === 'SUCCESSFUL' || order.paymentStatus === 'PAID'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Payment: {order.paymentStatus}
              </span>
            )}
            
            <button
              onClick={fetchOrder}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-100/80 shadow-sm space-y-6"
        >
          <h2 className="text-base font-bold text-slate-900 font-serif">Delivery Progress</h2>
          
          {order.status !== 'CANCELLED' ? (
            <div className="relative flex justify-between items-center w-full my-4 px-2">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[3px] bg-slate-100 -z-0" />
              <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-[3px] bg-emerald-500 transition-all duration-500 -z-0"
                style={{
                  width: `${Math.max(
                    0,
                    (currentIdx / (STATUS_STAGES.length - 1)) * 100
                  )}%`,
                }}
              />

              {STATUS_STAGES.map((st, idx) => {
                const Icon = STEP_ICONS[st] || Clock;
                const isDone = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const animationVariant = ICON_ANIMATIONS[st] || {};

                return (
                  <motion.div 
                    key={st} 
                    initial="initial"
                    whileHover="hover"
                    className="flex flex-col items-center bg-white z-10 px-1 group cursor-pointer"
                  >
                    <motion.div
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-4 ring-emerald-100'
                          : 'bg-white border-2 border-slate-200 text-slate-400'
                      }`}
                    >
                      <motion.div variants={animationVariant}>
                        <Icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                      </motion.div>
                    </motion.div>
                    <span
                      className={`text-[10px] font-extrabold tracking-wide mt-2 transition-colors ${
                        isDone ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl font-bold text-center text-xs">
              Order Cancelled / Timed Out
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xl shadow-md">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-200/70 px-2.5 py-0.5 rounded-full">
                Assigned Delivery Partner
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {driver ? driver.name : 'Dispatching Nearest Driver...'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {driver
                  ? `${driver.vehicle} • ★ ${driver.rating} rating`
                  : 'Your assigned delivery partner will appear here once dispatched from the kitchen.'}
              </p>
            </div>
          </div>

          {driver && (
            <a
              href={`tel:${driver.phone}`}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-2xl shadow-md transition transform active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" /> Call {driver.name}
            </a>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-amber-100/80 shadow-sm space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 font-serif border-b border-slate-100 pb-3">
              Ordered Items
            </h2>

            {order.items && order.items.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {order.items.map((rawItem: any, index: number) => {
                  const item = rawItem.menuItem ? rawItem.menuItem : rawItem;
                  const itemName = item.name || rawItem.name || 'Menu Item';
                  const quantity = rawItem.quantity || item.quantity || 1;
                  const price = Number(item.price || rawItem.price || 0);

                  return (
                    <div key={index} className="py-2.5 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          {quantity}x
                        </span>
                        <span className="font-medium text-slate-800">{itemName}</span>
                      </div>
                      <span className="font-bold text-slate-900">${(price * quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">No item details available for this order.</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-6 rounded-3xl border border-amber-100/80 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-4 h-4 text-amber-600" /> Status History Log
              </h2>

              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="space-y-2 border-l-2 border-slate-100 ml-2 pl-4">
                  {order.statusHistory.map((h, i) => (
                    <div key={i} className="text-xs flex justify-between items-center text-slate-600">
                      <span className="font-bold text-slate-800">
                        {String(h.status).replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {new Date(h.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Current Status: {order.status}</p>
              )}
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center">
              <span className="font-serif font-black text-slate-900 text-base">Total Paid</span>
              <span className="text-emerald-600 font-extrabold text-xl font-sans">
                ${Number(order.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}