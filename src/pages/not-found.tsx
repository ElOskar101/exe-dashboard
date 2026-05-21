import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation('not-found')
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="bg-white shadow-lg rounded-xl p-10 max-w-md text-center border border-gray-200">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>

        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {t('title')}
        </h2>

        <p className="text-gray-600 mb-8">{t('description')}</p>

        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          {t('button')}
        </a>
      </div>
    </div>
  )
}
