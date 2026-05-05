/**
 * API Service to interact with the Express backend (MySQL and Stripe)
 */

import { EventData, BookingData } from '../types';

export const api = {
  // --- Events ---
  async getEvents(): Promise<EventData[]> {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async createEvent(data: Partial<EventData>): Promise<void> {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create event');
  },

  async updateEvent(id: string | number, data: Partial<EventData>): Promise<void> {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update event');
  },

  async deleteEvent(id: string | number): Promise<void> {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete event');
  },

  // --- Bookings ---
  async getBookings(email: string): Promise<BookingData[]> {
    const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  async createBooking(data: Partial<BookingData>): Promise<{ id: string | number }> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create booking');
    }
    return res.json();
  },

  async updateBookingStatus(id: string | number, status: string): Promise<void> {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: status }),
    });
    if (!res.ok) throw new Error('Failed to update booking status');
  },

  // --- Admin ---
  async checkAdminStatus(uid: string): Promise<boolean> {
    const res = await fetch(`/api/admin-check?uid=${uid}`);
    if (!res.ok) return false;
    const { isAdmin } = await res.json();
    return isAdmin;
  },

  // --- AI Chat ---
  async chat(message: string): Promise<string> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get AI response');
    }
    
    const { text } = await res.json();
    return text;
  }
};
