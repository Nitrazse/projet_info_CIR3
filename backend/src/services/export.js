import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { supabaseAdmin } from '../config/supabase.js';

// ─── PDF ──────────────────────────────────────────────────────────────────────

/**
 * Génère un rapport PDF complet d'un projet (infos + tâches + livrables)
 * et le pipe directement dans res.
 */
export async function generateProjectPDF(projectId, res) {
  const [{ data: project }, { data: tasks }, { data: deliverables }] = await Promise.all([
    supabaseAdmin.from('projects').select('*').eq('id', projectId).single(),
    supabaseAdmin.from('tasks').select('*').eq('project_id', projectId).order('created_at'),
    supabaseAdmin.from('deliverables').select('*').eq('project_id', projectId).order('created_at'),
  ]);

  if (!project) throw new Error('Projet introuvable');

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="rapport_projet_${projectId}.pdf"`);
  doc.pipe(res);

  // En-tête
  doc.fontSize(22).fillColor('#1a1a2e').text(`Rapport de projet`, { align: 'center' });
  doc.fontSize(16).fillColor('#333').text(project.nom, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#888').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
  doc.moveDown(1.5);

  // Informations générales
  doc.fontSize(14).fillColor('#1a1a2e').text('Informations générales', { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#333');
  if (project.description) doc.text(`Description : ${project.description}`);
  if (project.statut)      doc.text(`Statut : ${project.statut}`);
  if (project.date_debut)  doc.text(`Début : ${new Date(project.date_debut).toLocaleDateString('fr-FR')}`);
  if (project.date_fin)    doc.text(`Fin : ${new Date(project.date_fin).toLocaleDateString('fr-FR')}`);
  doc.moveDown(1);

  // Tâches
  doc.fontSize(14).fillColor('#1a1a2e').text('Tâches', { underline: true });
  doc.moveDown(0.3);
  if (!tasks?.length) {
    doc.fontSize(11).fillColor('#888').text('Aucune tâche');
  } else {
    tasks.forEach((t, i) => {
      doc.fontSize(11).fillColor('#333').text(`${i + 1}. ${t.titre}  [${t.statut ?? '-'}]`);
      if (t.description) doc.fontSize(10).fillColor('#555').text(`   ${t.description}`);
    });
  }
  doc.moveDown(1);

  // Livrables
  doc.fontSize(14).fillColor('#1a1a2e').text('Livrables', { underline: true });
  doc.moveDown(0.3);
  if (!deliverables?.length) {
    doc.fontSize(11).fillColor('#888').text('Aucun livrable');
  } else {
    deliverables.forEach((d, i) => {
      doc.fontSize(11).fillColor('#333').text(
        `${i + 1}. ${d.nom}  [${d.statut}]  — ${new Date(d.created_at).toLocaleDateString('fr-FR')}`,
      );
    });
  }

  doc.end();
}

/**
 * Génère un PDF des évaluations d'un projet.
 */
export async function generateEvaluationsPDF(projectId, res) {
  const [{ data: project }, { data: evaluations }] = await Promise.all([
    supabaseAdmin.from('projects').select('nom').eq('id', projectId).single(),
    supabaseAdmin.from('evaluations').select('*').eq('project_id', projectId).order('created_at'),
  ]);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="evaluations_${projectId}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).fillColor('#1a1a2e').text('Évaluations', { align: 'center' });
  doc.fontSize(14).fillColor('#333').text(project?.nom ?? projectId, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#888').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
  doc.moveDown(1.5);

  if (!evaluations?.length) {
    doc.fontSize(12).fillColor('#888').text('Aucune évaluation enregistrée.');
  } else {
    // Moyenne
    const moyenne = evaluations.reduce((sum, e) => sum + (e.note ?? 0), 0) / evaluations.length;
    doc.fontSize(13).fillColor('#1a1a2e').text(`Moyenne : ${moyenne.toFixed(2)} / 20`, { align: 'right' });
    doc.moveDown(0.8);

    evaluations.forEach((ev, i) => {
      doc.fontSize(13).fillColor('#1a1a2e').text(`Évaluation n°${i + 1}`, { underline: true });
      doc.fontSize(11).fillColor('#333').text(`Note : ${ev.note} / 20`);
      if (ev.commentaire) doc.text(`Commentaire : ${ev.commentaire}`);
      if (ev.criteres)    doc.text(`Critères : ${JSON.stringify(ev.criteres)}`);
      doc.text(`Date : ${new Date(ev.created_at).toLocaleDateString('fr-FR')}`);
      doc.moveDown(0.8);
    });
  }

  doc.end();
}

// ─── Excel ────────────────────────────────────────────────────────────────────

/**
 * Génère un fichier Excel des évaluations d'un projet.
 */
export async function generateEvaluationsExcel(projectId, res) {
  const [{ data: project }, { data: evaluations }] = await Promise.all([
    supabaseAdmin.from('projects').select('nom').eq('id', projectId).single(),
    supabaseAdmin.from('evaluations').select('*').eq('project_id', projectId).order('created_at'),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Plateforme Projets JUNIA';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Évaluations');

  // Titre fusionné
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `Évaluations — ${project?.nom ?? projectId}`;
  sheet.getCell('A1').font = { size: 14, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // En-têtes
  sheet.columns = [
    { key: 'num',          header: 'N°',           width: 6 },
    { key: 'evaluateur_id',header: 'Évaluateur',   width: 36 },
    { key: 'note',         header: 'Note (/20)',    width: 12 },
    { key: 'commentaire',  header: 'Commentaire',   width: 50 },
    { key: 'criteres',     header: 'Critères',      width: 40 },
    { key: 'date',         header: 'Date',          width: 16 },
  ];

  const headerRow = sheet.getRow(3);
  headerRow.values = ['N°', 'Évaluateur', 'Note (/20)', 'Commentaire', 'Critères', 'Date'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };
  headerRow.alignment = { horizontal: 'center' };

  evaluations?.forEach((ev, i) => {
    const row = sheet.addRow({
      num:           i + 1,
      evaluateur_id: ev.evaluateur_id,
      note:          ev.note,
      commentaire:   ev.commentaire ?? '',
      criteres:      ev.criteres ? JSON.stringify(ev.criteres) : '',
      date:          new Date(ev.created_at).toLocaleDateString('fr-FR'),
    });
    // Colorer la note selon le résultat
    const noteCell = row.getCell('note');
    if (ev.note >= 14)      noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFd4edda' } };
    else if (ev.note >= 10) noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFfff3cd' } };
    else                    noteCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFf8d7da' } };
  });

  // Ligne de moyenne
  if (evaluations?.length) {
    const moyenne = evaluations.reduce((s, e) => s + (e.note ?? 0), 0) / evaluations.length;
    sheet.addRow([]);
    const avgRow = sheet.addRow({ num: '', evaluateur_id: 'MOYENNE', note: +moyenne.toFixed(2) });
    avgRow.font = { bold: true };
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="evaluations_${projectId}.xlsx"`);
  await workbook.xlsx.write(res);
}

/**
 * Génère un Excel de synthèse de toutes les tâches d'un projet.
 */
export async function generateTasksExcel(projectId, res) {
  const [{ data: project }, { data: tasks }] = await Promise.all([
    supabaseAdmin.from('projects').select('nom').eq('id', projectId).single(),
    supabaseAdmin.from('tasks').select('*').eq('project_id', projectId).order('created_at'),
  ]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Tâches');

  sheet.mergeCells('A1:G1');
  sheet.getCell('A1').value = `Tâches — ${project?.nom ?? projectId}`;
  sheet.getCell('A1').font = { size: 14, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };
  sheet.addRow([]);

  const headerRow = sheet.getRow(3);
  headerRow.values = ['N°', 'Titre', 'Description', 'Statut', 'Assigné à', 'Échéance', 'Créé le'];
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };

  sheet.columns = [
    { key: 'num',          width: 5 },
    { key: 'titre',        width: 30 },
    { key: 'description',  width: 40 },
    { key: 'statut',       width: 14 },
    { key: 'assignee_id',  width: 36 },
    { key: 'date_echeance',width: 14 },
    { key: 'created_at',   width: 14 },
  ];

  tasks?.forEach((t, i) => {
    sheet.addRow({
      num:          i + 1,
      titre:        t.titre,
      description:  t.description ?? '',
      statut:       t.statut,
      assignee_id:  t.assignee_id ?? '',
      date_echeance:t.date_echeance ? new Date(t.date_echeance).toLocaleDateString('fr-FR') : '',
      created_at:   new Date(t.created_at).toLocaleDateString('fr-FR'),
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="taches_${projectId}.xlsx"`);
  await workbook.xlsx.write(res);
}
