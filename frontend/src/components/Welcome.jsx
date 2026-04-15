import React from 'react';
import { Button, Row, Col, Typography, Card } from 'antd';
import { FormOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Welcome = () => {
     const navigate = useNavigate(); 
    return (
        <div style={{ padding: '40px', textAlign: 'center' , background: '#000000', minHeight: '100vh' }}>

            {/* Title */}

            <Title
                level={2}
                style={{
                    fontSize: '34px',
                    fontWeight: '700',
                    // background: 'linear-gradient(90deg, #08245c, #479fdb)',
                    background:"#fff",
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '10px',
                    letterSpacing: '0.5px'
                }}
            >
                Welcome to Abhinav Career Counselling - Your Pathway to Success
            </Title>

            {/* Big Video Section */}
            <Row justify="center">
                <Col xs={24} md={22} lg={20}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: '20px',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                            padding: '1px'
                        }}
                    >
                        <video
                            width="100%"
                            height="500px"
                            autoPlay
                            muted
                            loop
                            playsInline
                            controls
                            style={{
                                borderRadius: '16px',
                                objectFit: 'cover'
                            }}
                        >
                            <source src="/abhinav-video.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </Card>
                </Col>
            </Row>

            {/* Buttons OUTSIDE Card */}
            <Row justify="center" gutter={20} style={{ marginTop: '40px' }}>
                <Col>
                    <Button
                        size="large"
                        icon={<RocketOutlined />}
                        onClick={() => navigate("/aptitude-details", { state: { from: "enquiry" } })}
                        style={{
                            background: 'linear-gradient(135deg, #05162f, #124983)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '30px',
                            padding: '0 35px',
                            height: '48px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 6px 15px rgba(22,119,255,0.35)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
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

                <Col>
                    <Button
                        size="large"
                        icon={<FormOutlined />}
                        onClick={() => navigate("/register-details", { state: { from: "register" } })}
                        style={{
                            background: 'linear-gradient(135deg, #52c41a, #95de64)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '30px',
                            padding: '0 35px',
                            height: '48px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 6px 15px rgba(82,196,26,0.35)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(82,196,26,0.5)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 6px 15px rgba(82,196,26,0.35)';
                        }}
                    >
                        Register Now
                    </Button>
                </Col>
            </Row>

        </div>
    );
};

export default Welcome;