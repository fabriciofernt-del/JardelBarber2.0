import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });
dotenv.config({ override: true });

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_DESTINO = process.env.EMAIL_DESTINO || 'jardeldssbarbeiro@gmail.com';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const data = req.body.record || req.body;

    const nome = data.nome || data.client_name || data.user_name;
    const telefone = data.telefone || data.client_phone || data.user_phone;
    const servico = data.servico || data.service || data.service_name;
    const dataAgendamento = data.data || data.date || (data.start_time ? data.start_time.split('T')[0] : '');
    const hora = data.hora || data.time || (data.start_time ? data.start_time.split('T')[1]?.substring(0, 5) : '');
    const barbeiro = data.barbeiro || data.barber_name || 'Jardel';
    const clienteEmail = data.email || data.client_email || data.user_email;

    if (!nome || !dataAgendamento || !hora) {
      console.log('Dados recebidos incompletos no webhook:', req.body);
      return res.status(400).json({ 
        error: 'Dados incompletos. Certifique-se de enviar nome, data e hora.' 
      });
    }

    // --- 1. ENVIO DE WHATSAPP (META CLOUD API SE CONFIGURADA) ---
    let whatsappId = null;
    if (process.env.WHATSAPP_TOKEN) {
      try {
        const whatsappMessage = `✂️ *NOVO AGENDAMENTO*\n\n👤 Cliente: ${nome}\n📱 Telefone: ${telefone || 'Não informado'}\n💈 Serviço: ${servico || 'Atendimento'}\n📅 Data: ${dataAgendamento}\n⏰ Horário: ${hora}\n🧔 Barbeiro: ${barbeiro}`;

        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v20.0/1120552827797911/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: "5585999451711",
              type: "text",
              text: { body: whatsappMessage },
            }),
          }
        );

        const whatsappResult = await whatsappResponse.json();
        if (whatsappResult.messages && whatsappResult.messages.length > 0) {
          whatsappId = whatsappResult.messages[0].id;
        }
      } catch (whatsappError) {
        console.warn('Aviso WhatsApp:', whatsappError);
      }
    }

    // --- 2. ENVIO DE E-MAIL (RESEND) COM FALLBACK ---
    let emailData = null;
    if (resend) {
      try {
        const emailRes = await resend.emails.send({
        from: 'Barbearia do Jardel <notificacoes@barbeariadojardel.com.br>',
        to: [EMAIL_DESTINO],
        subject: `Novo agendamento - ${nome}`,
        html: `
          <h2>Novo agendamento</h2>
          <p><strong>Cliente:</strong> ${nome}</p>
          <p><strong>Telefone:</strong> ${telefone || 'Não informado'}</p>
          <p><strong>Serviço:</strong> ${servico || 'Serviço da Barbearia'}</p>
          <p><strong>Data:</strong> ${dataAgendamento}</p>
          <p><strong>Horário:</strong> ${hora}</p>
        `
      });

      if (emailRes.error) {
        console.warn('Erro domínio customizado no webhook, tentando onboarding@resend.dev');
        emailData = await resend.emails.send({
          from: 'Barbearia do Jardel <onboarding@resend.dev>',
          to: [EMAIL_DESTINO],
          subject: `Novo agendamento - ${nome}`,
          html: `
            <h2>Novo agendamento</h2>
            <p><strong>Cliente:</strong> ${nome}</p>
            <p><strong>Telefone:</strong> ${telefone || 'Não informado'}</p>
            <p><strong>Serviço:</strong> ${servico || 'Serviço da Barbearia'}</p>
            <p><strong>Data:</strong> ${dataAgendamento}</p>
            <p><strong>Horário:</strong> ${hora}</p>
          `
        });
      } else {
        emailData = emailRes;
      }
      } catch (e) {
        console.error('Erro Resend no webhook:', e);
      }
    } else {
      console.warn('Resend não configurado no webhook: RESEND_API_KEY ausente.');
    }

    return res.status(200).json({ 
      success: true, 
      whatsappId,
      emailId: (emailData as any)?.data?.id
    });

  } catch (err: any) {
    console.error('Erro no Webhook:', err);
    return res.status(500).json({ error: 'Erro interno no servidor.', details: err.message });
  }
}
