'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function PaymentGatewayPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.id || params?.orderId;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'UPI' | 'COD'>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isProcessing) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && id) {
          const cleanId = String(id).toUpperCase();
          const formattedId = cleanId.startsWith('ORD-') ? cleanId : `ORD-${cleanId}`;

          // Update real-time order status flags
          localStorage.setItem(`order_status_${id}`, 'CONFIRMED');
          localStorage.setItem(`order_status_${formattedId}`, 'CONFIRMED');

          // Dynamically read actual checkout order payload saved during checkout flow
          const storedOrder = 
            localStorage.getItem(`latest_order_${id}`) || 
            localStorage.getItem(`latest_order_${formattedId}`) ||
            localStorage.getItem('pending_checkout_order');

          let orderDetails: any = null;
          if (storedOrder) {
            try { 
              orderDetails = JSON.parse(storedOrder); 
            } catch (e) {
              console.error('Failed to parse checkout order:', e);
            }
          }

          // Construct order object entirely from dynamic session/checkout data
          const newOrderObj = {
            id: formattedId,
            orderNumber: formattedId,
            restaurantId: orderDetails?.restaurantId || orderDetails?.restaurant?.id || '',
            restaurantName: orderDetails?.restaurantName || orderDetails?.restaurant?.name || 'Restaurant',
            customerName: orderDetails?.customerName || orderDetails?.user?.name || 'Customer',
            deliveryAddress: orderDetails?.deliveryAddress || orderDetails?.address || '',
            totalAmount: Number(orderDetails?.totalAmount || orderDetails?.total || 0),
            status: 'CONFIRMED',
            paymentStatus: 'SUCCESSFUL',
            items: orderDetails?.items || orderDetails?.cartItems || [],
            createdAt: orderDetails?.createdAt || new Date().toISOString()
          };

          // Append real order dynamically to active kitchen queue
          const existingOrders = JSON.parse(localStorage.getItem('all_orders') || '[]');
          const filtered = existingOrders.filter((o: any) => o.id !== formattedId);
          localStorage.setItem('all_orders', JSON.stringify([newOrderObj, ...filtered]));
        }

        setIsSuccess(true);

        setTimeout(() => {
          router.push(`/orders/${id}`);
        }, 1200);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isProcessing, id, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
        {!isProcessing && !isSuccess ? (
          <div className="space-y-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Checkout
            </button>

            <div className="text-center space-y-1">
              <div className="inline-flex p-3 bg-amber-50 rounded-2xl text-amber-600 mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 font-serif">Complete Payment</h1>
              <p className="text-xs text-slate-500">
                Order ID: <span className="font-bold text-slate-700">{id}</span>
              </p>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setSelectedMethod('CARD')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                  selectedMethod === 'CARD' ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Credit / Debit Card</p>
                    <p className="text-[11px] text-slate-400">Pay using Visa or Mastercard</p>
                  </div>
                </div>
                <input type="radio" checked={selectedMethod === 'CARD'} readOnly />
              </label>

              <label
                onClick={() => setSelectedMethod('UPI')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                  selectedMethod === 'UPI' ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-amber-600 text-xs">UPI</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">UPI Payment</p>
                    <p className="text-[11px] text-slate-400">Google Pay, PhonePe, Paytm</p>
                  </div>
                </div>
                <input type="radio" checked={selectedMethod === 'UPI'} readOnly />
              </label>
            </div>

            <button
              onClick={() => setIsProcessing(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 text-sm transition active:scale-98 cursor-pointer"
            >
              Pay Successfully with {selectedMethod}
            </button>
          </div>
        ) : isSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8 space-y-3"
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
            <p className="text-xs text-slate-500">Routing to Kitchen & Order Tracking...</p>
          </motion.div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"></div>
              <CreditCard className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-serif">Directing to Payment Gateway</h2>
              <p className="text-xs text-slate-400 mt-1">
                Securing transaction for Order ID <span className="font-bold">{id}</span>...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}