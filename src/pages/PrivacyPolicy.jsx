import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LegalPageShell from "../components/LegalPageShell";

export default function PrivacyPolicy() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#cookies") {
      const t = window.setTimeout(() => {
        document.getElementById("cookies")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [location.hash, location.pathname]);

  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="How North-cot collects, uses, and protects your information when you use our CAD drawing platform and pay for services online."
    >
      <p>
        <strong>North-cot</strong> (“we”, “us”, “our”) operates the North-cot web application and related services for
        licensed land surveyors in Karnataka, India. This Privacy Policy explains what personal data we process, why we
        process it, and your choices. By using our website or services, you agree to this policy.
      </p>

      <h2 id="information-we-collect">1. Information we collect</h2>
      <p>We may collect the following categories of information, depending on how you use the platform:</p>
      <ul>
        <li>
          <strong>Account and profile data:</strong> name, phone number, email address (if provided), professional or
          business details you submit during registration or profile completion, and role (for example surveyor or CAD
          operator).
        </li>
        <li>
          <strong>Order and project data:</strong> survey-related information, locations, document uploads (such as
          sketches, Tippani, or supporting files), order references, and messages you send through the platform.
        </li>
        <li>
          <strong>Technical and usage data:</strong> device type, browser, approximate region, IP address, log
          timestamps, and diagnostic data needed to secure and operate the service.
        </li>
        <li>
          <strong>Payment-related data:</strong> when you pay through our payment gateway, we receive confirmation of
          payment status and transaction references. Card or UPI account numbers are handled by the payment provider; we
          do not store full card numbers on our servers.
        </li>
      </ul>

      <h2 id="how-we-use">2. How we use your information</h2>
      <p>We use personal data to:</p>
      <ul>
        <li>Provide, operate, and improve the North-cot platform and CAD fulfilment workflow.</li>
        <li>Authenticate users, prevent fraud and abuse, and comply with legal obligations.</li>
        <li>Process payments and reconcile transactions with our payment partners.</li>
        <li>Communicate with you about your orders, account, security, or service changes.</li>
        <li>Analyse aggregated usage to improve performance and user experience.</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2 id="payment-gateway">3. Payment processing</h2>
      <p>
        Payments are processed by independent, regulated payment gateway providers. When you complete a payment, you
        may be subject to that provider’s terms and privacy policy. We share only the data necessary to initiate and
        confirm the transaction (such as amount, order or invoice reference, and customer identifiers required by the
        gateway).
      </p>

      <h2 id="sharing">4. Sharing and disclosure</h2>
      <p>We may share information with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> who host our infrastructure, send notifications, or support security and
          analytics, under strict confidentiality and processing agreements.
        </li>
        <li>
          <strong>CAD operators and internal staff</strong> who need order details to prepare and quality-check
          drawings assigned through the platform.
        </li>
        <li>
          <strong>Authorities</strong> when required by applicable law, court order, or to protect our rights and users’
          safety.
        </li>
      </ul>

      <h2 id="retention">5. Retention</h2>
      <p>
        We retain personal and order data for as long as your account is active and as needed to provide the service,
        meet legal, tax, and accounting requirements, and resolve disputes. Uploads and project files may be retained
        according to operational and regulatory needs applicable to land survey documentation workflows.
      </p>

      <h2 id="security">6. Security</h2>
      <p>
        We implement reasonable technical and organisational measures to protect personal data against unauthorised
        access, alteration, or loss. No method of transmission over the internet is completely secure; you use the
        service at your own risk beyond what industry-standard safeguards can reasonably address.
      </p>

      <h2 id="your-rights">7. Your rights</h2>
      <p>
        Depending on applicable Indian law (including the Digital Personal Data Protection Act, 2023, where relevant),
        you may request access, correction, or deletion of certain personal data, or withdraw consent where processing
        is consent-based, subject to legal exceptions. To exercise these rights, contact us using the details below.
      </p>

      <h2 id="cookies">8. Cookies and similar technologies</h2>
      <p>
        We may use cookies or local storage to keep you signed in, remember preferences (such as theme), and measure
        basic site performance. You can control cookies through your browser settings; disabling some cookies may limit
        certain features.
      </p>

      <h2 id="changes">9. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The “Last updated” date at the bottom will change when we
        publish revisions. Continued use of the service after changes constitutes acceptance of the updated policy where
        permitted by law.
      </p>

      <h2 id="contact">10. Contact</h2>
      <p>
        For privacy questions or requests:{" "}
        <a href="mailto:support@northcot.in">support@northcot.in</a>
        <br />
        North-cot — Karnataka, India.
      </p>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "24px" }}>
        Last updated: 13 April 2026
      </p>
    </LegalPageShell>
  );
}
