"use client";

import { useState } from "react";
import { deleteRoleAction, updateRoleAction } from "@/app/actions/roles-permisos.actions";

type RoleRow = {
  id: string;
  codigo: string;
  nombre: string;
  usuarios: number;
  permisos: number;
};

type RolesTableProps = {
  roles: RoleRow[];
};

export function RolesTable({ roles }: RolesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="sagva-panel overflow-hidden">
      <div className="border-b border-[#d8dee8] p-5">
        <h2 className="text-lg font-bold text-slate-950">Roles existentes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Presiona Modificar para habilitar la fila. Luego guarda o cancela el cambio.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Codigo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Usuarios</th>
              <th className="px-4 py-3">Permisos</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1f7]">
            {roles.map((rol) => {
              const isEditing = editingId === rol.id;
              const updateAction = updateRoleAction.bind(null, rol.id);
              const deleteAction = deleteRoleAction.bind(null, rol.id);
              const canDelete = rol.usuarios === 0;

              return (
                <tr key={rol.id} className="bg-white align-top">
                  <td className="px-4 py-3">
                    <form id={`update-role-${rol.id}`} action={updateAction} className="contents">
                      <input
                        name="codigo"
                        defaultValue={rol.codigo}
                        required
                        disabled={!isEditing}
                        className="w-full rounded-md border border-[#d8dee8] px-3 py-2 font-semibold text-slate-900 disabled:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`update-role-${rol.id}`}
                      name="nombre"
                      defaultValue={rol.nombre}
                      required
                      disabled={!isEditing}
                      className="w-full rounded-md border border-[#d8dee8] px-3 py-2 text-slate-700 disabled:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{rol.usuarios}</td>
                  <td className="px-4 py-3 text-slate-600">{rol.permisos}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            form={`update-role-${rol.id}`}
                            className="rounded-md bg-[#064ea4] px-3 py-2 text-xs font-bold text-white hover:bg-[#043d82]"
                            type="submit"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-md border border-[#d8dee8] px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingId(rol.id)}
                          className="rounded-md border border-[#d8dee8] px-3 py-2 text-xs font-bold text-[#064ea4] hover:bg-blue-50"
                        >
                          Modificar
                        </button>
                      )}

                      <form action={deleteAction}>
                        <button
                          disabled={!canDelete || isEditing}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                          type="submit"
                          title={canDelete ? "Eliminar rol" : "No se puede eliminar un rol con usuarios asignados"}
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">No hay roles creados.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
