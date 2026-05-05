/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, MapPin, Users, DollarSign, Building } from 'lucide-react';
import { EventData } from '../types';
import EventMap from './EventMap';

interface EventDetailsProps {
  event: EventData;
}

export default function EventDetails({ event }: EventDetailsProps) {
  return (
    <div className="glass-card p-8 h-full flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      
      <div>
        <span className="badge mb-4">
          {event.department}
        </span>
        <h1 className="text-4xl font-bold text-white mt-4 leading-tight">
          {event.name}
        </h1>
        <p className="text-sky-400 font-medium mt-2 italic tracking-wide">University Special Event</p>
      </div>

      <div className="space-y-6 mt-8">
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
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Main Venue</p>
            <p className="text-slate-200 text-sm font-medium">{event.venue}</p>
          </div>
        </div>

        {/* Map Integration */}
        <div className="mt-2">
           <EventMap lat={event.lat} lng={event.lng} venueName={event.venue} />
        </div>

        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-sky-500/10 rounded-xl">
            <DollarSign className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Entrance Fee</p>
            <p className="text-slate-200 text-sm font-medium">${event.price} per person</p>
          </div>
        </div>
      </div>

      <div className="pt-8 mt-8 border-t border-slate-700/50">
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
