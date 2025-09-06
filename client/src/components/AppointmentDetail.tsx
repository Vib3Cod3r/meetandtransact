import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDateTimeForUK, formatDateTimeShort } from '../utils/timezone';
import KeyManagementModal from './KeyManagementModal';
import './AppointmentDetail.css';

interface Attendee {
  user_id: number;
  name: string;
  email: string;
  home_address: string;
  phone_number?: string;
  key_serial_number?: string;
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

interface AppointmentHistory {
  id: number;
  user_id: number;
  appointment_id: number;
  action: string;
  action_timestamp: string;
  details: string;
  place: string;
  datetime: string;
  user_name: string;
  email: string;
}

const AppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showKeyManagement, setShowKeyManagement] = useState(false);
  const [selectedUserForKey, setSelectedUserForKey] = useState<Attendee | null>(null);
  const [userHistory, setUserHistory] = useState<AppointmentHistory[]>([]);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<Attendee | null>(null);

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

  const fetchUserHistory = async (userId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`/api/admin/users/${userId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserHistory(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load user history.' });
    }
  };

  const handleViewUserHistory = (attendee: Attendee) => {
    setSelectedUserForHistory(attendee);
    fetchUserHistory(attendee.user_id);
  };

  const handleBackToAttendees = () => {
    setSelectedUserForHistory(null);
    setUserHistory([]);
  };

  const handleManageKey = (attendee: Attendee) => {
    setSelectedUserForKey(attendee);
    setShowKeyManagement(true);
  };

  const handleKeyIssued = (keySerialNumber: string) => {
    setMessage({ type: 'success', text: `Key issued successfully with serial number: ${keySerialNumber}` });
    // Refresh appointment details to show updated key status
    fetchAppointmentDetails();
  };

  const handleKeyRevoked = () => {
    setMessage({ type: 'success', text: 'Key revoked successfully' });
    // Refresh appointment details to show updated key status
    fetchAppointmentDetails();
  };

  const handleCloseKeyManagement = () => {
    setShowKeyManagement(false);
    setSelectedUserForKey(null);
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
          {!selectedUserForHistory ? (
            <>
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
                        <p className="attendee-key-status">
                          <strong>Key Status:</strong> 
                          <span className={`key-status ${attendee.key_serial_number ? 'has-key' : 'no-key'}`}>
                            {attendee.key_serial_number ? `Serial: ${attendee.key_serial_number}` : 'No key issued'}
                          </span>
                        </p>
                        <p className="attendee-booking-date">
                          Booked: {formatBookingDate(attendee.booking_date)}
                        </p>
                      </div>
                      <div className="attendee-actions">
                        <button
                          onClick={() => handleViewUserHistory(attendee)}
                          className="btn btn-primary btn-sm"
                        >
                          View History
                        </button>
                        <button
                          onClick={() => handleManageKey(attendee)}
                          className="btn btn-secondary btn-sm"
                        >
                          {attendee.key_serial_number ? 'Manage Key' : 'Issue Key'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="section-header">
                <button
                  onClick={handleBackToAttendees}
                  className="btn btn-secondary"
                  style={{ marginRight: '1rem' }}
                >
                  ← Back to Attendees
                </button>
                <h3>Appointment History - {selectedUserForHistory.name}</h3>
              </div>

              <div className="user-history">
                {userHistory.length === 0 ? (
                  <div className="card text-center">
                    <p>No appointment history found for this user.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {userHistory.map((history) => (
                      <div key={history.id} className="history-card">
                        <div className="history-header">
                          <h4 className={`history-action ${history.action}`}>
                            {history.action.charAt(0).toUpperCase() + history.action.slice(1)}
                          </h4>
                          <span className="history-timestamp">
                            {formatDateTime(history.action_timestamp)}
                          </span>
                        </div>
                        <div className="history-details">
                          <p><strong>Appointment:</strong> {history.place}</p>
                          <p><strong>Date & Time:</strong> {formatDateTime(history.datetime)}</p>
                          {history.details && (
                            <p><strong>Details:</strong> {history.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Key Management Modal */}
        {selectedUserForKey && (
          <KeyManagementModal
            isOpen={showKeyManagement}
            user={{
              id: selectedUserForKey.user_id,
              name: selectedUserForKey.name,
              email: selectedUserForKey.email,
              key_serial_number: selectedUserForKey.key_serial_number
            }}
            onClose={handleCloseKeyManagement}
            onKeyIssued={handleKeyIssued}
            onKeyRevoked={handleKeyRevoked}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentDetail;

