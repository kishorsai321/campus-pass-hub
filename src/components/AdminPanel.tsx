/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { api } from '../services/api';
import { EventData, BookingData } from '../types';
import { Plus, Edit2, Trash2, LayoutDashboard, Calendar, Users, IndianRupee, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);

  const handleCancelBooking = async (booking: BookingData) => {
    setCancellingId(booking.id);
    try {
      await api.updateBookingStatus(booking.id, 'cancelled');
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error("Cancellation error:", err);
    } finally {
      setCancellingId(null);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    department: '',
    dateTime: '',
    venue: '',
    price: '',
    totalTickets: '',
    availableTickets: '',
    imageUrl: '',
    registrationDeadline: '',
    lat: '',
    lng: ''
  });

  const fetchData = async () => {
    try {
      const eventsData = await api.getEvents();
      setEvents(eventsData);
      
      // Fetch all bookings for admin via proxy endpoint
      const res = await fetch('/api/admin/bookings');
      if (res.ok) {
          const bookingsData = await res.json();
          setBookings(bookingsData);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = bookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data: Partial<EventData> = {
      name: formData.name,
      department: formData.department,
      dateTime: formData.dateTime,
      venue: formData.venue,
      price: Number(formData.price),
      totalTickets: Number(formData.totalTickets),
      availableTickets: Number(formData.availableTickets || formData.totalTickets),
      imageUrl: formData.imageUrl,
      registrationDeadline: formData.registrationDeadline,
      lat: formData.lat ? Number(formData.lat) : undefined,
      lng: formData.lng ? Number(formData.lng) : undefined
    };

    try {
      if (editingEvent) {
        await api.updateEvent(editingEvent.id, data);
      } else {
        await api.createEvent(data);
      }
      fetchData();
      resetForm();
    } catch (err: any) {
      console.error("Event save error:", err);
    }
  };

  const handleEdit = (event: EventData) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      department: event.department,
      dateTime: event.dateTime,
      venue: event.venue,
      price: String(event.price),
      totalTickets: String(event.totalTickets),
      availableTickets: String(event.availableTickets),
      imageUrl: event.imageUrl || '',
      registrationDeadline: event.registrationDeadline || '',
      lat: event.lat ? String(event.lat) : '',
      lng: event.lng ? String(event.lng) : ''
    });
    setIsAddingMode(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.deleteEvent(id);
        fetchData();
      } catch (err: any) {
        console.error("Delete error:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', department: '', dateTime: '', venue: '', price: '', totalTickets: '', availableTickets: '', imageUrl: '', registrationDeadline: '', lat: '', lng: '' });
    setEditingEvent(null);
    setIsAddingMode(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4 border-sky-500/20">
          <div className="p-3 bg-sky-500/10 rounded-2xl"><Calendar className="w-6 h-6 text-sky-400" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Events</p>
            <p className="text-2xl font-bold text-white">{events.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 border-sky-500/20">
          <div className="p-3 bg-sky-500/10 rounded-2xl"><Users className="w-6 h-6 text-sky-400" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Bookings</p>
            <p className="text-2xl font-bold text-white">{bookings.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 border-emerald-500/20">
          <div className="p-3 bg-emerald-500/10 rounded-2xl"><IndianRupee className="w-6 h-6 text-emerald-400" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-400">₹{totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-sky-400" /> Event Management
                </h3>
              </div>
              <button 
                onClick={() => setIsAddingMode(true)}
                className="badge py-2 px-4 hover:bg-sky-400/20 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Event
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event Name & ID</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Availability</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-white text-sm">{event.name}</p>
                        <p className="text-xs text-slate-500">{event.department}</p>
                        <p className="text-[10px] font-mono text-sky-400/50 mt-1">ID: {event.id}</p>
                      </td>
                      <td className="p-4 text-slate-300 font-mono text-sm">₹{event.price}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden w-20">
                            <div 
                              className="bg-sky-400 h-full rounded-full" 
                              style={{ width: `${(event.availableTickets / event.totalTickets) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">{event.availableTickets}/{event.totalTickets}</span>
                        </div>
                      </td>
                      <td className="p-4 flex items-center gap-2">
                        <button onClick={() => handleEdit(event)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-1 space-y-8">
          {/* Recent Sales moved here */}
          <div className="glass-card">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" /> Recent Sales
              </h3>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">LIVE</span>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {bookings.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-xs italic tracking-wide">No transactions processed yet.</p>
                </div>
              ) : (
                bookings.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-sky-500/20 transition-all group">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-bold text-white truncate group-hover:text-sky-400 transition-colors">{booking.userName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{booking.eventName}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5 font-mono">#{String(booking.id).slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2 shrink-0">
                      <p className="text-sm font-bold text-sky-400">₹{booking.totalAmount}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border ${
                          booking.paymentStatus === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : booking.paymentStatus === 'cancelled'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20 opacity-50'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                        
                        {booking.paymentStatus !== 'cancelled' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelBooking(booking);
                            }}
                            disabled={cancellingId === booking.id}
                            className="p-1 px-2 text-white bg-red-500/20 hover:bg-red-500 hover:text-white border border-red-500/40 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
                            title="Cancel Booking"
                          >
                            {cancellingId === booking.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase">Void</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <AnimatePresence>
            {isAddingMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-8 shadow-2xl border-sky-500/20 ring-1 ring-white/5"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingEvent ? 'Edit College Event' : 'New Institutional Event'}</h2>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">University Event Coordinator Portal</p>
                  </div>
                  <button onClick={resetForm} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Event Title</label>
                    <input required className="input-field" placeholder="Campus Fest 2026" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Organizing Department</label>
                    <input required className="input-field" placeholder="Computer Science & Engineering" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Date & Time</label>
                    <input required className="input-field" placeholder="May 20, 2026 @ 10:00 AM" value={formData.dateTime} onChange={(e) => setFormData({...formData, dateTime: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Venue</label>
                    <input required className="input-field" placeholder="Main University Auditorium" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Registration Deadline</label>
                    <input required type="date" className="input-field" value={formData.registrationDeadline} onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Image URL</label>
                    <p className="text-[9px] text-sky-400/60 mb-2 italic">Tip: Use high-quality Unsplash URLs for campus branding.</p>
                    <input className="input-field" placeholder="https://images.unsplash.com/photo-..." value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Latitude</label>
                      <input type="number" step="any" className="input-field" placeholder="17.3850" value={formData.lat} onChange={(e) => setFormData({...formData, lat: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Longitude</label>
                      <input type="number" step="any" className="input-field" placeholder="78.4867" value={formData.lng} onChange={(e) => setFormData({...formData, lng: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Price (₹)</label>
                      <input required type="number" className="input-field" placeholder="499" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Capacity</label>
                      <input required type="number" className="input-field" placeholder="100" value={formData.totalTickets} onChange={(e) => setFormData({...formData, totalTickets: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full py-4 mt-6 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
