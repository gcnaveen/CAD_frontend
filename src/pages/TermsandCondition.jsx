import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";
import LegalPageShell from "../components/LegalPageShell";
import { SUPPORT_EMAIL, SUPPORT_MAILTO, getWhatsAppSupportUrl } from "../constants/siteMeta.js";
import {
  formatSupportPhoneDisplay,
  getPublicBusinessRules,
} from "../services/public/businessRulesService.js";

export default function TermsandCondition() {
  const location = useLocation();
  const [refund, setRefund] = useState({ title: null, summary: null, fromApi: false });
  const [support, setSupport] = useState({
    email: SUPPORT_EMAIL,
    whatsappNumber: null,
    whatsappUrl: getWhatsAppSupportUrl(),
  });

  useEffect(() => {
    if (location.hash === "#refund-policy") {
      const t = window.setTimeout(() => {
        document.getElementById("refund-policy")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    let cancelled = false;
    getPublicBusinessRules().then((rules) => {
      if (cancelled) return;
      setRefund({
        title: rules.refundPolicy?.title || null,
        summary: rules.refundPolicy?.summary || null,
        fromApi: Boolean(rules.fromApi && rules.refundPolicy?.summary),
      });
      setSupport({
        email: rules.supportContact?.email || SUPPORT_EMAIL,
        whatsappNumber: rules.supportContact?.whatsappNumber || null,
        whatsappUrl: rules.supportContact?.whatsappUrl || getWhatsAppSupportUrl(),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const phoneDisplay = formatSupportPhoneDisplay(support.whatsappNumber);
  const phoneHref = support.whatsappNumber
    ? `tel:+${String(support.whatsappNumber).replace(/\D/g, "")}`
    : null;
  const mailto = support.email ? `mailto:${support.email}` : SUPPORT_MAILTO;

  return (
    <LegalPageShell
      title="Terms of Service"
      subtitle="Rules for using North-cot, including online payments and refund terms published by the platform."
    >
      <p>
        These Terms of Service (“Terms”) govern your access to and use of the <strong>North-cot</strong> website,
        applications, and related services (collectively, the “Service”). The Service connects licensed land surveyors
        in <strong>Karnataka, India</strong> with CAD drawing preparation, quality review, and digital delivery. By
        registering, submitting an order, or making a payment, you agree to these Terms.
      </p>

      <h2>1. Eligibility and region</h2>
      <p>
        North-cot is intended for professional use by surveyors and registered CAD operators within Karnataka. You
        confirm that you have the legal capacity to enter a contract and that any information you provide is accurate.
        We may refuse or terminate access if eligibility requirements are not met.
      </p>

      <h2>2. The Service</h2>
      <p>
        We provide a platform to submit survey documents, request AutoCAD drawings, track orders, and receive
        deliverables electronically. Features, turnaround times (such as stated delivery windows), and pricing shown in
        the application form part of your agreement for each order. We may modify or suspend features for maintenance,
        security, or legal reasons.
      </p>

      <h2>3. Your account and conduct</h2>
      <p>You are responsible for safeguarding login credentials and for all activity under your account. You agree not to:</p>
      <ul>
        <li>Misrepresent your identity, licence status, or affiliation.</li>
        <li>Upload unlawful content, malware, or material you do not have rights to use.</li>
        <li>Attempt to interfere with the Service, other users, or our payment systems.</li>
        <li>Use the Service outside the permitted region or in violation of applicable law.</li>
      </ul>

      <h2>4. Orders, delivery, and acceptance</h2>
      <p>
        When you place an order, you request a custom CAD deliverable based on the documents and instructions you
        provide. Delivery is complete when the drawing (or agreed output) is made available for download or handover
        through the platform, unless we specify otherwise. You are responsible for reviewing deliverables promptly and
        reporting objective defects through the channels we provide, according to any stated QC or revision rules in the
        application.
      </p>

      <h2>5. Fees and payment gateway</h2>
      <p>
        Fees for the Service are displayed before you confirm payment and are calculated by the platform pricing
        service. All amounts are in Indian Rupees unless stated otherwise. You authorise us and our payment partners to
        charge your selected payment method for the total amount due.
      </p>
      <p>
        Payments are processed by third-party payment gateways. Your use of those services may be subject to separate
        terms from the payment provider. We are not responsible for gateway downtime, errors caused by your bank or UPI
        app, or declines issued by your financial institution.
      </p>
      <p>
        You agree to provide current, complete, and accurate billing information. If a payment is reversed, charged
        back, or found fraudulent, we may suspend your account and withhold deliverables until the matter is resolved.
      </p>

      <h2 id="refund-policy">
        {refund.title || "6. Refund policy"}
      </h2>
      {refund.fromApi && refund.summary ? (
        <div style={{ whiteSpace: "pre-wrap" }}>{refund.summary}</div>
      ) : (
        <>
          <p>
            Refund terms for North-cot are published by the platform and confirmed at checkout. When the live refund
            policy is available from our business-rules service, it is shown in this section.
          </p>
          <p>
            If you believe a technical error caused a duplicate charge or incorrect amount, contact{" "}
            <a href={mailto}>{support.email || SUPPORT_EMAIL}</a> with transaction details within seven (7) days. We
            will investigate in good faith.
          </p>
        </>
      )}
      <p>
        Failure of a payment at checkout does not create an obligation for us to provide the Service until payment is
        successfully captured and confirmed.
      </p>

      <h2>7. Intellectual property and licence</h2>
      <p>
        You retain ownership of documents and survey materials you upload. You grant us a licence to use those materials
        solely to perform the Service, including storage, processing, and sharing with assigned CAD personnel. Output
        drawings are provided for your professional use in line with your representations and applicable regulations; we
        do not transfer ownership of our software, templates, or platform technology.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided on an “as is” and “as available” basis to the fullest extent permitted by law. We do not
        guarantee uninterrupted or error-free operation. You remain responsible for verifying drawings for your
        professional purposes and complying with statutory survey and land-record requirements.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, North-cot and its affiliates will not be liable for indirect,
        incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill, arising from
        your use of the Service. Our aggregate liability for any claim relating to the Service shall not exceed the
        amount you paid to us for the specific order giving rise to the claim in the three (3) months preceding the
        claim, except where liability cannot be limited by law.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless North-cot and its team from claims, damages, and expenses (including
        reasonable legal fees) arising from your content, misuse of the Service, or breach of these Terms.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate access for breach of these Terms, risk to the platform, or legal requirements. You
        may stop using the Service at any time. Provisions that by nature should survive (including payment obligations
        incurred, intellectual property, disclaimers, and liability limits) will survive termination.
      </p>

      <h2>12. Governing law and disputes</h2>
      <p>
        These Terms are governed by the laws of <strong>India</strong>. Courts at Bengaluru, Karnataka shall have
        exclusive jurisdiction, subject to any mandatory consumer or small-business protections that apply to you.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href={mailto}>{support.email || SUPPORT_EMAIL}</a>
        {phoneDisplay && phoneHref ? (
          <>
            <br />
            Phone: <a href={phoneHref}>{phoneDisplay}</a>
          </>
        ) : null}
        {support.whatsappUrl ? (
          <>
            <br />
            WhatsApp:{" "}
            <a href={support.whatsappUrl} target="_blank" rel="noopener noreferrer">
              Chat with support
            </a>
          </>
        ) : null}
      </p>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "24px" }}>
        Last updated: 1 August 2026
      </p>
    </LegalPageShell>
  );
}
