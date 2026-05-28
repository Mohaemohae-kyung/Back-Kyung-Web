import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

/**
 * 프론트엔드용 E2E 양방향 암호화 유틸리티
 */
class E2eCryptoUtil {
  constructor() {
    // 1회성 세션(결제 주기) 동안 유지할 대칭키와 IV
    this.aesKey = null;
    this.iv = null;
    this.aesKeyHex = null;
    this.ivHex = null;
  }

  /**
   * 새로운 AES Key와 IV를 생성합니다.
   */
  generateKeys() {
    // 32바이트(256비트) 키, 16바이트(128비트) IV 생성
    this.aesKey = CryptoJS.lib.WordArray.random(32);
    this.iv = CryptoJS.lib.WordArray.random(16);
    this.aesKeyHex = CryptoJS.enc.Hex.stringify(this.aesKey);
    this.ivHex = CryptoJS.enc.Hex.stringify(this.iv);
  }

  /**
   * 결제 페이로드(JSON)를 암호화하여 서버 전송용 DTO 객체로 만듭니다.
   * @param {Object} data 결제 데이터 객체
   * @param {String} rsaPublicKeyPem 서버에서 받은 RSA 공개키
   * @returns {Object} { encryptedAesKey, iv, cipherText }
   */
  encryptPayload(data, rsaPublicKeyPem) {
    // 1. 키 생성
    this.generateKeys();

    // 2. RSA로 AES Key 암호화
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(rsaPublicKeyPem);
    
    // AES키를 Base64로 인코딩한 문자열을 RSA로 암호화 (node-forge와 규격 맞춤)
    const base64AesKey = CryptoJS.enc.Base64.stringify(this.aesKey);
    const encryptedAesKey = encryptor.encrypt(base64AesKey);
    
    if (!encryptedAesKey) {
      throw new Error("RSA Encryption failed");
    }

    // 3. AES로 데이터 암호화
    const plainText = JSON.stringify(data);
    const encryptedData = CryptoJS.AES.encrypt(plainText, this.aesKey, {
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const cipherText = encryptedData.toString(); // 기본 Base64
    const base64Iv = CryptoJS.enc.Base64.stringify(this.iv);

    return {
      encryptedAesKey,
      iv: base64Iv,
      cipherText
    };
  }

  /**
   * 서버가 응답한 E2E 암호문을 현재 세션의 AES Key로 복호화합니다.
   * @param {String} cipherText 서버가 보낸 Base64 암호문
   * @returns {Object} 평문 JSON 객체
   */
  decryptResponse(cipherText) {
    if (!this.aesKey || !this.iv) {
      throw new Error("Local AES key is missing. Cannot decrypt response.");
    }

    const decryptedData = CryptoJS.AES.decrypt(cipherText, this.aesKey, {
      iv: this.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const plainText = decryptedData.toString(CryptoJS.enc.Utf8);
    if (!plainText) {
      throw new Error("AES Decryption failed. Malformed cipherText.");
    }

    return JSON.parse(plainText);
  }
}

// 싱글톤 인스턴스 (단일 결제 플로우 내에서 상태 유지용)
const e2eCrypto = new E2eCryptoUtil();
export default e2eCrypto;
