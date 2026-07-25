/**
 * SMS Adapter — pluggable interface for OTP delivery.
 * Currently logs to console (dev mode).
 * To wire a real provider (Twilio, Unifonic, etc.) replace sendSms()
 * without touching any other file — the interface stays the same.
 */

async function sendSms(phone, message) {
  if (process.env.SMS_PROVIDER === 'twilio') {
    // Future: require('twilio')(SID, TOKEN).messages.create(...)
    throw new Error('Twilio not yet configured — owner must approve and add credentials');
  }

  // Default: console (dev)
  console.log(`\n📱 SMS to ${phone}:\n${message}\n`);
  return { sent: true, provider: 'console' };
}

async function sendOtp(phone, code) {
  return sendSms(phone, `Your Ahilney verification code is: ${code}\nValid for 10 minutes.`);
}

module.exports = { sendOtp };
