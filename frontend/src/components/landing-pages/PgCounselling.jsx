import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "🧠", title: "Aptitude Test", desc: "We assess your personality, interests, and strengths to identify the best path for your future career." },
  { icon: "📘", title: "India Options", desc: "Explore a wide range of PG courses across India, with deep dives into curriculum, entrance exams, and top institutions." },
  { icon: "📚", title: "Preparation Resources", desc: "Gain access to curated online resources, mock tests, and proven tips for success." },
  { icon: "💼", title: "Internship & Job Discussion", desc: "Guidance on resume building, interview prep, networking strategies, and career growth opportunities." },
];

export default function PgCounselling() {
  const navigate = useNavigate();
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "PG Counselling Program";
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
          <img src="/PG-Counselling-Flayer.jpeg" alt="PG Counselling Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">
          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Abhinav Career Scope — Structured PG Guidance</p>

            <p className="law-desc">
              Ready to take the next leap in your academic and professional journey? 🎓 
              At <strong>Abhinav Career Scope</strong>, we provide a structured and comprehensive counseling process 
              designed to help you navigate postgraduate studies with ease.
            </p>
            <p className="law-desc">
              Our end-to-end support is built to ensure you find the right fit and excel in your chosen field.
            </p>

            <div className="sec-head">📘 Our PG Counseling Roadmap includes:</div>
            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">📞 Plan Your Future with Experts</div>
            <p className="law-desc">
              Led by a team with over <strong>18 years of experience</strong> in career mentorship, 
              we are committed to bridging the gap between education and employability.
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
