import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Result, Typography } from "antd";

const { Paragraph, Text } = Typography;

export default function PaymentFailurePage() {
  const navigate = useNavigate();

  return (
    <Result
      status="error"
      title="Payment failed or cancelled"
      subTitle={
        <div>
          <Paragraph className="mb-0">
            Your order may be created, but payment is not completed. You can retry from Requests.
          </Paragraph>
          <Paragraph className="mb-0">
            <Text type="secondary">If you believe this is wrong, wait a moment and check Requests again.</Text>
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

