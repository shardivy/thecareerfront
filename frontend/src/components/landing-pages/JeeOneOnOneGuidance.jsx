import React, { useState } from "react";
import {
  WhatsAppOutlined,
  PhoneOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./landing.css";

export default function JeeOneOnOneGuidance() {
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

  const consultNow = () => {
    const whatsappText =
      "Hello Abhinav Career Scope, I want guidance for JEE Engineering Admissions.";

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
          <img src="/Jee-Flayer.jpeg" alt="JEE Guidance Flyer" />
        </div>

        {/* RIGHT CONTENT */}
        <div className="law-content-card">

          <div className="law-scroll">

            <h1 className="law-title">
              JEE One-on-One Admission Guidance
            </h1>

            <p className="law-tagline">
              Expert personalized support for JEE Main & Advanced admissions 🎓
            </p>

            <p className="law-desc">
              At <strong>Abhinav Career Scope</strong>, we provide strategic
              one-on-one engineering admission guidance for students appearing
              through JEE Main and JEE Advanced counselling processes.
            </p>

            <p className="law-desc">
              With over <strong>18+ years of experience</strong>, we help
              students bridge the gap between their results and their dream
              engineering colleges through smart planning and expert mentorship.
              🚀
            </p>

            <div className="sec-head">
              What Our Guidance Includes
            </div>

            <div className="benefit-grid">

              <div className="b-card">
                <span className="b-icon">📘</span>
                <h4>Eligibility Clarity</h4>
                <p>
                  Understand eligibility criteria for JoSAA, CSAB, NITs, IITs,
                  and various admission categories.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">📊</span>
                <h4>Trend Analysis</h4>
                <p>
                  Get expert insights into previous cutoffs, ranks, and
                  admission trends.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">🏫</span>
                <h4>Targeted Colleges</h4>
                <p>
                  Find the best-fit engineering colleges and branches based on
                  your rank and goals.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">📱</span>
                <h4>WhatsApp Updates</h4>
                <p>
                  Receive premium admission alerts, counselling updates, and
                  important notifications in real time.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">📝</span>
                <h4>Choice Filling Support</h4>
                <p>
                  Get smart analysis sheets and expert guidance for confident
                  choice filling decisions.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">🤝</span>
                <h4>End-to-End Support</h4>
                <p>
                  Complete support from registration to JoSAA and CSAB admission
                  rounds.
                </p>
              </div>

            </div>

            <div className="sec-head">
              Why Students Trust Us
            </div>

            <div className="mentor-card">

              <div className="mentor-avatar">
                AC
              </div>

              <div className="mentor-info">

                <h4>18+ Years of Expertise</h4>

                <p>
                  We combine experience, data-driven counselling, and personal
                  mentorship to help students make informed admission decisions
                  with confidence.
                </p>

                <span className="award-pill">
                  🏆 Trusted Engineering Guidance
                </span>

              </div>

            </div>

            <div className="sec-head">
              Important Notes
            </div>

            <ul className="law-desc">
              <li>
                Guidance is fully personalized according to student rank,
                preferences, and admission goals.
              </li>

              <li>
                Students and parents will receive timely counselling updates and
                important admission information.
              </li>

              <li>
                Keeping all required admission documents ready beforehand is
                highly recommended.
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
                  Your engineering journey deserves the right strategy,
                  mentorship, and expert planning.
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
                    Bavdhan , Pune, India
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
                onClick={consultNow}
              >
                <WhatsAppOutlined className="btn-icon" />
                Consult Now
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