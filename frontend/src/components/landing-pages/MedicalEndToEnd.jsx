import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsAppOutlined, UserAddOutlined } from "@ant-design/icons";
import "./landing.css";

const benefits = [
  { icon: "📘", title: "NEET UG Guidebook", desc: "Your essential manual for the admission journey." },
  { icon: "🎥", title: "Expert Webinars", desc: "Unlimited sessions with industry veterans." },
  { icon: "👩‍⚕️", title: "2 Counselling Sessions", desc: "Tailored advice to match your scores with the best possible options." },
  { icon: "📊", title: "Post-Result Counselling", desc: "Strategy building once the results are out to maximize your chances." },
  { icon: "📝", title: "Application Assistance", desc: "Expert help for AIQ, Deemed Universities, AFMC, AIIMS, and more." },
];

export default function MedicalEndToEnd() {
  const navigate = useNavigate();
  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";
  const defaultPackageName = "Medical End-to-End Admission Guidance";
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
          <img src="/Medical-EndToEnd-Flayer.jpeg" alt="Medical Admission Flyer" />
        </div>

        {/* RIGHT: content card */}
        <div className="law-content-card">
          <div className="law-scroll">
            <h1 className="law-title">{pageTitle}</h1>
            <p className="law-tagline">Abhinav Career Scope — Perfect Career Guide</p>

            <p className="law-desc">
              Navigating the road to a medical degree can be overwhelming, but you don't have to walk it alone! 🩺✨
              <br /><br />
              <strong>Abhinav Career Scope</strong> presents <strong>Medical End-to-End Admission Process Guidance</strong>, a comprehensive resource that simplifies every step from NEET exams to final college allotment.
            </p>

            <div className="sec-head">🏥 Complete Medical Admission Support</div>
            <p className="law-desc">
              We provide a 360-degree approach to ensure you don't miss out on your dream college due to technical errors or lack of information.
            </p>

            <div className="benefit-grid">
              {benefits.map((b) => (
                <div className="b-card" key={b.title}>
                  <span className="b-icon">{b.icon}</span>
                  <h4>{b.title}</h4>
                  <p>{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="sec-head">🌐 Online + Offline Support</div>
            <p className="law-desc">
              Whether you prefer a face-to-face consultation or the convenience of digital support, we’ve got you covered! Join the <strong>hundreds of NEET aspirants</strong> who have already trusted us with their careers.
            </p>

            
            <p className="law-desc">
              Your medical career is a high-stakes journey. Get the professional guidance you deserve.
            </p>
            <p className="law-desc">Scan the QR Code to join our exclusive WhatsApp Group for real-time updates.</p>

            

    

           
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
              🩺 <strong>Abhinav Career Scope</strong> — Perfect Career Guide
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
