import nodemailer, { type Transporter } from 'nodemailer'
import type {
  EmailResultsInput,
  EmailSendResult,
  EmailSettingsInput,
  EmailTestResult,
  SessionAnswersReview,
  StudentAnswerReview
} from '@offlineclass/shared'

import type { Db } from '../db/client'
import { loadStudentAnswers, markResultsSent, SessionError } from '../sessions/store'
import { getEmailSecret } from './store'

function buildTransport(settings: EmailSettingsInput): Transporter {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: settings.username ? { user: settings.username, pass: settings.password } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000
  })
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/** Verify the SMTP connection + auth without sending anything. Powers the
    "Testar conexão" button so the teacher can validate before saving. */
export async function verifyEmailSettings(settings: EmailSettingsInput): Promise<EmailTestResult> {
  const transport = buildTransport(settings)
  try {
    await transport.verify()
    return { ok: true, error: null }
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) }
  } finally {
    transport.close()
  }
}

function fmtNum(n: number): string {
  return (Math.round(n * 100) / 100).toString()
}

/** Points the student earned on a single answer, mirroring the points-weighted
    grading in loadStudentAnswers (auto kinds store earned points; manual kinds
    store a 0–1 fraction × the question's weight). */
function earnedPoints(a: StudentAnswerReview): number | null {
  if (a.score === null) return null
  return a.correct !== null ? a.score : a.score * a.question.points
}

interface ComposedEmail {
  subject: string
  text: string
  html: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Build the per-student grade e-mail (subject + plaintext + HTML). */
export function composeResultEmail(
  review: SessionAnswersReview,
  sender: { name: string; email: string },
  overrides?: { subject?: string; message?: string }
): ComposedEmail {
  const grade10 = review.maxScore > 0 ? (review.totalScore / review.maxScore) * 10 : 0
  const discipline = review.examSubject?.trim() || null
  const subject = overrides?.subject?.trim()
    ? overrides.subject.trim()
    : `Sua nota — ${discipline ? `${discipline} · ` : ''}${review.examTitle}`

  const intro = overrides?.message?.trim() ?? ''

  // --- plaintext ---
  const textLines: string[] = []
  textLines.push(`Olá, ${review.studentName}!`)
  textLines.push('')
  if (intro) {
    textLines.push(intro)
    textLines.push('')
  }
  if (discipline) textLines.push(`Disciplina: ${discipline}`)
  textLines.push(`Prova: ${review.examTitle}`)
  textLines.push(
    `Nota: ${fmtNum(Math.round(grade10 * 10) / 10)} / 10 ` +
      `(${fmtNum(review.totalScore)} de ${fmtNum(review.maxScore)} pontos)`
  )
  textLines.push('')
  textLines.push('Detalhes por questão:')
  review.answers.forEach((a, i) => {
    const earned = earnedPoints(a)
    const earnedStr = earned === null ? '—' : fmtNum(earned)
    textLines.push(`${i + 1}. ${a.question.prompt}`)
    textLines.push(`   Pontos: ${earnedStr} / ${fmtNum(a.question.points)}`)
    if (a.feedback) textLines.push(`   Comentário: ${a.feedback}`)
  })
  if (review.studentFeedback) {
    textLines.push('')
    textLines.push(`Observações gerais: ${review.studentFeedback}`)
  }
  textLines.push('')
  textLines.push(`— ${sender.name}`)
  textLines.push(sender.email)
  textLines.push('')
  textLines.push('Enviado pela plataforma OfflineClass')
  const text = textLines.join('\n')

  // --- HTML (minimalist OfflineClass template) ---
  const gradeStr = fmtNum(Math.round(grade10 * 10) / 10)
  const meta = discipline ? `${discipline} · ${review.examTitle}` : review.examTitle

  const rows = review.answers
    .map((a, i) => {
      const earned = earnedPoints(a)
      const earnedStr = earned === null ? '—' : fmtNum(earned)
      const comment = a.feedback
        ? `<div style="margin-top:6px;color:#6b6b7a;font-size:13px;line-height:1.5;">${escapeHtml(
            a.feedback
          )}</div>`
        : ''
      return `<tr>
        <td style="padding:14px 0;border-top:1px solid #eeeef2;vertical-align:top;">
          <div style="color:#1f2430;font-size:14px;line-height:1.45;">
            <span style="color:#9a9aa8;">${i + 1}.</span> ${escapeHtml(a.question.prompt)}
          </div>
          ${comment}
        </td>
        <td style="padding:14px 0 14px 16px;border-top:1px solid #eeeef2;text-align:right;white-space:nowrap;vertical-align:top;color:#1f2430;font-size:14px;font-weight:500;">
          ${earnedStr}<span style="color:#b4b4c0;"> / ${fmtNum(a.question.points)}</span>
        </td>
      </tr>`
    })
    .join('')

  const overall = review.studentFeedback
    ? `<div style="margin:22px 0 0;padding:16px 18px;background:#f7f7fa;border-radius:12px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9a9aa8;margin-bottom:4px;">Observações gerais</div>
        <div style="color:#3a3a48;font-size:14px;line-height:1.55;">${escapeHtml(
          review.studentFeedback
        )}</div>
      </div>`
    : ''

  const introHtml = intro
    ? `<p style="margin:0 0 20px;color:#5a5a68;font-size:15px;line-height:1.6;">${escapeHtml(
        intro
      ).replace(/\n/g, '<br>')}</p>`
    : ''

  const html = `<div style="margin:0;padding:32px 16px;background:#ffffff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ececf0;border-radius:18px;">
      <div style="padding:24px 32px;border-bottom:1px solid #f0f0f4;">
        <span style="font-size:15px;font-weight:600;color:#1f2430;letter-spacing:-0.2px;">OfflineClass</span>
      </div>
      <div style="padding:28px 32px 32px;">
        <h1 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#1f2430;">Olá, ${escapeHtml(
          review.studentName
        )}</h1>
        <p style="margin:0 0 22px;color:#9a9aa8;font-size:14px;">${escapeHtml(meta)}</p>
        ${introHtml}
        <div style="background:#eef0fb;border:1px solid #e2e6f5;border-radius:14px;padding:20px 22px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#1f2430;">Sua nota</div>
          <div style="margin-top:2px;font-size:36px;font-weight:600;color:#1f2430;line-height:1.1;">${gradeStr}<span style="font-size:17px;font-weight:500;color:#6b6b7a;"> / 10</span></div>
          <div style="margin-top:2px;font-size:13px;color:#6b6b7a;">${fmtNum(
            review.totalScore
          )} de ${fmtNum(review.maxScore)} pontos</div>
        </div>
        <div style="margin:28px 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9a9aa8;">Detalhes por questão</div>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>${rows}</tbody>
        </table>
        ${overall}
      </div>
      <div style="padding:20px 32px;border-top:1px solid #f0f0f4;">
        <div style="font-size:14px;font-weight:500;color:#1f2430;">${escapeHtml(sender.name)}</div>
        <div style="font-size:13px;color:#9a9aa8;">${escapeHtml(sender.email)}</div>
        <div style="margin-top:12px;font-size:12px;color:#b4b4c0;">Enviado pela plataforma OfflineClass</div>
      </div>
    </div>
  </div>`

  return { subject, text, html }
}

/** Send each selected student their grade e-mail. Returns a per-student outcome
    list (students without an e-mail are reported as failed, not silently
    skipped). Throws SessionError when SMTP isn't configured. */
export async function sendResults(
  db: Db,
  sessionId: string,
  ownerId: string,
  input: EmailResultsInput
): Promise<EmailSendResult[]> {
  const settings = getEmailSecret(db, ownerId)
  if (!settings) {
    throw new SessionError('Configure o e-mail (SMTP) nas Configurações primeiro', 'BAD_STATE')
  }

  const transport = buildTransport(settings)
  const from = `"${settings.fromName}" <${settings.fromEmail}>`
  const results: EmailSendResult[] = []

  for (const studentId of input.studentIds) {
    // loadStudentAnswers re-verifies owner → session → student scoping.
    let review: SessionAnswersReview
    try {
      review = loadStudentAnswers(db, sessionId, studentId, ownerId)
    } catch (err) {
      results.push({
        studentId,
        name: studentId,
        email: null,
        ok: false,
        error: toErrorMessage(err)
      })
      continue
    }

    if (!review.studentEmail) {
      results.push({
        studentId,
        name: review.studentName,
        email: null,
        ok: false,
        error: 'Aluno sem e-mail cadastrado'
      })
      continue
    }

    const { subject, text, html } = composeResultEmail(
      review,
      { name: settings.fromName, email: settings.fromEmail },
      { subject: input.subject, message: input.message }
    )

    try {
      await transport.sendMail({
        from,
        to: review.studentEmail,
        replyTo: settings.fromEmail,
        subject,
        text,
        html
      })
      markResultsSent(db, studentId, new Date())
      results.push({
        studentId,
        name: review.studentName,
        email: review.studentEmail,
        ok: true,
        error: null
      })
    } catch (err) {
      results.push({
        studentId,
        name: review.studentName,
        email: review.studentEmail,
        ok: false,
        error: toErrorMessage(err)
      })
    }
  }

  transport.close()
  return results
}
