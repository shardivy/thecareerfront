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
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "Law Admission WhatsApp Paid Group";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello Abhinav Career Scope, I want to join the ${defaultPackageName}.`;
    window.open(
      `https://wa.me/91${phone1.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`,
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
            <div className="footer-label">WhatsApp / Call</div>
            <div className="contact-info">
              <div>📞 {phone1} | {phone2}</div>
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
