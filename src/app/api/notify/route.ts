// app/api/notify/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Peschiamo la chiave in modo sicuro dall'ambiente
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { first_name, last_name, email, phone, type, provinces } = data;

    // Usiamo Resend per inviare l'email a noi stessi!
    await resend.emails.send({
      from: 'CashflowScore <support@info.cashflowscore.app>', // Il mittente (deve essere il dominio verificato su Resend)
      to: 'support@cashflowscore.app', // Il destinatario (te stesso)
      subject: `🔥 Nuova Candidatura B2B: ${first_name} ${last_name}`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2>Hai ricevuto una nuova richiesta di accesso!</h2>
            <p>Un consulente ha appena compilato il form su CashflowScore.</p>
            <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Nome:</strong> ${first_name} ${last_name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefono:</strong> ${phone}</p>
                <p><strong>Ruolo:</strong> ${type}</p>
                <p><strong>Province:</strong> ${provinces}</p>
            </div>
            <p>Vai sulla dashboard di Supabase (tabella <i>join_requests</i>) per vedere i dettagli completi, come l'accettazione dell'online e le specializzazioni, e decidere se approvarlo.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore invio notifica Resend:', error);
    return NextResponse.json({ error: 'Errore invio email' }, { status: 500 });
  }
}