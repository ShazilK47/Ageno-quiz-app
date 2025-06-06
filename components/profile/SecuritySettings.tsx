"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { MultiFactorInfo, User as FirebaseUser, TotpSecret } from "firebase/auth";
import {
  getMfaStatus,
  startPhoneMfaEnrollment,
  completePhoneMfaEnrollment,
  generateTotpSecret,
  completeTotpMfaEnrollment,
  unenrollMfaFactor,
} from "@/lib/actions/auth.actions";

interface SecuritySettingsProps {
  user: FirebaseUser;
  onMessage: (
    message: { type: "success" | "error"; text: string } | null
  ) => void;
}

type MfaMethod = "phone" | "totp";

// Type definitions for MFA operations
// Import TotpSecret from firebase/auth rather than defining our own
// interface TotpSecret {
//   secret: string;
//   qrCode?: string;
//   base32Secret?: string;
// }

interface PhoneMfaFactor extends MultiFactorInfo {
  phoneNumber?: string;
}

interface AuthError {
  code: string;
  message: string;
}

interface TotpSecretWithQr extends TotpSecret {
  qrCode?: string;
  base32Secret?: string;
}

interface AuthResult {
  success: boolean;
  verificationId?: string;
  secret?: TotpSecretWithQr;
  qrCode?: string;
  message?: string;
}

export default function SecuritySettings({
  user,
  onMessage,
}: SecuritySettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMfaSetup, setActiveMfaSetup] = useState<MfaMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [mfaFactors, setMfaFactors] = useState<MultiFactorInfo[]>([]);
  const [totpSecret, setTotpSecret] = useState<TotpSecretWithQr | null>(null);
  const [totpQrCode, setTotpQrCode] = useState("");
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Get MFA status when component mounts
  useEffect(() => {
    if (user) {
      const status = getMfaStatus(user);
      setMfaFactors(status.availableFactors);
    }
  }, [user]);

  // Start phone MFA enrollment
  const handleStartPhoneMfa = async () => {
    if (!user || !recaptchaContainerRef.current) return;

    try {
      setIsSubmitting(true);
      onMessage(null);

      const result = await startPhoneMfaEnrollment(
        user,
        phoneNumber,
        recaptchaContainerRef.current
      );

      if (result && 'verificationId' in result && !('code' in result)) {
        setVerificationId(result.verificationId);
        onMessage({
          type: "success",
          text: "Verification code sent to your phone number.",
        });
      } else {
        onMessage({
          type: "error",
          text: typeof result === 'object' && result !== null && 'message' in result 
            ? ((result as AuthError).message || "Failed to start phone verification.")
            : "Failed to start phone verification.",
        });
      }
    } catch (_) {
      onMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete phone MFA enrollment
  const handleCompletePhoneMfa = async () => {
    if (!user || !verificationId) return;

    try {
      setIsSubmitting(true);

      const result = await completePhoneMfaEnrollment(
        user,
        verificationId,
        verificationCode
      );

      if (result === true) {
        setPhoneNumber("");
        setVerificationId("");
        setVerificationCode("");
        setActiveMfaSetup(null);

        // Update MFA factors list
        const status = getMfaStatus(user);
        setMfaFactors(status.availableFactors);

        onMessage({
          type: "success",
          text: "Phone authentication successfully set up!",
        });
      } else {
        onMessage({
          type: "error",
          text: typeof result === 'object' && result !== null && 'message' in result 
            ? ((result as AuthError).message || "Failed to verify code.")
            : "Failed to verify code. Please try again.",
        });
      }
    } catch (_) {
      onMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start TOTP MFA setup
  const handleStartTotpMfa = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      onMessage(null);

      const result = await generateTotpSecret(user);

      if (result && 'secret' in result && !('code' in result)) {
        // Keep the original TotpSecret object but cast it to include our custom properties
        // This avoids TypeScript errors while still allowing the object to be used with Firebase
        const totpWithQr = result as unknown as TotpSecretWithQr;
        
        // Generate QR code URL using the Firebase method if available
        if (typeof result.generateQrCodeUrl === 'function') {
          totpWithQr.qrCode = result.generateQrCodeUrl("Ageno Quiz App");
        }
        
        // Use secretKey for manual entry code
        if ('secretKey' in result) {
          totpWithQr.base32Secret = result.secretKey as string;
        }
        
        setTotpSecret(totpWithQr);
        setTotpQrCode(totpWithQr.qrCode || "");

        onMessage({
          type: "success",
          text: "TOTP secret generated. Scan the QR code with your authenticator app.",
        });
      } else {
        onMessage({
          type: "error",
          text: typeof result === 'object' && result !== null && 'message' in result 
            ? ((result as AuthError).message || "Failed to generate TOTP secret.")
            : "Failed to generate TOTP secret.",
        });
      }
    } catch (_) {
      onMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete TOTP MFA enrollment
  const handleCompleteTotpMfa = async () => {
    if (!user || !totpSecret) return;

    try {
      setIsSubmitting(true);

      // Pass the actual TotpSecret object from Firebase, not our extended version
      const result = await completeTotpMfaEnrollment(
        user,
        totpSecret,
        verificationCode
      );

      if (result === true) {
        // Clear form state
        setTotpSecret(null);
        setTotpQrCode("");
        setVerificationCode("");
        setActiveMfaSetup(null);

        // Update MFA factors list
        const status = getMfaStatus(user);
        setMfaFactors(status.availableFactors);

        onMessage({
          type: "success",
          text: "Authenticator app successfully set up!",
        });
      } else {
        onMessage({
          type: "error",
          text: typeof result === 'object' && result !== null && 'message' in result 
            ? ((result as AuthError).message || "Failed to verify code.")
            : "Failed to verify code. Please try again.",
        });
      }
    } catch (_) {
      onMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove an MFA factor
  const handleRemoveMfaFactor = async (factorId: string) => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      const result = await unenrollMfaFactor(user, factorId);

      if (result === true) {
        // Update MFA factors list
        const status = getMfaStatus(user);
        setMfaFactors(status.availableFactors);

        onMessage({
          type: "success",
          text: "MFA method successfully removed.",
        });
      } else {
        onMessage({
          type: "error",
          text: typeof result === 'object' && result !== null && 'message' in result 
            ? ((result as AuthError).message || "Failed to remove 2FA method.")
            : "Failed to remove 2FA method. Please try again.",
        });
      }
    } catch (_) {
      onMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
        <p className="text-gray-600 mb-4">
          Secure your account with an additional verification step.
        </p>

        {/* Current MFA Methods */}
        {mfaFactors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Active Methods</h4>
            <ul className="space-y-2">
              {mfaFactors.map((factor) => (
                <li
                  key={factor.uid}
                  className="p-3 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {factor.displayName ||
                        (factor.factorId === "phone"
                          ? "Phone Number"
                          : factor.factorId === "totp"
                          ? "Authenticator App"
                          : "Two-Factor Method")}
                    </p>
                    {factor.factorId === "phone" && (factor as PhoneMfaFactor).phoneNumber && (
                      <p className="text-sm text-gray-500">
                        {(factor as PhoneMfaFactor).phoneNumber}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveMfaFactor(factor.uid)}
                    disabled={isSubmitting}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add New MFA Method */}
        {!activeMfaSetup ? (
          <div className="space-y-3">
            <button
              onClick={() => setActiveMfaSetup("phone")}
              className="w-full p-3 border rounded-md text-left hover:bg-gray-50 transition"
            >
              <p className="font-medium">Use Phone Number</p>
              <p className="text-sm text-gray-500">
                Get verification codes via SMS
              </p>
            </button>

            <button
              onClick={() => setActiveMfaSetup("totp")}
              className="w-full p-3 border rounded-md text-left hover:bg-gray-50 transition"
            >
              <p className="font-medium">Use Authenticator App</p>
              <p className="text-sm text-gray-500">
                Generate codes with Google Authenticator, Authy, or similar apps
              </p>
            </button>
          </div>
        ) : activeMfaSetup === "phone" ? (
          <div className="border rounded-md p-4">
            <h4 className="text-md font-medium mb-2">Phone Authentication</h4>

            {!verificationId ? (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 202 555 0123"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>

                <div ref={recaptchaContainerRef} className="mb-4"></div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveMfaSetup(null)}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartPhoneMfa}
                    disabled={isSubmitting || !phoneNumber}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {isSubmitting ? "Sending..." : "Send Code"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="verificationCode"
                    className="block text-sm font-medium mb-1"
                  >
                    Verification Code
                  </label>
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationId("");
                      setVerificationCode("");
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCompletePhoneMfa}
                    disabled={isSubmitting || !verificationCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {isSubmitting ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : activeMfaSetup === "totp" ? (
          <div className="border rounded-md p-4">
            <h4 className="text-md font-medium mb-2">Authenticator App</h4>

            {!totpSecret ? (
              <div className="flex flex-col items-center">
                <p className="text-center mb-4">
                  Use an authenticator app like Google Authenticator, Authy, or
                  Microsoft Authenticator.
                </p>
                <button
                  type="button"
                  onClick={handleStartTotpMfa}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? "Generating..." : "Set Up Authenticator"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMfaSetup(null)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center mb-4">
                  {totpQrCode && (
                    <div className="mb-4 p-2 bg-white border">
                      <QRCodeSVG value={totpQrCode} size={200} />
                    </div>
                  )}

                  <p className="text-center mb-2">
                    Scan the QR code with your authenticator app
                  </p>

                  {totpSecret && 'base32Secret' in totpSecret && totpSecret.base32Secret && (
                    <div className="mb-4 text-center">
                      <p className="text-sm text-gray-600 mb-1">
                        Or enter this code manually:
                      </p>
                      <code className="p-2 bg-gray-100 rounded block text-center">
                        {totpSecret.base32Secret}
                      </code>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="verificationCode"
                    className="block text-sm font-medium mb-1"
                  >
                    Enter the 6-digit code from your app
                  </label>
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTotpSecret(null);
                      setTotpQrCode("");
                      setVerificationCode("");
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteTotpMfa}
                    disabled={isSubmitting || !verificationCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {isSubmitting ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
