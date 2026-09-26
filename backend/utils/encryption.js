const crypto = require("crypto");

function getKey() {
  const value = process.env.META_TOKEN_ENCRYPTION_KEY || "";
  if (!value) {
    throw new Error("META_TOKEN_ENCRYPTION_KEY is not configured");
  }
  return crypto.createHash("sha256").update(value).digest();
}

exports.encrypt = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
};

exports.decrypt = (payload) => {
  const [ivHex, tagHex, encryptedHex] = String(payload || "").split(":");
  if (!ivHex || !tagHex || !encryptedHex) throw new Error("Invalid encrypted token");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
};