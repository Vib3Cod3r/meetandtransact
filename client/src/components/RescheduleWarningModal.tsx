import React from 'react';
import { formatDateTimeForUK } from '../utils/timezone';
import './RescheduleWarningModal.css';

interface RescheduleWarningModalProps {
  isOpen: boolean;
  existingAppointment: {
    id: number;
    place: string;
    datetime: string;
  };
  newAppointment: {
    id: number;
    place: string;
    datetime: string;
  };
  onConfirmReschedule: () => void;
  onCancel: () => void;
}

const RescheduleWarningModal: React.FC<RescheduleWarningModalProps> = ({
  isOpen,
  existingAppointment,
  newAppointment,
  onConfirmReschedule,
  onCancel
}) => {
  if (!isOpen) return null;

  const formatDateTime = (datetime: string) => {
    return formatDateTimeForUK(datetime);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content reschedule-warning-modal">
        <div className="modal-header">
          <h2>Existing Appointment Found</h2>
        </div>
        
        <div className="modal-body">
          <p>You already have an active appointment scheduled:</p>
          
          <div className="appointment-comparison">
            <div className="existing-appointment">
              <h3>Current Appointment</h3>
              <div className="appointment-details">
                <p><strong>Location:</strong> {existingAppointment.place}</p>
                <p><strong>Date & Time:</strong> {formatDateTime(existingAppointment.datetime)}</p>
              </div>
            </div>
            
            <div className="new-appointment">
              <h3>New Appointment</h3>
              <div className="appointment-details">
                <p><strong>Location:</strong> {newAppointment.place}</p>
                <p><strong>Date & Time:</strong> {formatDateTime(newAppointment.datetime)}</p>
              </div>
            </div>
          </div>
          
          <p className="warning-text">
            Would you like to reschedule your current appointment to this new time?
          </p>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            Keep Current Appointment
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onConfirmReschedule}
          >
            Reschedule to New Time
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleWarningModal;
