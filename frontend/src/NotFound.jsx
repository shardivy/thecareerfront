// src/components/NotFound.jsx

import React from "react";
import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f5f5f5",
            }}
        >
            <Result
                status="404"
                title="404"
                subTitle={
                    <span style={{ color: "#000", fontSize: "16px" }}>
                        Sorry, the page you are looking for does not exist.
                    </span>
                }
                extra={
                    <Button
                        key="back"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </Button>
                }
            />
        </div>
    );
};

export default NotFound;