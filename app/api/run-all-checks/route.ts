import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin'; // <--- USAR A BIBLIOTECA ADMIN

// --- CONFIGURAÇÃO DO ADMIN SDK ---
// Esta função só corre uma vez para inicializar o admin
function initializeFirebaseAdmin() {
  try {
    // Tenta obter a chave da Vercel
    const serviceAccountKey = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
    );

    if (!admin.apps.length) {
      // Inicializa o admin com a chave
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      });
    }
    return admin.firestore(); // Devolve a ligação à BD de admin
  } catch (error: any) {
    if (error.code === 'ENOENT' || error.name === 'SyntaxError') {
      // Isto é um fallback para o ambiente local (npm run dev)
      // se quiseres criar um ficheiro serviceAccountKey.json
      console.log('Chave da Vercel não encontrada, a tentar fallback local...');
      // ... (podes ignorar isto por agora, só importa para a Vercel)
    }
    // Se a inicialização falhar, relança o erro
    throw new Error('Falha ao inicializar o Firebase Admin: ' + error.message);
  }
}

// Inicializa o admin e obtém a ligação à BD
const db = initializeFirebaseAdmin();
// --- FIM DA CONFIGURAÇÃO DO ADMIN ---


// Esta função (o "motor") é a mesma de antes
async function fetchPageSpeedScores(url: string) {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) throw new Error('PAGESPEED_API_KEY is not defined');

  const categories = 'category=PERFORMANCE&category=ACCESSIBILITY&category=SEO';
  const googleApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&strategy=mobile&${categories}&key=${apiKey}`;

  const response = await fetch(googleApiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${url}`);
  }

  const data = await response.json();
  const lighthouse = data.lighthouseResult;

  return {
    performance: Math.round(lighthouse.categories.performance.score * 100),
    accessibility: Math.round(lighthouse.categories.accessibility.score * 100),
    seo: Math.round(lighthouse.categories.seo.score * 100),
    lastChecked: new Date(), // Usar new Date() (padrão do servidor)
  };
}


// Esta é a função que o "despertador" (Cron) vai chamar
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  if (searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let sitesProcessed = 0;
    
    // Agora, esta query usa os poderes de ADMIN
    const sitesSnapshot = await db.collection('sites').get();

    if (sitesSnapshot.empty) {
      // Se a coleção 'sites' estiver mesmo vazia
      return NextResponse.json({
        message: 'Cron job ran, but no sites found in database.',
        sitesProcessed: 0,
      });
    }

    const updatePromises: Promise<void>[] = [];

    sitesSnapshot.forEach((docSnap) => {
      const siteData = docSnap.data();
      const siteUrl = siteData.url;
      const siteId = docSnap.id;

      const updatePromise = (async () => {
        try {
          const scores = await fetchPageSpeedScores(siteUrl);
          // O SDK Admin usa .update() diretamente na referência do documento
          await db.collection('sites').doc(siteId).update(scores);
          sitesProcessed++;
        } catch (error) {
          console.error(`Failed to process site ${siteUrl}:`, error);
        }
      })();
      updatePromises.push(updatePromise);
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Cron job completed successfully (Admin Mode)',
      sitesProcessed,
    });

  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}