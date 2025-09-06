import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDateTimeForUK, formatDateTimeShort } from '../utils/timezone';
import './AppointmentDetail.css';

interface Attendee {
  user_id: number;
  name: string;
  email: string;
  home_address: string;
  phone_number?: string;
  booking_date: string;
}

interface AppointmentDetail {
  id: number;
  place: string;
  datetime: string;
  max_bookings: number;
  current_bookings: number;
  status: string;
  created_at: string;
  attendees: Attendee[];
}

const AppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`/api/admin/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointment(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load appointment details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!appointment) return;
    
    setActionLoading('remind');
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`/api/admin/appointments/${id}/remind`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Reminder emails sent successfully!' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send reminder emails.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to cancel this appointment? This will:\n\n` +
      `• Mark the appointment as cancelled\n` +
      `• Send rescheduling emails to all ${appointment.attendees.length} attendees\n` +
      `• Remove the appointment from available booking options\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading('cancel');
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`/api/admin/appointments/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Appointment cancelled and rescheduling emails sent!' });
      // Refresh the appointment details
      fetchAppointmentDetails();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to cancel appointment.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (datetime: string) => {
    return formatDateTimeForUK(datetime);
  };

  const formatBookingDate = (bookingDate: string) => {
    return formatDateTimeShort(bookingDate);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading-spinner"></div>
          <p>Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container">
        <div className="card text-center">
          <p>Appointment not found.</p>
          <button onClick={() => navigate('/admin/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-detail">
      <div className="container">
        <div className="detail-header">
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="btn btn-secondary"
          >
            ← Back to Dashboard
          </button>
          <h1>Appointment Details</h1>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="appointment-info-card">
          <div className="appointment-header">
            <h2>{appointment.place}</h2>
            <div className={`status-badge status-${appointment.status}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </div>
          </div>
          
          <div className="appointment-details">
            <p className="appointment-datetime">
              <strong>Date & Time:</strong> {formatDateTime(appointment.datetime)}
            </p>
            <p className="appointment-capacity">
              <strong>Capacity:</strong> {appointment.current_bookings} / {appointment.max_bookings} booked
            </p>
            <p className="appointment-created">
              <strong>Created:</strong> {formatBookingDate(appointment.created_at)}
            </p>
          </div>

          {appointment.status === 'active' && (
            <div className="appointment-actions">
              <button
                onClick={handleSendReminder}
                disabled={actionLoading !== null || appointment.attendees.length === 0}
                className="btn btn-primary"
              >
                {actionLoading === 'remind' ? 'Sending...' : 'Send Reminder'}
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={actionLoading !== null}
                className="btn btn-danger"
              >
                {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          )}
        </div>

        <div className="attendees-section">
          <h3>Attendees ({appointment.attendees.length})</h3>
          
          {appointment.attendees.length === 0 ? (
            <div className="no-attendees">
              <p>No attendees booked for this appointment.</p>
            </div>
          ) : (
            <div className="attendees-list">
              {appointment.attendees.map((attendee) => (
                <div key={attendee.user_id} className="attendee-card">
                  <div className="attendee-info">
                    <h4>{attendee.name}</h4>
                    <p className="attendee-email">{attendee.email}</p>
                    <p className="attendee-address">{attendee.home_address}</p>
                    {attendee.phone_number && (
                      <p className="attendee-phone">Phone: {attendee.phone_number}</p>
                    )}
                    <p className="attendee-booking-date">
                      Booked: {formatBookingDate(attendee.booking_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;

