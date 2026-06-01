import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "📅", title: "Important Dates", desc: "Timely alerts for registrations, deadlines and counseling windows." },
  { icon: "🏫", title: "Admission Process Details", desc: "IIT, NIT, MHTCET, BITSAT & private university updates." },
  { icon: "📢", title: "Official Notifications", desc: "Curated official updates from relevant websites." },
  { icon: "❓", title: "Q&A Support", desc: "Clarifications on rules, eligibility and seat allotment." },
  { icon: "📚", title: "Resources", desc: "Sample papers, cutoff lists and helpful links." },
  { icon: "🤝", title: "Group Support", desc: "Peer and expert help inside a focused WhatsApp group." },
];

export default function EngineeringPaidGroup() {
  const navigate = useNavigate();
  const phone1 = "+91 9922695424";
  const phone2 = "+91 8208030557";
  const defaultPackageName = "Paid Group for Engineering Admission Update";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello Abhinav Career Scope, I want to join the ${defaultPackageName} paid group.`;
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
          <img src="/Engg-WP-Flayer.jpeg" alt="Engineering Admission Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">

          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Abhinav Career Scope — Paid WhatsApp Group for Parents</p>

            <p className="law-desc">
              This group helps parents stay informed about the engineering admission process — from important dates and official notifications to rules, FAQs and focused Q&A support.
            </p>

            <div className="sec-head">Key highlights</div>

            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">Group notes</div>

            <div className="benefit-grid">
              <div className="b-card">
                <span className="b-icon">💸</span>
                <h4>Charges & Entry</h4>
                <p>Group charges vary by process; free e-book on engineering cutoffs provided to members.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">🔒</span>
                <h4>One Parent Policy</h4>
                <p>Only one parent number will be added per payment; send screenshot after payment for addition.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">⏱️</span>
                <h4>Response Time</h4>
                <p>Queries answered within 24 hours; no personal college/branch predictions inside the group.</p>
              </div>
            </div>

            <div className="sec-head">Program duration</div>
            <p className="law-desc">Group remains active until the engineering admission process concludes for the year.</p>

            <div className="sec-head">Your mentor</div>
            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  National Award-Winning Career Counselor with extensive experience guiding parents and students through engineering admissions.
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
                Join Paid Group
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
              🔧 <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
