import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Result, Typography } from "antd";

const { Paragraph, Text } = Typography;

export default function PaymentSuccessPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="success"
      title="Payment successful"
      subTitle={
        <div>
          <Paragraph className="mb-0">
            Your payment was completed. You can track your request from the dashboard.
          </Paragraph>
          <Paragraph className="mb-0">
            <Text type="secondary">If status doesn’t update immediately, refresh in Requests.</Text>
          </Paragraph>
        </div>
      }
      extra={[
        <Button key="home" type="primary" onClick={() => navigate("/dashboard/user")}>
          Go Home
        </Button>,
        <Button key="requests" onClick={() => navigate("/dashboard/user/requests")}>
          Go to Requests
        </Button>,
      ]}
    />
  );
}

