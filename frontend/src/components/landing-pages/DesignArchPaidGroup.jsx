import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "📅", title: "Important Dates", desc: "Timely alerts for application windows and deadlines." },
  { icon: "📝", title: "Entrance Exam Info", desc: "Updates and guidance for NATA, UCEED and other exams." },
  { icon: "🧭", title: "Option Form Guidance", desc: "Tips for filling option forms and preference strategy." },
  { icon: "❓", title: "Q&A Support", desc: "Clarifications on rules, eligibility and seat allotment." },
  { icon: "📚", title: "Resource Links", desc: "Curated resources, sample papers and preparation tips." },
  { icon: "🤝", title: "Group Support", desc: "Join a focused WhatsApp group for peer and expert help." },
];

export default function DesignArchPaidGroup() {
  const navigate = useNavigate();
  const phone1 = "+91 9922695424";
  const phone2 = "+91 8208030557";
  const defaultPackageName = "Counseling for Design & Architecture";
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
          <img src="/Design-Flayer.jpeg" alt="Design & Architecture Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">

          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Paid Group for B.Arch & B.Des Admission Process — 2025</p>

            <p className="law-desc">
              This group provides important updates and guidance for the 2025 B.Arch & B.Des admission cycle.
              Join for deadlines, exam information, option form tips and focused Q&A support.
            </p>

            <div className="sec-head">What you get</div>

            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">Group Highlights</div>

            <div className="benefit-grid">
              <div className="b-card">
                <span className="b-icon">💸</span>
                <h4>Entry Fees</h4>
                <p>Rs. 2000/- (GPay to 9922695424). Send screenshot after payment for group addition.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">🔒</span>
                <h4>Group Addition Policy</h4>
                <p>One parent number added per payment; multiple additions not allowed.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">👥</span>
                <h4>One-on-One Guidance</h4>
                <p>Available separately for full admission support; charges vary by requirement.</p>
              </div>
            </div>

            <div className="sec-head">Program Duration</div>
            <p className="law-desc">Group remains active until the 2025 B.Arch & B.Des admission process concludes.</p>

            <div className="sec-head">Your Mentor</div>
            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  National Award-Winning Career Counselor with extensive experience guiding students through design and architecture admissions.
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
              🏦 <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
