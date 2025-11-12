'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/lib/AuthContext'; // O Copilot criou isto
import { db } from '@/lib/firebase'; // O Copilot criou isto
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  Timestamp, // Importar Timestamp
} from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- NOVA DEFINIÇÃO DE TIPO ---
// Vamos definir como é um objeto 'Site' na nossa base de dados
interface SiteData {
  id: string;
  url: string;
  createdAt: Timestamp;
  userId: string;
  // Estes são os novos campos que vêm do nosso "motor"
  performance?: number;
  accessibility?: number;
  seo?: number;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [url, setUrl] = useState('');
  
  // --- NOVOS ESTADOS ---
  const [loading, setLoading] = useState(false); // Para mostrar um feedback de "a carregar..."
  const [error, setError] = useState<string | null>(null); // Para mostrar erros
  const [message, setMessage] = useState(''); // Para mostrar mensagens de sucesso

  // Estado para guardar os sites e os dados do gráfico
  const [sites, setSites] = useState<SiteData[]>([]);
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Performance Score',
        data: [] as number[],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  });

  // Efeito para ir buscar os sites do utilizador ao Firestore em tempo real
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'sites'), where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const sitesData: SiteData[] = [];
        const labels: string[] = [];
        const performanceData: number[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<SiteData, 'id'>;
          const site = { id: doc.id, ...data };
          sitesData.push(site);

          // Limitar o URL a 20 caracteres para o gráfico
          const shortUrl = site.url.replace('https://', '').replace('www.', '').substring(0, 20);
          labels.push(shortUrl);
          
          // Adicionar o score de performance ao gráfico (se existir)
          if (site.performance) {
            performanceData.push(site.performance);
          } else {
            performanceData.push(0); // Pôr 0 se ainda não tiver score
          }
        });

        setSites(sitesData);
        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Performance Score',
              data: performanceData,
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
          ],
        });
      });

      // Limpar o listener quando o componente for desmontado
      return () => unsubscribe();
    }
  }, [user]);

  // --- ESTA É A FUNÇÃO ATUALIZADA ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in.');
      return;
    }

    setLoading(true); // 1. Começa o loading
    setError(null);
    setMessage('');

    let scores = {}; // Objeto para guardar os scores

    try {
      // 2. Chamar o nosso "motor" (a API que criámos)
      const response = await fetch('/api/run-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run PageSpeed check');
      }

      // 3. Obter os scores da resposta da API
      const data = await response.json();
      scores = data.scores; // ex: { performance: 90, accessibility: 95, seo: 100 }
      setMessage('Scores fetched successfully! Saving to database...');
      
      // 4. Guardar TUDO (URL + Scores) no Firestore
      await addDoc(collection(db, 'sites'), {
        url: url,
        createdAt: new Date(), // Usar new Date()
        userId: user.uid,
        ...scores, // Adiciona performance, accessibility, e seo ao documento
      });

      setMessage('URL added and scores saved!');
      setUrl(''); // Limpar o formulário

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false); // 5. Para o loading (quer dê erro ou sucesso)
    }
  };

  if (!user) {
    return <p>Loading user...</p>; // Ou reencaminhar para /login
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div>
          <span className="mr-4">{user.email}</span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* --- Formulário Atualizado --- */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Add New URL</h2>
          <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              Website URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading} // Desativar o botão enquanto está a carregar
              className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              {loading ? 'Checking...' : 'Add and Run Check'}
            </button>
            {/* Mostrar mensagens de feedback */}
            {message && <p className="text-green-500 mt-2">{message}</p>}
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </form>
        </div>

        {/* --- O Gráfico (agora vai-se atualizar com os scores) --- */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Analytics</h2>
          <div className="bg-white p-4 shadow rounded">
            <h3 className="font-medium mb-2">Site Performance Overview</h3>
            {sites.length > 0 ? (
              <Bar options={{ responsive: true }} data={chartData} />
            ) : (
              <p>Add a site to see analytics.</p>
            )}
          </div>
        </div>
      </div>

       {/* --- Lista de Sites (opcional, mas útil) --- */}
       <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Your Monitored Sites</h2>
        <div className="bg-white p-4 shadow rounded">
          {sites.length > 0 ? (
            <ul>
              {sites.map((site) => (
                <li key={site.id} className="border-b last:border-b-0 py-2 flex justify-between">
                  <span>{site.url}</span>
                  <div className='flex gap-4'>
                    <span title='Performance'>🚀 {site.performance || 'N/A'}</span>
                    <span title='Accessibility'>♿ {site.accessibility || 'N/A'}</span>
                    <span title='SEO'>📈 {site.seo || 'N/A'}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No sites added yet.</p>
          )}
        </div>
       </div>

    </div>
  );
}