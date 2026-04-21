/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { CheckCircle, Calendar, MapPin, User, Hash, ShieldCheck, Ticket } from 'lucide-react';

interface TicketVerifierProps {
  name: string;
  qty: string;
  id: string;
  eventName: string;
  date: string;
  venue: string;
  onClose: () => void;
}

export default function TicketVerifier({ name, qty, id, eventName, date, venue, onClose }: TicketVerifierProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-[#020617] flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Immersive Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-sky-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full relative">
        {/* Verification Badge */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full border-2 border-emerald-500/50 flex items-center justify-center relative z-10">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-center"
          >
            <h1 className="text-emerald-400 font-black text-xl tracking-[0.2em] uppercase">Pass Verified</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Campus Ticket System • Secure Entry</p>
          </motion.div>
        </motion.div>

        {/* Stylish Ticket Card */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 20 }}
          className="glass-card relative overflow-hidden border border-white/10 shadow-2xl"
        >
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-6 flex justify-between items-end relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-sky-100 uppercase tracking-widest mb-1 opacity-80">Event Admission</p>
              <h2 className="text-white text-xl font-black leading-tight italic truncate max-w-[240px]">{eventName.toUpperCase()}</h2>
            </div>
            <Ticket className="w-8 h-8 text-white/40 relative z-10" />
          </div>

          <div className="p-8 space-y-8 relative">
            {/* Cutout effects for ticket look */}
            <div className="absolute -left-3 top-[32%] w-6 h-6 bg-[#020617] rounded-full border-r border-white/5" />
            <div className="absolute -right-3 top-[32%] w-6 h-6 bg-[#020617] rounded-full border-l border-white/5" />
            <div className="absolute left-6 right-6 top-[32%] h-px border-t border-dashed border-white/10 mt-3" />

            {/* Content Groups */}
            <div className="pt-4 grid grid-cols-2 gap-8">
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] flex items-center gap-1.5">
                   <User className="w-3 h-3" /> Pass Holder
                 </label>
                 <p className="text-white font-bold text-lg leading-none">{name}</p>
               </div>
               <div className="space-y-1 text-right">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] flex items-center justify-end gap-1.5">
                   Admit <Hash className="w-3 h-3" />
                 </label>
                 <p className="text-sky-400 font-black text-2xl leading-none">{qty}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] flex items-center gap-1.5">
                   <Calendar className="w-3 h-3" /> Schedule
                 </label>
                 <p className="text-slate-200 text-xs font-medium">{date}</p>
               </div>
               <div className="space-y-1 text-right">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] flex items-center justify-end gap-1.5">
                   <MapPin className="w-3 h-3" /> Location
                 </label>
                 <p className="text-slate-200 text-xs font-medium">{venue}</p>
               </div>
            </div>

            <div className="pt-8 flex flex-col items-center gap-4">
               <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-400" />
                 <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Auth Token: {id.slice(0, 12).toUpperCase()}</span>
               </div>
               <div className="flex gap-1">
                 {[...Array(20)].map((_, i) => (
                   <div key={i} className="w-3 h-1 bg-slate-800 rounded-full" />
                 ))}
               </div>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onClose}
          className="mt-12 w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all text-xs font-bold uppercase tracking-widest"
        >
          Return to Portal
        </motion.button>
      </div>
    </motion.div>
  );
}
