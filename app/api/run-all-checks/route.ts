import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query, // <-- adicionar
} from 'firebase/firestore';

// Esta função vai buscar os scores ao Google (lógica duplicada de 'run-check')
async function fetchPageSpeedScores(url: string) {
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey) {
    throw new Error('PAGESPEED_API_KEY is not defined');
  }

  const categories = 'category=PERFORMANCE&category=ACCESSIBILITY&category=SEO';
  const googleApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&strategy=mobile&${categories}&key=${apiKey}`;

  const response = await fetch(googleApiUrl);

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Google PageSpeed API error for ${url}:`, errorData);
    throw new Error(`Failed to fetch data for ${url}`);
  }

  const data = await response.json();
  const lighthouse = data.lighthouseResult;

  return {
    performance: Math.round(lighthouse.categories.performance.score * 100),
    accessibility: Math.round(lighthouse.categories.accessibility.score * 100),
    seo: Math.round(lighthouse.categories.seo.score * 100),
    // Vamos guardar a data da última verificação
    lastChecked: new Date(), 
  };
}

// Esta é a função que o "despertador" (Cron) vai chamar
export async function GET(req: NextRequest) {
  // --- PASSO 1: VERIFICAR O SEGREDO ---
  const { searchParams } = req.nextUrl;
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    // Se o segredo estiver errado, rejeitamos o pedido
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- PASSO 2: SE O SEGREDO ESTIVER CERTO, COMEÇAR O TRABALHO ---
  try {
    let sitesProcessed = 0;
    const sitesQuery = query(collection(db, 'sites'));
    const querySnapshot = await getDocs(sitesQuery);

    // Criar uma lista de todas as tarefas
    const updatePromises: Promise<void>[] = [];

    querySnapshot.forEach((docSnap) => {
      const siteData = docSnap.data();
      const siteUrl = siteData.url;
      const siteId = docSnap.id;

      const updatePromise = (async () => {
        try {
          const scores = await fetchPageSpeedScores(siteUrl);
          const docRef = doc(db, 'sites', siteId);
          await updateDoc(docRef, scores);
        } catch (error) {
          console.error(`Failed to process site ${siteUrl}:`, error);
        }
      })();
      updatePromises.push(updatePromise);
    });

    // Esperar que todas as tarefas da lista terminem
    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Cron job completed successfully',
      sitesProcessed,
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}