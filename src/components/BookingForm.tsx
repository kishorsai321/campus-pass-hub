/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, ChangeEvent } from 'react';
import { Mail, Building, Ticket, AlertCircle, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { EventData, BookingData } from '../types';
import { api } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import OTPModal from './OTPModal';

// Lazy initialization of Stripe client
const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY);

interface BookingFormProps {
  event: EventData;
  user: any;
  onSuccess: (booking: BookingData) => void;
}

export default function BookingForm({ event, user, onSuccess }: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    department: '',
    tickets: '1'
  });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOTP, setShowOTP] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const isPastDeadline = event.registrationDeadline && today > event.registrationDeadline;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isProcessing || isPastDeadline) return;
    
    setError(null);

    const { name, email, department, tickets } = formData;
    const numTickets = parseInt(tickets);

    // Basic Validations
    if (!name || !email || !department || !tickets) {
      setError('All fields are mandatory.');
      return;
    }

    if (numTickets > event.availableTickets) {
      setError(`Only ${event.availableTickets} tickets are available.`);
      return;
    }

    // Trigger OTP verification first
    setShowOTP(true);
  };

  const handleOTPVerified = async () => {
    setShowOTP(false);
    setIsProcessing(true);
    setError(null);

    const { name, email, department, tickets } = formData;
    const numTickets = parseInt(tickets);

    try {
      // 1. Create a pending booking in MySQL
      const bookingData: Partial<BookingData> = {
        eventId: event.id,
        eventName: event.name,
        userName: name,
        userEmail: email,
        userDepartment: department,
        ticketsCount: numTickets,
        totalAmount: numTickets * event.price,
        paymentStatus: 'pending'
      };

      const { id: bookingId } = await api.createBooking(bookingData);

      // 2. Create Stripe Checkout Session via Backend
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: event.name,
          ticketPrice: event.price,
          quantity: numTickets,
          bookingId: bookingId
        }),
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error("Session Error Response:", errorText);
          throw new Error('Payment gateway synchronization error. Please try again.');
      }

      const { id: sessionId, error: stripeError } = await response.json();

      if (stripeError) {
        throw new Error(stripeError);
      }

      // 3. Redirect or Mock Simulate
      if (sessionId.startsWith('mock_session_')) {
        await api.updateBookingStatus(bookingId, 'paid');
        
        const finalBooking: BookingData = {
          id: String(bookingId),
          ...bookingData,
          paymentStatus: 'paid',
          bookingDate: new Date().toISOString()
        } as BookingData;

        setTimeout(() => {
          onSuccess(finalBooking);
        }, 1200);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");
      
      const { error: redirectError } = await (stripe as any).redirectToCheckout({ sessionId });
      if (redirectError) throw new Error(redirectError.message);

    } catch (err: any) {
      console.error("Booking Error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="glass-card p-10 h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white">Reserve Your Spot</h2>
        <p className="text-slate-400 text-sm mt-1">Complete the details to proceed to secure checkout.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">
            Attendee Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Dr. Sarah Chen"
            className="input-field"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            readOnly
            value={formData.email}
            className="input-field bg-slate-900/40 text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">
            Department
          </label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g. Computer Science"
            className="input-field"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">
            Tickets count
          </label>
          <div className="relative">
            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="number"
              name="tickets"
              min="1"
              max={event.availableTickets}
              value={formData.tickets}
              onChange={handleChange}
              className="input-field pl-12"
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[11px] mb-4 animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="p-6 bg-sky-500/5 border border-sky-500/10 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Payable Amount</span>
              <span className="text-2xl font-black text-white">₹{(parseInt(formData.tickets || '0') * event.price).toFixed(2)}</span>
            </div>
            <button
              type="submit"
              disabled={isProcessing || isPastDeadline}
              className="btn-primary px-10 py-4 text-sm tracking-wide w-full sm:w-auto flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Securing...
                </>
              ) : isPastDeadline ? (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  Registration Closed
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Proceed to Payment
                </>
              )}
            </button>
          </div>
          {isPastDeadline && (
            <p className="text-center text-[10px] text-red-400/80 font-bold uppercase tracking-widest mt-4">
              Error: The last date for institutional registration ({event.registrationDeadline}) has passed.
            </p>
          )}
        </div>
      </form>
      
      {showOTP && (
        <OTPModal 
          email={formData.email} 
          onVerify={handleOTPVerified} 
          onClose={() => setShowOTP(false)} 
        />
      )}
    </div>
  );
}
