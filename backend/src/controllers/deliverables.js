import { supabaseAdmin } from '../config/supabase.js';

// TODO: Liste les livrables d'un projet
export async function listDeliverables(req, res) {}

// TODO: Dépose un livrable — upload dans Supabase Storage, enregistre l'URL en base
export async function uploadDeliverable(req, res) {}

// TODO: Retourne le détail (et l'URL signée) d'un livrable
export async function getDeliverable(req, res) {}

// TODO: Valide ou rejette un livrable (ENCADRANT, JURY)
export async function updateDeliverableStatus(req, res) {}

// TODO: Supprime un livrable et son fichier dans Supabase Storage
export async function deleteDeliverable(req, res) {}
