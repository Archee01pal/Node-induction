'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bike, MapPin, Truck } from 'lucide-react';
import api from '@/lib/axios';
import Loader from '@/components/common/Loader';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function DeliveryDashboardPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/delivery/active');
      setDeliveries(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStatusUpdate = async (deliveryId: string, status: string) => {
    try {
      await api.patch(`/delivery/${deliveryId}/status`, { status });
      fetchDeliveries();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  if (loading) return <Loader label="Fetching active delivery tasks..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDeliveries} />;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-50 rounded-2xl text-sky-600">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 font-serif">Delivery Driver Portal</h1>
            <p className="text-xs text-slate-500">Pick up ready orders and deliver to customer locations.</p>
          </div>
        </div>

        {/* Deliveries List or Empty State */}
        {deliveries.length === 0 ? (
          <EmptyState title="No active assignments" description="Available delivery requests will show up here." />
        ) : (
          <div className="space-y-4">
            {deliveries.map((item) => (
              <div 
                key={item.id} 
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                      #{item.id.slice(-6)}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {item.restaurantName || 'Restaurant'}
                    </span>
                    <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> 
                    {item.deliveryAddress || 'Delivery Address'}
                  </p>
                </div>

                {/* Status Update Actions */}
                <div className="flex items-center gap-2">
                  {(item.status === 'ASSIGNED' || item.status === 'READY') && (
                    <button
                      onClick={() => handleStatusUpdate(item.id, 'IN_TRANSIT')}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Accept & Start Transit
                    </button>
                  )}
                  {item.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleStatusUpdate(item.id, 'DELIVERED')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}