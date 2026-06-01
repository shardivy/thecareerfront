import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "🧭", title: "Scientific Aptitude Test", desc: "Identify strengths, talents, personality & learning style." },
  { icon: "🎒", title: "Career Awareness", desc: "Explore future career opportunities and suitable subject choices." },
  { icon: "🤝", title: "Personalized Counselling", desc: "One-on-one sessions for students and parents." },
  { icon: "🧩", title: "Early Guidance", desc: "Build confidence and reduce confusion about future streams." },
  { icon: "📈", title: "Progress Tracking", desc: "Follow-up tips and resources to nurture strengths." },
  { icon: "💬", title: "WhatsApp Support", desc: "Join group for updates, tips and career resources." },
];

export default function Apti89() {
  const navigate = useNavigate();
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "Career Guidance for 8th & 9th Students";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello Abhinav Career Scope, I want to book counselling for ${defaultPackageName}.`;
    window.open(
      `https://wa.me/${phone1.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="law-page">
      <div className="law-wrapper">

        {/* LEFT: floating image card */}
        <div className="law-image-card">
          <img src="/8-12Aptitude-Flayer.jpeg" alt="8th 9th Aptitude Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">

          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Give your child the right direction at the right time.</p>

            <p className="law-desc">
              Students of <strong>8th and 9th standard</strong> are at a pivotal stage. Early, structured guidance helps
              discover strengths, build confidence and choose the right academic path. Abhinav Career Scope offers
              age-appropriate aptitude assessments and personalized counselling to set students on a clear trajectory.
            </p>

            <div className="sec-head">What we offer</div>

            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">Program highlights</div>

            <div className="benefit-grid">
              <div className="b-card">
                <span className="b-icon">🔬</span>
                <h4>Scientific Aptitude Test</h4>
                <p>Expert-designed assessment to reveal natural strengths and learning style.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">🧭</span>
                <h4>Career Awareness</h4>
                <p>Age-appropriate career exploration and subject guidance for middle schoolers.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">👪</span>
                <h4>Parent-Student Session</h4>
                <p>Joint counseling to align expectations and plan next steps together.</p>
              </div>
            </div>

            <div className="sec-head">Your mentor</div>

            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  National Award-Winning Career Counselor with extensive experience guiding young students and families.
                </p>
                <span className="award-pill">🏆 National Award Winner</span>
              </div>
            </div>

           
          </div>

          {/* sticky contact footer */}
          <div className="law-footer">
            <div className="contact-section">
              <div className="contact-section-header">
                <p className="contact-eyebrow">📞 Connect With Us Today</p>
                <p className="contact-copy">
                  Don't navigate your admission journey alone. Join our community for premium updates, expert guidance, and timely support.
                </p>
              </div>

              <div className="contact-details">
                <div className="contact-item">
                  <span className="contact-label">WhatsApp / Call</span>
                  <span className="contact-value">{phone1}</span>
                  <span className="contact-value">{phone2}</span>
                </div>

                <div className="contact-item">
                  <span className="contact-label">Location</span>
                  <span className="contact-value">Pune, India</span>
                </div>
              </div>
            </div>

            <div className="btn-row">
              <button className="book-btn" onClick={bookCounselling}>
                <WhatsAppOutlined className="btn-icon" />
                Book Counselling
              </button>

              <button
                className="register-btn"
                onClick={() => navigate("/register")}
              >
                <UserAddOutlined className="btn-icon" />
                Create Student Account
              </button>
            </div>

            <div className="footer-brand">
              <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
