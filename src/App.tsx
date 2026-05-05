/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EventData, BookingData } from './types';
import EventDetails from './components/EventDetails';
import BookingForm from './components/BookingForm';
import BookingSummary from './components/BookingSummary';
import AdminPanel from './components/AdminPanel';
import MyBookings from './components/MyBookings';
import TicketVerifier from './components/TicketVerifier';
import SupportBot from './components/SupportBot';
import { db, auth, handleFirestoreError } from './lib/firebase';
import { api } from './services/api';
import { collection, query, onSnapshot, orderBy, doc, getDoc, updateDoc, increment, setDoc, getDocs, limit } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Settings, User, CreditCard, GraduationCap, School, Loader2, Mail, Lock, AlertCircle, Compass, Ticket, Layout, LayoutDashboard, Menu, X as CloseIcon, Calendar, MapPin, Hash, CheckCircle, XCircle } from 'lucide-react';

const INITIAL_EVENT: EventData = {
  id: 'event-2',
  name: 'Global Innovation Summit',
  department: 'Computer Science',
  dateTime: 'May 20, 2026 • 09:30 AM',
  venue: 'Tech Center Hall 1',
  price: 99,
  totalTickets: 50,
  availableTickets: 50,
  imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
  registrationDeadline: '2026-05-19',
  lat: 17.3860,
  lng: 78.4870 // Default to a central campus location
};

export default function App() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasNoAdmins, setHasNoAdmins] = useState(false);
  const [view, setView] = useState<'user' | 'admin'>('user');
  const [userTab, setUserTab] = useState<'explore' | 'my-bookings'>('explore');
  const [currentBooking, setCurrentBooking] = useState<BookingData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [verifyData, setVerifyData] = useState<any>(null);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setDbConnected(data.database === 'connected'))
      .catch(() => setDbConnected(false));
  }, []);

  const slides = [
    {
      title: 'THE CAMPUS EVENT ECOSYSTEM.',
      desc: 'The official digital gateway for academic seminars, technical symposiums, and cultural fests.',
      features: [
        { title: 'Student IDs', desc: 'Secure institutional identity verification.' },
        { title: 'Campus Passes', desc: 'Instant check-ins for venue entries.' },
        { title: 'Live Feeds', desc: 'Real-time department event tracking.' }
      ]
    },
    {
      title: 'ACADEMIC EVENT DISCOVERY.',
      desc: 'Browse and book slots for guest lectures, workshops, and inter-college competitions.',
      features: [
        { title: 'Department Access', desc: 'Events categorized by academic faculty.' },
        { title: 'Smart Scheduling', desc: 'Sync your academic calendar with events.' },
        { title: 'Certificate Ready', desc: 'Automatic attendance for credit workshops.' }
      ]
    },
    {
      title: 'CAMPUS-WIDE VERIFICATION.',
      desc: 'Robust tools for student coordinators and security to manage authenticated entries.',
      features: [
        { title: 'Admin Controls', desc: 'Manage event capacity and student lists.' },
        { title: 'Secured entries', desc: 'Verify student legitimacy via institutional DB.' },
        { title: 'Event Insights', desc: 'Analytics on student engagement and participation.' }
      ]
    }
  ];

  useEffect(() => {
    if (!user) {
      const timer = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Request geolocation on login
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => console.log("Location access granted"),
          (err) => console.warn("Location access denied:", err),
          { enableHighAccuracy: true }
        );
      }
    }
  }, [user]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const isAdminStatus = await api.checkAdminStatus(u.uid);
        setIsAdmin(isAdminStatus);
        // Fallback for claim system admin if needed - but check SQL admins table
        if (!isAdminStatus) {
            const adminsSnap = await getDocs(query(collection(db, 'admins'), limit(1)));
            setHasNoAdmins(adminsSnap.empty);
        }
      } else {
        setIsAdmin(false);
        setView('user');
      }
      setLoading(false);
    });

    const fetchEvents = async () => {
        try {
            const data = await api.getEvents();
            setEvents(data);
        } catch (err) {
            console.error("Failed to load events from MySQL:", err);
        }
    };
    fetchEvents();
    // Refresh every 30s to simulate "real-time" without WebSockets
    const refreshTimer = setInterval(fetchEvents, 30000);

    return () => {
      unsubAuth();
      clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking_id');
    const sessionId = params.get('session_id');
    const isVerify = params.get('verify') === '1';
    const isPortal = params.get('portal') === 'admin';

    if (isPortal) setShowAdminPortal(true);

    if (isVerify) {
      setVerifyData({
        id: params.get('id'),
        name: params.get('name'),
        qty: params.get('qty'),
        event: params.get('event'),
        date: params.get('date'),
        venue: params.get('venue')
      });
    }

    if (bookingId && sessionId) {
      const verifyAndFinalize = async () => {
        try {
          const res = await fetch(`/api/verify-session/${sessionId}`);
          const { status } = await res.json();
          if (status === 'paid') {
            const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
            if (bookingDoc.exists()) {
              const bData = bookingDoc.data();
              if (bData.paymentStatus !== 'paid') {
                await updateDoc(doc(db, 'bookings', bookingId), { paymentStatus: 'paid', stripeSessionId: sessionId });
                await updateDoc(doc(db, 'events', bData.eventId), { availableTickets: increment(-bData.ticketsCount) });
              }
              setCurrentBooking({ id: bookingId, ...bData, paymentStatus: 'paid' } as BookingData);
            }
          }
          window.history.replaceState({}, '', '/');
        } catch (err) {
          console.error("Verification failed:", err);
        }
      };
      verifyAndFinalize();
    }
  }, []);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailAuth = async (e: any) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === selectedEventId) || (events.length > 0 ? events[0] : INITIAL_EVENT);

  return (
    <div className="min-h-screen bg-[#0f172a] py-4 lg:py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500 overflow-x-hidden">
      <AnimatePresence>
        {verifyData && (
          <TicketVerifier 
            id={verifyData.id || ''}
            name={verifyData.name || ''}
            qty={verifyData.qty || ''}
            eventName={verifyData.event || ''}
            date={verifyData.date || ''}
            venue={verifyData.venue || ''}
            onClose={() => {
              setVerifyData(null);
              window.history.replaceState({}, '', window.location.pathname);
            }}
          />
        )}
      </AnimatePresence>

      <SupportBot />

      <div className="max-w-7xl mx-auto h-full flex flex-col relative">
        {user ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start relative min-h-[85vh]">
            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b]/95 backdrop-blur-3xl border-r border-white/5 p-6 transform transition-all duration-500 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl lg:shadow-none'}`}>
              <div className="flex items-center justify-between mb-10">
                <h1 className="text-white text-2xl font-black italic tracking-tighter">
                  CAMPUS <span className="text-sky-400">PASS</span>
                </h1>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 p-2 hover:bg-white/5 rounded-full transition-colors">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-1 mb-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4">University Discovery Hub</p>
                {[
                  { id: 'explore', label: 'Campus Events', icon: School, tab: 'explore', view: 'user' },
                  { id: 'my-bookings', label: 'My Registrations', icon: Ticket, tab: 'my-bookings', view: 'user' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.view as any);
                      setUserTab(item.tab as any);
                      setCurrentBooking(null);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                      !currentBooking && view === item.view && userTab === item.tab 
                        ? 'bg-sky-500 text-white shadow-xl shadow-sky-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}

                {isAdmin && (
                  <>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-4 mt-10">Administrative Control</p>
                    <button
                      onClick={() => {
                        setView('admin');
                        setCurrentBooking(null);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                        !currentBooking && view === 'admin' 
                          ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Layout className="w-4 h-4" />
                      Staff Command
                    </button>
                  </>
                )}
              </div>

              <div className="mt-auto pt-8 border-t border-white/5">
                {hasNoAdmins && !isAdmin && (
                  <button 
                    onClick={async () => {
                      try {
                        await setDoc(doc(db, 'admins', user.uid), { email: user.email, name: user.displayName || 'Root Admin' });
                        setIsAdmin(true);
                        setHasNoAdmins(false);
                      } catch (err: any) {
                        handleFirestoreError(err, 'create', `admins/${user.uid}`);
                      }
                    }}
                    className="w-full mb-4 text-[10px] bg-red-500/10 text-red-400 p-3 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all uppercase font-black tracking-widest"
                  >
                    Claim System Admin
                  </button>
                )}
                <div className="flex items-center gap-3 px-3 py-4 bg-white/[0.03] rounded-2xl border border-white/5 mb-6 ring-1 ring-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/20">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.email?.split('@')[0]}</p>
                    <p className="text-[9px] text-slate-500 tracking-wider font-mono opacity-60 uppercase">PASS ID: {user.uid.slice(0, 8)}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Terminate Session
                </button>
              </div>
            </aside>

            {/* Mobile Navigation Trigger */}
            {!isSidebarOpen && (
              <div className="lg:hidden fixed bottom-8 right-8 z-40 animate-in fade-in zoom-in duration-500">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-5 bg-sky-500 text-white rounded-full shadow-2xl shadow-sky-500/40 active:scale-90 transition-transform flex items-center justify-center"
                >
                  <Menu className="w-7 h-7" />
                </button>
              </div>
            )}

            {/* Content Area */}
            <main className="flex-1 w-full pb-20">
              <AnimatePresence mode="wait">
                {currentBooking ? (
                   <motion.div key="summary-view" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                     <BookingSummary 
                       booking={currentBooking} 
                       event={events.find(e => e.id === currentBooking.eventId) || selectedEvent} 
                       onReset={() => setCurrentBooking(null)} 
                     />
                   </motion.div>
                ) : view === 'admin' ? (
                  <AdminPanel key="admin-view" />
                ) : userTab === 'my-bookings' ? (
                  <motion.div key="my-bookings-view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}>
                    <MyBookings userEmail={user?.email || ''} onViewSummary={setCurrentBooking} events={events} />
                  </motion.div>
                ) : (
                  <div className="space-y-10">
                    {/* Event Selector - Horizontal Scroll */}
                    <section className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">Institutional Events</h3>
                        <span className="text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">{events.length} Department Fests</span>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
                        {events.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => setSelectedEventId(e.id)}
                            className={`flex-shrink-0 w-64 glass-card p-4 text-left transition-all group relative overflow-hidden border ${
                              (selectedEventId === e.id || (!selectedEventId && events[0]?.id === e.id))
                                ? 'border-sky-500/50 bg-sky-500/5 ring-1 ring-sky-500/20' 
                                : 'border-white/5 hover:border-white/20'
                            }`}
                          >
                            {e.imageUrl && (
                              <div className="w-full h-32 mb-3 rounded-xl overflow-hidden border border-white/5">
                                <img 
                                  src={e.imageUrl} 
                                  alt={e.name} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                  referrerPolicy="no-referrer" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800';
                                  }}
                                />
                              </div>
                            )}
                            <p className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-1">{e.department}</p>
                            <h4 className="text-white font-bold text-sm leading-tight line-clamp-1">{e.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {e.dateTime.split('•')[0]}
                            </p>
                          </button>
                        ))}
                      </div>
                    </section>

                    <motion.div
                      key={selectedEvent.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-stretch"
                    >
                      <div className="xl:col-span-1">
                        <EventDetails event={selectedEvent} />
                      </div>
                      <div className="xl:col-span-2">
                         {events.length > 0 ? (
                         <BookingForm 
                           event={selectedEvent} 
                           user={user}
                           onSuccess={(booking: BookingData) => {
                             setCurrentBooking(booking);
                             window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                         />
                       ) : (
                         <div className="text-center py-24 glass-card border-dashed">
                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Calendar className="w-8 h-8 text-slate-700" />
                            </div>
                            <p className="text-slate-500 uppercase tracking-[0.2em] font-black text-sm italic">System Syncing: No events active</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                </div>
                )}
              </AnimatePresence>
            </main>
          </div>
        ) : (
          /* Authentication Gate */
          <div className="flex flex-col min-h-[85vh]">
             <AnimatePresence mode="wait">
                 <motion.div 
                   key="auth-gate"
                   initial={{ opacity: 0, scale: 1.02 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.8 }}
                   className="max-w-5xl mx-auto w-full py-10"
                 >
                   <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#1e293b]/40 rounded-[2.5rem] overflow-hidden border border-white/10 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5">
                     <div className="p-16 bg-gradient-to-br from-sky-500/20 to-blue-600/10 relative overflow-hidden hidden lg:flex flex-col justify-center min-h-[650px] border-r border-white/5">
                       <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/20 rounded-full -mr-40 -mt-40 blur-[100px] opacity-40" />
                       <AnimatePresence mode="wait">
                         <motion.div 
                           key={activeSlide}
                           initial={{ opacity: 0, x: 30 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -30 }}
                           transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                           className="relative z-10 space-y-10"
                         >
                           <div className="space-y-6">
                             <div className="w-16 h-1 bg-sky-400 rounded-full shadow-lg shadow-sky-400/50" />
                             <h2 className="text-5xl font-black text-white italic leading-[1.1] uppercase tracking-tighter">
                               {slides[activeSlide].title.split(' ').map((word, i, arr) => (
                                 <span key={i}>
                                   {i === arr.length - 1 ? <span className="text-sky-400">{word}</span> : word}{' '}
                                   {i === 1 && <br />}
                                 </span>
                               ))}
                             </h2>
                             <p className="text-slate-400 text-base leading-relaxed max-w-sm font-medium">{slides[activeSlide].desc}</p>
                           </div>
                           <div className="grid gap-8">
                             {slides[activeSlide].features.map((item, idx) => (
                               <div key={idx} className="flex gap-5 group">
                                 <div className="mt-1 w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-400/30">
                                   <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
                                 </div>
                                 <div className="space-y-1.5">
                                   <p className="text-white font-bold text-sm tracking-wide leading-none uppercase">{item.title}</p>
                                   <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </motion.div>
                       </AnimatePresence>
                       <div className="absolute bottom-16 left-16 flex gap-3">
                         {slides.map((_, i) => (
                           <button key={i} onClick={() => setActiveSlide(i)} className={`h-2 rounded-full transition-all duration-500 ${activeSlide === i ? 'w-10 bg-sky-400' : 'w-2 bg-white/10 hover:bg-white/20'}`} />
                         ))}
                       </div>
                     </div>

                     <div className="p-10 lg:p-16 flex flex-col justify-center relative bg-slate-950/40">
                       <div className="max-w-sm mx-auto w-full space-y-10">
                         <div className="text-center space-y-4">
                           <div className="relative inline-block">
                             <button 
                               onClick={() => setShowAdminPortal(!showAdminPortal)} 
                               className="w-24 h-24 bg-sky-500/10 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-sky-500/20 active:scale-95 transition-transform group"
                             >
                               <GraduationCap className="w-12 h-12 text-sky-400 group-hover:scale-110 transition-transform" />
                             </button>
                           </div>
                           <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Institutional Access</h2>
                         </div>

                         {authError && (
                           <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                              <AlertCircle className="w-5 h-5 shrink-0" />
                              <span className="font-bold uppercase tracking-wide">{authError}</span>
                           </div>
                         )}

                         <form onSubmit={handleEmailAuth} className="space-y-5">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Campus Email</label>
                             <div className="relative group">
                               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                               <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="id@campus.institute" className="input-field pl-12 bg-slate-900 font-bold" />
                             </div>
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Secret Key</label>
                             <div className="relative group">
                               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                               <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field pl-12 bg-slate-900 font-bold" />
                             </div>
                           </div>
                           <button type="submit" disabled={isAuthenticating} className="btn-primary w-full py-4.5 flex items-center justify-center gap-3 shadow-2xl shadow-sky-500/20 text-sm tracking-widest">{isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : (authMode === 'signin' ? 'UNLOCK SYSTEM' : 'ENROLL IDENTITY')}</button>
                         </form>
                         
                         <div className="flex items-center gap-5 py-2">
                           <div className="h-px bg-white/5 flex-1" />
                           <span className="text-[10px] text-slate-700 font-black tracking-widest">CREDENTIAL PROXY</span>
                           <div className="h-px bg-white/5 flex-1" />
                         </div>

                         <button onClick={handleAuthenticate} disabled={isAuthenticating} className="w-full py-4 bg-white/[0.03] hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 text-sm font-black tracking-widest"><LogIn className="w-5 h-5 text-sky-400" /> GOOGLE AUTH</button>

                         <div className="text-center">
                           <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} className="text-[10px] font-black text-slate-500 hover:text-sky-400 transition-colors uppercase tracking-[0.2em]">{authMode === 'signin' ? "New Student? Register Hub" : "Existing Member? Sign In"}</button>
                         </div>

                         {showAdminPortal && (
                           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-10 border-t border-white/5">
                             <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 text-center">
                               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4 text-center">Staff Overdrive Active</p>
                               <button onClick={() => setAuthMode('signin')} className="w-full py-3.5 bg-sky-500 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl shadow-sky-500/20 mb-4"><Settings className="w-4 h-4" /> enter command center</button>
                               <button onClick={() => setShowAdminPortal(false)} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors uppercase font-black tracking-widest">[ Disengage ]</button>
                             </div>
                           </motion.div>
                         )}
                       </div>
                     </div>
                   </div>
                 </motion.div>
             </AnimatePresence>

             <footer className="mt-auto py-16 flex flex-col md:flex-row items-center justify-between text-slate-600 text-[10px] uppercase font-black tracking-[0.3em]">
               <div className="flex items-center gap-10 mb-6 md:mb-0">
                 <div className="flex items-center gap-2.5"><School className="w-4 h-4 text-emerald-500" /><span>Verified Academic Network</span></div>
                 <div className="flex items-center gap-2.5"><CreditCard className="w-4 h-4 text-sky-400" /><span>Campus Protocol v4.2</span></div>
               </div>
               <p>© 2026 Institutional Network • Strategic Event Management</p>
             </footer>
          </div>
        )}
      </div>
    </div>
  );
}
