import React, { useEffect, useState, useRef } from 'react';
import { Button, Row, Col, Typography, Modal } from 'antd';
import { PlayCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title } = Typography;
import { Grid } from 'antd';

const Welcome = () => {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openVideo) {
      setIsModalOpen(true);
    }
  }, [location.state]);

  const handleClose = () => {
    setIsModalOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();       // ⏸ stop video
      videoRef.current.currentTime = 0; // ⏮ reset to start
    }
  };


  return (
    <div style={{ padding: '24px 16px', textAlign: 'center', background: '#e0dddd', minHeight: '100vh' }}>

      {/* Title */}

      <Title
        level={2}
        style={{
          // fontSize: '34px',
          fontSize: screens.xs ? '16px' : '34px',
          fontWeight: '700',
          // background: 'linear-gradient(90deg, #08245c, #479fdb)',
          background: "#000000",
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
          letterSpacing: '0.5px'
        }}
      >
        Welcome to Abhinav Career Counselling - Your Pathway to Success
      </Title><br></br>


      <Row justify="center">
        <Col xs={24} md={22} lg={20} xl={18}>
          <div
            style={{
              width: '100%',
              maxWidth: '1100px',
              margin: '0 auto',
              borderRadius: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              overflow: 'hidden', // keeps corners clean
              background: '#fff'
            }}
          >
            <img
              src="/abhinav-img.jpeg"
              alt="Abhinav Career Counselling"
              style={{
                width: "100%",
                height: "auto",
                display: "block"
              }}
            />
          </div>
        </Col>
      </Row>

      <Row
        justify="center"
        align="middle"
         gutter={[16, 16]} 
        style={{ marginTop: '20px' , gap: '0px' }}
      >
        <Col
          xs={24}
          sm={10}
          md={5}
          style={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={() => setIsModalOpen(true)}
            style={{
              background: '#ffffff',
              border: '1px solid #1E40AF',
              color: '#1E40AF',
              borderRadius: '30px',
              padding: screens.xs ? '0 20px' : '0 25px',
              height: '44px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: screens.xs ? '100%' : 'auto',
              margin: screens.xs ? '0' : '0 auto',
              boxShadow: '0 6px 15px rgba(30, 64, 175, 0.18)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(30, 64, 175, 0.28)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(30, 64, 175, 0.18)';
            }}
          >
            Watch Video
          </Button>
        </Col>

        <Col
          xs={24}
          sm={10}
          md={5}
          style={{
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button
            size="large"
            icon={<RocketOutlined />}
            onClick={() =>
              navigate("/welcome-enquiry", { state: { from: "enquiry" } })
            }
            style={{
              background: 'linear-gradient(135deg, #05162f, #124983)',
              border: 'none',
              color: '#fff',
              borderRadius: '30px',
              padding: screens.xs ? '0 20px' : '0 25px',
              height: '44px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: screens.xs ? '100%' : 'auto',
              margin: screens.xs ? '0' : '0 auto',
              boxShadow: '0 6px 15px rgba(22,119,255,0.35)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(22,119,255,0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(22,119,255,0.35)';
            }}
          >
            Enquiry Now
          </Button>
        </Col>
      </Row>


       <Modal
        open={isModalOpen}
        onCancel={handleClose}
        footer={null}
        centered
        width={1000}
        destroyOnHidden
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <video
            ref={videoRef}
            controls
            autoPlay
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          >
            <source src="/abhinav-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </Modal> 
    </div>
  );
};

export default Welcome;
