import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './EmailVerification.css';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

let nsent = 0;

const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onVerified, onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const sendVerificationCode = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      await axios.post('/api/verification/request-code', { email });
      setMessage({ 
        type: 'success', 
        text: `Verification code sent to ${email}. Please check your email and spam folder.` 
      });
      setCodeSent(true);
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limited - show retry countdown
        const retryAfter = error.response?.data?.retryAfter || 60;
        setMessage({ 
          type: 'info', 
          text: error.response?.data?.message || `Please wait ${retryAfter} seconds before requesting another verification code.` 
        });
        setResendCooldown(retryAfter);
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to send verification code. Please try again.';
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    // Auto-send verification code when component mounts (only once)
    if (!codeSent) {
      console.log("Sending verification code: ", nsent++, " codeSent: ", codeSent);
      sendVerificationCode();
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter the verification code.' });
      return;
    }

    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await axios.post('/api/verification/verify-code', { email, code });
      setMessage({ 
        type: 'success', 
        text: 'Email verified successfully! You can now proceed with your booking.' 
      });
      
      // Wait a moment then call onVerified
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid verification code. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <div className="email-verification">
      <div className="verification-container">
        <div className="verification-header">
          <h2>Verify Your Email Address</h2>
          <p>We've sent a 6-digit verification code to:</p>
          <div className="email-display">{email}</div>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="verification-form">
          <div className="form-group">
            <label htmlFor="code" className="form-label">Enter Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={handleCodeChange}
              className="form-input code-input"
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
            <p className="code-help">Enter the 6-digit code from your email</p>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        </form>

        <div className="verification-footer">
          <p>Didn't receive the code?</p>
          <button
            onClick={sendVerificationCode}
            className="resend-button"
            disabled={loading || resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>

        <div className="back-section">
          <button onClick={onBack} className="btn btn-secondary">
            ← Back to Booking Form
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;

