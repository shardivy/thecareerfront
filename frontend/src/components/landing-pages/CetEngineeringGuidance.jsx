import React, { useState } from "react";
import { WhatsAppOutlined, PhoneOutlined , UserAddOutlined} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./landing.css";

export default function CetEngineeringGuidance() {
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
      "Hello Abhinav Career Scope, I want guidance for CET Engineering Admissions.";

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
          <img src="/Cet-Flayer.jpeg" alt="CET Guidance Flyer" />
        </div>

        {/* RIGHT CONTENT */}
        <div className="law-content-card">

          <div className="law-scroll">

            <h1 className="law-title">
              CET Engineering One-on-One Guidance
            </h1>

            <p className="law-tagline">
              Navigate the CET admission process with confidence 🎓
            </p>

            <p className="law-desc">
              At <strong>Abhinav Career Scope</strong>, we help students and
              parents make informed engineering admission decisions through
              expert one-on-one mentorship after CET results.
            </p>

            <p className="law-desc">
              From understanding cutoffs to choosing the right colleges and
              branches, our guidance ensures that you move ahead with clarity
              and confidence. 🚀
            </p>

            <div className="sec-head">
              What Our Guidance Includes
            </div>

            <div className="benefit-grid">

              <div className="b-card">
                <span className="b-icon">📘</span>
                <h4>Eligibility Mastery</h4>
                <p>
                  Understand eligibility rules and admission criteria for all
                  categories.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">📊</span>
                <h4>Cutoff Analysis</h4>
                <p>
                  Detailed insights into previous cutoffs, trends, and admission
                  patterns.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">🏫</span>
                <h4>Personalized Colleges</h4>
                <p>
                  College and branch suggestions tailored to your percentile and
                  preferences.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">📱</span>
                <h4>Premium Updates</h4>
                <p>
                  Join our WhatsApp group for instant admission alerts and
                  important updates.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">📝</span>
                <h4>Choice Filling Support</h4>
                <p>
                  Smart analysis sheets and expert guidance for better decision
                  making.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">🤝</span>
                <h4>End-to-End Guidance</h4>
                <p>
                  Complete support from registration till final admission and
                  spot rounds.
                </p>
              </div>

            </div>

            <div className="sec-head">
              Why Students Choose Us
            </div>

            <div className="mentor-card">

              <div className="mentor-avatar">
                AC
              </div>

              <div className="mentor-info">
                <h4>18+ Years of Experience</h4>

                <p>
                  With years of expertise in engineering admissions, we help
                  students secure the best possible opportunities through
                  accurate guidance, updated information, and strategic planning.
                </p>

                <span className="award-pill">
                  🏆 Trusted Career Guidance
                </span>
              </div>

            </div>

            <div className="sec-head">
              Important Notes
            </div>

            <ul className="law-desc">
              <li>
                Guidance is personalized according to student performance and
                preferences.
              </li>

              <li>
                Updates regarding CAP rounds, spot rounds, and counselling
                schedules will be shared regularly.
              </li>

              <li>
                Students are encouraged to keep all admission documents ready in
                advance.
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
                  Your engineering future deserves proper planning and expert
                  support. Let us help you make the best decision.
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
                    Bavdhan ,Pune, India
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