import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Logger from "./logger.mjs";
dotenv.config({ quiet: true });

class mailer {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendVerificationCode(toEmail, verificationCode) {
    try {
      await this.transporter.sendMail({
        from: `"MoiDoctor" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "Your MoiDoctor Verification Code",
        html: `
          <h2>Verify your account</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing:4px;">${verificationCode}</h1>
          <p>This code is valid for 24 hours.</p>
        `,
      });
    } catch (err) {
      Logger.ERROR(err);
    }
  }

  async sendPasswordResetCode(toEmail, verificationCode) {
    try {
      await this.transporter.sendMail({
        from: `"MoiDoctor" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "MoiDoctor Password Reset",
        html: `
          <h2>Password Reset Request</h2>
          <p>Use your verification code below to reset your password:</p>
          <h1 style="letter-spacing:4px;">${verificationCode}</h1>
          <p>If you did not request this, ignore this email.</p>
        `,
      });
    } catch (err) {
      Logger.ERROR(err);
    }
  }
}

export const Mailer = new mailer();

export default Mailer;
