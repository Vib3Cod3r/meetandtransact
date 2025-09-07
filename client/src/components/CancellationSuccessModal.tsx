import React from 'react';
import './CancellationSuccessModal.css';

interface CancellationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentDetails: {
    place: string;
    datetime: string;
    attendeeCount: number;
  };
}

const CancellationSuccessModal: React.FC<CancellationSuccessModalProps> = ({
  isOpen,
  onClose,
  appointmentDetails
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content cancellation-success-modal">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#dc2626" stroke="#dc2626" strokeWidth="2"/>
            <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Appointment Cancelled</h2>
        <p style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '1.5rem' }}>
          The appointment at <strong>{appointmentDetails.place}</strong> on{' '}
          <strong>{appointmentDetails.datetime}</strong> has been successfully cancelled.
        </p>
        <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
          Rescheduling emails have been sent to all {appointmentDetails.attendeeCount} scheduled attendees.
        </p>
        <button onClick={onClose} className="btn btn-primary">
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default CancellationSuccessModal;
