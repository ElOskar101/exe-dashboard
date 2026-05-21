import { useState } from 'react'

export default function FolderCard() {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-72">
      {/* Pestaña */}
      <div
        className="
        border
        rounded-t-lg rounded-b-0
        w-40 h-7 ml-4
        flex items-center px-3
        font-medium
      "
      >
        Carpeta
      </div>
      {/* Contenedor con perspectiva */}
      <div className="relative perspective-[800px]">
        <div
          className={`
                transition-opacity duration-300 min-h-20
                border
                rounded-md
                p-4
                `}
        >
          ...contenido...
        </div>
        {/* Cuerpo que rota */}
        <div
          onClick={() => setOpen(!open)}
          className={`
            border
            rounded-md
            p-4
            origin-bottom
            transition-transform duration-500
            bottom-0
            absolute
            h-[90%]
            w-full
            ${!open ? 'rotate-x-0' : 'rotate-x-[-75deg]'}
          `}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          <h3 className="font-semibold">Carpeta de archivos</h3>
          <p className="text-sm">Haz click para abrir o cerrar.</p>
        </div>
      </div>
    </div>
  )
}
