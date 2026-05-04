#!/usr/bin/env node
// Stage 5 of #34 — Consistency Linter.
// Verifies that translation keys, piece-type identifiers, template nameKeys,
// and JSON-schema discriminators stay in sync inside index.html.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INDEX_HTML = resolve(ROOT, 'index.html');
const WOODMODEL_SCHEMA = resolve(ROOT, 'woodmodel.schema.json');

const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

// Find the JS expression that immediately follows `var <name> =` and ends at the
// matching closing bracket of the opening `{` or `[`. Returns the raw expression
// source (without the trailing semicolon), suitable for eval via `vm`.
function extractVarExpression(source, name) {
    const re = new RegExp('var\\s+' + name + '\\s*=\\s*([\\[{])');
    const m = re.exec(source);
    if (!m) throw new Error('Could not locate `var ' + name + ' = ...` in index.html');
    const open = m[1];
    const close = open === '{' ? '}' : ']';
    let i = m.index + m[0].length;
    let depth = 1;
    let inStr = null;
    let inLineComment = false;
    let inBlockComment = false;
    while (i < source.length && depth > 0) {
        const c = source[i];
        const next = source[i + 1];
        if (inLineComment) {
            if (c === '\n') inLineComment = false;
        } else if (inBlockComment) {
            if (c === '*' && next === '/') { inBlockComment = false; i++; }
        } else if (inStr) {
            if (c === '\\') { i++; }
            else if (c === inStr) inStr = null;
        } else if (c === '/' && next === '/') { inLineComment = true; i++; }
        else if (c === '/' && next === '*') { inBlockComment = true; i++; }
        else if (c === '"' || c === "'") inStr = c;
        else if (c === open) depth++;
        else if (c === close) depth--;
        i++;
    }
    if (depth !== 0) throw new Error('Unbalanced brackets while extracting `' + name + '`');
    return source.slice(m.index + m[0].length - 1, i);
}

function evalExpression(expr) {
    return vm.runInNewContext('(' + expr + ')', {}, { timeout: 1000 });
}

const html = readFileSync(INDEX_HTML, 'utf8');

const translations = evalExpression(extractVarExpression(html, 'translations'));
const ADD_TYPES = evalExpression(extractVarExpression(html, 'ADD_TYPES'));
const SUPPORTED_LANGS = evalExpression(extractVarExpression(html, 'SUPPORTED_LANGS'));

// Translations must cover every supported language.
for (const lang of SUPPORTED_LANGS) {
    if (!translations[lang]) err('translations is missing entry for SUPPORTED_LANGS["' + lang + '"]');
}
const langs = SUPPORTED_LANGS.filter(l => translations[l]);

// Symmetric key set across all languages: union, then check each is present in each lang.
const union = new Set();
for (const lang of langs) for (const k of Object.keys(translations[lang])) union.add(k);
for (const lang of langs) {
    const have = new Set(Object.keys(translations[lang]));
    const missing = [...union].filter(k => !have.has(k)).sort();
    if (missing.length) err('translations["' + lang + '"] is missing ' + missing.length + ' key(s): ' + missing.join(', '));
}

// Each ADD_TYPES entry needs a `type.<Name>` translation in every language.
for (const t of ADD_TYPES) {
    const key = 'type.' + t;
    for (const lang of langs) {
        if (!Object.prototype.hasOwnProperty.call(translations[lang], key)) {
            err('ADD_TYPES "' + t + '" has no translation key "' + key + '" in lang "' + lang + '"');
        }
    }
}

// Every `nameKey: '...'` referenced in index.html must resolve in every language.
const nameKeyRe = /nameKey\s*:\s*'([^']+)'/g;
const nameKeys = new Set();
let m;
while ((m = nameKeyRe.exec(html)) !== null) nameKeys.add(m[1]);
for (const key of nameKeys) {
    for (const lang of langs) {
        if (!Object.prototype.hasOwnProperty.call(translations[lang], key)) {
            err('nameKey "' + key + '" is missing in translations["' + lang + '"]');
        }
    }
}

// Static `data-i18n*` attributes in HTML must resolve in every language.
const i18nAttrRe = /data-i18n(?:-placeholder|-title)?\s*=\s*"([^"]+)"/g;
const htmlKeys = new Set();
while ((m = i18nAttrRe.exec(html)) !== null) htmlKeys.add(m[1]);
for (const key of htmlKeys) {
    for (const lang of langs) {
        if (!Object.prototype.hasOwnProperty.call(translations[lang], key)) {
            err('data-i18n attribute key "' + key + '" is missing in translations["' + lang + '"]');
        }
    }
}

// Schema `type` discriminator must equal ADD_TYPES (as an unordered set).
const schema = JSON.parse(readFileSync(WOODMODEL_SCHEMA, 'utf8'));
const schemaTypeEnum = schema?.properties?.pieces?.items?.properties?.type?.enum;
if (!Array.isArray(schemaTypeEnum)) {
    err('woodmodel.schema.json: pieces.items.properties.type.enum is missing or not an array');
} else {
    const a = new Set(ADD_TYPES);
    const b = new Set(schemaTypeEnum);
    const onlyInAdd = [...a].filter(x => !b.has(x));
    const onlyInSchema = [...b].filter(x => !a.has(x));
    if (onlyInAdd.length) err('Schema type enum is missing ADD_TYPES values: ' + onlyInAdd.join(', '));
    if (onlyInSchema.length) err('Schema type enum has extra values not in ADD_TYPES: ' + onlyInSchema.join(', '));
}

// Unused translation keys: present in translations but never referenced in HTML
// (data-i18n*), via t('key'), via typeName (type.X), or as a nameKey. Reported
// as warnings only — some keys are interpolated dynamically (e.g. cost.*, snap.*).
const tCallRe = /\bt\(\s*'([^']+)'/g;
const tCallKeys = new Set();
while ((m = tCallRe.exec(html)) !== null) tCallKeys.add(m[1]);
const referenced = new Set([
    ...htmlKeys,
    ...tCallKeys,
    ...nameKeys,
    ...ADD_TYPES.map(t => 'type.' + t),
]);
const enKeys = new Set(Object.keys(translations.en || {}));
const unused = [...enKeys].filter(k => !referenced.has(k));
if (unused.length) warn('possibly-unused translation keys (no static reference found): ' + unused.sort().join(', '));

// Report.
const out = [];
out.push('# Consistency Lint');
out.push('');
out.push('- Languages checked: ' + langs.join(', '));
out.push('- Translation keys (union): ' + union.size);
out.push('- ADD_TYPES: ' + ADD_TYPES.length);
out.push('- nameKey references: ' + nameKeys.size);
out.push('- HTML data-i18n keys: ' + htmlKeys.size);
out.push('- Schema type enum size: ' + (Array.isArray(schemaTypeEnum) ? schemaTypeEnum.length : 'n/a'));
out.push('');
if (errors.length) {
    out.push('## Errors');
    for (const e of errors) out.push('- :x: ' + e);
    out.push('');
}
if (warnings.length) {
    out.push('## Warnings');
    for (const w of warnings) out.push('- :warning: ' + w);
    out.push('');
}
if (!errors.length && !warnings.length) {
    out.push('All checks passed. :tada:');
}
const report = out.join('\n');
console.log(report);

if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
}

if (errors.length) {
    console.error('\nConsistency lint failed with ' + errors.length + ' error(s).');
    process.exit(1);
}
