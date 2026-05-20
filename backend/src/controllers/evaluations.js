import { supabaseAdmin } from '../config/supabase.js';

// TODO: Liste les évaluations d'un projet
export async function listEvaluations(req, res) {}

// TODO: Crée une évaluation avec critères et notes (ENCADRANT, JURY)
export async function createEvaluation(req, res) {}

// TODO: Retourne le détail d'une évaluation
export async function getEvaluation(req, res) {}

// TODO: Modifie une évaluation (avant la clôture du projet)
export async function updateEvaluation(req, res) {}

// TODO: Exporte les évaluations d'un projet en PDF ou CSV
export async function exportEvaluations(req, res) {}
