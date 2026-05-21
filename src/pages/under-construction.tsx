import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '../context/auth-context/context'

export default function UnderConstruction() {
  const [t] = useTranslation('underConstruction')
  const authContext = useContext(AuthContext)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center px-6">
      <div className="shadow-lg rounded-xl p-10 max-w-md text-center border border-gray-200">
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>

        <p className="mb-6">{t('subTitle')}</p>

        <p className="mb-8">{t('last-comment')}</p>

        <button
          type="button"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
          onClick={authContext?.logout}
        >
          {t('button')}
        </button>
      </div>
    </div>
  )
}
