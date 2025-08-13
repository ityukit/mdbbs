import bcrypt from 'bcrypt';
import crypto from 'crypto'; 

export default class pHash {
  constructor(settings) {
    this.settings = settings;
  }

  async pv_sha512(password) {
    const salt = await crypto.randomBytes(16);
    return {
      salt,
      hash: crypto.createHash('sha512').update(salt).update(password, 'utf8').update(this.settings.password.sugar).digest(),
    };
  }
  async pv_sha512_with_salt(password, salt) {
    return {
      salt,
      hash: crypto.createHash('sha512').update(salt).update(password, 'utf8').update(this.settings.password.sugar).digest(),
    };
  }
  async pv_bcrypt_hash(data){
    return bcrypt.hash(data, this.settings.password.rounds);
  }
  async pv_bcrypt_verify(data, hash) {
    return bcrypt.compare(data, hash);
  }
  async pv_aes_encrypt(data) {
    const iv = crypto.randomBytes(16)
    const salt = crypto.randomBytes(16)
    const key = crypto.scryptSync(this.settings.password.pepper, salt, 32)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    return { iv, salt, encrypted: Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])  };
  }
  async pv_aes_decrypt(iv, salt, encrypted) {
    const key = crypto.scryptSync(this.settings.password.pepper, salt, 32)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
  async hashPassword(password) {
    const sha = await this.pv_sha512(password);
    const bc = await this.pv_bcrypt_hash(sha.hash);
    const aes = await this.pv_aes_encrypt(bc);
    return ':0:' + sha.salt.toString('base64') + ':' + aes.iv.toString('base64') + ':' + aes.salt.toString('base64') + ':' + aes.encrypted.toString('base64');
  }
  async verifyPassword(password, hash) {
    const parts = hash.split(':');
    if (parts.length !== 6) return false;
    if (parts[0] !== '') return false;
    parts.shift(); // remove the header part
    if (parts[0] !== '0') return false;
    parts.shift(); // remove the version part

    const [shaSalt, aesIv, aesSalt, aesEncrypted] = parts.map(part => Buffer.from(part, 'base64'));
    const sha = await this.pv_sha512_with_salt(password, shaSalt);
    const aes = await this.pv_aes_decrypt(aesIv, aesSalt, aesEncrypted);
    return await this.pv_bcrypt_verify(sha.hash, aes);
  }
};

