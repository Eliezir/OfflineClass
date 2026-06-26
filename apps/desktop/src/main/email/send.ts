import nodemailer, { type Transporter } from 'nodemailer'
import type {
  EmailResultsInput,
  EmailSendResult,
  EmailSettings,
  EmailSettingsInput,
  EmailTestResult,
  SessionAnswersReview,
  StudentAnswerReview
} from '@offlineclass/shared'

import type { Db } from '../db/client'
import { loadStudentAnswers, SessionError } from '../sessions/store'
import { getEmailSettings } from './store'

function buildTransport(settings: EmailSettings | EmailSettingsInput): Transporter {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: settings.username ? { user: settings.username, pass: settings.password } : undefined
  })
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/** Verify the SMTP connection + auth without sending anything. Powers the
    "Testar conexão" button so the teacher can validate before saving. */
export async function verifyEmailSettings(settings: EmailSettingsInput): Promise<EmailTestResult> {
  try {
    const transport = buildTransport(settings)
    await transport.verify()
    return { ok: true, error: null }
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) }
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
  fromName: string,
  overrides?: { subject?: string; message?: string }
): ComposedEmail {
  const grade10 = review.maxScore > 0 ? (review.totalScore / review.maxScore) * 10 : 0
  const subject = overrides?.subject?.trim()
    ? overrides.subject.trim()
    : `Sua nota — ${review.examTitle}`

  const intro = overrides?.message?.trim() ?? ''

  // --- plaintext ---
  const textLines: string[] = []
  textLines.push(`Olá, ${review.studentName}!`)
  textLines.push('')
  if (intro) {
    textLines.push(intro)
    textLines.push('')
  }
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
  textLines.push(`— ${fromName}`)
  const text = textLines.join('\n')

  // --- HTML ---
  const rows = review.answers
    .map((a, i) => {
      const earned = earnedPoints(a)
      const earnedStr = earned === null ? '—' : fmtNum(earned)
      const comment = a.feedback
        ? `<div style="margin-top:4px;color:#555;font-size:13px;"><strong>Comentário:</strong> ${escapeHtml(
            a.feedback
          )}</div>`
        : ''
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;vertical-align:top;">
          <div style="font-weight:600;">${i + 1}. ${escapeHtml(a.question.prompt)}</div>
          ${comment}
        </td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;vertical-align:top;">
          ${earnedStr} / ${fmtNum(a.question.points)}
        </td>
      </tr>`
    })
    .join('')

  const overall = review.studentFeedback
    ? `<p style="margin:16px 0 0;padding:12px 14px;background:#f4f1ff;border-radius:10px;">
        <strong>Observações gerais:</strong> ${escapeHtml(review.studentFeedback)}
      </p>`
    : ''

  const introHtml = intro
    ? `<p style="margin:0 0 16px;">${escapeHtml(intro).replace(/\n/g, '<br>')}</p>`
    : ''

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;">
    <h2 style="margin:0 0 4px;">Olá, ${escapeHtml(review.studentName)}!</h2>
    ${introHtml}
    <p style="margin:0 0 16px;color:#555;">Prova: <strong>${escapeHtml(review.examTitle)}</strong></p>
    <div style="display:inline-block;padding:12px 18px;background:#5b3df5;color:#fff;border-radius:12px;font-size:20px;font-weight:700;">
      Nota: ${fmtNum(Math.round(grade10 * 10) / 10)} / 10
    </div>
    <p style="margin:8px 0 16px;color:#888;font-size:13px;">${fmtNum(review.totalScore)} de ${fmtNum(
      review.maxScore
    )} pontos</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 10px;border-bottom:2px solid #ddd;">Questão</th>
          <th style="text-align:right;padding:8px 10px;border-bottom:2px solid #ddd;">Pontos</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${overall}
    <p style="margin:24px 0 0;color:#888;font-size:13px;">— ${escapeHtml(fromName)}</p>
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
  const settings = getEmailSettings(db, ownerId)
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

    const { subject, text, html } = composeResultEmail(review, settings.fromName, {
      subject: input.subject,
      message: input.message
    })

    try {
      await transport.sendMail({ from, to: review.studentEmail, subject, text, html })
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

  return results
}
