import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "🧭", title: "Scientific Aptitude Test", desc: "Understand strengths, personality and learning style." },
  { icon: "🎯", title: "Career & Course Selection", desc: "Explore best courses, entrance exams and college pathways." },
  { icon: "🤝", title: "Personalized Counselling", desc: "One-on-one sessions for students and parents." },
  { icon: "📈", title: "Exam & College Strategy", desc: "Actionable plan for entrance exams and admissions." },
  { icon: "💬", title: "Doubt Clearing", desc: "Resolve questions about streams, subjects and careers." },
  { icon: "👥", title: "Follow-up Support", desc: "Guidance until decisions are implemented." },
];

export default function Apti1112() {
  const navigate = useNavigate();
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "Career Guidance for 11th & 12th Students";
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
          <img src="/8-12Aptitude-Flayer.jpeg" alt="11th 12th Aptitude Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">

          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Get clarity on courses, exams and college choices with expert guidance.</p>

            <p className="law-desc">
              Students in <strong>11th and 12th standard</strong> face critical academic and career decisions. Abhinav Career Scope helps you discover the best career opportunities based on aptitude, interests and future goals.
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

            <div className="sec-head">Program highlights</div>

            <div className="benefit-grid">
              <div className="b-card">
                <span className="b-icon">🔬</span>
                <h4>Scientific Assessment</h4>
                <p>Professional aptitude & career assessment to map strengths to options.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">🧭</span>
                <h4>Course & Exam Roadmap</h4>
                <p>Clear plan for subject choices, entrance exams and timelines.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">📝</span>
                <h4>Application & Prep Guidance</h4>
                <p>Essay help, form guidance and exam preparation tips where needed.</p>
              </div>
            </div>

            <div className="sec-head">Your mentor</div>

            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  National Award-Winning Career Counselor with extensive experience guiding senior secondary students toward the right academic and career choices.
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
