import React, { useState } from "react";
import "./landing.css";

export default function Apti812() {
  const [copied, setCopied] = useState(false);

  const phone1 = "+91 992 269 5424";
  const phone2 = "+91 820 803 0557";

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("failed");
    }
  };

  return (
    <div className="container">

      {/* LEFT */}
      <div className="left">
        <div className="flyer-card">
          <img src="/8-12Aptitude-Flayer.jpeg" alt="Aptitude  Flyer" />
        </div>
      </div>

      {/* RIGHT */}
      <div className="right">
        <div className="card">

          {/* 🔽 SCROLLABLE CONTENT */}
          <div className="scroll-content">

            <h1>Career Guidance</h1>

            <p>
              Struggling to navigate the maze of career choices? 🧭 You don't have to do it alone!
            </p>

            <p>
              Whether you are in the 8th grade trying to pick the right stream or a 12th grader standing at the crossroads of your professional future, <b>Abhinav Career Scope</b> is here to light the way. 💡
            </p>

            <h3>🌟 Meet Your Mentor: Reena Bhutada</h3>

            <p>
              Connect with <b>Reena Bhutada</b>, a National Award-Winning Career Counselor, dedicated to helping students break through barriers and discover their true potential. With expert guidance, "feeling stuck" becomes a thing of the past.
            </p>

            <h3>🚀 Our Signature Process</h3>

            <p>
              We believe that every successful career starts with self-discovery. Our comprehensive approach includes:
            </p>

            <div className="list-cards">

              <div className="list-card">
                <b>Scientific Aptitude Testing</b>
                <p>
                  Specifically designed for <b>8th and 12th-grade students</b> to identify core strengths and interests.
                </p>
              </div>

              <div className="list-card">
                <b>Personalized Counselling Sessions</b>
                <p>
                  One-on-one deep dives to translate test results into a concrete, actionable career roadmap.
                </p>
              </div>

            </div><br></br>

            <h3>📞 Get Started Today!</h3>

            <p>
              Don't leave your future to chance. Take the first step toward a career you'll love.
            </p>

            <ul>
              <li>Scan the QR Code in the post to join our WhatsApp Group for regular updates and insights.</li>
            </ul>

          </div>

          {/* 🔽 STICKY FOOTER */}
          <div className="fixed-bottom">

            <div>
              <h3>Call Us Directly</h3>
            </div>

            <div className="phones">
              <button onClick={() => copy(phone1)}>📞 {phone1}</button>
              <button onClick={() => copy(phone2)}>📞 {phone2}</button>
            </div>

            {copied && <div className="copied">Copied!</div>}

            <div className="footer">
              <b>Abhinav Career Scope</b> – Your Perfect Career Guide.
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}