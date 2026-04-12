// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { Button, Result, Typography } from "antd";

// const { Paragraph, Text } = Typography;

// export default function PaymentSuccessPage() {
//   const navigate = useNavigate();

//   return (
//     <Result
//       status="success"
//       title="Payment successful"
//       subTitle={
//         <div>
//           <Paragraph className="mb-0">
//             Your payment was completed. You can track your request from the dashboard.
//           </Paragraph>
//           <Paragraph className="mb-0">
//             <Text type="secondary">If status doesn’t update immediately, refresh in Requests.</Text>
//           </Paragraph>
//         </div>
//       }
//       extra={[
//         <Button key="home" type="primary" onClick={() => navigate("/dashboard/user")}>
//           Go Home
//         </Button>,
//         <Button key="requests" onClick={() => navigate("/dashboard/user/requests")}>
//           Go to Requests
//         </Button>,
//       ]}
//     />
//   );
// }

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Result, Typography } from "antd";
import Confetti from "react-confetti";

const { Paragraph, Text } = Typography;

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [confettiActive, setConfettiActive] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Stop generating new confetti pieces after 4 seconds
    const confettiTimer = setTimeout(() => setConfettiActive(false), 4000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(confettiTimer);
    };
  }, []);

  useEffect(() => {
    const redirectTimer = setTimeout(() => navigate("/"), 3000);
    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <>
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        run={confettiActive}
        recycle={confettiActive}
        numberOfPieces={confettiActive ? 200 : 0}
        gravity={0.15}
        tweenDuration={4000}
      />
      <Result
        status="success"
        title="Payment successful"
        subTitle={
          <div>
            <Paragraph className="mb-0">
              Your payment was completed. You can track your request from the dashboard.
            </Paragraph>
            <Paragraph className="mb-0">
              <Text type="secondary">
                If status doesn't update immediately, refresh in Requests.
              </Text>
            </Paragraph>
            <Paragraph className="mb-0" style={{ marginTop: 8 }}>
              <Text type="secondary">Taking you to the home page in 3 seconds…</Text>
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
    </>
  );
}