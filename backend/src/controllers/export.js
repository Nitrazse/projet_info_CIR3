import {
  generateProjectPDF,
  generateEvaluationsPDF,
  generateEvaluationsExcel,
  generateTasksExcel,
} from '../services/export.js';
import { sendError } from '../utils/index.js';

// GET /api/export/projects/:id/pdf  — rapport complet du projet en PDF
export async function projectPDF(req, res) {
  try {
    await generateProjectPDF(req.params.id, res);
  } catch (err) {
    sendError(res, 500, err.message);
  }
}

// GET /api/export/projects/:id/tasks/excel  — tâches du projet en Excel
export async function tasksExcel(req, res) {
  try {
    await generateTasksExcel(req.params.id, res);
  } catch (err) {
    sendError(res, 500, err.message);
  }
}

// GET /api/export/projects/:id/evaluations/pdf  — évaluations en PDF
export async function evaluationsPDF(req, res) {
  try {
    await generateEvaluationsPDF(req.params.id, res);
  } catch (err) {
    sendError(res, 500, err.message);
  }
}

// GET /api/export/projects/:id/evaluations/excel  — évaluations en Excel
export async function evaluationsExcel(req, res) {
  try {
    await generateEvaluationsExcel(req.params.id, res);
  } catch (err) {
    sendError(res, 500, err.message);
  }
}
