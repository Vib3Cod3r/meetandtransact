import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <Link to="/" className="brand-link">
            <h1>Queen Street Gardens</h1>
            <p>Key Pickup Appointments</p>
          </Link>
        </div>
        
        <nav className="header-nav">
          {!isAdmin ? (
            <>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/book" className="nav-link">Book Appointment</Link>
              <Link to="/admin" className="nav-link admin-link">Admin</Link>
            </>
          ) : (
            <>
              <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/" className="nav-link">Public Site</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

