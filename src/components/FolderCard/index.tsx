import { useState } from "react";

export default function FolderCard() {
    const [open, setOpen] = useState(false);

    return (
        <div className="w-72">
            {/* Pestaña */}
            <div className="
        bg-[var(--primary-200)]
        border border-[var(--primary-400)]
        rounded-t-lg rounded-b-0
        w-40 h-7 ml-4
        flex items-center px-3
        font-medium text-[var(--primary-800)]
      ">
                Carpeta
            </div>
            {/* Contenedor con perspectiva */}
            <div className="relative perspective-[800px]">
                <div className={`
                transition-opacity duration-300 min-h-20
                bg-[var(--neutral-50)]
                border border-[var(--primary-400)]
                rounded-md
                p-4
                `}>
                    ...contenido...
                </div>
                {/* Cuerpo que rota */}
                <div
                    onClick={() => setOpen(!open)}
                    className={`
            bg-[var(--neutral-50)]
            border border-[var(--primary-400)]
            rounded-md
            p-4
            origin-bottom
            transition-transform duration-500
            bottom-0
            absolute
            h-[90%]
            w-full
            ${!open ? "rotate-x-0" : "rotate-x-[-75deg]"}
          `}
                    style={{
                        transformStyle: "preserve-3d"
                    }}
                >
                    <h3 className="font-semibold text-[var(--neutral-900)]">
                        Carpeta de archivos
                    </h3>
                    <p className="text-[var(--neutral-700)] text-sm">
                        Haz click para abrir o cerrar.
                    </p>
                </div>

            </div>
        </div>
    );
}
