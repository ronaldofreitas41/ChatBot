let qrCode = null;
let connected = false;

export function setQRCode(qr) {
  qrCode = qr;
}

export function setConnected(value) {
  connected = value;

  if (value) {
    qrCode = null;
  }
}

export function getWhatsAppStatus() {
  return {
    connected,
    qr: qrCode,
  };
}