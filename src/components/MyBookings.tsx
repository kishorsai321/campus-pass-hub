/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { api } from '../services/api';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, increment } from 'firebase/firestore';
import { BookingData, EventData } from '../types';
import { Ticket, Calendar, MapPin, Hash, CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MyBookingsProps {
  userEmail: string;
  onViewSummary: (booking: BookingData) => void;
  events: EventData[];
}

export default function MyBookings({ userEmail, onViewSummary, events }: MyBookingsProps) {
  const [userBookings, setUserBookings] = useState<BookingData[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleCancelTicket = async (e: React.MouseEvent, booking: BookingData) => {
    e.stopPropagation();
    setCancellingId(booking.id);
    try {
      await api.updateBookingStatus(booking.id, 'cancelled');
      fetchUserBookings();
    } catch (err: any) {
      console.error("Cancellation error:", err);
    } finally {
      setCancellingId(null);
    }
  };

  const fetchUserBookings = async () => {
    if (!userEmail) return;
    try {
      const data = await api.getBookings(userEmail);
      setUserBookings(data);
    } catch (err) {
      console.error("Error fetching user bookings from MySQL:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
    const interval = setInterval(fetchUserBookings, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Fetching your passes...</p>
      </div>
    );
  }

  if (userBookings.length === 0) {
    return (
      <div className="text-center py-20 glass-card">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
          <Ticket className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Bookings Yet</h3>
        <p className="text-slate-400 max-w-sm mx-auto">
          You haven't reserved any event passes yet. Browse our events and secure your spot!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Ticket className="w-6 h-6 text-sky-400" />
          My Reserved Passes
        </h2>
        <span className="text-xs bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full border border-sky-500/20 font-bold uppercase tracking-wider">
          {userBookings.length} Total
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {userBookings.map((booking) => {
            const event = events.find(e => e.id === booking.eventId);
            return (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card flex flex-col md:flex-row overflow-hidden group cursor-pointer border border-white/5 hover:border-sky-500/30 transition-all duration-300 min-h-[160px]"
                onClick={() => onViewSummary(booking)}
              >
                {/* Visual Accent */}
                <div className={`w-full md:w-3 ${
                  booking.paymentStatus === 'paid' ? 'bg-sky-500' : 
                  booking.paymentStatus === 'cancelled' ? 'bg-red-500 opacity-40' : 'bg-amber-500'
                }`} />

                <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                         booking.paymentStatus === 'paid' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : booking.paymentStatus === 'cancelled'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20 opacity-60'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                       }`}>
                         {booking.paymentStatus === 'paid' ? <CheckCircle className="w-3 h-3" /> : booking.paymentStatus === 'cancelled' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                         {booking.paymentStatus}
                       </span>
                       <span className="text-[10px] font-mono text-slate-500 uppercase">#{booking.id.slice(0, 8)}</span>
                    </div>

                    <h3 className="text-xl font-black text-white group-hover:text-sky-400 transition-colors uppercase tracking-tight mb-2">
                      {booking.eventName}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        {event?.dateTime || 'Date update pending'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                        {event?.venue || 'Venue update pending'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                        <Hash className="w-3.5 h-3.5 text-sky-400" />
                        {booking.ticketsCount} PASS{booking.ticketsCount > 1 ? 'ES' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-center md:text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Value</p>
                      <p className={`text-2xl font-black text-white ${booking.paymentStatus === 'cancelled' ? 'line-through opacity-40' : ''}`}>${booking.totalAmount}</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {booking.paymentStatus !== 'cancelled' && (
                        <button 
                          onClick={(e) => handleCancelTicket(e, booking)}
                          disabled={cancellingId === booking.id}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all group/btn font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/5 active:scale-95"
                          title="Cancel Ticket"
                        >
                          {cancellingId === booking.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <><XCircle className="w-4 h-4" /> VOID</>
                          )}
                        </button>
                      )}
                      
                      <button 
                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          booking.paymentStatus === 'cancelled' 
                          ? 'border-white/5 text-slate-600 cursor-not-allowed' 
                          : 'border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-white shadow-lg shadow-sky-500/5'
                        }`}
                        disabled={booking.paymentStatus === 'cancelled'}
                      >
                        {booking.paymentStatus === 'cancelled' ? 'Invalid' : 'Access →'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
