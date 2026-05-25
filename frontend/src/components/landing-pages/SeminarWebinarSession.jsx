import React, { useState } from "react";
import {
  WhatsAppOutlined,
  PhoneOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./landing.css";

export default function SeminarWebinarSession() {
    const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Failed to copy");
    }
  };

  const bookSession = () => {
    const whatsappText =
      "Hello Abhinav Career Scope, I want to know more about your Seminar & Webinar Sessions.";

    window.open(
      `https://wa.me/${phone1.replace(/\D/g, "")}?text=${encodeURIComponent(
        whatsappText
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="law-page">
      <div className="law-wrapper">

        {/* LEFT IMAGE */}
        <div className="law-image-card">
          <img
            src="/Seminar-Flayer.jpeg"
            alt="Seminar Webinar Flyer"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div className="law-content-card">

          <div className="law-scroll">

            <h1 className="law-title">
              Seminar & Webinar Sessions
            </h1>

            <p className="law-tagline">
              Career awareness sessions designed to inspire and guide students 🌟
            </p>

            <p className="law-desc">
              At <strong>Abhinav Career Scope</strong>, we conduct engaging
              offline seminars and online webinars that help students and
              parents make informed academic and career decisions.
            </p>

            <p className="law-desc">
              These sessions are specially designed for school and junior
              college students across all education boards, helping them build
              clarity, confidence, and direction for the future. 🚀
            </p>

            <div className="sec-head">
              Key Topics We Cover
            </div>

            <div className="benefit-grid">

              <div className="b-card">
                <span className="b-icon">🎓</span>
                <h4>Life After 10th & 12th</h4>
                <p>
                  Explore multiple career pathways and discover opportunities
                  aligned with your interests and strengths.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">📚</span>
                <h4>Effective Study Habits</h4>
                <p>
                  Learn practical techniques and study strategies for academic
                  success and better focus.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">🧠</span>
                <h4>Career Awareness</h4>
                <p>
                  Gain exposure to emerging career options, entrance exams, and
                  future opportunities.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">🌟</span>
                <h4>Motivation & Guidance</h4>
                <p>
                  Interactive sessions that inspire students to set goals and
                  build confidence in their journey.
                </p>
              </div>

            </div>

            <div className="sec-head">
              Meet Your Mentor
            </div>

            <div className="mentor-card">

              <div className="mentor-avatar">
                RB
              </div>

              <div className="mentor-info">

                <h4>Reena Bhutada</h4>

                <p>
                  National Award-Winning Career Counselor with over
                  <strong> 18+ years of experience</strong> helping students
                  bridge the gap between education and employability through
                  expert counselling and mentorship.
                </p>

                <span className="award-pill">
                  🏆 National Award-Winning Counselor
                </span>

              </div>

            </div>

            <div className="sec-head">
              Why Attend Our Sessions
            </div>

            <ul className="law-desc">
              <li>
                Sessions are suitable for students from all education boards.
              </li>

              <li>
                Interactive guidance designed for both students and parents.
              </li>

              <li>
                Available in both offline seminar and online webinar formats.
              </li>

              <li>
                Helps students plan academic and career goals confidently.
              </li>
            </ul>

          </div>

          {/* FOOTER */}
          <div className="law-footer">

            <div className="contact-section">

              <div className="contact-section-header">

                <p className="contact-eyebrow">
                  📞 Connect With Us Today
                </p>

                <p className="contact-copy">
                  Your future starts with the right guidance, awareness, and
                  informed decisions.
                </p>

              </div>

              <div className="contact-details">

                <div className="contact-item">

                  <span className="contact-label">
                    WhatsApp / Call
                  </span>

                  <span
                    className="contact-value"
                    onClick={() => copy(phone1)}
                    style={{ cursor: "pointer" }}
                  >
                    <PhoneOutlined /> {phone1}
                  </span>

                  <span
                    className="contact-value"
                    onClick={() => copy(phone2)}
                    style={{ cursor: "pointer" }}
                  >
                    <PhoneOutlined /> {phone2}
                  </span>

                </div>

                <div className="contact-item">

                  <span className="contact-label">
                    Location
                  </span>

                  <span className="contact-value">
                    Bavdhan, Pune
                  </span>

                </div>

              </div>

              {copied && (
                <div className="copied-toast show">
                  Number copied!
                </div>
              )}

            </div>

            <div className="btn-row">

              <button
                className="book-btn"
                onClick={bookSession}
              >
                <WhatsAppOutlined className="btn-icon" />
                Book Session
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