/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle, ArrowLeft, Download, Share2, QrCode } from 'lucide-react';
import { BookingData, EventData } from '../types';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface BookingSummaryProps {
  booking: BookingData;
  event: EventData;
  onReset: () => void;
}

export default function BookingSummary({ booking, event, onReset }: BookingSummaryProps) {
  const verifyUrl = `${window.location.origin}/?verify=1&id=${booking.id}&name=${encodeURIComponent(booking.userName)}&qty=${booking.ticketsCount}&event=${encodeURIComponent(event.name)}&date=${encodeURIComponent(event.dateTime)}&venue=${encodeURIComponent(event.venue)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="glass-card overflow-hidden border border-sky-500/20 shadow-2xl shadow-sky-500/10 mb-8">
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-8 text-center text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Booking Confirmed</h2>
          <p className="text-sky-100 text-sm opacity-90 tracking-wide">Your pass for {event.name} is ready</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Pass Holder</p>
              <p className="text-white font-bold text-lg">{booking.userName}</p>
              <p className="text-slate-400 text-xs">{booking.userEmail}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Department</p>
              <p className="text-white font-bold text-lg">{booking.userDepartment}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Quantity</p>
              <p className="text-white font-bold text-lg">{booking.ticketsCount} Passes</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Total Fee Paid</p>
              <p className="text-sky-400 font-black text-2xl">${booking.totalAmount}</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Pass Hash ID</p>
                <p className="font-mono text-slate-300 text-xs">{booking.id.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Timestamp</p>
                <p className="text-slate-300 text-xs">{booking.bookingDate}</p>
              </div>
            </div>
            
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800 flex items-center gap-6">
              <div className="p-2 bg-white rounded-xl">
                <QRCodeSVG 
                  value={verifyUrl} 
                  size={80} 
                  level="H" 
                  includeMargin={false}
                />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="w-4 h-4 text-sky-400" />
                    <p className="text-xs font-bold text-white tracking-wide uppercase">Scan & Validate</p>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-[150px]">
                    Present this QR to campus security for admission.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 tooltip" title="Download Ticket">
                    <Download className="w-4 h-4 text-slate-300" />
                  </button>
                  <button className="p-2.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 tooltip" title="Share Ticket">
                    <Share2 className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="btn-primary w-full py-4 opacity-80 hover:opacity-100 flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Book Another Pass
      </button>
    </motion.div>
  );
}
