const nodeMailer = require('nodemailer');
const { htmlToText } = require('html-to-text');
const pug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `LEILEI <${process.env.EMAIL_FROM}>`;
  }

  // Create transport for different enviorment
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodeMailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    return nodeMailer.createTransport({
      // service:"Gmail"
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send Email
  async send(template, subject) {
    // 1) Create a email from HTML
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      url: this.url,
      firstName: this.firstName,
      subject
    });

    //2) Define Email options
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      //very important to keep it as text!!
      text: htmlToText(html)
    };
    //3) Call newTransport method and send email
    await this.newTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'WELCOME TO NATOUR FAMILY');
  }

  async sendResetPassword() {
    await this.send('resetPassword', 'Reset Password Time');
  }
};
