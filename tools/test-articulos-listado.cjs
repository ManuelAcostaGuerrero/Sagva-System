/* Prueba aislada del listado, sin consultar ni modificar la base de datos. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

let hooks = [], cursor = 0;
const react = {
  useState(init) {
    const i = cursor++;
    if (!(i in hooks)) hooks[i] = typeof init === 'function' ? init() : init;
    return [hooks[i], value => hooks[i] = typeof value === 'function' ? value(hooks[i]) : value];
  },
  useMemo: fn => fn()
};
const jsx = { jsx: (type, props) => ({ type, props: props || {} }), jsxs: (type, props) => ({ type, props: props || {} }), Fragment: 'fragment' };
const output = {};
const js = ts.transpileModule(fs.readFileSync('src/app/articulos/articulos-listado-client.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
}).outputText;
vm.runInNewContext(js, { exports: output, require: name => {
  if (name === 'react') return react;
  if (name === 'react/jsx-runtime') return jsx;
  if (name === 'next/link') return { default: 'a' };
  if (name === 'lucide-react') return { Edit: 'icon', Plus: 'icon', Save: 'icon', Search: 'icon' };
  if (name === '@/utils/formatters/currency') return { formatCurrency: value => String(value) };
  if (name === '@/app/actions/articulos-rapido.actions') return {};
  return require(name);
}, console, Set, Intl });

const props = {
  articulos: [
    { id: 'db-id-a', codigoProducto: 'INT-A', codigoBarra: '780001', nombre: 'Avena', tipoArticulo: 'PRODUCTO', familiaId: null, subfamiliaId: null, marcaId: null, estado: 'activo', precioPublico: 1200, costoConIva: 1000, stock: 5 },
    { id: 'db-id-b', codigoProducto: 'INT-B', codigoBarra: null, nombre: 'Leche', tipoArticulo: 'PRODUCTO', familiaId: null, subfamiliaId: null, marcaId: null, estado: 'inactivo', precioPublico: 900, costoConIva: 1000, stock: 3 }
  ], familias: [], subfamilias: [], marcas: [], puedeEditar: false, mostrarGanancia: true
};
function render() { cursor = 0; return output.ArticulosListadoClient(props); }
function nodes(value) { if (!value) return []; if (Array.isArray(value)) return value.flatMap(nodes); if (typeof value !== 'object') return []; return [value, ...nodes(value.props?.children)]; }
function words(value) { if (Array.isArray(value)) return value.map(words).join(' '); if (typeof value === 'object' && value) return words(value.props?.children); return value == null ? '' : String(value); }
function search(tree) { const match = nodes(tree).find(n => n.type === 'input' && n.props.onFocus && n.props.onBlur); assert.ok(match); return match; }
function status(tree) { const match = nodes(tree).find(n => n.type === 'select' && words(n).includes('Deshabilitado')); assert.ok(match); return match; }
function body(tree) { return words(nodes(tree).find(n => n.type === 'tbody')); }

let tree = render();
assert.match(body(tree), /780001/);
assert.match(body(tree), /—/);
assert.doesNotMatch(body(tree), /INT-A|INT-B/);
assert.match(body(tree), /Habilitado/);
assert.match(body(tree), /Deshabilitado/);
assert.equal(search(tree).props.placeholder, 'Escribe o escanea un código');
search(tree).props.onFocus();
tree = render();
assert.equal(search(tree).props.placeholder, '');
search(tree).props.onChange({ target: { value: '780001' } });
tree = render();
assert.match(body(tree), /Avena/);
assert.doesNotMatch(body(tree), /Leche/);
search(tree).props.onBlur();
tree = render();
assert.equal(search(tree).props.value, '780001');
assert.equal(search(tree).props.placeholder, 'Escribe o escanea un código');

search(tree).props.onChange({ target: { value: 'INT-B' } });
tree = render();
assert.match(body(tree), /Leche/);
search(tree).props.onChange({ target: { value: 'db-id-a' } });
tree = render();
assert.match(body(tree), /Avena/);
status(tree).props.onChange({ target: { value: 'inactivo' } });
tree = render();
assert.doesNotMatch(body(tree), /Avena|Leche/);
search(tree).props.onChange({ target: { value: '' } });
tree = render();
assert.match(body(tree), /Leche/);
assert.doesNotMatch(body(tree), /Avena/);
status(tree).props.onChange({ target: { value: 'activo' } });
tree = render();
assert.match(body(tree), /Avena/);
assert.doesNotMatch(body(tree), /Leche/);
console.log('Búsqueda, estados y código de barras: correctos.');
