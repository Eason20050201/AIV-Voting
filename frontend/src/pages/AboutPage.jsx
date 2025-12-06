import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-header">
          <h1 className="about-title">
            About <span className="gradient-text">VoteFlow</span>
          </h1>
          <p className="about-subtitle">
            Empowering organizations with secure, transparent, and efficient decision-making tools for the modern age.
          </p>
        </div>

        <section className="about-section glass-panel">
          <h2 className="section-title">🚀 Our Mission</h2>
          <p className="section-text">
            At VoteFlow, we believe that every voice matters. Our mission is to democratize decision-making processes by providing a platform that is accessible, reliable, and secure. Whether it's a small team decision or a large-scale organizational vote, VoteFlow ensures that the process is smooth and the results are trustworthy.
          </p>
        </section>

        <section className="about-section glass-panel">
          <h2 className="section-title">✨ Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h3 className="feature-title">Secure & Private</h3>
              <p className="feature-desc">
                State-of-the-art encryption ensures that your votes remain anonymous and tamper-proof.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3 className="feature-title">Real-time Results</h3>
              <p className="feature-desc">
                Watch the consensus build in real-time with our dynamic and interactive result visualizations.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📱</span>
              <h3 className="feature-title">Mobile First</h3>
              <p className="feature-desc">
                Vote from anywhere, anytime. Our platform is fully optimized for all devices.
              </p>
            </div>
          </div>
        </section>

        <section className="about-section glass-panel">
          <h2 className="section-title">🤝 Join the Revolution</h2>
          <p className="section-text">
            Ready to transform how your organization makes decisions? Join thousands of teams who trust VoteFlow for their governance needs. Let's build a more democratic future together.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
