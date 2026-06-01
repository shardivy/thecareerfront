import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "📰", title: "Monthly GK Updates",  desc: "Curated current affairs to keep you sharp for entrance exams." },
  { icon: "📋", title: "NLU Preference List",  desc: "Tailored NLU ranking based on your profile and goals." },
  { icon: "📝", title: "Form-Filling Help",    desc: "Error-free application guidance across all law colleges." },
  { icon: "📊", title: "Cutoff Insights",      desc: "Latest cutoff trends for NLUs and premier institutions." },
  { icon: "💬", title: "Query Support",        desc: "Expert answers on quotas, fee structures & admissions." },
  { icon: "👥", title: "Community Access",     desc: "Connect with fellow aspirants and stay motivated together." },
];

export default function LawAdmission() {
  const navigate = useNavigate();
  const phone1 = "+91 9922695424";
  const phone2 = "+91 8208030557";
  const defaultPackageName = "Law Admission WhatsApp Paid Group";
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
          <img src="/Law-Flayer.jpeg" alt="Law Admission Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">
          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Abhinav Career Scope — Perfect Career Guide</p>

            <p className="law-desc">
              Ready to advocate for your future? ⚖️✨ The journey to a top National Law University (NLU) or a prestigious law college requires more than just hard work—it requires the right strategy and timely information. 
              <strong> Abhinav Career Scope </strong> is here to guide you every step of the way with our exclusive 
              <strong> Law Admission WhatsApp Paid Group!</strong>
            </p>

            <div className="sec-head">🏛️ Why Join Our Law Admission Group?</div>
            <p className="law-desc">Stay ahead of the competition with curated, expert-led support designed specifically for law aspirants:</p>

            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">🎓 Expert Mentorship</div>
            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  National Award-Winning Career Counselor with over 18 years of experience guiding students in Pune and beyond. 
                  At <strong>Abhinav Career Scope</strong>, we bridge the gap between your academic potential and professional employability.
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
                  Don't navigate the complex legal admission process alone. Join our community for premium updates and expert coaching.
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
              ⚖️ <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
