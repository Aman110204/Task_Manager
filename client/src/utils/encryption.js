const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SALT = "tm_local_finance_salt_v1";

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function deriveKey(userId) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${userId}:productivity-finance-key`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptJSON(userId, value) {
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext))
  };
}

export async function decryptJSON(userId, payload, fallback) {
  if (!payload || !payload.iv || !payload.data) {
    return fallback;
  }

  try {
    const key = await deriveKey(userId);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(payload.iv) },
      key,
      base64ToBytes(payload.data)
    );
    return JSON.parse(decoder.decode(plainBuffer));
  } catch (error) {
    return fallback;
  }
}
