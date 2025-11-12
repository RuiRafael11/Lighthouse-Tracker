import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Obter o URL do corpo do pedido que o nosso frontend vai enviar
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 2. Obter a nossa chave secreta do .env.local (isto SÓ funciona no servidor)
    const apiKey = process.env.PAGESPEED_API_KEY;

    if (!apiKey) {
      // Nunca expor a chave no erro
      throw new Error('PAGESPEED_API_KEY is not defined in .env.local');
    }

    // 3. Construir o URL da API do Google PageSpeed
    // Vamos pedir logo os 3 scores mais importantes
    const categories = 'category=PERFORMANCE&category=ACCESSIBILITY&category=SEO';
    const googleApiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&strategy=mobile&${categories}&key=${apiKey}`;

    // 4. Chamar a API do Google (o nosso servidor a falar com o servidor do Google)
    const response = await fetch(googleApiUrl);

    if (!response.ok) {
      // Se o Google der erro (ex: URL inválido), reportamos
      const errorData = await response.json();
      console.error('Google PageSpeed API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch data from Google PageSpeed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 5. Extrair apenas os scores de que precisamos (e multiplicar por 100)
    const lighthouse = data.lighthouseResult;
    const scores = {
      performance: Math.round(lighthouse.categories.performance.score * 100),
      accessibility: Math.round(lighthouse.categories.accessibility.score * 100),
      seo: Math.round(lighthouse.categories.seo.score * 100),
    };

    // 6. Enviar os scores de volta para o nosso frontend
    return NextResponse.json({ scores });

  } catch (error) {
    console.error('Internal server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}