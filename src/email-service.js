import { db } from './firebase-config.js';
import { collection, addDoc } from 'firebase/firestore';

export async function sendConfirmationEmail(reservation) {
  const { date, time, guests, email } = reservation;

  // Format date for Dutch locale
  const formattedDate = new Date(date).toLocaleDateString('nl-BE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = 'Bevestiging van uw reservering';

  // HTML Email Template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
    .logo { width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px; }
    .content { padding: 20px 0; }
    .details { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .footer { text-align: center; font-size: 0.8rem; color: #999; margin-top: 20px; border-top: 1px solid #f0f0f0; padding-top: 10px; }
    h1 { color: #ff7a5c; margin: 0; font-size: 24px; }
    p { margin: 10px 0; }
    strong { color: #555; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="http://localhost:5173/logo.png" alt="Logo" class="logo">
      <h1>Reservering Bevestigd!</h1>
    </div>
    <div class="content">
      <p>Beste klant,</p>
      <p>Bedankt voor uw reservering. We kijken ernaar uit u te mogen verwelkomen!</p>
      
      <div class="details">
        <p><strong>Datum:</strong> ${formattedDate}</p>
        <p><strong>Tijd:</strong> ${time}</p>
        <p><strong>Aantal gasten:</strong> ${guests}</p>
      </div>
      
      <p>Mocht u verhinderd zijn, laat het ons dan zo snel mogelijk weten.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${window.location.origin}/cancel.html?id=${reservation.id}" style="background-color: #e57373; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reservering Annuleren</a>
      </div>
    </div>
    <div class="footer">
      <p>Tot snel!</p>
      <p>&copy; ${new Date().getFullYear()} Uw Restaurant</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await addDoc(collection(db, 'mail'), {
      to: [email],
      message: {
        subject: subject,
        html: html
      }
    });

    console.group('📧 Email Queued in Firestore');
    console.log(`To: ${email}`);
    console.log('Status: Document added to "mail" collection.');
    console.groupEnd();
  } catch (error) {
    console.error('Error queuing email:', error);
  }
}

