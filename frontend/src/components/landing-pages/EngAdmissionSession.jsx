import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "📊", title: "Rank & Percentile Analysis", desc: "Clear interpretation of JEE/CET ranks and realistic college targets." },
  { icon: "🏫", title: "College & Branch Options", desc: "Best-fit colleges and branch suggestions based on your rank." },
  { icon: "🧭", title: "CAP / Counseling Strategy", desc: "Step-by-step guidance for CAP rounds and seat preference strategy." },
  { icon: "📅", title: "Timely Updates", desc: "Notifications for important dates, cutoffs and counseling windows." },
  { icon: "💬", title: "Doubt Clearing", desc: "Live Q&A on seat matrix, quotas and fee structures." },
  { icon: "🤝", title: "Ongoing Support", desc: "Join the WhatsApp group for continuous help until admission." },
];

export default function EngAdmissionSession() {
  const navigate = useNavigate();
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "Expert Engineering Online Session";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello Abhinav Career Scope, I want to book the ${defaultPackageName}.`;
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
          <img src="/Engg-EndToEnd-Flayer.jpeg" alt="Engineering Session Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">

          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Turn your JEE / CET rank into a clear admission roadmap.</p>

            <p className="law-desc">
              Confused about your JEE or CET results? The engineering admission process involves percentiles,
              cutoffs and branch preferences. At <strong>Abhinav Career Scope</strong> we simplify the process and
              provide an actionable plan to help you secure the best possible college for your rank.
            </p>

            <div className="sec-head">What to expect</div>

            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">Session highlights</div>

            <div className="benefit-grid">
              <div className="b-card">
                <span className="b-icon">🔎</span>
                <h4>Rank Interpretation</h4>
                <p>Detailed analysis of your rank and realistic college targets.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">🗂️</span>
                <h4>Preference Strategy</h4>
                <p>How to prioritize branches and colleges during counseling rounds.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">📌</span>
                <h4>Action Plan</h4>
                <p>Next steps, timelines and resources to improve admission chances.</p>
              </div>
            </div>

            <div className="sec-head">Your mentor</div>

            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  Seasoned counselor with deep experience in Maharashtra and national admission cycles,
                  helping students convert ranks into the best possible outcomes.
                </p>
                <span className="award-pill">🏆 Experienced Counselor</span>
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
              🔧 <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
