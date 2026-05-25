import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "📅", title: "Critical Timelines", desc: "Stay informed with all Important Dates for registrations, results, and rounds." },
  { icon: "🛣️", title: "Process Roadmap", desc: "Understand complete Admission Process for AIQ, State Quota & Deemed Universities." },
  { icon: "⚙️", title: "Technical Guidance", desc: "Get updates on Exams & Rules with smart Options Form Tips." },
  { icon: "❓", title: "Expert Q&A", desc: "Get answers to questions about cutoffs and college selection." },
];

export default function MedicalNeetGroup() {
  const navigate = useNavigate();
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "NEET Admission WhatsApp Group";
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
          <img src="/Medical-WP-Flayer.jpeg" alt="Medical Admission Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">
          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Abhinav Career Scope — WhatsApp Paid Group</p>

            <p className="law-desc">
              Your medical career is a high-stakes journey—don't leave it to chance! 🩺✨ 
              Navigating the NEET UG counseling process can be complex, but <strong>Abhinav Career Scope</strong> 
              is here to ensure you stay ahead with our specialized <strong>Admission WhatsApp Paid Group for NEET!</strong>
            </p>
            <p className="law-desc">
              Join a community of focused aspirants and receive real-time updates directly from experts 
              to secure your dream seat in the medical field.
            </p>

            <div className="sec-head">🏥 Why Join Our Medical Admission Group?</div>
            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">💼 Expert Mentorship</div>
            <p className="law-desc">
              Led by <strong>Reena Bhutada</strong>, a National Award-Winning Career Counselor with over <strong>18 years of experience</strong>, 
              Abhinav Career Scope is dedicated to bridging the gap between education and employability. 
              We are your "Perfect Career Guide" from Bavdhan, Pune, helping students across India achieve their medical aspirations.
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
              🩺 <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
