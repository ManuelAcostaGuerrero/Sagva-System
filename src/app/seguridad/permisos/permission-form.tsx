"use client";

import { useMemo, useState } from "react";
import { savePermissionMatrixAction } from "@/app/actions/roles-permisos.actions";
import { moduleSensitiveFields, permissionActions, securityModules } from "@/config/permissions.config";

type RoleOption = {
  id: string;
  nombre: string;
};

type ExistingPermission = {
  rolId: string;
  modulo: string;
  accion: string;
  campo: string | null;
  permitido: boolean;
};

type ModuleKey = keyof typeof moduleSensitiveFields;

type PermissionFormProps = {
  roles: RoleOption[];
  existingPermissions: ExistingPermission[];
  initialRoleId?: string;
  initialModule?: string;
};

function fieldLabel(value: string) {
  if (value === "__module__") return "Todo el modulo";
  return value.replaceAll("_", " ");
}

function permissionKey(campo: string, accion: string) {
  return `${campo}:${accion}`;
}

export function PermissionForm({
  roles,
  existingPermissions,
  initialRoleId = "",
  initialModule = ""
}: PermissionFormProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleId);
  const [selectedModule, setSelectedModule] = useState<ModuleKey | "">(
    initialModule && initialModule in moduleSensitiveFields ? (initialModule as ModuleKey) : ""
  );
  const [searchedRoleId, setSearchedRoleId] = useState(initialRoleId);
  const [searchedModule, setSearchedModule] = useState<ModuleKey | "">(
    initialModule && initialModule in moduleSensitiveFields ? (initialModule as ModuleKey) : ""
  );

  const canSearch = !!selectedRoleId && !!selectedModule;
  const showMatrix = !!searchedRoleId && !!searchedModule;

  const fields = useMemo(() => {
    if (!searchedModule) return [];
    return ["__module__", ...(moduleSensitiveFields[searchedModule] ?? [])];
  }, [searchedModule]);

  const permissionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of existingPermissions) {
      if (item.rolId !== searchedRoleId || item.modulo !== searchedModule) continue;
      const campo = item.campo ?? "__module__";
      map.set(permissionKey(campo, item.accion), item.permitido);
    }
    return map;
  }, [existingPermissions, searchedRoleId, searchedModule]);

  const selectedRole = roles.find((role) => role.id === searchedRoleId);

  function handleSearch() {
    if (!canSearch) return;
    setSearchedRoleId(selectedRoleId);
    setSearchedModule(selectedModule);
  }

  return (
    <div className="space-y-5">
      <div className="sagva-panel p-5">
        <h2 className="text-lg font-bold text-slate-950">Buscar permisos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Selecciona un rol y un modulo. Luego se despliega la matriz completa de campos y acciones.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-semibold text-slate-700">
            Rol
            <select
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"
            >
              <option value="">Seleccionar rol</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>{rol.nombre}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Modulo
            <select
              value={selectedModule}
              onChange={(event) => setSelectedModule(event.target.value as ModuleKey | "")}
              className="mt-1 w-full rounded-md border border-[#d8dee8] px-3 py-2"
            >
              <option value="">Seleccionar modulo</option>
              {securityModules.map((modulo) => (
                <option key={modulo} value={modulo}>{modulo}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              disabled={!canSearch}
              onClick={handleSearch}
              className="w-full rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82] disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {showMatrix ? (
        <form action={savePermissionMatrixAction} className="sagva-panel overflow-hidden">
          <input type="hidden" name="rolId" value={searchedRoleId} />
          <input type="hidden" name="modulo" value={searchedModule} />

          <div className="border-b border-[#d8dee8] p-5">
            <h2 className="text-lg font-bold text-slate-950">Matriz de permisos</h2>
            <p className="mt-1 text-sm text-slate-500">
              Rol: <strong>{selectedRole?.nombre ?? "-"}</strong> · Modulo: <strong>{searchedModule}</strong> · Campos: <strong>{fields.length}</strong>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Campo</th>
                  {permissionActions.map((accion) => (
                    <th key={accion} className="px-4 py-3 text-center">{accion}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f7]">
                {fields.map((campo) => (
                  <tr key={campo} className="bg-white">
                    <td className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-900">
                      {fieldLabel(campo)}
                    </td>
                    {permissionActions.map((accion) => {
                      const key = permissionKey(campo, accion);
                      const defaultChecked = permissionMap.get(key) ?? false;
                      return (
                        <td key={accion} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            name={`permiso:${campo}:${accion}`}
                            defaultChecked={defaultChecked}
                            className="h-4 w-4 rounded border-slate-300 text-[#064ea4]"
                            aria-label={`${fieldLabel(campo)} ${accion}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#d8dee8] bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500">
              Las casillas activadas quedan permitidas. Las desactivadas quedan bloqueadas para esa combinacion de rol, modulo, campo y accion.
            </p>
            <button className="rounded-md bg-[#064ea4] px-4 py-2 text-sm font-bold text-white hover:bg-[#043d82]" type="submit">
              Guardar matriz
            </button>
          </div>
        </form>
      ) : (
        <div className="sagva-panel p-5 text-sm text-slate-500">
          Selecciona rol y modulo para desplegar la matriz de permisos.
        </div>
      )}
    </div>
  );
}
