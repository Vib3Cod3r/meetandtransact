import React, { useState } from 'react';
import axios from 'axios';
import './KeyManagementModal.css';

interface KeyManagementModalProps {
  isOpen: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    key_serial_number?: string;
  };
  onClose: () => void;
  onKeyIssued: (keySerialNumber: string) => void;
  onKeyRevoked: () => void;
}

const KeyManagementModal: React.FC<KeyManagementModalProps> = ({
  isOpen,
  user,
  onClose,
  onKeyIssued,
  onKeyRevoked
}) => {
  const [keySerialNumber, setKeySerialNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleIssueKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keySerialNumber.trim()) {
      setMessage({ type: 'error', text: 'Please enter a key serial number.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post(`/api/admin/users/${user.id}/issue-key`, {
        keySerialNumber: keySerialNumber.trim()
      }, { headers });
      
      setMessage({ type: 'success', text: response.data.message });
      onKeyIssued(keySerialNumber.trim());
      setKeySerialNumber('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to issue key. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!window.confirm(`Are you sure you want to revoke the key (Serial: ${user.key_serial_number}) from ${user.name}?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post(`/api/admin/users/${user.id}/revoke-key`, {}, { headers });
      
      setMessage({ type: 'success', text: response.data.message });
      onKeyRevoked();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to revoke key. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content key-management-modal">
        <div className="modal-header">
          <h2>Key Management</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="user-info">
            <h3>User Details</h3>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Current Key Status:</strong> 
              <span className={`key-status ${user.key_serial_number ? 'has-key' : 'no-key'}`}>
                {user.key_serial_number ? `Serial: ${user.key_serial_number}` : 'No key issued'}
              </span>
            </p>
          </div>

          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {!user.key_serial_number ? (
            <div className="issue-key-section">
              <h3>Issue New Key</h3>
              <form onSubmit={handleIssueKey}>
                <div className="form-group">
                  <label htmlFor="keySerialNumber" className="form-label">
                    Key Serial Number *
                  </label>
                  <input
                    type="text"
                    id="keySerialNumber"
                    value={keySerialNumber}
                    onChange={(e) => setKeySerialNumber(e.target.value)}
                    className="form-input"
                    placeholder="Enter key serial number"
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !keySerialNumber.trim()}
                >
                  {loading ? 'Issuing...' : 'Issue Key'}
                </button>
              </form>
            </div>
          ) : (
            <div className="revoke-key-section">
              <h3>Key Management</h3>
              <div className="key-details">
                <p><strong>Serial Number:</strong> {user.key_serial_number}</p>
                <p className="warning-text">
                  <strong>Warning:</strong> Revoking this key will make the user eligible to book new appointments again.
                </p>
              </div>
              <button
                onClick={handleRevokeKey}
                className="btn btn-danger"
                disabled={loading}
              >
                {loading ? 'Revoking...' : 'Revoke Key'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeyManagementModal;
