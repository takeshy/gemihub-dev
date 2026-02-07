// Client-side session cache for encryption password and private key.
// Keeps credentials in memory so the user only enters the password once per session.

let _password: string | null = null;
let _privateKey: string | null = null;

export const cryptoCache = {
  setPassword(password: string) {
    _password = password;
  },
  getPassword(): string | null {
    return _password;
  },
  hasPassword(): boolean {
    return _password !== null;
  },

  setPrivateKey(key: string) {
    _privateKey = key;
  },
  getPrivateKey(): string | null {
    return _privateKey;
  },
  hasPrivateKey(): boolean {
    return _privateKey !== null;
  },

  clear() {
    _password = null;
    _privateKey = null;
  },
  isEmpty(): boolean {
    return _password === null && _privateKey === null;
  },
};
