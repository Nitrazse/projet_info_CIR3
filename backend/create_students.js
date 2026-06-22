// Script pour créer 50 comptes étudiants et les répartir dans les groupes
// Lancer depuis le dossier backend : node create_students.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ncnlgiuwmrhrmouarmxm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbmxnaXV3bXJocm1vdWFybXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM0NjExMCwiZXhwIjoyMDk0OTIyMTEwfQ.NMgxu2YnPTf5ohkcjlHjaSFLrw14PeyMYmnrqwGbxI0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ── 50 étudiants ────────────────────────────────────────────────────────────
const ETUDIANTS = [
  // Projet 1 — 25 étudiants (Groupes 1, 2, 3)
  { nom: 'Alice Martin',       email: 'alice.martin@student.junia.com'        },
  { nom: 'Omar Diallo',        email: 'omar.diallo@student.junia.com'         },
  { nom: 'Sofia Benali',       email: 'sofia.benali@student.junia.com'        },
  { nom: 'Karim Toure',        email: 'karim.toure@student.junia.com'         },
  { nom: 'Lea Dubois',         email: 'lea.dubois@student.junia.com'          },
  { nom: 'Youssef Ndiaye',     email: 'youssef.ndiaye@student.junia.com'      },
  { nom: 'Camille Petit',      email: 'camille.petit@student.junia.com'       },
  { nom: 'Amina Kone',         email: 'amina.kone@student.junia.com'          },
  { nom: 'Lucas Bernard',      email: 'lucas.bernard@student.junia.com'       },
  { nom: 'Fatou Sow',          email: 'fatou.sow@student.junia.com'           },
  { nom: 'Noah Lambert',       email: 'noah.lambert@student.junia.com'        },
  { nom: 'Ines Moreau',        email: 'ines.moreau@student.junia.com'         },
  { nom: 'Moussa Camara',      email: 'moussa.camara@student.junia.com'       },
  { nom: 'Chloe Rousseau',     email: 'chloe.rousseau@student.junia.com'      },
  { nom: 'Adrien Leroy',       email: 'adrien.leroy@student.junia.com'        },
  { nom: 'Mariama Barry',      email: 'mariama.barry@student.junia.com'       },
  { nom: 'Pierre Fontaine',    email: 'pierre.fontaine@student.junia.com'     },
  { nom: 'Aissatou Balde',     email: 'aissatou.balde@student.junia.com'      },
  { nom: 'Theo Girard',        email: 'theo.girard@student.junia.com'         },
  { nom: 'Nadia Cherif',       email: 'nadia.cherif@student.junia.com'        },
  { nom: 'Emile Dupont',       email: 'emile.dupont@student.junia.com'        },
  { nom: 'Rokia Traore',       email: 'rokia.traore@student.junia.com'        },
  { nom: 'Baptiste Simon',     email: 'baptiste.simon@student.junia.com'      },
  { nom: 'Hawa Coulibaly',     email: 'hawa.coulibaly@student.junia.com'      },
  { nom: 'Victor Mercier',     email: 'victor.mercier@student.junia.com'      },

  // Projet 2 — 25 étudiants (Groupes 1, 2, 3)
  { nom: 'Emma Leclerc',       email: 'emma.leclerc@student.junia.com'        },
  { nom: 'Ibrahima Sy',        email: 'ibrahima.sy@student.junia.com'         },
  { nom: 'Julie Blanchard',    email: 'julie.blanchard@student.junia.com'     },
  { nom: 'Abdou Fall',         email: 'abdou.fall@student.junia.com'          },
  { nom: 'Manon Chevalier',    email: 'manon.chevalier@student.junia.com'     },
  { nom: 'Sekou Bah',          email: 'sekou.bah@student.junia.com'           },
  { nom: 'Pauline Morin',      email: 'pauline.morin@student.junia.com'       },
  { nom: 'Oumar Keita',        email: 'oumar.keita@student.junia.com'         },
  { nom: 'Clement Roux',       email: 'clement.roux@student.junia.com'        },
  { nom: 'Kadiatou Diallo',    email: 'kadiatou.diallo@student.junia.com'     },
  { nom: 'Antoine Perrin',     email: 'antoine.perrin@student.junia.com'      },
  { nom: 'Mariam Sacko',       email: 'mariam.sacko@student.junia.com'        },
  { nom: 'Hugo Bonnet',        email: 'hugo.bonnet@student.junia.com'         },
  { nom: 'Aminata Diarra',     email: 'aminata.diarra@student.junia.com'      },
  { nom: 'Romain Colin',       email: 'romain.colin@student.junia.com'        },
  { nom: 'Fatoumata Balde',    email: 'fatoumata.balde@student.junia.com'     },
  { nom: 'Alexis Garnier',     email: 'alexis.garnier@student.junia.com'      },
  { nom: 'Binta Diakite',      email: 'binta.diakite@student.junia.com'       },
  { nom: 'Florian Muller',     email: 'florian.muller@student.junia.com'      },
  { nom: 'Aida Tounkara',      email: 'aida.tounkara@student.junia.com'       },
  { nom: 'Mathieu Roussel',    email: 'mathieu.roussel@student.junia.com'     },
  { nom: 'Coumba Gaye',        email: 'coumba.gaye@student.junia.com'         },
  { nom: 'Julien Faure',       email: 'julien.faure@student.junia.com'        },
  { nom: 'Ndeye Fall',         email: 'ndeye.fall@student.junia.com'          },
  { nom: 'Kevin Lemaire',      email: 'kevin.lemaire@student.junia.com'       },
];

// ── Groupes ─────────────────────────────────────────────────────────────────
// Projet 1 — Application de Gestion RH
const PROJET1_ID = 'aa000001-0000-0000-0000-000000000001';
const GROUPES_P1 = [
  { id: 'ab000001-0000-0000-0000-000000000001', nom: 'Groupe 1' },
  { id: 'ab000001-0000-0000-0000-000000000002', nom: 'Groupe 2' },
  { id: 'ab000001-0000-0000-0000-000000000003', nom: 'Groupe 3' },
];

// Projet 2 — Plateforme E-Learning
const PROJET2_ID = 'aa000002-0000-0000-0000-000000000002';
const GROUPES_P2 = [
  { id: 'ab000002-0000-0000-0000-000000000001', nom: 'Groupe 1' },
  { id: 'ab000002-0000-0000-0000-000000000002', nom: 'Groupe 2' },
  { id: 'ab000002-0000-0000-0000-000000000003', nom: 'Groupe 3' },
];

async function createStudents() {
  console.log(`\n🎓 Création de ${ETUDIANTS.length} comptes étudiants...\n`);
  const ids = [];

  for (const etudiant of ETUDIANTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: etudiant.email,
      password: 'Demo1234!',
      email_confirm: true,
      user_metadata: { nom: etudiant.nom, role: 'etudiant' },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = users.find(u => u.email === etudiant.email);
        if (existing) {
          ids.push({ ...etudiant, id: existing.id });
          console.log(`⚠️  ${etudiant.nom} — déjà existant (${existing.id})`);
        }
      } else {
        console.log(`❌ ${etudiant.nom} — ${error.message}`);
      }
    } else {
      ids.push({ ...etudiant, id: data.user.id });
      console.log(`✅ ${etudiant.nom} — ${data.user.id}`);
    }
  }

  // ── Répartition dans les groupes ─────────────────────────────────────────
  console.log('\n\n📦 Répartition dans les groupes...\n');

  // Les 50 étudiants sont dans les 2 projets (17 / 17 / 16 par groupe)
  await assignToGroups(PROJET1_ID, GROUPES_P1, ids);
  await assignToGroups(PROJET2_ID, GROUPES_P2, ids);

  console.log('\n✅ Terminé ! Tous les étudiants sont répartis dans les groupes.');
  console.log('   Mot de passe de tous les comptes : Demo1234!');
}

async function assignToGroups(projectId, groupes, students) {
  // Répartition équilibrée dans les groupes
  const perGroup = Math.ceil(students.length / groupes.length);

  for (let i = 0; i < groupes.length; i++) {
    const groupe = groupes[i];
    const groupStudents = students.slice(i * perGroup, (i + 1) * perGroup);

    console.log(`  ${groupe.nom} (${groupStudents.length} étudiants) :`);

    for (let j = 0; j < groupStudents.length; j++) {
      const student = groupStudents[j];
      const role = j === 0 ? 'team_leader' : 'etudiant';

      // Supprimer l'entrée existante si elle existe (évite les doublons)
      await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', student.id);

      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: student.id,
          role,
          groupe_id: groupe.id,
        });

      if (error) {
        console.log(`    ❌ ${student.nom} — ${error.message}`);
      } else {
        console.log(`    ${role === 'team_leader' ? '👑' : '  '} ${student.nom} (${role})`);
      }
    }
  }
}

createStudents().catch(console.error);
