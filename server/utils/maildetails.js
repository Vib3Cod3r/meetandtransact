const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      type: 'login',
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    secure: false,
  });
function getFromAddress() {
  return "Queen Street Gardens <" + process.env.FROM_EMAIL + ">";
}

function getReplyToAddress() {
  return process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL;
}

function sendSystemEmail(email, subject, html, options = {}) {
  
  const mailOptions = {
    from: getFromAddress(),
    to: email,
    replyTo: getReplyToAddress(),
    subject: `Queen Street Gardens - ${subject}`,
    html: html,
    ...options
  };
  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendSystemEmail
};
