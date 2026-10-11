/**
 * lateJoinPdfExporter.ts
 *
 * Client-side PDF generator for Late Join Catch-Up.
 *
 * Uses html2canvas + jsPDF to render crisp, high-resolution pages supporting
 * Noto Sans Malayalam, bilingual text, styled cards, weak prerequisite callouts,
 * teacher emphasis flags, and answer keys on the final page.
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { LateJoinCatchUpData } from '../types/lateJoinCatchUpTypes';

export async function exportLateJoinCatchUpPDF(params: {
  data: LateJoinCatchUpData;
  language: 'en' | 'ml';
}): Promise<void> {
  const { data, language } = params;
  const isMl = language === 'ml';

  // Create an offscreen DOM container with print styling
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // Standard A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#18181b';
  container.style.padding = '36px 42px';
  container.style.fontFamily = isMl
    ? "'Noto Sans Malayalam', 'Inter', system-ui, sans-serif"
    : "'Inter', system-ui, sans-serif";
  container.style.lineHeight = '1.6';

  const briefList = isMl ? data.ninetySecondBriefMl : data.ninetySecondBriefEn;

  container.innerHTML = `
    <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-size: 11px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 999px;">
            ${isMl ? 'വ്യക്തിഗത ക്യാച്ച്-അപ്പ് റിപ്പോർട്ട്' : 'Personalized Late-Join Catch-Up'}
          </span>
          <h1 style="font-size: 24px; font-weight: 900; margin: 8px 0 4px 0; color: #09090b;">
            ${data.className} (Code: ${data.classCode})
          </h1>
          <p style="font-size: 13px; color: #52525b; margin: 0;">
            <strong>${isMl ? 'വിദ്യാർത്ഥി' : 'Student'}:</strong> ${data.studentName} &nbsp;|&nbsp; 
            <strong>${isMl ? 'നഷ്ടപ്പെട്ട സമയം' : 'Missed Range'}:</strong> ${data.missedFromFormatted} – ${data.missedToFormatted} (${data.missedMinutesCount} ${isMl ? 'മിനിറ്റ്' : 'mins'})
          </p>
        </div>
        <div style="text-align: right; font-size: 11px; color: #71717a;">
          <div>${isMl ? 'തയ്യാറാക്കിയത്' : 'Generated'}: ${new Date(data.generatedAt).toLocaleString()}</div>
          <div style="margin-top: 4px; font-weight: 700; color: ${data.generatorMode === 'ai' ? '#059669' : '#d97706'};">
            ${data.generatorMode === 'ai' ? 'Summary Engine: Gemini AI' : 'Summary Engine: Deterministic Extractive'}
          </div>
        </div>
      </div>
    </div>

    <!-- 90-Second Brief -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 22px;">
      <h2 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px;">
        ⏱️ ${isMl ? '90-സെക്കൻഡ് ചുരുക്കം (നിങ്ങൾ നഷ്ടപ്പെടുത്തിയത്)' : '90-Second Executive Brief (What You Missed)'}
      </h2>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
        ${briefList.map((b) => `<li style="margin-bottom: 6px;">${b}</li>`).join('')}
      </ul>
    </div>

    <!-- Personalized Alert if any -->
    ${
      data.studentPersonalizedAlert
        ? `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin-bottom: 22px;">
        <div style="font-size: 12px; font-weight: 800; color: #92400e; margin-bottom: 4px;">
          ⚠️ ${isMl ? 'വ്യക്തിഗത മുന്നറിയിപ്പ് (നിങ്ങളുടെ ലേണിംഗ് പ്രൊഫൈൽ പ്രകാരം)' : 'Personalized Knowledge Prerequisite Warning'}
        </div>
        <div style="font-size: 13px; color: #78350f; font-weight: 600;">
          ${data.studentPersonalizedAlert.advice}
        </div>
      </div>
    `
        : ''
    }

    <!-- Slides Covered -->
    <div style="margin-bottom: 22px;">
      <h2 style="font-size: 15px; font-weight: 800; color: #09090b; margin: 0 0 12px 0;">
        📑 ${isMl ? 'നഷ്ടപ്പെട്ട സമയത്ത് ക്ലാസ്സിൽ എടുത്ത സ്ലൈഡുകൾ' : 'Slides Covered During Missed Period'}
      </h2>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${data.missedSlides
          .map(
            (s) => `
          <div style="border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px 16px; background: #fafafa;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 13px; font-weight: 800; color: #18181b;">
                Slide ${s.slideIndex + 1}: ${s.slideTitle}
              </span>
            </div>
            <div style="font-size: 12px; color: #52525b; line-height: 1.6;">
              <strong>${isMl ? 'പ്രധാന പോയിന്റുകൾ' : 'Key Spoken Points'}:</strong>
              <ul style="margin: 4px 0 0 18px; padding: 0;">
                ${s.spokenKeyPoints.map((p) => `<li>${p}</li>`).join('')}
              </ul>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Teacher Flagged Important -->
    ${
      data.teacherFlaggedImportant.length > 0
        ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 18px; margin-bottom: 22px;">
        <h3 style="font-size: 13px; font-weight: 800; color: #991b1b; margin: 0 0 8px 0;">
          📌 ${isMl ? 'അധ്യാപകൻ പ്രത്യേകം എടുത്തുപറഞ്ഞത് (പരീക്ഷാ പോയിന്റുകൾ)' : 'Teacher Flagged as Important / Exam Critical'}
        </h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #7f1d1d; line-height: 1.6;">
          ${data.teacherFlaggedImportant.map((f) => `<li style="margin-bottom: 4px;">"${f}"</li>`).join('')}
        </ul>
      </div>
    `
        : ''
    }

    <!-- Key Concepts -->
    <div style="margin-bottom: 22px;">
      <h2 style="font-size: 15px; font-weight: 800; color: #09090b; margin: 0 0 10px 0;">
        💡 ${isMl ? 'പുതിയ അടിസ്ഥാന ആശയങ്ങൾ' : 'Key Concepts Introduced'}
      </h2>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${data.keyConcepts
          .map(
            (c) => `
          <div style="border: 1px solid #e4e4e7; background: #ffffff; padding: 8px 12px; border-radius: 8px; font-size: 12px;">
            <strong style="color: #09090b;">${c.conceptName}</strong>: 
            <span style="color: #52525b;">${isMl ? c.oneLineDefinitionMl : c.oneLineDefinitionEn}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <!-- Cleaned Transcript Digest -->
    <div style="margin-bottom: 24px; border: 1px solid #e4e4e7; border-radius: 12px; padding: 14px 18px;">
      <h3 style="font-size: 13px; font-weight: 800; color: #27272a; margin: 0 0 6px 0;">
        🎙️ ${isMl ? 'ഓഡിയോ ട്രാൻസ്ക്രിപ്റ്റ് സംഗ്രഹം (ഫില്ലറുകൾ ഒഴിവാക്കിയത്)' : 'Audio Transcript Digest (Fillers Removed)'}
      </h3>
      <p style="font-size: 12px; color: #52525b; line-height: 1.6; margin: 0;">
        ${data.transcriptDigest}
      </p>
    </div>

    <!-- Quick-Check Questions -->
    ${
      data.quickCheckQuestions.length > 0
        ? `
      <div style="page-break-before: always; padding-top: 18px; border-top: 2px solid #e4e4e7;">
        <h2 style="font-size: 16px; font-weight: 900; color: #09090b; margin: 0 0 12px 0;">
          📝 ${isMl ? 'ക്വിക്ക്-ചെക്ക് ചോദ്യങ്ങൾ' : 'Recovery Quick-Check Questions'}
        </h2>
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
          ${data.quickCheckQuestions
            .map(
              (q, qIdx) => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
              <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;">
                Q${qIdx + 1}. ${q.question}
              </p>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: #334155;">
                ${q.options
                  .map(
                    (opt, optIdx) => `
                  <div style="padding: 6px 10px; border-radius: 6px; background: #ffffff; border: 1px solid #cbd5e1;">
                    <strong>${String.fromCharCode(65 + optIdx)})</strong> ${opt}
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Answer Key & Explanations on Last Page Section -->
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px;">
          <h3 style="font-size: 14px; font-weight: 800; color: #065f46; margin: 0 0 8px 0;">
            ✓ ${isMl ? 'ഉത്തരസൂചികയും വിശദീകരണങ്ങളും' : 'Answer Key & Explanations'}
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #047857; line-height: 1.6;">
            ${data.quickCheckQuestions
              .map(
                (q, qIdx) => `
              <li style="margin-bottom: 6px;">
                <strong>Q${qIdx + 1}: Option ${String.fromCharCode(65 + q.correctIndex)}</strong> — ${q.explanation}
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      </div>
    `
        : ''
    }

    <!-- Footer -->
    <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #e4e4e7; display: flex; justify-content: space-between; font-size: 10px; color: #a1a1aa;">
      <span>LectureLens • AI Classroom Accessibility & Learning Recovery</span>
      <span>${isMl ? 'റിപ്പോർട്ട് സമയം' : 'Report generated at'}: ${new Date(data.generatedAt).toISOString()}</span>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const totalPdfHeight = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = totalPdfHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
    heightLeft -= pdfHeight;

    // Subsequent pages if content overflows
    while (heightLeft > 0) {
      position = -(totalPdfHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`LectureLens-LateCatchUp-${data.classCode}-${Date.now()}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
