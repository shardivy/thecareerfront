import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "📅", title: "Critical Timelines", desc: "Real-time alerts for important dates and application windows." },
  { icon: "🏫", title: "IIM & University Insights", desc: "Guidance on IPM, private university admissions and selection criteria." },
  { icon: "🔔", title: "Official Notifications", desc: "Curated official updates so you never miss a change." },
  { icon: "💬", title: "Interactive Support", desc: "Q&A sessions and quick clarifications on eligibility and process." },
  { icon: "🧾", title: "Form & Document Help", desc: "Assistance with application forms, documents and submissions." },
  { icon: "👥", title: "Community Access", desc: "Join a focused WhatsApp group for peer support and updates." },
];

export default function BBAAdmission() {
  const navigate = useNavigate();
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "Commerce & Management Admission Group";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello Abhinav Career Scope, I want to join the ${defaultPackageName}.`;
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
          <img src="/BBA-Flayer.jpeg" alt="Commerce Admission Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">
          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">
              Unlock your potential in the world of business and management! 📈💼
            </p>

            <p className="law-desc">
              Whether you are aiming for an IPM at an IIM or looking to secure a seat in a leading private university, 
              <strong> Abhinav Career Scope </strong> is here to streamline your journey with our exclusive 
              <strong> Admission WhatsApp Paid Group for Commerce!</strong>
            </p>

            <p className="law-desc">
              Navigating the competitive landscape of management entrance exams requires timely information and strategic planning.
            </p>

            <div className="sec-head">📊 Why Join Our Commerce & Management Group?</div>
            <p className="law-desc">Stay ahead of the competition for <strong>IPM, BBA, MBA, and CET</strong> with curated updates:</p>

            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">🎓 Guided by Industry Experts</div>
            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  National Award-Winning Career Counselor with over 18 years of experience guiding students toward commerce and management careers.
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
                  <span className="contact-value">Bavdhan, Pune, India</span>
                </div>
              </div>
            </div>

            <div className="btn-row">
              <button className="book-btn" onClick={bookCounselling}>
                <WhatsAppOutlined className="btn-icon" />
                Join Group
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
              💼 <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
