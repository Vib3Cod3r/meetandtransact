import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
              <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">Queen Street Gardens</h1>
          <p className="hero-subtitle">Central District</p>
          <p className="hero-description">
            A community garden in the heart of Edinburgh. Reserve a convenient time to collect your garden key 
            and enjoy access to one of Edinburgh's most beautiful private gardens, where nature meets community 
            in the heart of the New Town.
          </p>
          <div className="hero-actions">
            <Link to="/book" className="btn btn-primary btn-large">
              Book Key Pickup Appointment
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="features-section">
          <h2 className="section-title">A place to relax, exercise and enjoy nature</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌸</div>
              <h3>Enjoy the flowers</h3>
              <p>Our exquisite garden boasts over a dozen flower borders. From the delicate elegance of roses to the cheerful hues of daisies, there is a border for everyone. Explore paths adorned with fragrant lavender and vibrant summer perennials.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Meet for a chat</h3>
              <p>With shaded nooks and inviting benches, it's the perfect haven for friends, families, and neighbours to gather and catch up. Whether you're seeking a tranquil escape or a lively chat, our garden welcomes you.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌿</div>
              <h3>Get close to nature</h3>
              <p>Embrace nature where tranquility meets biodiversity. Wander through our serene haven and encounter a multitude of birds, playful squirrels, and discover the fascinating world of fungi carpeting the woodland floor.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👶</div>
              <h3>Let the children play</h3>
              <p>Discover a haven for young adventurers where nature sparks the curiosity of little explorers. A dedicated, fenced-off area with sandpit caters specifically to the youngest nature enthusiasts.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">☀️</div>
              <h3>Relax in the open spaces</h3>
              <p>Discover inviting open spaces for relaxation and recreation. Bask in the warmth of the sun, finding your perfect spot for a leisurely sunbathe. Our sprawling lawns invite games and laughter.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌳</div>
              <h3>Discover woodland walks</h3>
              <p>A hidden gem boasting a diverse array of mature trees, including majestic weeping elms, resplendent copper beeches, and enduring oaks. These towering guardians provide a serene escape within the urban landscape.</p>
            </div>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>Key Access & Subscriptions</h3>
            <p>
              The Central Gardens is the middle of the three Queen Street Gardens. If you would like to have a key to access the Central Gardens and live in the catchment area, please see the subscribers section. A subscription currently costs £130 per annum. Note this gives you access to the Central Gardens only.
            </p>
            <p>
              Property owners in 17-38 Queen Street, 1-19 Heriot Row, 116 and 118 Hanover Street, 63 and 65 Frederick Street and 1 Howe Street should refer to the Proprietors section.
            </p>
            <p>
              To maintain the garden's exclusivity and security, key access is carefully managed through our appointment booking system. Once you have your subscription, you can book a convenient time to collect your garden key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
