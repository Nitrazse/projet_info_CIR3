import { supabaseAdmin, createUserClient } from '../config/supabase.js';

// TODO: Liste les tâches avec filtres optionnels (projectId, assigneeId, status)
export async function listTasks(req, res) {}

// TODO: Crée une tâche dans un projet
export async function createTask(req, res) {}

// TODO: Retourne le détail d'une tâche
export async function getTask(req, res) {}

// TODO: Met à jour une tâche (titre, description, assignee, dates…)
export async function updateTask(req, res) {}

// TODO: Supprime une tâche
export async function deleteTask(req, res) {}

// TODO: Change uniquement le statut d'une tâche (pour le drag & drop Kanban)
export async function updateTaskStatus(req, res) {}
