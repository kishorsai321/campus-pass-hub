/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EventData {
  id: string;
  name: string;
  department: string;
  dateTime: string;
  venue: string;
  price: number;
  totalTickets: number;
  availableTickets: number;
  createdAt?: string;
}

export interface BookingData {
  id: string;
  eventId: string;
  eventName: string;
  userName: string;
  userEmail: string;
  userDepartment: string;
  ticketsCount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
  stripeSessionId?: string;
  bookingDate: string;
}
