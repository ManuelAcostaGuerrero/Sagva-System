import { moduleAreas, modulesConfig } from "@/config/modules.config";
import { routesConfig } from "@/config/routes.config";
import {
  estadosGenerales,
  metodosPago,
  tiposFecha,
  tiposImpuesto,
  tiposMovimientoInventario
} from "@/utils/constants/catalogs";

export const InterfazIntegracionService = {
  obtenerMenu() {
    return moduleAreas.map((area) => ({
      area,
      items: modulesConfig.filter((moduleItem) => moduleItem.area === area)
    }));
  },

  obtenerRutas() {
    return routesConfig;
  },

  obtenerVariablesGlobales() {
    return {
      estadosGenerales,
      metodosPago,
      tiposFecha,
      tiposImpuesto,
      tiposMovimientoInventario
    };
  }
};
