import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Lighthouse Tracker</h1>
        <p className="text-lg mb-8 text-gray-600">
          Track and monitor your website performance with Lighthouse metrics
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  )
}
