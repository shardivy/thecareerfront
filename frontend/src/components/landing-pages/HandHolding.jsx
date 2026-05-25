import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const highlights = [
  { icon: "🎓", title: "Real-world Training", desc: "Hands-on learning through 10 Live Sessions." },
  { icon: "👩‍🏫", title: "Expert Learning", desc: "Learn from a nationally awarded career counselor." },
  { icon: "🖥️", title: "Flexible Learning", desc: "Online & offline sessions as per convenience." },
  { icon: "🤝", title: "Mentorship Support", desc: "Ongoing personalized guidance for success." },
];

export default function HandHolding() {
  const navigate = useNavigate();
  const phone1 = "+91 9922695424";
  const phone2 = "+91 8208030557";
  const defaultPackageName = "Certified Career Counselor Program";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello Abhinav Career Scope, I want to join the ${defaultPackageName}.`;
    window.open(
      `https://wa.me/919922695424?text=${encodeURIComponent(whatsappText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="law-page">
      <div className="law-wrapper">

        {/* LEFT: floating image card */}
        <div className="law-image-card">
          <img src="/HH-Flayer.jpeg" alt="Career Counselor Program Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">
          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Abhinav Career Scope — Hand-Holding Sessions</p>
            <p className="law-desc">
              At <b>Abhinav Career Scope</b>, we don’t just guide students, we empower future career counselors! 
              Our hand-holding sessions equip passionate individuals with the skills and knowledge to guide students and parents with confidence.
            </p>
            <p className="law-desc">
              Whether you’re an educator, HR, industry expert, graduate, parent, or homemaker, if you’re passionate about career counseling, we are here to support you.
            </p>

            <div className="sec-head">Program Highlights</div>
            <div className="benefit-grid">
              {highlights.map((h) => (
                <div className="b-card" key={h.title}>
                  <span className="b-icon">{h.icon}</span>
                  <h4>{h.title}</h4>
                  <p>{h.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">🚀 Start Your Journey</div>
            <p className="law-desc">
              Join us and transform the future of career counseling!
            </p>

         
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
                  <span className="contact-value">Bavdhan , Pune, India</span>
                </div>
              </div>
            </div>
            <div className="btn-row">
              <button className="book-btn" onClick={bookCounselling}>
                <WhatsAppOutlined className="btn-icon" />
                Join Program
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
              🏦 <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
