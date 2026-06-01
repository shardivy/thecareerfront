import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

export default function Apti10() {
  const navigate = useNavigate();
  const phone1 = "+91 9922695424";
  const phone2 = "+91 8208030557";
  const orgName = "Abhinav Career Scope, Pune";
  const defaultPackageName = "Aptitude Test Of 10th Std (5k)";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello ${orgName}, I want to book the Aptitude Test (10th-12th).`;
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
          <img src="/8-12Aptitude-Flayer.jpeg" alt="Aptitude Test Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">

          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>

            <p className="law-desc">
              The aptitude test can be completed online from home using a laptop or computer with an internet connection. You will receive a test link via email. The test takes approximately 2 hours and requires no prior preparation.
            </p>

            <p className="law-desc">
              All questions are objective, and there is no pass or fail — it’s designed for students of ICSE, IB, CBSE, and State Boards.
            </p>

            <div className="sec-head">Important Steps</div>

            <div className="benefit-grid">
              <div className="b-card">
                <span className="b-icon">📌</span>
                <h4>Complete Sections</h4>
                <p>Aptitude, Interest, Study Habits, Aspired Career & Personality Test.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">📄</span>
                <h4>Report Generation</h4>
                <p>Color report generated within 3–4 days after completion.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">📅</span>
                <h4>Session Booking</h4>
                <p>Counseling scheduled based on available time slots.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">✅</span>
                <h4>No Preparation Needed</h4>
                <p>Simple objective test designed for all boards.</p>
              </div>
            </div>

            <div className="sec-head">Counseling Procedure</div>

            <div className="benefit-grid">
              <div className="b-card">
                <span className="b-icon">🔎</span>
                <h4>Report Explanation</h4>
                <p>Detailed explanation of aptitude report.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">🎯</span>
                <h4>Goal Understanding</h4>
                <p>Discussion with students & parents.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">❓</span>
                <h4>Doubt Solving</h4>
                <p>Clear confusion about career choices.</p>
              </div>

              <div className="b-card">
                <span className="b-icon">🧭</span>
                <h4>Career Guidance</h4>
                <p>Stream, exams, colleges, strategy & more.</p>
              </div>
            </div>

            <div className="sec-head">Fee Structure</div>

            <div className="law-desc">
              <p>Online Aptitude Test + Color Report + 1.5 hr Counseling: <strong>₹5,000</strong></p>
              <ul>
                <li>Offline: ₹500 Registration + ₹4.5k during counseling</li>
                <li>Online: ₹5k paid at registration</li>
              </ul>
              <p>Payment via Google Pay to <strong>9922695424</strong>. Share screenshot after payment.</p>
            </div>

            <div className="sec-head">Note</div>
            <p className="law-desc">Aptitude Test Report will be shared on WhatsApp after the counseling session.</p>

            <div className="sec-head">Contact</div>
            <div className="law-desc">
              <p>🏦 {orgName}</p>
              <p>📞 {phone1} / {phone2}</p>
            </div>

            <div className="sec-head">Your Counselor</div>
            <div className="mentor-card">
              <div className="mentor-avatar">AC</div>
              <div className="mentor-info">
                <h4>Abhinav Career Scope</h4>
                <p>Experienced counselors providing personalized strategies, report interpretation and follow-up support.</p>
                <span className="award-pill">🌟 Trusted Career Partner</span>
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
