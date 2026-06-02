import React from 'react';
import './Hello.css';

const Home = () => {
  return (
    <div className="landing-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="logo-container">
          <div className="logo-icon">
            <span className="leaf leaf-1">🍃</span>
            <span className="leaf leaf-2">🍂</span>
          </div>
          <span className="logo-text">EventRoots</span>
        </div>
        <div className="nav-actions">
          <button className="btn-secondary">Sign in</button>
          <button className="btn-primary">Create an account</button>
        </div>
      </nav>

      {/* Hero Announcement Banner */}
      <div className="announcement-banner">
        <div className="banner-content">
          <span className="sparkle-icon">✨</span>
          <p><strong>New:</strong> Plan structurally sound, culturally rich events with our AI Assistant.</p>
          <a href="#chatbot-feature" className="banner-link">Explore Chatbot ➔</a>
        </div>
      </div>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-text-content">
          <h1 className="hero-title">
            AI-powered event planning <br />
            <span className="highlight-text">rooted in tradition.</span>
          </h1>
          <p className="hero-description">
            Simplify complex event planning while keeping your cultural customs intact. 
            From weddings to funerals, get personalized guidance, structured workflows, and smart vendor matches tailored to your community.
          </p>
          <div className="hero-cta-group">
            <button className="btn-primary btn-large">Create an account</button>
            <button className="btn-secondary btn-large">How it works</button>
          </div>
        </div>

        {/* Hero Interactive UI Preview */}
        <div className="hero-preview-container">
          <div className="mock-window">
            <div className="mock-header">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              <span className="mock-title">EventRoots Dashboard</span>
            </div>
            <div className="mock-body">
              <div className="mock-sidebar">
                <div className="sidebar-item active">📋 Dashboard</div>
                <div className="sidebar-item">📅 Event Flow</div>
                <div className="sidebar-item">🤝 Sample Vendors</div>
              </div>
              <div className="mock-content">
                <div className="widget-row">
                  <div className="widget card-progress">
                    <h4>Kerala Hindu Wedding</h4>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: '40%' }}></div>
                    </div>
                    <span>12 of 30 tasks completed</span>
                  </div>
                </div>
                
                {/* Visual Highlight on Chatbot */}
                <div className="widget card-chatbot-highlight" id="chatbot-feature">
                  <div className="chatbot-header">
                    <span className="bot-avatar">🤖</span>
                    <div>
                      <h5>EventGPT Assistant</h5>
                      <p className="status">Online • Ready to guide</p>
                    </div>
                  </div>
                  <div className="chat-bubble user">What is a Mehendi ceremony milestone timeline?</div>
                  <div className="chat-bubble bot">
                    Based on your North Indian cultural profile, it traditionally takes place 1-2 days before the wedding. Let me update your event checklist...
                  </div>
                  <div className="chat-input-mock">
                    <span>Ask follow-up questions...</span>
                    <button className="send-btn">➔</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Core Features Overview */}
      <section className="features-section">
        <h2 className="section-title">Designed for Seamless Planning</h2>
        <div className="features-grid">
          <div className="feature-card highlighted-card">
            <div className="card-badge">CORE FEATURE</div>
            <h3>Intelligent</h3>
            <p>Engage with our conversational AI initialized directly with your cultural preferences and scope. Ask infinite follow-up questions without re-entering details.</p>
          </div>
          <div className="feature-card">
            <h3>Cultural Personalization</h3>
            <p>From a Hindu wedding in Kerala to a Christian wedding in Goa, our system respects and aligns with your exact regional customs and community templates.</p>
          </div>
          <div className="feature-card">
            <h3>Dynamic Workflow & Vendors</h3>
            <p>Automatically maps your plan to necessary operational vendor categories and reviews matching sample providers from our internal repository.</p>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar / Minimal Footer */}
      <footer className="footer-bar">
        <div className="footer-left">
          <span>© 2026 EventRoots MVP. All rights reserved.</span>
          <span className="internship-tag">Dcube Intern Project</span>
        </div>
        <div className="footer-right">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <button className="btn-link-auth">Sign In / Sign Up</button>
        </div>
      </footer>
    </div>
  );
};

export default Home;