import React, { useState, useEffect } from "react";
import { Card, Button, Typography, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { startReviewByStudent, submitReviewByStudent, getReviewStatus  } from "../../../adminSlices/reviewSlice";

const { Title, Text } = Typography;

const GOOGLE_REVIEW_URL =
  "https://g.page/Abhinav-career-scope-pune/review?np";

const suggestions = [
  "Great career guidance and very helpful counselors!",
  "Amazing experience, helped me choose the right path.",
  "Highly recommended for students looking for career clarity.",
  "Very professional and supportive team.",
  "The aptitude test and counseling were very helpful!",
];

const WriteReview = () => {
//   const [hasVisitedGoogle, setHasVisitedGoogle] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
  const [reviewId, setReviewId] = useState(null);

  
  const dispatch = useDispatch();

const { loading, submitLoading } = useSelector((state) => state.review);
const { reviewStatus, statusLoading } = useSelector((state) => state.review);
  const status = reviewStatus?.review_status;

  
const handleWriteOwnReview = async () => {
  await handleSuggestionClick(""); // Reuse the same logic
};


//   useEffect(() => {
//     const visited = localStorage.getItem("visitedGoogleReview");
//     const done = localStorage.getItem("reviewSubmitted");

//     if (visited) setHasVisitedGoogle(true);
//     if (done) setSubmitted(true);
//   }, []);

const handleSuggestionClick = async (text) => {
  try {
    const studentId = Number(localStorage.getItem("studentId"));

    const res = await dispatch(
      startReviewByStudent({ student_id: studentId })
    ).unwrap();

    const id = res?.review_id;
    setReviewId(id);

    // ✅ Show message first
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        message.success("Review copied! Now just paste it on Google and submit your review... ⭐");
      } catch (err) {
        message.warning("Copy failed, please copy manually");
      }
    } else {
      message.success("Redirecting to Google... ⭐");
    }

    // ✅ Delay everything (navigation + status update)
    setTimeout(() => {
      window.open(GOOGLE_REVIEW_URL, "_blank");

      // 🔥 NOW update status AFTER navigation
      dispatch(getReviewStatus(studentId));

    }, 3500);

  } catch (err) {
    message.error("Failed to start review process");
  }
};
const handleSubmitted = async () => {
  try {
    if (!reviewId) {
      message.error("Review ID not found");
      return;
    }

    await dispatch(submitReviewByStudent(reviewId)).unwrap();

    const studentId = Number(localStorage.getItem("studentId"));

    // ✅ Refresh status again
    dispatch(getReviewStatus(studentId));

    message.success("Thank you for your review! 🙌");
  } catch (err) {
    message.error("Failed to submit review");
  }
};

useEffect(() => {
  const studentId = Number(localStorage.getItem("studentId"));

  if (studentId) {
    dispatch(getReviewStatus(studentId));
  }
}, [dispatch]);

useEffect(() => {
  if (reviewStatus) {
    const status = reviewStatus?.review_status;
    const id = reviewStatus?.review_id;

    if (id) {
      localStorage.setItem("reviewId", String(id)); // ✅ store automatically
      setReviewId(id);
    }

   
  }
}, [reviewStatus]);

  return (
    <div
      style={{
        // minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // background:
        //   "linear-gradient(135deg, #d1e0e0, #f0f7f7, #e6f2f2)",
        fontFamily: "Times New Roman, serif",
        padding: 10,
      }}
    >
     <Card
  style={{
    width: "100%",
    maxWidth: 520,
    borderRadius: 20,
    backdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.7)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.3)",
  }}
>
  {/* ✅ SHOW EVERYTHING ONLY IF NOT SUBMITTED */}
{status !== "submitted" && (
    <>
      {/* STEP 1 */}
      {status !== "in_process" && (
        <>
          {/* TITLE */}
          <Title
            level={3}
            style={{
              textAlign: "center",
              background: "linear-gradient(135deg, #ff7a45, #d946ef)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: 26,
              fontWeight: "800",
              animation: "slideInDown 0.6s ease-out",
            }}
          >
            ⭐ Write a Review
          </Title>

          {/* DESCRIPTION 1 */}
          <Text
            style={{
              textAlign: "center",
              display: "block",
              animation: "slideInUp 0.6s ease-out 0.15s both",
              fontSize: 14,
              color: "#666",
              fontWeight: "500",
            }}
          >
            Your feedback helps us improve and guide more students
          </Text>

          {/* DESCRIPTION 2 */}
          <Text
            style={{
              textAlign: "center",
              display: "block",
              animation: "slideInUp 0.6s ease-out 0.3s both",
              fontSize: 14,
              color: "#333",
              fontWeight: "600",
              marginBottom: 15,
            }}
          >
            Pick a review or write your own ✍️
          </Text>

          {/* SUGGESTIONS LIST WITH STAGGERED ANIMATION */}
          <div style={{ marginTop: 20 }}>
            {suggestions.map((item, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(item)}
                style={{
                  marginBottom: 12,
                  padding: 14,
                  borderRadius: 12,
                  cursor: "pointer",
                  background: "#ffffff",
                  border: "2px solid #e6e6e6",
                  transition: "all 0.3s ease",
                  animation: `slideInLeft 0.5s ease-out ${0.4 + index * 0.1}s both`,
                  fontSize: 13,
                  fontWeight: "500",
                  color: "#444",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(8px) scale(1.02)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(255, 122, 69, 0.2)";
                  e.currentTarget.style.borderColor = "#ff7a45";
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 122, 69, 0.05), rgba(217, 70, 239, 0.05))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0) scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e6e6e6";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                {item}
              </div>
            ))}
          </div>

          {/* WRITE OWN BUTTON WITH ANIMATION */}
      <Button
  block
  style={{
    marginTop: 15,
    height: "auto", // ✅ important for multi-line
    minHeight: 50,
    borderRadius: 12,
    fontWeight: "bold",
    fontSize: 16,
    background: "linear-gradient(135deg, #1E40AF, #022933)",
    color: "#fff",
    border: "none",
    boxShadow: "0 8px 20px rgba(33, 147, 176, 0.3)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    animation: "slideInUp 0.6s ease-out 0.9s both",
    whiteSpace: "normal", // ✅ allow wrapping
    textAlign: "center",
    lineHeight: "1.4",
    padding: "10px 12px",
  }}
  className="responsive-review-btn"
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-3px)";
    e.currentTarget.style.boxShadow =
      "0 12px 30px rgba(33, 147, 176, 0.5)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "0 8px 20px rgba(33, 147, 176, 0.3)";
  }}
  onClick={handleWriteOwnReview}
  loading={loading}
>
  <span className="btn-text">
    ✍️ Write My Own Review
  </span>
</Button>

          {/* ANIMATIONS */}
          <style>
            {`
              @keyframes slideInDown {
                from {
                  opacity: 0;
                  transform: translateY(-30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              @keyframes slideInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              @keyframes slideInLeft {
                from {
                  opacity: 0;
                  transform: translateX(-30px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
            `}
          </style>
        </>
      )}

      {/* STEP 2 */}
     {status === "in_process" && (
        <div style={{ textAlign: "center", marginTop: 20, animation: "slideDown 0.5s ease" }}>
          {/* ICON */}
          <div style={{ fontSize: 60, marginBottom: 15, animation: "bounce 2s infinite" }}>
            ⭐
          </div>

          {/* TITLE */}
          <Title
            level={3}
            style={{
              marginBottom: 8,
              background: "linear-gradient(135deg, #ff7a45, #d946ef)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: 24,
              fontWeight: "800",
            }}
          >
            Did you submit your review?
          </Title>

          {/* DESCRIPTION */}
          <Text
            style={{
              textAlign: "center",
              display: "block",
              fontSize: 14,
              color: "#666",
              marginBottom: 25,
              fontStyle: "italic",
            }}
          >
            Your feedback makes a huge difference! 💫
          </Text>

          {/* BUTTON WITH HOVER EFFECT */}
        <Button
  block
  style={{
    height: "auto", // ✅ allow multi-line
    minHeight: 50,
    borderRadius: 15,
    fontWeight: "bold",
    fontSize: 16,
    background: "linear-gradient(135deg, #56ab2f, #a8e063)",
    color: "#fff",
    border: "none",
    boxShadow: "0 8px 20px rgba(86, 171, 47, 0.3)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    whiteSpace: "normal", // ✅ enable wrapping
    textAlign: "center",
    lineHeight: "1.4",
    padding: "10px 12px",
  }}
  className="responsive-submit-btn"
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-3px)";
    e.currentTarget.style.boxShadow =
      "0 12px 30px rgba(86, 171, 47, 0.5)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "0 8px 20px rgba(86, 171, 47, 0.3)";
  }}
  onClick={handleSubmitted}
  loading={submitLoading}
>
  <span className="btn-text">
    ✅ Yes, I Submitted My Review
  </span>
</Button>

          {/* ANIMATIONS */}
          <style>
            {`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes slideDown {
                from { 
                  opacity: 0;
                  transform: translateY(-20px);
                }
                to { 
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>
        </div>
      )}
    </>
  )}

  {/* ✅ ONLY THANK YOU */}
{status === "submitted" && (
  <div
    style={{
      textAlign: "center",
      padding: "40px 20px",
      margin: "-24px",
      borderRadius: 20, 
      background: "linear-gradient(135deg, #e6fffb, #f6ffed, #ffffff)",
      animation: "fadeInScale 0.7s ease-out",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* DECORATIVE BACKGROUND ELEMENTS */}
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        fontSize: 40,
        opacity: 0.1,
        animation: "float 4s ease-in-out infinite",
      }}
    >
      ⭐
    </div>
    <div
      style={{
        position: "absolute",
        bottom: 30,
        right: 20,
        fontSize: 35,
        opacity: 0.1,
        animation: "float 5s ease-in-out infinite 0.5s",
      }}
    >
      ✨
    </div>

    {/* ICON */}
    <div
      style={{
        fontSize: 70,
        marginBottom: 15,
        animation: "pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        position: "relative",
        zIndex: 1,
      }}
    >
      🎉
    </div>

    {/* CONFETTI PARTICLES */}
    <div style={{ position: "relative", height: 0 }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            fontSize: "20px",
            animation: `confetti ${2 + i * 0.3}s ease-out forwards`,
            animationDelay: `${i * 0.1}s`,
            left: `${15 + i * 12}%`,
            top: "-20px",
          }}
        >
          {["🎊", "⭐", "✨", "🌟", "💫", "🎯"][i]}
        </div>
      ))}
    </div>

    {/* TITLE */}
    <Title
      level={3}
      style={{
        marginBottom: 8,
        background: "linear-gradient(135deg, #389e0d, #73d13d)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontSize: 28,
        fontWeight: "800",
        animation: "slideInDown 0.8s ease-out 0.2s both",
      }}
    >
      Thank You for Your Review!
    </Title>

    {/* MESSAGE */}
    <Text
      style={{
        fontSize: 15,
        color: "#444",
        display: "block",
        animation: "slideInUp 0.8s ease-out 0.4s both",
        fontWeight: "500",
      }}
    >
      Your feedback helps us improve and guide more students 🙌
    </Text>

    {/* HEART ANIMATION */}
    <div
      style={{
        marginTop: 15,
        animation: "pulse 2s ease-in-out infinite 0.6s",
      }}
    >
      <Text style={{ fontSize: 12, color: "#888", animation: "slideInUp 0.8s ease-out 0.6s both", display: "block" }}>
        💚 We truly appreciate your support
      </Text>
    </div>

    {/* ANIMATION KEYFRAMES */}
    <style>
      {`
        @keyframes pop {
          0% { 
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.15) rotate(10deg);
          }
          100% { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        @keyframes confetti {
          0% {
            opacity: 1;
            transform: translateY(0) rotateZ(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(400px) rotateZ(720deg);
          }
        }
      `}
    </style>
  </div>
)}
</Card>
    </div>
  );
};

export default WriteReview;

// import React, { useState, useEffect } from "react";
// import { Card, Button, Typography, message } from "antd";

// const { Title, Text } = Typography;

// const GOOGLE_REVIEW_URL =
//   "https://g.page/Abhinav-career-scope-pune/review?np";

// const suggestions = [
//   "Great career guidance and very helpful counselors!",
//   "Amazing experience, helped me choose the right path.",
//   "Highly recommended for students looking for career clarity.",
//   "Very professional and supportive team.",
//   "The aptitude test and counseling were बेहद helpful!",
// ];

// const WriteReview = () => {
//   const [hasVisitedGoogle, setHasVisitedGoogle] = useState(false);
//   const [submitted, setSubmitted] = useState(false);

//   useEffect(() => {
//     const visited = localStorage.getItem("visitedGoogleReview");
//     const done = localStorage.getItem("reviewSubmitted");

//     if (visited) setHasVisitedGoogle(true);
//     if (done) setSubmitted(true);
//   }, []);

// const handleSuggestionClick = (text) => {
//   if (text) {
//     navigator.clipboard.writeText(text);
//   }

//   message.success(
//     "Review copied! Now paste it on Google 🙌",
//     3, // duration (seconds)
//     () => {
//       // ✅ After message disappears → change UI
//       window.open(GOOGLE_REVIEW_URL, "_blank");

//       localStorage.setItem("visitedGoogleReview", "true");
//       setHasVisitedGoogle(true);
//     }
//   );
// };

//   const handleSubmitted = () => {
//     localStorage.setItem("reviewSubmitted", "true");
//     setSubmitted(true);
//     message.success("Thank you for your review! 🙌");
//   };

//   return (
//     <div
//       style={{
//         // minHeight: "100vh",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         // background:
//         //   "linear-gradient(135deg, #d1e0e0, #f0f7f7, #e6f2f2)",
//         fontFamily: "Times New Roman, serif",
//         padding: 10,
//       }}
//     >
//      <Card
//   style={{
//     width: "100%",
//     maxWidth: 520,
//     borderRadius: 20,
//     backdropFilter: "blur(12px)",
//     background: "rgba(255,255,255,0.7)",
//     boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
//     border: "1px solid rgba(255,255,255,0.3)",
//   }}
// >
//   {/* ✅ SHOW EVERYTHING ONLY IF NOT SUBMITTED */}
//   {!submitted && (
//     <>
//       {/* STEP 1 */}
//       {!hasVisitedGoogle && (
//         <>
//           <Title level={3} style={{ textAlign: "center" }}>
//             ⭐ Write a Review
//           </Title>

//           <Text style={{ textAlign: "center", display: "block" }}>
//             Your feedback helps us improve and guide more students
//           </Text>

//           <Text style={{ textAlign: "center", display: "block" }}>
//             Pick a review or write your own ✍️
//           </Text>

//           <div style={{ marginTop: 20 }}>
//             {suggestions.map((item, index) => (
//               <div
//                 key={index}
//                 onClick={() => handleSuggestionClick(item)}
//                 style={{
//                   marginBottom: 12,
//                   padding: 14,
//                   borderRadius: 12,
//                   cursor: "pointer",
//                   background: "#ffffff",
//                   border: "1px solid #e6e6e6",
//                   transition: "all 0.3s ease",
//                 }}
//                 onMouseEnter={(e) => {
//                   e.currentTarget.style.transform = "scale(1.03)";
//                   e.currentTarget.style.boxShadow =
//                     "0 6px 18px rgba(0,0,0,0.1)";
//                 }}
//                 onMouseLeave={(e) => {
//                   e.currentTarget.style.transform = "scale(1)";
//                   e.currentTarget.style.boxShadow = "none";
//                 }}
//               >
//                 {item}
//               </div>
//             ))}
//           </div>

//           <Button
//             block
//             style={{
//               marginTop: 10,
//               height: 45,
//               borderRadius: 10,
//               fontWeight: "bold",
//               background: "linear-gradient(135deg, #02062f, #2193b0)",
//               color: "#fff",
//               border: "none",
//             }}
//             onClick={() => handleSuggestionClick("")}
//           >
//             ✍️ Write My Own Review
//           </Button>
//         </>
//       )}

//       {/* STEP 2 */}
//       {hasVisitedGoogle && (
//         <div style={{ textAlign: "center", marginTop: 20, animation: "slideDown 0.5s ease" }}>
//           {/* ICON */}
//           <div style={{ fontSize: 60, marginBottom: 15, animation: "bounce 2s infinite" }}>
//             ⭐
//           </div>

//           {/* TITLE */}
//           <Title
//             level={3}
//             style={{
//               marginBottom: 8,
//               background: "linear-gradient(135deg, #ff7a45, #d946ef)",
//               WebkitBackgroundClip: "text",
//               WebkitTextFillColor: "transparent",
//               fontSize: 24,
//               fontWeight: "800",
//             }}
//           >
//             Did you submit your review?
//           </Title>

//           {/* DESCRIPTION */}
//           <Text
//             style={{
//               textAlign: "center",
//               display: "block",
//               fontSize: 14,
//               color: "#666",
//               marginBottom: 25,
//               fontStyle: "italic",
//             }}
//           >
//             Your feedback makes a huge difference! 💫
//           </Text>

//           {/* BUTTON WITH HOVER EFFECT */}
//           <Button
//             block
//             style={{
//               height: 50,
//               borderRadius: 15,
//               fontWeight: "bold",
//               fontSize: 16,
//               background: "linear-gradient(135deg, #56ab2f, #a8e063)",
//               color: "#fff",
//               border: "none",
//               boxShadow: "0 8px 20px rgba(86, 171, 47, 0.3)",
//               transition: "all 0.3s ease",
//               cursor: "pointer",
//             }}
//             onMouseEnter={(e) => {
//               e.currentTarget.style.transform = "translateY(-3px)";
//               e.currentTarget.style.boxShadow =
//                 "0 12px 30px rgba(86, 171, 47, 0.5)";
//             }}
//             onMouseLeave={(e) => {
//               e.currentTarget.style.transform = "translateY(0)";
//               e.currentTarget.style.boxShadow =
//                 "0 8px 20px rgba(86, 171, 47, 0.3)";
//             }}
//             onClick={handleSubmitted}
//           >
//             ✅ Yes, I Submitted My Review
//           </Button>

//           {/* ANIMATIONS */}
//           <style>
//             {`
//               @keyframes bounce {
//                 0%, 100% { transform: translateY(0); }
//                 50% { transform: translateY(-10px); }
//               }
//               @keyframes slideDown {
//                 from { 
//                   opacity: 0;
//                   transform: translateY(-20px);
//                 }
//                 to { 
//                   opacity: 1;
//                   transform: translateY(0);
//                 }
//               }
//             `}
//           </style>
//         </div>
//       )}
//     </>
//   )}

//   {/* ✅ ONLY THANK YOU */}
// {submitted && (
//   <div
//     style={{
//       textAlign: "center",
//       padding: "40px 20px",
//       margin: "-24px",
//       borderRadius: 20, 
//       background: "linear-gradient(135deg, #e6fffb, #f6ffed, #ffffff)",
//       animation: "fadeInScale 0.7s ease-out",
//       position: "relative",
//       overflow: "hidden",
//     }}
//   >
//     {/* DECORATIVE BACKGROUND ELEMENTS */}
//     <div
//       style={{
//         position: "absolute",
//         top: 20,
//         left: 20,
//         fontSize: 40,
//         opacity: 0.1,
//         animation: "float 4s ease-in-out infinite",
//       }}
//     >
//       ⭐
//     </div>
//     <div
//       style={{
//         position: "absolute",
//         bottom: 30,
//         right: 20,
//         fontSize: 35,
//         opacity: 0.1,
//         animation: "float 5s ease-in-out infinite 0.5s",
//       }}
//     >
//       ✨
//     </div>

//     {/* ICON */}
//     <div
//       style={{
//         fontSize: 70,
//         marginBottom: 15,
//         animation: "pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
//         position: "relative",
//         zIndex: 1,
//       }}
//     >
//       🎉
//     </div>

//     {/* CONFETTI PARTICLES */}
//     <div style={{ position: "relative", height: 0 }}>
//       {[...Array(6)].map((_, i) => (
//         <div
//           key={i}
//           style={{
//             position: "absolute",
//             fontSize: "20px",
//             animation: `confetti ${2 + i * 0.3}s ease-out forwards`,
//             animationDelay: `${i * 0.1}s`,
//             left: `${15 + i * 12}%`,
//             top: "-20px",
//           }}
//         >
//           {["🎊", "⭐", "✨", "🌟", "💫", "🎯"][i]}
//         </div>
//       ))}
//     </div>

//     {/* TITLE */}
//     <Title
//       level={3}
//       style={{
//         marginBottom: 8,
//         background: "linear-gradient(135deg, #389e0d, #73d13d)",
//         WebkitBackgroundClip: "text",
//         WebkitTextFillColor: "transparent",
//         fontSize: 28,
//         fontWeight: "800",
//         animation: "slideInDown 0.8s ease-out 0.2s both",
//       }}
//     >
//       Thank You for Your Review!
//     </Title>

//     {/* MESSAGE */}
//     <Text
//       style={{
//         fontSize: 15,
//         color: "#444",
//         display: "block",
//         animation: "slideInUp 0.8s ease-out 0.4s both",
//         fontWeight: "500",
//       }}
//     >
//       Your feedback helps us improve and guide more students 🙌
//     </Text>

//     {/* HEART ANIMATION */}
//     <div
//       style={{
//         marginTop: 15,
//         animation: "pulse 2s ease-in-out infinite 0.6s",
//       }}
//     >
//       <Text style={{ fontSize: 12, color: "#888", animation: "slideInUp 0.8s ease-out 0.6s both", display: "block" }}>
//         💚 We truly appreciate your support
//       </Text>
//     </div>

//     {/* ANIMATION KEYFRAMES */}
//     <style>
//       {`
//         @keyframes pop {
//           0% { 
//             transform: scale(0) rotate(-45deg);
//             opacity: 0;
//           }
//           50% {
//             transform: scale(1.15) rotate(10deg);
//           }
//           100% { 
//             transform: scale(1) rotate(0deg);
//             opacity: 1;
//           }
//         }
        
//         @keyframes slideInDown {
//           from {
//             opacity: 0;
//             transform: translateY(-30px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes slideInUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes fadeInScale {
//           from {
//             opacity: 0;
//             transform: scale(0.95);
//           }
//           to {
//             opacity: 1;
//             transform: scale(1);
//           }
//         }
        
//         @keyframes pulse {
//           0%, 100% {
//             transform: scale(1);
//           }
//           50% {
//             transform: scale(1.05);
//           }
//         }
        
//         @keyframes float {
//           0%, 100% {
//             transform: translateY(0px);
//           }
//           50% {
//             transform: translateY(-15px);
//           }
//         }
        
//         @keyframes confetti {
//           0% {
//             opacity: 1;
//             transform: translateY(0) rotateZ(0deg);
//           }
//           100% {
//             opacity: 0;
//             transform: translateY(400px) rotateZ(720deg);
//           }
//         }
//       `}
//     </style>
//   </div>
// )}
// </Card>
//     </div>
//   );
// };

// export default WriteReview;