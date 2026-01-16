// // src/utils/aes.ts
// import CryptoJS from "crypto-js";
//
// export function encryptAes256Cbc_Base64(plainText: string, secret: string) {
//     const key = CryptoJS.SHA256(secret);
//     const iv  = CryptoJS.lib.WordArray.random(16);
//
//     const encrypted = CryptoJS.AES.encrypt(plainText, key, {
//         iv,
//         mode: CryptoJS.mode.CBC,
//         padding: CryptoJS.pad.Pkcs7,
//     });
//
//     return {
//         iv: CryptoJS.enc.Base64.stringify(iv),
//         cipher: CryptoJS.enc.Base64.stringify(encrypted.ciphertext)
//     };
// }
//
// export function decryptAes256Cbc_Base64(base64: string, secret: string): string {
//     const raw = CryptoJS.enc.Base64.parse(base64);
//
//     const iv  = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4), 16);
//     const ct  = CryptoJS.lib.WordArray.create(raw.words.slice(4), raw.sigBytes - 16);
//
//     const key = CryptoJS.SHA256(secret);
//
//     const decrypted = CryptoJS.AES.decrypt({ ciphertext: ct } as any, key, {
//         iv,
//         mode: CryptoJS.mode.CBC,
//         padding: CryptoJS.pad.Pkcs7
//     });
//
//     return CryptoJS.enc.Utf8.stringify(decrypted);
// }