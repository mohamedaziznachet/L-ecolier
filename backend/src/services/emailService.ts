// src/server/emailService.ts
import nodemailer from 'nodemailer';

// Email transporter configuration
const createTransporter = () => {
  const port = parseInt(process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true for 465 (SSL), false for other ports (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // Secure TLS: Reject unauthorized self-signed certificates in production by default
      rejectUnauthorized: process.env.SMTP_SECURE_REJECT_UNAUTHORIZED !== 'false',
    },
  });
};

// Send order confirmation email
export const sendOrderConfirmation = async (email: string, orderDetails: any) => {
  if (process.env.NODE_ENV === 'test') return;
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL MOCK] Order confirmation email would be sent to: ${email} for order ${orderDetails._id || orderDetails.id}`);
    return;
  }

  try {
    const transporter = createTransporter();
    const itemsList = (orderDetails.items || []).map((i: any) => 
      `<li>${i.name} x ${i.quantity} - ${(i.unitPrice * i.quantity).toFixed(2)} DT</li>`
    ).join('');

    await transporter.sendMail({
      from: `"L'Écolier Orders" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Confirmation de votre commande #${orderDetails._id || orderDetails.id}`,
      html: `
        <h2>Merci pour votre commande !</h2>
        <p>Bonjour ${orderDetails.customerName || 'Client'},</p>
        <p>Nous avons bien reçu votre commande.</p>
        <h3>Détails de la commande :</h3>
        <ul>
          ${itemsList}
        </ul>
        <p><strong>Total : ${(orderDetails.total || 0).toFixed(2)} DT</strong></p>
        <p>Méthode de paiement : ${orderDetails.paymentMethod || 'Non spécifiée'}</p>
        <p>Nous vous tiendrons informé de l'état de préparation de votre commande.</p>
      `
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }
};

// Send order status update email
export const sendOrderStatusUpdate = async (email: string, orderDetails: any, status: string) => {
  if (process.env.NODE_ENV === 'test') return;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL MOCK] Order status update email would be sent to: ${email} for order ${orderDetails._id || orderDetails.id} with status ${status}`);
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"L'Écolier Orders" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Mise à jour de votre commande #${orderDetails._id || orderDetails.id}`,
      html: `
        <h2>Votre commande a été mise à jour</h2>
        <p>Bonjour ${orderDetails.customerName || 'Client'},</p>
        <p>L'état de votre commande #${orderDetails._id || orderDetails.id} est maintenant : <strong>${status}</strong>.</p>
        <p>Merci de votre confiance !</p>
      `
    });
  } catch (error) {
    console.error('Failed to send order status update email:', error);
  }
};

// Send welcome email for new users
export const sendWelcomeEmail = async (email: string, name: string) => {
  if (process.env.NODE_ENV === 'test') return;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL MOCK] Welcome email would be sent to: ${email}`);
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"L'Écolier Welcome" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Bienvenue chez L'Écolier",
      html: `
        <h2>Bienvenue sur L'Écolier !</h2>
        <p>Bonjour ${name},</p>
        <p>Votre compte a été créé avec succès.</p>
        <p>Vous pouvez maintenant vous connecter et commencer vos achats.</p>
      `
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

// Send Password Reset Email (Real SMTP)
export const sendPasswordResetEmail = async (email: string, token: string) => {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?view=reset&token=${token}&email=${encodeURIComponent(email)}`;
    await transporter.sendMail({
      from: `"L'Écolier Security" <${process.env.SMTP_USER || 'no-reply@lecolier.tn'}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Veuillez cliquer sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:5px;">Réinitialiser mon mot de passe</a>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
        <p>Ce lien expirera dans 1 heure.</p>
      `
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};
