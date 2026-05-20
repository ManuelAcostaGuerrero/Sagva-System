"use client";

import { useMemo, useState } from "react";
import { savePermissionAction } from "@/app/actions/roles-permisos.actions";
import { moduleSensitiveFields, permissionActions, securityModules } from "@/config/permissions.config";

type RoleOption = {
  id: string;
  nombre: string;
};

type ModuleKey = keyof typeof moduleSensitiveFields;

type PermissionFormProps = {
  roles: RoleOption[];
};

function fieldLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function PermissionForm({ roles }: PermissionFormProps) {
  const [selectedModule, setSelectedModule] = useState<ModuleKey | "">("");

  const fields = useMemo(() => {
    if (!selectedModule) return [];
    return moduleSensitiveFields[selectedModule] ?? [];
  }, [selectedModule]);

  return (
    <form action={savePermissionAction} className="sagva-panel p-5">
      <h2 className="text-lg font-bold text-slate-950">Crear o actualizar permiso</h2>
      <p className="mt-1 text-sm text-slate-500">
        Primero selecciona el modulo. El campo sensible se filtra segun las variables reales de ese modulo.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="text-sm font-semibold text-slate-700">
          Rol
          <select name="rolId" required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2">
            <option value="">Seleccionar</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>{rol.nombre}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Modulo
          <select
            name="modulo"
            required
            value={selectedModule}
            onChange={(event) => setSelectedModule(event.target.value as ModuleKey | "")}
            className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"
          >
            <option value="">Seleccionar</option>
            {securityModules.map((modulo) => (
              <option key={modulo} value={modulo}>{modulo}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Accion
          <select name="accion" required className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2">
            <option value="">Seleccionar</option>
            {permissionActions.map((accion) => (
              <option key={accion} value={accion}>{accion}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Campo sensible
          <select name="campo" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2" disabled={!selectedModule}>
            <option value="">Todo el modulo</option>
            {fields.map((campo) => (
              <option key={campo} value={campo}>{fieldLabel(campo)}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Estado
          <select name="permitido" defaultValue="true" className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2">
            <option value="true">Permitido</option>
            <option value="false">Bloqueado</option>
          </select>
        </label>

        <div className="flex items-end">
          <button className="w-full rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82]" type="submit">
            Guardar permiso
          </button>
        </div>
      </div>

      {selectedModule ? (
        <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
          Campos disponibles para <strong>{selectedModule}</strong>: {fields.length}
        </div>
      ) : null}
    </form>
  );
}
