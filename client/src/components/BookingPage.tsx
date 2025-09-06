import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EmailVerification from './EmailVerification';
import RescheduleWarningModal from './RescheduleWarningModal';
import { formatDateTimeForUK } from '../utils/timezone';
import './BookingPage.css';

interface Appointment {
  id: number;
  place: string;
  datetime: string;
  available_slots: number;
}

interface BookingForm {
  name: string;
  email: string;
  homeAddress: string;
  phoneNumber: string;
  appointmentId: string;
  eligibilityConfirmed: boolean;
}

const BookingPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showRescheduleWarning, setShowRescheduleWarning] = useState(false);
  const [existingAppointment, setExistingAppointment] = useState<{ id: number; place: string; datetime: string } | null>(null);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string>('');
  
  const [formData, setFormData] = useState<BookingForm>({
    name: '',
    email: '',
    homeAddress: '',
    phoneNumber: '',
    appointmentId: '',
    eligibilityConfirmed: false
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments');
      setAppointments(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load appointments. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name.' });
      return false;
    }
    if (!formData.email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return false;
    }
    if (!formData.homeAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter your home address.' });
      return false;
    }
    if (!formData.appointmentId) {
      setMessage({ type: 'error', text: 'Please select an appointment time.' });
      return false;
    }
    if (!formData.eligibilityConfirmed) {
      setMessage({ type: 'error', text: 'Please confirm your eligibility for Queen Street Gardens Central District access.' });
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return false;
    }

    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      // Remove all non-digit characters except + at the start
      const cleanPhone = formData.phoneNumber.replace(/[\s\-()]/g, '');
      // UK phone numbers: +44, 0, or 44 at start, followed by 10-11 digits
      const phoneRegex = /^(\+44|0|44)?[1-9]\d{8,10}$/;
      if (!phoneRegex.test(cleanPhone)) {
        setMessage({ type: 'error', text: 'Please enter a valid UK phone number.' });
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await axios.post('/api/appointments/book', formData);
      setMessage({ 
        type: 'success', 
        text: 'Appointment booked successfully! You will receive a confirmation email shortly.' 
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        homeAddress: '',
        phoneNumber: '',
        appointmentId: '',
        eligibilityConfirmed: false
      });
      
      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData?.requiresVerification) {
        // Show email verification step
        setVerificationEmail(formData.email);
        setShowVerification(true);
        setMessage({ 
          type: 'info', 
          text: 'Please verify your email address to complete the booking.' 
        });
      } else if (errorData?.hasExistingAppointment) {
        // Show reschedule warning modal
        setExistingAppointment(errorData.existingAppointment);
        setPendingAppointmentId(formData.appointmentId);
        setShowRescheduleWarning(true);
        setMessage({ 
          type: 'info', 
          text: 'You already have an active appointment. Please choose whether to reschedule.' 
        });
      } else if (errorData?.hasKey) {
        // User already has a key and is ineligible
        setMessage({ 
          type: 'error', 
          text: 'You have already received a key and are no longer eligible to book appointments through this system. If you believe this is an error, please contact the administrator.' 
        });
      } else {
        const errorMessage = errorData?.error || 'Failed to book appointment. Please try again.';
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailVerified = () => {
    setShowVerification(false);
    // Retry the booking after email verification
    handleSubmit(new Event('submit') as any);
  };

  const handleBackToForm = () => {
    setShowVerification(false);
    setVerificationEmail('');
  };

  const handleConfirmReschedule = async () => {
    if (!existingAppointment || !pendingAppointmentId) return;

    setSubmitting(true);
    setShowRescheduleWarning(false);
    setMessage(null);

    try {
      // Use the reschedule endpoint
      await axios.post('/api/appointments/reschedule', {
        ...formData,
        appointmentId: pendingAppointmentId
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Appointment rescheduled successfully! You will receive a confirmation email shortly.' 
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        homeAddress: '',
        phoneNumber: '',
        appointmentId: '',
        eligibilityConfirmed: false
      });
      
      // Refresh appointments
      fetchAppointments();
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || 'Failed to reschedule appointment. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
      setExistingAppointment(null);
      setPendingAppointmentId('');
    }
  };

  const handleCancelReschedule = () => {
    setShowRescheduleWarning(false);
    setExistingAppointment(null);
    setPendingAppointmentId('');
    setMessage({ 
      type: 'info', 
      text: 'You can keep your current appointment or select a different time to reschedule.' 
    });
  };

  const formatDateTime = (datetime: string) => {
    return formatDateTimeForUK(datetime);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">
          <div className="loading-spinner"></div>
          <p>Loading available appointments...</p>
        </div>
      </div>
    );
  }

  if (showVerification) {
    return (
      <EmailVerification
        email={verificationEmail}
        onVerified={handleEmailVerified}
        onBack={handleBackToForm}
      />
    );
  }

  return (
    <div className="booking-page">
      <div className="container">
        <div className="page-header">
          <h1>Book Your Key Pickup Appointment</h1>
          <p>Select a convenient time to collect your Queen Street Gardens key.</p>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="booking-content">
          <div className="booking-form-section">
            <div className="card">
              <h2>Your Details</h2>
              <form onSubmit={handleSubmit} className="booking-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="homeAddress" className="form-label">Home Address *</label>
                  <textarea
                    id="homeAddress"
                    name="homeAddress"
                    value={formData.homeAddress}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Enter your complete home address"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber" className="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="appointmentId" className="form-label">Select Appointment Time *</label>
                  <select
                    id="appointmentId"
                    name="appointmentId"
                    value={formData.appointmentId}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Choose an appointment time</option>
                    {appointments.map((appointment) => (
                      <option key={appointment.id} value={appointment.id}>
                        {appointment.place} - {formatDateTime(appointment.datetime)} 
                        ({appointment.available_slots} slot{appointment.available_slots !== 1 ? 's' : ''} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="eligibilityConfirmed"
                      name="eligibilityConfirmed"
                      checked={formData.eligibilityConfirmed}
                      onChange={(e) => setFormData(prev => ({ ...prev, eligibilityConfirmed: e.target.checked }))}
                      className="form-checkbox"
                      required
                    />
                    <label htmlFor="eligibilityConfirmed" className="checkbox-label">
                      I confirm that I believe I am eligible for a key to the Central District of Queen Street Gardens. 
                      I understand that eligibility is based on residence in the catchment area (17-38 Queen Street, 1-19 Heriot Row, 
                      116 and 118 Hanover Street, 63 and 65 Frederick Street and 1 Howe Street) or having a valid subscription. *
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={submitting}
                >
                  {submitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </div>
          </div>

          <div className="appointments-section">
            <div className="card">
              <h2>Available Appointments</h2>
              {appointments.length === 0 ? (
                <p className="no-appointments">No appointments are currently available. Please check back later.</p>
              ) : (
                <div className="appointments-list">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-card">
                      <div className="appointment-info">
                        <h3>{appointment.place}</h3>
                        <p className="appointment-datetime">{formatDateTime(appointment.datetime)}</p>
                        <p className="appointment-slots">
                          {appointment.available_slots} slot{appointment.available_slots !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Warning Modal */}
      {existingAppointment && (
        <RescheduleWarningModal
          isOpen={showRescheduleWarning}
          existingAppointment={existingAppointment}
          newAppointment={appointments.find(apt => apt.id.toString() === pendingAppointmentId) || { id: 0, place: '', datetime: '' }}
          onConfirmReschedule={handleConfirmReschedule}
          onCancel={handleCancelReschedule}
        />
      )}
    </div>
  );
};

export default BookingPage;
