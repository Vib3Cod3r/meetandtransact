import React from 'react';
import './BookingSuccessModal.css';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentDetails: {
    place: string;
    datetime: string;
  };
}

const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  appointmentDetails 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content success-modal">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#10b981" stroke="#10b981" strokeWidth="2"/>
            <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="success-title">Appointment Booked Successfully!</h2>
        
        <div className="appointment-details">
          <h3>Your Appointment Details</h3>
          <div className="detail-item">
            <strong>Location:</strong> {appointmentDetails.place}
          </div>
          <div className="detail-item">
            <strong>Date & Time:</strong> {appointmentDetails.datetime}
          </div>
        </div>
        
        <div className="success-message">
          <p>You will receive a confirmation email shortly with all the details and a calendar invite.</p>
          <p>Please arrive on time for your appointment. If you need to reschedule, you can use the link in your confirmation email.</p>
        </div>
        
        <div className="modal-actions">
          <button 
            onClick={onClose}
            className="btn btn-primary btn-large"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessModal;
