/**
 * WebAuthn JSON types compatible with @simplewebauthn/server verify/generate APIs.
 * Kept local so builds do not depend on package-internal type export paths that vary by version.
 */

export type AuthenticatorTransportFuture =
  | "ble"
  | "cable"
  | "hybrid"
  | "internal"
  | "nfc"
  | "smart-card"
  | "usb";

export type RegistrationResponseJSON = {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    authenticatorData?: string;
    transports?: AuthenticatorTransportFuture[];
    publicKeyAlgorithm?: number;
    publicKey?: string;
  };
  authenticatorAttachment?: string;
  clientExtensionResults: Record<string, unknown>;
  type: "public-key";
};

export type AuthenticationResponseJSON = {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
  authenticatorAttachment?: string;
  clientExtensionResults: Record<string, unknown>;
  type: "public-key";
};
