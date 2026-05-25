import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

export default function AdmissionCounselling() {
  const navigate = useNavigate();

  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const orgName = "Abhinav Career Scope, Pune";
  const defaultPackageName = "Expert Engineering Online Session";
  const [pageTitle, setPageTitle] = useState(defaultPackageName);

  const bookCounselling = () => {
    setPageTitle(defaultPackageName);
    const whatsappText = `Hello ${orgName}, I want to book the ${defaultPackageName}.`;
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
        {/* LEFT: floating image card */}
        <div className="law-image-card">
          <img
            src="/Engg-EndToEnd-Flayer.jpeg"
            alt="Admission Counselling Flyer"
          />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">
          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">
              Confused about your JEE or CET results? 🧱 Turn your rank into a
              roadmap with our <strong>Expert Engineering Online Session</strong>!
            </p>

            <p className="law-desc">
              The engineering admission process can be a complex puzzle of
              percentiles, cutoffs, and branch preferences. At{" "}
              <strong>Abhinav Career Scope</strong>, we simplify the process so
              you can secure the best possible college based on your
              performance. 🚀
            </p>

            <div className="sec-head">What to Expect in This Single Session</div>

            <div className="benefit-grid">
              <div className="b-card">
                <span className="b-icon">📊</span>
                <h4>Percentile & Rank Discussion</h4>
                <p>
                  Understand where you stand in the current competitive
                  landscape.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">🏫</span>
                <h4>College & Branch Options</h4>
                <p>
                  Explore the best institutions and engineering streams that
                  align with your rank.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">❓</span>
                <h4>Admission Process Q&A</h4>
                <p>
                  Get your technical doubts cleared regarding the CAP rounds and
                  counseling procedures.
                </p>
              </div>

              <div className="b-card">
                <span className="b-icon">💬</span>
                <h4>Ongoing Support</h4>
                <p>
                  One parent will be added to our exclusive{" "}
                  <strong>Engineering Admission WhatsApp Group</strong>,
                  providing updates and community support until the admission
                  process is complete!
                </p>
              </div>
            </div>

            <div className="sec-head">Guided by</div>

            <div className="mentor-card">
              <div className="mentor-avatar">RB</div>
              <div className="mentor-info">
                <h4>Reena Bhutada</h4>
                <p>
                  Learn from a seasoned expert who understands the nuances of
                  the Maharashtra and National engineering admission cycles. We
                  help you make informed decisions that set the foundation for
                  your professional career.
                </p>
                <span className="award-pill">🏆 Experienced Counselor</span>
              </div>
            </div>

            <div className="sec-head">Important Notes</div>
            <ul className="law-desc">
              <li>
                This is a focused, single-session intervention. Please note that
                post-session calls are not available.
              </li>
              <li>
                While we discuss ranks, technical rank/percentile analysis is
                not conducted during the session; students and parents are
                encouraged to perform this independently.
              </li>
            </ul>

           
             

  
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

            <div className="footer-brand" style={{ marginTop: 10 }}>
              <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
