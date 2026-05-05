/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, MapPin, IndianRupee } from 'lucide-react';
import { EventData } from '../types';

interface EventDetailsProps {
  event: EventData;
}

export default function EventDetails({ event }: EventDetailsProps) {
  return (
    <div className="glass-card h-full flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      
      <div>
        {event.imageUrl ? (
          <div className="w-full h-64 mb-6 rounded-2xl overflow-hidden border border-white/5 relative bg-slate-900 flex items-center justify-center">
            <img 
              src={event.imageUrl} 
              alt={event.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523050335392-938511794211?auto=format&fit=crop&q=80&w=800';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
          </div>
        ) : (
          <div className="w-full h-64 mb-6 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
             <Calendar className="w-12 h-12 text-slate-700" />
          </div>
        )}
        <div className="px-1">
          <span className="badge mb-4">
            {event.department}
          </span>
          <h1 className="text-4xl font-bold text-white mt-4 leading-tight">
            {event.name}
          </h1>
          <p className="text-sky-400 font-medium mt-2 italic tracking-wide">University Special Event</p>
        </div>
      </div>

      <div className="space-y-6 mt-8 px-1">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-sky-500/10 rounded-xl">
            <Calendar className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Date & Time</p>
            <p className="text-slate-200 text-sm font-medium">{event.dateTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-sky-500/10 rounded-xl">
            <MapPin className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Venue</p>
            <p className="text-slate-200 text-sm font-medium">{event.venue}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-sky-500/10 rounded-xl">
            <IndianRupee className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Entrance Fee</p>
            <p className="text-slate-200 text-sm font-medium">₹{event.price} per person</p>
          </div>
        </div>
      </div>

      <div className="pt-8 mt-8 border-t border-slate-700/50 px-1">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Availability</span>
          <span className="text-sm font-mono text-sky-400 font-bold">
            {event.availableTickets} / {event.totalTickets}
          </span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-sky-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(56,189,248,0.4)]" 
            style={{ width: `${(event.availableTickets / event.totalTickets) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
