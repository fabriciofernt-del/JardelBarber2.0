import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });
dotenv.config({ override: true });

// Chaves com fallbacks seguros para evitar falhas silenciosas
const SUPABASE_URL = 
  process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  'https://jqrtyqsnoskeyfcffjdx.supabase.co';

const SUPABASE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcnR5cXNub3NrZXlmY2ZmamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjMzOTQsImV4cCI6MjA4NjgzOTM5NH0.lebb9Rx3yed8rxJNTbHluW5nzwsV86iAZHsp5OS0sbo';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

const EMAIL_DESTINO = 
  process.env.EMAIL_DESTINO || 
  'jardeldssbarbeiro@gmail.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Helper para formatar data e horário em pt-BR
function formatDateTime(isoString: string): { data: string; hora: string; diaSemana: string } {
  if (!isoString) return { data: '', hora: '', diaSemana: '' };
  const [datePart, timePart = '00:00'] = isoString.split('T');
  if (!datePart) return { data: isoString, hora: '', diaSemana: '' };
  
  const [year, month, day] = datePart.split('-');
  const hora = timePart.substring(0, 5);
  const data = `${day}/${month}/${year}`;
  
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const diaSemana = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  
  return { data, hora, diaSemana };
}

// Envia e-mail com fallback caso o domínio customizado não esteja ativo
async function sendResendEmail(params: {
  to: string[];
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn('Resend não configurado: RESEND_API_KEY ausente.');
    return { data: null, error: null };
  }
  try {
    const response = await resend.emails.send({
      from: 'Barbearia do Jardel <notificacoes@barbeariadojardel.com.br>',
      to: params.to,
      subject: params.subject,
      html: params.html
    });

    if (response.error) {
      console.warn('Tentativa com domínio customizado retornou erro, tentando onboarding@resend.dev:', response.error);
      const fallbackResponse = await resend.emails.send({
        from: 'Barbearia do Jardel <onboarding@resend.dev>',
        to: params.to,
        subject: params.subject,
        html: params.html
      });
      return fallbackResponse;
    }
    return response;
  } catch (err) {
    console.warn('Erro ao disparar Resend com domínio principal, usando fallback:', err);
    return await resend.emails.send({
      from: 'Barbearia do Jardel <onboarding@resend.dev>',
      to: params.to,
      subject: params.subject,
      html: params.html
    });
  }
}

// Resolver o service_id real no Supabase para evitar violação de Foreign Key
async function resolveService(serviceId: number | string, serviceName?: string): Promise<{ id: number; name: string }> {
  try {
    const { data: services } = await supabase.from('services').select('id, name').order('id');
    if (services && services.length > 0) {
      // 1. Tentar encontrar por ID exato
      const numericId = Number(serviceId);
      const byId = services.find(s => s.id === numericId);
      if (byId) return byId;

      // 2. Se for ID de pacote mockado (991 / 992) ou nome de pacote
      const nameLower = (serviceName || '').toLowerCase();
      if (numericId === 991 || (nameLower.includes('4 cortes') && !nameLower.includes('barba'))) {
        const pkg = services.find(s => s.name.toLowerCase().includes('4 cortes') && !s.name.toLowerCase().includes('barba'));
        if (pkg) return pkg;
      }
      if (numericId === 992 || (nameLower.includes('4 cortes') && nameLower.includes('barba'))) {
        const pkg = services.find(s => s.name.toLowerCase().includes('4 cortes') && s.name.toLowerCase().includes('barba'));
        if (pkg) return pkg;
      }

      // 3. Tentar encontrar pelo nome
      if (serviceName) {
        const byName = services.find(s => s.name.toLowerCase() === serviceName.toLowerCase());
        if (byName) return byName;
      }

      // 4. Fallback para o primeiro serviço ativo do banco
      return services[0];
    }
  } catch (err) {
    console.error('Erro ao consultar tabela services:', err);
  }

  return { id: Number(serviceId) || 1, name: serviceName || 'Atendimento' };
}

// Obter nome do profissional
async function resolveProfessionalName(proId: number | string, fallbackName?: string): Promise<string> {
  if (fallbackName) return fallbackName;
  try {
    const { data } = await supabase
      .from('professionals')
      .select('name')
      .eq('id', Number(proId))
      .maybeSingle();
    if (data?.name) return data.name;
  } catch (err) {
    console.error('Erro ao consultar profissional:', err);
  }
  return 'Jardel';
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const dados = req.body || {};

    const nomeCliente = dados.user_name || dados.nome || dados.client_name || 'Cliente';
    const telefoneCliente = dados.user_phone || dados.telefone || dados.client_phone || 'Não informado';
    const emailCliente = dados.user_email || dados.email || dados.client_email || null;
    const tenantId = Number(dados.tenant_id) || 1;
    const professionalId = Number(dados.professional_id) || 1;

    // Resolver serviço e profissional reais
    const resolvedService = await resolveService(dados.service_id, dados.service_name);
    const professionalName = await resolveProfessionalName(professionalId, dados.professional_name);

    // =========================================================================
    // CASO 1: PACOTE MENSAL (4 HORÁRIOS)
    // =========================================================================
    const isMonthlyPackage = 
      Boolean(dados.is_monthly_package) || 
      (Array.isArray(dados.appointments) && dados.appointments.length === 4) ||
      (Array.isArray(dados.selected_slots) && dados.selected_slots.length === 4) ||
      resolvedService.name.toLowerCase().includes('pacote mensal') ||
      resolvedService.name.toLowerCase().includes('4 cortes');

    if (isMonthlyPackage && (Array.isArray(dados.appointments) || Array.isArray(dados.selected_slots))) {
      const slots: Array<{ start_time: string; end_time?: string }> = 
        dados.appointments || dados.selected_slots;

      if (!slots || slots.length < 4) {
        return res.status(400).json({ 
          error: 'Um pacote mensal requer a seleção de exatamente 4 horários.',
          receivedCount: slots ? slots.length : 0
        });
      }

      // Preparar os 4 registros limpando colunas extras que quebrariam a query SQL
      const recordsToInsert = slots.slice(0, 4).map((slot, index) => {
        const startTime = slot.start_time;
        let endTime = slot.end_time;
        if (!endTime) {
          const startDate = new Date(startTime);
          const endDate = new Date(startDate.getTime() + 45 * 60000);
          endTime = `${startTime.split('T')[0]}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
        }

        return {
          tenant_id: tenantId,
          user_name: nomeCliente,
          user_phone: telefoneCliente,
          user_email: emailCliente,
          service_id: resolvedService.id,
          professional_id: professionalId,
          start_time: startTime,
          end_time: endTime,
          status: 'pendente'
        };
      });

      // 1. Salvar os 4 agendamentos no Supabase
      const { data: insertedData, error: insertError } = await supabase
        .from('appointments')
        .insert(recordsToInsert)
        .select();

      if (insertError) {
        console.error('Erro ao salvar os 4 agendamentos no Supabase:', insertError);
        return res.status(500).json({ 
          error: 'Erro ao salvar os 4 agendamentos no banco de dados', 
          details: insertError.message 
        });
      }

      console.log('4 agendamentos do pacote mensal salvos com sucesso no Supabase:', insertedData?.length);

      // 2. Formatando as 4 datas para o corpo do e-mail
      const datesFormattedList = recordsToInsert.map((rec, idx) => {
        const { data, hora, diaSemana } = formatDateTime(rec.start_time);
        return {
          index: idx + 1,
          data,
          hora,
          diaSemana
        };
      });

      const datesHtmlRows = datesFormattedList.map(item => `
        <tr style="border-bottom: 1px solid #262626;">
          <td style="padding: 12px 16px; font-weight: bold; color: #f59e0b;">${item.index}º Corte</td>
          <td style="padding: 12px 16px; color: #ffffff;">${item.data} <span style="color: #a3a3a3; font-size: 12px;">(${item.diaSemana})</span></td>
          <td style="padding: 12px 16px; color: #ffffff; font-weight: bold;">${item.hora}</td>
        </tr>
      `).join('');

      // 3. Enviar o e-mail via Resend listando as 4 datas
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 30px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #262626;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #f59e0b; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">Barbearia do Jardel</h1>
            <p style="color: #a3a3a3; font-size: 13px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px;">Notificação de Agendamento • Pacote Mensal</p>
          </div>

          <div style="background-color: #171717; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="color: #ffffff; margin-top: 0; font-size: 18px; margin-bottom: 12px;">👑 Novo Pacote Mensal Confirmado!</h2>
            <p style="margin: 4px 0; color: #d4d4d4;"><strong>Cliente:</strong> ${nomeCliente}</p>
            <p style="margin: 4px 0; color: #d4d4d4;"><strong>WhatsApp:</strong> ${telefoneCliente}</p>
            ${emailCliente ? `<p style="margin: 4px 0; color: #d4d4d4;"><strong>E-mail:</strong> ${emailCliente}</p>` : ''}
            <p style="margin: 4px 0; color: #d4d4d4;"><strong>Plano:</strong> <span style="color: #f59e0b; font-weight: bold;">${resolvedService.name}</span></p>
            <p style="margin: 4px 0; color: #d4d4d4;"><strong>Profissional:</strong> ${professionalName}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="color: #f59e0b; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">📅 Cronograma dos 4 Cortes Escolhidos:</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #141414; border-radius: 8px; overflow: hidden; border: 1px solid #262626;">
              <thead>
                <tr style="background-color: #1f1f1f; text-align: left; font-size: 12px; color: #a3a3a3; text-transform: uppercase;">
                  <th style="padding: 10px 16px;">Sessão</th>
                  <th style="padding: 10px 16px;">Data</th>
                  <th style="padding: 10px 16px;">Horário</th>
                </tr>
              </thead>
              <tbody>
                ${datesHtmlRows}
              </tbody>
            </table>
          </div>

          <div style="background-color: #171717; padding: 16px; border-radius: 8px; font-size: 13px; color: #a3a3a3; line-height: 1.5;">
            <p style="margin: 0;">💡 <strong>Observação:</strong> Os 4 agendamentos foram criados e salvos com sucesso no sistema. O pagamento pode ser feito presencialmente ou via PIX na barbearia.</p>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #737373;">
            <p>Barbearia do Jardel • Sistema Integrado com Supabase & Resend</p>
          </div>
        </div>
      `;

      const destinatarios = [EMAIL_DESTINO];
      if (emailCliente && emailCliente.includes('@')) {
        destinatarios.push(emailCliente);
      }

      const { data: emailData, error: emailError } = await sendResendEmail({
        to: destinatarios,
        subject: `👑 Novo Pacote Mensal (4 Cortes) - ${nomeCliente}`,
        html: emailHtml
      });

      if (emailError) {
        console.error('Aviso ao enviar e-mail com Resend (mas os 4 registros foram salvos):', emailError);
      } else {
        console.log('E-mail do pacote mensal com as 4 datas enviado com sucesso:', emailData);
      }

      return res.status(200).json({ 
        success: true, 
        isMonthlyPackage: true,
        count: recordsToInsert.length,
        data: insertedData,
        emailId: emailData?.id,
        emailSent: !emailError
      });
    }

    // =========================================================================
    // CASO 2: AGENDAMENTO AVULSO (CORTE, BARBA, COMBO, ETC.)
    // =========================================================================
    const startTime = dados.start_time;
    let endTime = dados.end_time;
    if (!endTime && startTime) {
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + 45 * 60000);
      endTime = `${startTime.split('T')[0]}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
    }

    // Filtrar apenas campos aceitos na tabela appointments
    const appointmentRecord = {
      tenant_id: tenantId,
      user_name: nomeCliente,
      user_phone: telefoneCliente,
      user_email: emailCliente,
      service_id: resolvedService.id,
      professional_id: professionalId,
      start_time: startTime,
      end_time: endTime,
      status: dados.status || 'pendente'
    };

    // 1. Salvar no Supabase
    const { data: singleData, error: singleError } = await supabase
      .from('appointments')
      .insert([appointmentRecord])
      .select()
      .single();

    if (singleError) {
      console.error('Erro ao salvar agendamento avulso no Supabase:', singleError);
      return res.status(500).json({ 
        error: 'Erro ao salvar no banco de dados', 
        details: singleError.message 
      });
    }

    console.log('Agendamento avulso salvo com sucesso no Supabase:', singleData?.id);

    // 2. Formatar data e horário para o e-mail
    const { data: dataFormatada, hora: horaFormatada, diaSemana } = formatDateTime(startTime);

    // 3. Enviar e-mail de confirmação via Resend
    const singleEmailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 30px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #262626;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">Barbearia do Jardel</h1>
          <p style="color: #a3a3a3; font-size: 13px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px;">Novo Agendamento Confirmado</p>
        </div>

        <div style="background-color: #171717; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin-top: 0; font-size: 18px; margin-bottom: 12px;">✂️ Detalhes da Reserva</h2>
          <p style="margin: 6px 0; color: #d4d4d4;"><strong>Cliente:</strong> ${nomeCliente}</p>
          <p style="margin: 6px 0; color: #d4d4d4;"><strong>WhatsApp:</strong> ${telefoneCliente}</p>
          ${emailCliente ? `<p style="margin: 6px 0; color: #d4d4d4;"><strong>E-mail:</strong> ${emailCliente}</p>` : ''}
          <p style="margin: 6px 0; color: #d4d4d4;"><strong>Serviço:</strong> <span style="color: #f59e0b; font-weight: bold;">${resolvedService.name}</span></p>
          <p style="margin: 6px 0; color: #d4d4d4;"><strong>Profissional:</strong> ${professionalName}</p>
          <p style="margin: 6px 0; color: #d4d4d4;"><strong>Data:</strong> ${dataFormatada} (${diaSemana})</p>
          <p style="margin: 6px 0; color: #d4d4d4;"><strong>Horário:</strong> <span style="color: #f59e0b; font-weight: bold;">${horaFormatada}</span></p>
        </div>

        <div style="background-color: #171717; padding: 14px; border-radius: 8px; font-size: 12px; color: #a3a3a3; text-align: center;">
          <p style="margin: 0;">O agendamento já está disponível no painel de administração.</p>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #737373;">
          <p>Barbearia do Jardel • Sistema Integrado com Supabase & Resend</p>
        </div>
      </div>
    `;

    const destinatarios = [EMAIL_DESTINO];
    if (emailCliente && emailCliente.includes('@')) {
      destinatarios.push(emailCliente);
    }

    const { data: emailData, error: emailError } = await sendResendEmail({
      to: destinatarios,
      subject: `💈 Novo agendamento - ${nomeCliente} (${dataFormatada} às ${horaFormatada})`,
      html: singleEmailHtml
    });

    if (emailError) {
      console.error('Aviso ao enviar e-mail com Resend (agendamento avulso salvo no banco):', emailError);
    } else {
      console.log('E-mail do agendamento avulso enviado com sucesso:', emailData);
    }

    return res.status(200).json({ 
      success: true, 
      data: singleData,
      emailId: emailData?.id,
      emailSent: !emailError
    });

  } catch (err: any) {
    console.error('Erro interno no servidor ao processar agendamento:', err);
    return res.status(500).json({ 
      error: 'Erro interno no servidor.', 
      details: err?.message || String(err) 
    });
  }
}
