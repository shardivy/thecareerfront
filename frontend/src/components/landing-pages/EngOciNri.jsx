import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "📑", title: "Document Verification", desc: "Check all your documents NOW to ensure anything missing can be completed well before critical deadlines." },
  { icon: "🛣️", title: "Process Roadmap", desc: "Get a clear, detailed timeline of the entire admission process to stay ahead of the curve." },
  { icon: "🏫", title: "College Insights", desc: "Explore all available options for colleges that cater to your specific quota and academic goals." },
  { icon: "🎯", title: "Strategic Prioritization", desc: "Learn how to prioritize your choices based on results, preferred city, state, and your specific budget." },
  { icon: "⏱️", title: "Real-Time Support", desc: "Stay updated with the latest instructions and ensure you are available for every critical step of the cycle." },
];

export default function EngOciNri() {
  const navigate = useNavigate();
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "NRI / OCI / CIWG / PIO Engineering Admission 2026";
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
          <img src="/OCI-NRI-Flayer.jpeg" alt="NRI Admission Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">
          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Abhinav Career Scope — WhatsApp Paid Group</p>

            <p className="law-desc">
              Attention all OCI, NRI, CIWG, and PIO engineering aspirants! 🎓✨ Navigating the 2026 admission cycle requires precision, timing, and expert knowledge. 
              <strong> Abhinav Career Scope </strong> is here to ensure your journey to a top engineering college is smooth and successful with our exclusive 
              <strong> Admission WhatsApp Paid Group!</strong>
            </p>

            <div className="sec-head">🚀 Why Join Our Specialized 2026 Admission Group?</div>
            <p className="law-desc">We provide comprehensive support tailored to the unique needs of international and non-resident Indian students:</p>

            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">💼 Professional Mentorship</div>
            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  National Award-Winning Career Counselor with over 18 years of experience in career counseling and student advocacy, 
                  specializing in bridging the gap between global education and employability.
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
              🎓 <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
