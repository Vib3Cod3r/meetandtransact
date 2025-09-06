import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmailVerification from './EmailVerification';
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

interface PreFilledData {
  name?: string;
  email?: string;
  homeAddress?: string;
  phoneNumber?: string;
}

const ReschedulePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [formData, setFormData] = useState<BookingForm>({
    name: '',
    email: '',
    homeAddress: '',
    phoneNumber: '',
    appointmentId: '',
    eligibilityConfirmed: false
  });

  useEffect(() => {
    // Parse pre-filled data from URL parameters
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        // Handle both base64 encoded data (new format) and URL encoded JSON (old format)
        let preFilledData: PreFilledData;
        try {
          // Try base64 decoding first (new format)
          const decodedData = atob(dataParam);
          preFilledData = JSON.parse(decodedData) as PreFilledData;
        } catch (base64Error) {
          // Fall back to URL decoding (old format)
          preFilledData = JSON.parse(decodeURIComponent(dataParam)) as PreFilledData;
        }
        
        setFormData(prev => ({
          ...prev,
          name: preFilledData.name || '',
          email: preFilledData.email || '',
          homeAddress: preFilledData.homeAddress || '',
          phoneNumber: preFilledData.phoneNumber || '',
          eligibilityConfirmed: true // Pre-confirm for rescheduling
        }));
      } catch (error) {
        console.error('Error parsing pre-filled data:', error);
        setMessage({ type: 'error', text: 'Invalid rescheduling link. Please start a new booking.' });
      }
    }
    
    fetchAppointments();
  }, [searchParams]);

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
      await axios.post('/api/appointments/reschedule', formData);
      setShowSuccessModal(true);
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData?.requiresVerification) {
        // Show email verification step
        setVerificationEmail(formData.email);
        setShowVerification(true);
        setMessage({ 
          type: 'info', 
          text: 'Please verify your email address to complete the rescheduling.' 
        });
      } else {
        const errorMessage = errorData?.error || 'Failed to reschedule appointment. Please try again.';
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

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/');
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
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-icon">✅</div>
            <h2>Appointment Rescheduled Successfully!</h2>
            <p>
              Your appointment has been rescheduled successfully. You will receive a confirmation email 
              shortly with the details of your new appointment.
            </p>
            <div className="success-details">
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>Check your email for a confirmation message</li>
                <li>Save the appointment details to your calendar</li>
                <li>Arrive on time for your new appointment</li>
              </ul>
            </div>
            <button 
              onClick={handleSuccessModalClose}
              className="btn btn-primary btn-large"
            >
              Return to Home Page
            </button>
          </div>
        </div>
      )}

      <div className="container">
        <div className="page-header">
          <h1>Reschedule Your Appointment</h1>
          <p>Your details have been pre-filled. Please select a new appointment time.</p>
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
                  <label htmlFor="appointmentId" className="form-label">Select New Appointment Time *</label>
                  <select
                    id="appointmentId"
                    name="appointmentId"
                    value={formData.appointmentId}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Choose a new appointment time</option>
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
                  {submitting ? 'Rescheduling...' : 'Reschedule Appointment'}
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
    </div>
  );
};

export default ReschedulePage;
