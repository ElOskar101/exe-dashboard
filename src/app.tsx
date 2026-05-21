import { AppRouter } from './router/app-router.tsx'

function App() {
  // useEffect(() => {
  //   fetch(import.meta.env.VITE_SOCKET_URL + '/api/v1/executions', {
  //     method: 'POST',
  //     body: JSON.stringify({
  //       "project": "liberty",
  //       "workers": 2,
  //       "retries": 3,
  //       "headed": false,
  //       "createdBy": "Oscar Gonzalez",
  //       "client": "Petite Smiles",
  //       "clinic": "Doral",
  //       "execution": "2026-04-27",
  //       "bot": "Liberty Dental Plan",
  //       mode: "parallel"
  //     })

  //   })
  //   fetcher.post('/executions', {
  //     "project": "liberty",
  //     "workers": 2,
  //     "retries": 3,
  //     "headed": false,
  //     "createdBy": "Oscar Gonzalez",
  //     "client": "Petite Smiles",
  //     "clinic": "Doral",
  //     "execution": "2026-04-27",
  //     "bot": "Liberty Dental Plan",
  //     mode: "parallel"
  //   }, { baseURL: import.meta.env.VITE_SOCKET_URL + '/api/v1/' },)

  // const executionId = '6a07684ef351a12f56d67c02'
  // socket.on("connect", () => {
  //   // Importante: re-join en cada reconexion
  //   socket.emit("execution:join", { executionId });
  // });

  // socket.on("execution:logs:history", (payload) => {
  //   if (payload.executionId !== executionId) return;
  //   // Reemplazar buffer inicial de logs
  //   console.log("history", payload.content);
  // });

  // socket.on("logs", (payload) => {
  //   if (payload.executionId !== executionId) return;
  //   // Append incremental
  //   console.log(`[${payload.stream}]`, payload.message);
  // });

  // socket.on("status", (payload) => {
  //   if (payload.executionId !== executionId) return;
  //   console.log("status", payload.status);
  // });

  // socket.connect();

  // return () => {
  //   socket.emit("execution:leave", { executionId });
  //   socket.disconnect();
  // };
  // }, [])

  return (
    <>
      <AppRouter></AppRouter>
      {/* <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
          <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-6">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                  template
                </p>
                <h1 className="mt-2 text-2xl font-semibold">React + TypeScript</h1>
              </div>

              <button
                type="button"
                onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </header>

            <section className="flex flex-1 items-center justify-center py-12">
              <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                <h2 className="text-xl font-semibold">Basic project template</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  A minimal setup with TypeScript, Tailwind, sockets, and a class-based theme toggle.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {templateSections.map((section) => (
                    <div
                      key={section}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    >
                      {section}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main> */}
    </>
  )
}

export default App
