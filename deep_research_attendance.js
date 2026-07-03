const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kekuwxhqrzvrgbjiqyue.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtla3V3eGhxcnp2cmdiamlxeXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTkyMTAsImV4cCI6MjA5Mjk5NTIxMH0.U183t2yRk83igrSqpaNFZdMoXsw_X7yidWIzKm7nfBg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepResearch() {
  const studentId = '8b3a39e4-4b2b-4361-8003-cd0a95368fd6';
  const disciplineId = '0b13cda0-5ad2-43cc-81c5-b6263494edc2';

  console.log('--- BUSCANDO TODOS OS REGISTROS DE PRESENÇA ---');
  const { data: attendances, error } = await supabase
    .from('attendance')
    .select('*')
    .match({ student_id: studentId, discipline_id: disciplineId });
  
  if (error) {
    console.error('Erro ao buscar presenças:', error);
  } else {
    console.log(`Encontrados ${attendances.length} registros de presença:`, JSON.stringify(attendances, null, 2));
  }

  console.log('\n--- BUSCANDO TODOS OS ALUNOS COM NOME SIMILAR ---');
  const { data: similarStudents } = await supabase
    .from('students')
    .select('id, name, email, cpf')
    .ilike('name', '%Fábio Barreto%');
  
  console.log('Alunos similares:', JSON.stringify(similarStudents, null, 2));

  // Se houver mais de um aluno similar, buscar presenças para eles também
  if (similarStudents.length > 1) {
    for (const s of similarStudents) {
      if (s.id === studentId) continue;
      console.log(`\n--- BUSCANDO PRESENÇAS PARA O ALUNO ${s.name} (${s.id}) ---`);
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .match({ student_id: s.id, discipline_id: disciplineId });
      console.log(`Encontrados ${data.length} registros.`);
    }
  }
}

deepResearch();
