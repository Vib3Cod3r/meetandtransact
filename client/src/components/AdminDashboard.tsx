import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import KeyManagementModal from './KeyManagementModal';
import { formatDateTimeForUK, utcToLocalDateTime, localDateTimeToUTC } from '../utils/timezone';
import './AdminDashboard.css';

interface Appointment {
  id: number;
  place: string;
  datetime: string;
  max_bookings: number;
  current_bookings: number;
  booked_users?: string;
  status: 'active' | 'cancelled';
}

interface User {
  id: number;
  name: string;
  email: string;
  home_address: string;
  phone_number?: string;
  key_serial_number?: string;
  total_bookings: number;
  appointments?: string;
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

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'users'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userHistory, setUserHistory] = useState<AppointmentHistory[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showKeyManagement, setShowKeyManagement] = useState(false);
  const [selectedUserForKey, setSelectedUserForKey] = useState<User | null>(null);
  
  const [appointmentForm, setAppointmentForm] = useState({
    place: '',
    datetime: '',
    maxBookings: 1
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [appointmentsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/appointments', { headers }),
        axios.get('/api/admin/users', { headers })
      ]);
      
      setAppointments(appointmentsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (userId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.get(`/api/admin/users/${userId}/history`, { headers });
      setUserHistory(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load user history. Please try again.' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointmentForm.place || !appointmentForm.datetime) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Convert local datetime to UTC for API
      const formData = {
        ...appointmentForm,
        //datetime: localDateTimeToUTC(appointmentForm.datetime)  // do not convert to UTC for admin
      };
      
      if (editingAppointment) {
        await axios.put(`/api/admin/appointments/${editingAppointment.id}`, formData, { headers });
        setMessage({ type: 'success', text: 'Appointment updated successfully!' });
      } else {
        await axios.post('/api/admin/appointments', formData, { headers });
        setMessage({ type: 'success', text: 'Appointment created successfully!' });
      }
      
      setShowAppointmentForm(false);
      setEditingAppointment(null);
      setAppointmentForm({ place: '', datetime: '', maxBookings: 1 });
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save appointment.';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    // Check if appointment has attendees
    if (appointment.current_bookings > 0) {
      setMessage({ 
        type: 'error', 
        text: 'Cannot edit appointments with existing attendees. You can only increase the maximum number of attendees or cancel the appointment.' 
      });
      return;
    }
    
    setEditingAppointment(appointment);
    setAppointmentForm({
      place: appointment.place,
      datetime: utcToLocalDateTime(appointment.datetime),
      maxBookings: appointment.max_bookings
    });
    setShowAppointmentForm(true);
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this appointment? This will also cancel all associated bookings.')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.delete(`/api/admin/appointments/${id}`, { headers });
      setMessage({ type: 'success', text: 'Appointment deleted successfully!' });
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete appointment.';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const formatDateTime = (datetime: string) => {
    return formatDateTimeForUK(datetime);
  };

  const handleViewUserHistory = (user: User) => {
    setSelectedUser(user);
    fetchUserHistory(user.id);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setUserHistory([]);
  };

  const handleManageKey = (user: User) => {
    setSelectedUserForKey(user);
    setShowKeyManagement(true);
  };

  const handleKeyIssued = (keySerialNumber: string) => {
    setMessage({ type: 'success', text: `Key issued successfully with serial number: ${keySerialNumber}` });
    fetchData(); // Refresh users list
  };

  const handleKeyRevoked = () => {
    setMessage({ type: 'success', text: 'Key revoked successfully' });
    fetchData(); // Refresh users list
  };

  const handleCloseKeyManagement = () => {
    setShowKeyManagement(false);
    setSelectedUserForKey(null);
  };

  const handleIncreaseMaxBookings = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setAppointmentForm({
      place: appointment.place,
      datetime: utcToLocalDateTime(appointment.datetime),
      maxBookings: appointment.max_bookings
    });
    setShowAppointmentForm(true);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        {activeTab === 'appointments' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Manage Appointments</h2>
              <button
                onClick={() => {
                  setEditingAppointment(null);
                  setAppointmentForm({ place: '', datetime: '', maxBookings: 1 });
                  setShowAppointmentForm(true);
                }}
                className="btn btn-primary"
              >
                Add New Appointment
              </button>
            </div>

            {showAppointmentForm && (
              <div className="card">
                <h3>
                  {editingAppointment 
                    ? (editingAppointment.current_bookings > 0 
                        ? 'Increase Maximum Attendees' 
                        : 'Edit Appointment')
                    : 'Add New Appointment'
                  }
                </h3>
                {editingAppointment && editingAppointment.current_bookings > 0 && (
                  <div className="alert alert-warning">
                    <strong>Note:</strong> This appointment has {editingAppointment.current_bookings} attendee(s). 
                    You can only increase the maximum number of attendees. Other changes require cancelling and creating a new appointment.
                  </div>
                )}
                <form onSubmit={handleAppointmentSubmit} className="appointment-form">
                  <div className="form-group">
                    <label htmlFor="place" className="form-label">Location *</label>
                    <input
                      type="text"
                      id="place"
                      value={appointmentForm.place}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, place: e.target.value }))}
                      className="form-input"
                      placeholder="e.g., Queen Street Gardens Main Gate"
                      required
                      disabled={editingAppointment ? editingAppointment.current_bookings > 0 : false}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="datetime" className="form-label">Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="datetime"
                      value={appointmentForm.datetime}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, datetime: e.target.value }))}
                      className="form-input"
                      required
                      disabled={editingAppointment ? editingAppointment.current_bookings > 0 : false}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="maxBookings" className="form-label">Maximum Bookings</label>
                    <input
                      type="number"
                      id="maxBookings"
                      value={appointmentForm.maxBookings}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, maxBookings: parseInt(e.target.value) || 1 }))}
                      className="form-input"
                      min={editingAppointment && editingAppointment.current_bookings > 0 ? editingAppointment.current_bookings : 1}
                    />
                    {editingAppointment && editingAppointment.current_bookings > 0 && (
                      <small className="form-help">
                        Must be at least {editingAppointment.current_bookings} (current number of attendees)
                      </small>
                    )}
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      {editingAppointment 
                        ? (editingAppointment.current_bookings > 0 
                            ? 'Increase Maximum Attendees' 
                            : 'Update Appointment')
                        : 'Create Appointment'
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppointmentForm(false);
                        setEditingAppointment(null);
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="appointments-list">
              {appointments.length === 0 ? (
                <div className="card text-center">
                  <p>No appointments found. Create your first appointment above.</p>
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className={`appointment-card ${appointment.status === 'cancelled' ? 'cancelled' : ''}`}>
                    <div 
                      className={`appointment-info ${appointment.status !== 'cancelled' ? 'clickable' : ''}`}
                      onClick={() => appointment.status !== 'cancelled' && navigate(`/admin/appointments/${appointment.id}`)}
                    >
                      <div className="appointment-header">
                        <h3>{appointment.place}</h3>
                        {appointment.status === 'cancelled' && (
                          <span className="cancelled-badge">CANCELLED</span>
                        )}
                      </div>
                      <p className="appointment-datetime">{formatDateTime(appointment.datetime)}</p>
                      <p className="appointment-bookings">
                        {appointment.current_bookings} / {appointment.max_bookings} bookings
                      </p>
                      {appointment.booked_users && (
                        <p className="appointment-users">
                          <strong>Booked by:</strong> {appointment.booked_users}
                        </p>
                      )}
                      {appointment.status !== 'cancelled' && (
                        <p className="click-hint">Click to view details and manage attendees</p>
                      )}
                      {appointment.status === 'cancelled' && (
                        <p className="cancelled-hint">This appointment has been cancelled</p>
                      )}
                    </div>
                    <div className="appointment-actions">
                      {appointment.status !== 'cancelled' && (
                        <>
                          {appointment.current_bookings === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAppointment(appointment);
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIncreaseMaxBookings(appointment);
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              Increase Max
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAppointment(appointment.id);
                            }}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {appointment.status === 'cancelled' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAppointment(appointment.id);
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            {!selectedUser ? (
              <>
                <div className="section-header">
                  <h2>Registered Users</h2>
                </div>

                <div className="users-list">
                  {users.length === 0 ? (
                    <div className="card text-center">
                      <p>No users found.</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="user-card">
                        <div className="user-info">
                          <h3>{user.name}</h3>
                          <p className="user-email">{user.email}</p>
                          <p className="user-address">{user.home_address}</p>
                          {user.phone_number && (
                            <p className="user-phone">Phone: {user.phone_number}</p>
                          )}
                          <p className="user-bookings">
                            Total bookings: {user.total_bookings}
                          </p>
                          <p className="user-key-status">
                            <strong>Key Status:</strong> 
                            <span className={`key-status ${user.key_serial_number ? 'has-key' : 'no-key'}`}>
                              {user.key_serial_number ? `Serial: ${user.key_serial_number}` : 'No key issued'}
                            </span>
                          </p>
                          {user.appointments && (
                            <p className="user-appointments">
                              <strong>Appointments:</strong> {user.appointments}
                            </p>
                          )}
                        </div>
                        <div className="user-actions">
                          <button
                            onClick={() => handleViewUserHistory(user)}
                            className="btn btn-primary btn-sm"
                          >
                            View History
                          </button>
                          <button
                            onClick={() => handleManageKey(user)}
                            className="btn btn-secondary btn-sm"
                          >
                            {user.key_serial_number ? 'Manage Key' : 'Issue Key'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="section-header">
                  <button
                    onClick={handleBackToUsers}
                    className="btn btn-secondary"
                    style={{ marginRight: '1rem' }}
                  >
                    ← Back to Users
                  </button>
                  <h2>Appointment History - {selectedUser.name}</h2>
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
        )}

        {/* Key Management Modal */}
        {selectedUserForKey && (
          <KeyManagementModal
            isOpen={showKeyManagement}
            user={selectedUserForKey}
            onClose={handleCloseKeyManagement}
            onKeyIssued={handleKeyIssued}
            onKeyRevoked={handleKeyRevoked}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
