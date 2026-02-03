import React, { useState, useRef, useEffect } from "react";
import { Card, Row, Col, Typography, Button, Tag, Grid } from "antd";
import {
  ToolOutlined,
  MedicineBoxOutlined,
  SketchOutlined,
  StockOutlined,
  ReadOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import antdTheme from "../../../theme/antdTheme";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { token } = antdTheme;

/* ================= PROGRAM LIST ================= */
const programs = [
  { title: "Engineering", icon: <ToolOutlined />, color: "#4B7CF3" },
  { title: "Medical", icon: <MedicineBoxOutlined />, color: "#F44336" },
  { title: "Law", icon: <BankOutlined />, color: "#FFC107" },
  { title: "Design", icon: <SketchOutlined />, color: "#9C27B0" },
  { title: "Commerce", icon: <StockOutlined />, color: "#4CAF50" },
  { title: "Arts", icon: <ReadOutlined />, color: "#E91E63" },
];

/* ================= PACKAGES (3 FOR EACH PROGRAM) ================= */
const programPackages = {
  Engineering: [
    {
      title: "Basic Assessment",
      price: "₹499",
      features: [
        "Career Assessment Exam",
        "Basic Career Report",
        "One Counselling Session (30 min)",
        "Free Content Library Access",
      ],
    },
    {
      title: "Standard Guidance",
      price: "₹5,999",
      popular: true,
      features: [
        "Career Assessment Exam",
        "Comprehensive Career Report",
        "Two Counselling Sessions (45 min)",
        "Detailed Career Roadmap",
        "Premium Resources (3 months)",
      ],
    },
    {
      title: "Premium Mentorship",
      price: "₹9,999",
      features: [
        "Advanced Psychometric Analysis",
        "Four Counselling Sessions",
        "Personalized Career Roadmap",
        "Unlimited Follow-ups",
        "College Selection Guidance",
      ],
    },
  ],

  Medical: [
    {
      title: "Basic Medical Assessment",
      price: "₹3,499",
      features: [
        "Medical Aptitude Test",
        "Basic Medical Career Report",
        "One Counselling Session",
        "Free Content Access",
      ],
    },
    {
      title: "Standard Medical Guidance",
      price: "₹6,999",
      popular: true,
      features: [
        "NEET Career Assessment",
        "Detailed Medical Career Report",
        "Two Counselling Sessions",
        "College Admission Roadmap",
      ],
    },
    {
      title: "Premium Medical Mentorship",
      price: "₹11,999",
      features: [
        "Advanced Psychometric Analysis",
        "Four Counselling Sessions",
        "Personalized NEET Strategy",
        "College Selection Guidance",
      ],
    },
  ],

  Law: [
    {
      title: "Basic Law Assessment",
      price: "₹3,999",
      features: [
        "Law Aptitude Test",
        "Basic Law Career Report",
        "One Counselling Session",
        "Free Content Access",
      ],
    },
    {
      title: "Standard Law Guidance",
      price: "₹6,499",
      popular: true,
      features: [
        "CLAT / AILET Guidance",
        "Detailed Career Roadmap",
        "Two Counselling Sessions",
        "College Shortlisting",
      ],
    },
    {
      title: "Premium Law Mentorship",
      price: "₹10,999",
      features: [
        "Advanced Career Analysis",
        "Four Counselling Sessions",
        "Personalized Law Roadmap",
        "Top Law College Guidance",
      ],
    },
  ],

  Design: [
    {
      title: "Basic Design Assessment",
      price: "₹2,999",
      features: [
        "Creative Aptitude Test",
        "Basic Design Career Report",
        "One Counselling Session",
        "Free Content Access",
      ],
    },
    {
      title: "Standard Design Guidance",
      price: "₹5,499",
      popular: true,
      features: [
        "Portfolio Guidance",
        "Detailed Career Roadmap",
        "Two Counselling Sessions",
        "Design College Guidance",
      ],
    },
    {
      title: "Premium Design Mentorship",
      price: "₹9,999",
      features: [
        "Advanced Skill Assessment",
        "Four Counselling Sessions",
        "Personalized Portfolio Plan",
        "Top Design Institute Guidance",
      ],
    },
  ],

  Commerce: [
    {
      title: "Basic Commerce Assessment",
      price: "₹2,799",
      features: [
        "Commerce Aptitude Test",
        "Basic Career Report",
        "One Counselling Session",
        "Free Content Access",
      ],
    },
    {
      title: "Standard Commerce Guidance",
      price: "₹5,299",
      popular: true,
      features: [
        "CA / CS / CMA Guidance",
        "Detailed Career Roadmap",
        "Two Counselling Sessions",
        "Exam Preparation Strategy",
      ],
    },
    {
      title: "Premium Commerce Mentorship",
      price: "₹8,999",
      features: [
        "Advanced Career Analysis",
        "Four Counselling Sessions",
        "Personalized Study Plan",
        "Professional Course Guidance",
      ],
    },
  ],

  Arts: [
    {
      title: "Basic Arts Assessment",
      price: "₹2,499",
      features: [
        "Interest & Skill Assessment",
        "Basic Career Report",
        "One Counselling Session",
        "Free Content Access",
      ],
    },
    {
      title: "Standard Arts Guidance",
      price: "₹4,999",
      popular: true,
      features: [
        "Detailed Career Exploration",
        "Two Counselling Sessions",
        "Arts Career Roadmap",
        "College Selection Support",
      ],
    },
    {
      title: "Premium Arts Mentorship",
      price: "₹7,999",
      features: [
        "Advanced Career Mapping",
        "Four Counselling Sessions",
        "Personalized Career Plan",
        "Creative Industry Guidance",
      ],
    },
  ],
};

/* ================= MAIN COMPONENT ================= */
const Program = () => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const currentProgram = programs.find((p) => p.title === selectedProgram);
  const programScrollRef = useRef(null);
  const navigate = useNavigate();
  const screens = useBreakpoint();

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (!programScrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = programScrollRef.current;
    
    // Show/hide left arrow
    setShowLeftArrow(scrollLeft > 0);
    
    // Show/hide right arrow
    const maxScrollLeft = scrollWidth - clientWidth - 1; // -1 for rounding errors
    setShowRightArrow(scrollLeft < maxScrollLeft);
  };

  // Initialize scroll position check
  useEffect(() => {
    checkScrollPosition();
    
    // Add resize listener
    window.addEventListener('resize', checkScrollPosition);
    
    return () => {
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  // Calculate visible cards based on screen size
  const getVisibleCards = () => {
    if (screens.xs) return 2; // Mobile
    if (screens.sm) return 3; // Small tablet
    if (screens.md) return 4; // Tablet
    return 6; // Desktop
  };

  const scrollPrograms = (direction) => {
    if (!programScrollRef.current) return;

    const cardWidth = screens.xs ? 140 : 180;
    const scrollAmount = cardWidth * (getVisibleCards() - 0.5); // Scroll slightly less than full width
    programScrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });

    // Update arrow visibility after scroll
    setTimeout(checkScrollPosition, 300);
  };

  const FreeContentCard = ({ useProgramColor = false }) => (
    <Card
      style={{
        marginTop: 24,
        borderRadius: 16,
        border: `1px solid ${token.colorBgContainer}`,
        background: "linear-gradient(135deg, #F0FFF4 0%, #ECFDF5 100%)",
        boxShadow: token.boxShadow,
      }}
      bodyStyle={{ padding: screens.xs ? 16 : 20 }}
    >
      <div style={{ 
        display: "flex", 
        alignItems: "flex-start", 
        gap: screens.xs ? 12 : 16, 
        flexWrap: "wrap",
        flexDirection: screens.xs ? "column" : "row"
      }}>
        <div
          style={{
            width: screens.xs ? 48 : 64,
            height: screens.xs ? 48 : 64,
            borderRadius: 14,
            backgroundColor: "#52B788",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ReadOutlined style={{ fontSize: screens.xs ? 20 : 28, color: "#ffffff" }} />
        </div>

        <div style={{ flex: 1, minWidth: screens.xs ? "100%" : 200 }}>
          <Title 
            level={screens.xs ? 5 : 4} 
            style={{ 
              marginBottom: 6, 
              color: "#52B788",
              fontSize: screens.xs ? "16px" : "20px"
            }}
          >
            Free Content Available
          </Title>

          <Text style={{ 
            color: token.colorTextSecondary, 
            display: "block", 
            fontSize: screens.xs ? "14px" : "16px"
          }}>
            Browse curated guides, sample tests, videos and case studies that help you explore careers and prepare for exams. No payment required.
          </Text>

          <div style={{ 
            marginTop: 16, 
            display: "flex", 
            gap: 12, 
            alignItems: "center", 
            flexWrap: "wrap" 
          }}>
            <Button
              type="default"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate("/student/freecontent")}
              size={screens.xs ? "small" : "middle"}
            >
              Browse Free Content
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ 
      padding: screens.xs ? "20px 16px" : "40px 20px", 
      maxWidth: "1200px", 
      margin: "0 auto", 
      fontFamily: token.fontFamily 
    }}>
      <Title 
        level={screens.xs ? 3 : 2} 
        style={{ 
          textAlign: "center", 
          marginBottom: screens.xs ? 20 : 30,
          fontSize: screens.xs ? "24px" : "32px"
        }}
      >
        Choose Your Career Path
      </Title>

      {/* PROGRAM CARDS WITH SLIDER */}
      <div style={{ 
        position: "relative", 
        marginTop: screens.xs ? 16 : 20,
        padding: screens.xs ? "0 36px" : "0 46px" // Add padding for arrows
        
      }}>
        {/* LEFT ARROW - Always show if there's content to scroll */}
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          onClick={() => scrollPrograms("left")}
          disabled={!showLeftArrow}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: showLeftArrow ? 1 : 0.3,
            pointerEvents: showLeftArrow ? "auto" : "none",
            width: screens.xs ? 32 : 40,
            height: screens.xs ? 32 : 40,
            minWidth: screens.xs ? 32 : 40,
          }}
          size={screens.xs ? "small" : "middle"}
        />

        {/* SCROLLABLE PROGRAM LIST */}
        <div
          ref={programScrollRef}
          onScroll={checkScrollPosition}
          style={{
            display: "flex",
            gap: screens.xs ? 12 : 16,
            overflowX: "auto",
            scrollBehavior: "smooth",
            padding: screens.xs ? "8px 0" : "0 0 10px 0",
            margin: "0 auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {programs.map((program) => (
            <div 
              key={program.title} 
              style={{ 
                minWidth: screens.xs ? 140 : 180,
                flexShrink: 0 
              }}
            >
              <Card
                hoverable
                onClick={() => setSelectedProgram(program.title)}
                style={{
                  height: screens.xs ? 110 : 130,
                  borderRadius: 8,
                  border:
                    selectedProgram === program.title
                      ? "2px solid #4B7CF3"
                      : "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: selectedProgram === program.title 
                    ? "0 4px 12px rgba(75, 124, 243, 0.2)" 
                    : "none",
                  transition: "all 0.3s ease",
                }}
                bodyStyle={{
                  padding: screens.xs ? 8 : 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    backgroundColor: program.color,
                    width: screens.xs ? 36 : 44,
                    height: screens.xs ? 36 : 44,
                    borderRadius: "50%",
                    marginBottom: screens.xs ? 6 : 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {React.cloneElement(program.icon, { 
                    style: { fontSize: screens.xs ? 16 : 20 } 
                  })}
                </div>
                <Text strong style={{ fontSize: screens.xs ? "14px" : "16px" }}>
                  {program.title}
                </Text>
              </Card>
            </div>
          ))}
        </div>

        {/* RIGHT ARROW - Always show if there's content to scroll */}
        <Button
          shape="circle"
          icon={<RightOutlined />}
          onClick={() => scrollPrograms("right")}
          disabled={!showRightArrow}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: showRightArrow ? 1 : 0.3,
            pointerEvents: showRightArrow ? "auto" : "none",
            width: screens.xs ? 32 : 40,
            height: screens.xs ? 32 : 40,
            minWidth: screens.xs ? 32 : 40,
          }}
          size={screens.xs ? "small" : "middle"}
        />

        {/* Scroll hint dots for mobile */}
        {screens.xs && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 12,
          }}>
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: showRightArrow ? "#4B7CF3" : "#d9d9d9",
                  opacity: showRightArrow ? (dot === 0 ? 1 : 0.3) : 0.3,
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {!selectedProgram && (
        <div style={{ marginTop: screens.xs ? 30 : 40 }}>
          <FreeContentCard />
        </div>
      )}

      {/* PACKAGE CARDS */}
      {selectedProgram && (
        <div style={{ marginTop: screens.xs ? 40 : 60 }}>
          <Title 
            level={screens.xs ? 4 : 3} 
            style={{ 
              textAlign: "center", 
              marginBottom: screens.xs ? 20 : 30,
              fontSize: screens.xs ? "20px" : "24px"
            }}
          >
            {selectedProgram} Packages
          </Title>

          <Row 
            gutter={[screens.xs ? 16 : 24, screens.xs ? 16 : 24]} 
            justify="center"
            style={{ width: "100%" }}
          >
            {programPackages[selectedProgram].map((pkg) => (
              <Col xs={24} sm={12} md={8} key={pkg.title}>
                <Card 
                  style={{ 
                    borderRadius: 12, 
                    position: "relative", 
                    height: "100%", 
                    boxShadow: token.boxShadow,
                    marginBottom: screens.xs ? 8 : 0
                  }}
                  bodyStyle={{ padding: screens.xs ? 16 : 24 }}
                >
                  {pkg.popular && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        background: token.colorWarning,
                        color: "#fff",
                        padding: screens.xs ? "4px 10px" : "6px 14px",
                        borderTopRightRadius: 12,
                        borderBottomLeftRadius: 12,
                        fontSize: screens.xs ? 10 : 12,
                      }}
                    >
                      ⭐ Most Popular
                    </div>
                  )}

                  <Title 
                    level={screens.xs ? 5 : 4} 
                    style={{ 
                      fontSize: screens.xs ? "16px" : "20px",
                      marginTop: pkg.popular ? (screens.xs ? 20 : 24) : 0
                    }}
                  >
                    {pkg.title}
                  </Title>
                  <Title 
                    level={screens.xs ? 3 : 2} 
                    style={{ 
                      color: token.colorPrimary,
                      fontSize: screens.xs ? "28px" : "36px",
                      margin: screens.xs ? "8px 0 4px 0" : "12px 0 6px 0"
                    }}
                  >
                    {pkg.price}
                  </Title>
                  <Text type="colorTextSecondary" style={{ fontSize: screens.xs ? "13px" : "14px" }}>
                    one-time
                  </Text>

                  <div style={{ marginTop: screens.xs ? 16 : 20 }}>
                    {pkg.features.map((feature, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          display: "flex", 
                          marginBottom: screens.xs ? 8 : 10,
                          alignItems: "flex-start"
                        }}
                      >
                        <CheckCircleOutlined
                          style={{ 
                            color: token.colorSuccess, 
                            marginRight: 8,
                            fontSize: screens.xs ? 14 : 16,
                            marginTop: 2
                          }}
                        />
                        <Text style={{ fontSize: screens.xs ? "13px" : "14px" }}>
                          {feature}
                        </Text>
                      </div>
                    ))}
                  </div>

                  <Button 
                    type="primary" 
                    block 
                    style={{ 
                      marginTop: screens.xs ? 16 : 20,
                      height: screens.xs ? 36 : 40
                    }}
                    size={screens.xs ? "small" : "middle"}
                  >
                    Select Package
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>

          <div style={{ marginTop: screens.xs ? 30 : 40 }}>
            <FreeContentCard useProgramColor={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Program;