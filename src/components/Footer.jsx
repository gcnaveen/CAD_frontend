import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const quickLinks = [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Benefits", href: "#benefits" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Upload Sketch", href: "#upload" },
  ];

  const supportLinks = [
    { name: "FAQ", href: "#faq" },
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
    { name: "Refund Policy", href: "#refund" },
  ];

  return (
    <footer className="bg-slate-900 text-gray-300 border-t-4 border-blue-500">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {/* Logo */}
              <div className="flex items-center">
                <img
                  src="/assets/logo.png"
                  alt="CAD Design Service"
                  className="w-26 h-26 rounded-lg object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<div class="w-8 h-8 bg-white rounded-full"></div>';
                  }}
                />
              </div>
             
            </div>
            <p className="text-sm leading-relaxed">
              Professional CAD drawings for rural land and property owners.
              Government-approved and reliable.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-blue-400 transition-colors duration-300 hover:underline"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-blue-400 transition-colors duration-300 hover:underline"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <a
                  href="tel:+919876543210"
                  className="text-sm hover:text-blue-400 transition-colors duration-300"
                >
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:support@caddesignservice.com"
                  className="text-sm hover:text-blue-400 transition-colors duration-300 break-all"
                >
                  support@caddesignservice.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Available across India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © 2026 CAD Design Service. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#privacy"
                className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-300"
              >
                Privacy
              </a>
              <a
                href="#terms"
                className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-300"
              >
                Terms
              </a>
              <a
                href="#cookies"
                className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-300"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
