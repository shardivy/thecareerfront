import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "🎯", title: "Personalized Roadmap", desc: "Tailored admission plan aligned to your goals and target universities." },
  { icon: "🧭", title: "End-to-end Support", desc: "From inquiry to enrollment — continuous guidance at every step." },
  { icon: "📚", title: "Test Prep Resources", desc: "Guidance & resources for SAT, ACT, TOEFL, IELTS and more." },
  { icon: "📝", title: "Application Assistance", desc: "Help with essays, forms, and document preparation for each university." },
  { icon: "🌍", title: "Global Admission Insights", desc: "Comprehensive knowledge of procedures, criteria, and trends worldwide." },
  { icon: "🤝", title: "Post-Admission Support", desc: "Enrollment follow-up, pre-departure briefings and ongoing help." },
];

export default function AbroadCounselling() {
  const navigate = useNavigate();
  const phone1 = "+91 9922695424";
  const phone2 = "+91 8208030557";
  const orgName = "Abhinav Career Scope, Pune";
  const defaultPackageName = "Abroad Admission Counselling";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello ${orgName}, I want to book counselling for ${defaultPackageName}.`;
    window.open(
      `https://wa.me/${phone1.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="law-page abroad-page">
      <div className="law-wrapper">

        {/* LEFT: floating image card */}
        <div className="law-image-card">
          <img src="/Abroad-Counselling-Flayer.jpeg" alt="Abroad Admission Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">

          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Providing Continuous Support From Inquiry To Enrollment & Beyond.</p>

            <div className="law-desc">
              <p>Providing Personalized Support Tailored To Individual Goals & Aspirations.</p>
              <p>Guidance & Resources For Standardized Tests Like SAT, ACT, TOEFL, & IELTS.</p>
              <p>Assistance With Application Completion, Essay Writing, & Document Preparation.</p>
              <p>Comprehensive Knowledge Of Global Admission Procedures, Criteria, & Patterns.</p>
              {/* <p className="join-cta">Join now to make your admission journey seamless and informed!</p>

              <div className="contact-block mt-4">
                <div className="org-name">🏦 {orgName}</div>
                <div className="org-phones">📞 {phone1} / {phone2}</div>
              </div> */}
            </div>

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

            <div className="sec-head">Your counselor</div>

            <div className="mentor-card">
              <div className="mentor-avatar">AC</div>
              <div className="mentor-info">
                <h4>Abhinav Career Scope</h4>
                <p>
                  Experienced international admissions counselors providing personalized strategies,
                  document review and interview prep to maximize your chances.
                </p>
                <span className="award-pill">🌟 Trusted Overseas Admissions Partner</span>
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
