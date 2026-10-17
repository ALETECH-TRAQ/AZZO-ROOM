// Catálogo procedural v1. IDs permanecem estáveis quando meshes GLB substituírem as primitivas.
export const skins = [
  "#f8d9c5",
  "#edbd9c",
  "#dca27d",
  "#be8059",
  "#9b6142",
  "#70432f",
  "#452b23",
];
export const hairColors = [
  "#251b19",
  "#4a2e23",
  "#815132",
  "#c9a167",
  "#b75832",
  "#a4a3a1",
  "#273d52",
];
export const clothingColors = [
  "#e8eef6",
  "#639bc3",
  "#202d46",
  "#d6bda4",
  "#6e8c78",
  "#b27e8d",
  "#484b57",
];
export const hairs = [
  "Original da base",
  "Lateral",
  "Despenteado",
  "Ondulado curto",
  "Cacheado curto",
  "Raspado",
  "Undercut",
  "Longo liso",
  "Médio liso",
  "Ondulado longo",
  "Cacheado longo",
  "Coque",
  "Meio preso",
  "Curto com franja",
];
export const glasses = [
  "Sem óculos",
  "Redondo",
  "Quadrado",
  "Retangular",
  "Aviador",
  "Moderno",
  "Esportivo",
];
export const tops = [
  "Camisa social",
  "Blazer",
  "Camiseta",
  "Moletom",
  "Jaqueta",
];
export const accessories = [
  "Crachá",
  "Headset",
  "Mochila",
  "Café",
  "Smartwatch",
  "Boné",
  "Chapéu",
  "Colar",
];
export const defaultAvatar = {
  schemaVersion: 1,
  base: "masc",
  displayName: "Meu avatar",
  pronoun: "",
  skin: 2,
  hair: 0,
  hairColor: 1,
  eyes: "#3b2720",
  glasses: 0,
  top: 0,
  topColor: 0,
  bottom: 0,
  bottomColor: 2,
  shoes: 0,
  accessories: [],
  height: 1,
  body: 1,
  face: 1,
};
export const presetNames = [
  "Clássico",
  "Tech casual",
  "Executivo",
  "Criativo",
  "Business casual",
  "Clássica",
  "Executiva",
  "Tech",
  "Criativa",
  "Minimalista",
  "Moderna",
  "Despojada",
  "Sênior",
  "Contemporâneo",
];
export const presets = presetNames.map((name, i) => ({
  name,
  config: {
    ...defaultAvatar,
    base: i < 5 ? "masc" : "fem",
    skin: i % 7,
    hair: [0, 6, 1, 4, 3, 7, 11, 8, 10, 12, 9, 13, 11, 2][i],
    hairColor: i % 7,
    top: i % 5,
    topColor: i % 7,
    glasses: i % 4,
    accessories: i % 2 ? [0, 4] : [0],
    bottom: i === 6 ? 1 : 0,
  },
}));
export function validateAvatar(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    JSON.stringify(value).length > 2000
  )
    return null;
  const v = value;
  if (
    v.schemaVersion !== 1 ||
    !["masc", "fem", "custom"].includes(v.base) ||
    typeof v.displayName !== "string" ||
    !v.displayName.trim() ||
    v.displayName.length > 28 ||
    typeof v.pronoun !== "string" ||
    v.pronoun.length > 24
  )
    return null;
  for (const [key, max] of Object.entries({
    skin: 6,
    hair: 13,
    hairColor: 6,
    glasses: 6,
    top: 4,
    topColor: 6,
    bottom: 1,
    bottomColor: 6,
    shoes: 1,
  }))
    if (!Number.isInteger(v[key]) || v[key] < 0 || v[key] > max) return null;
  if (!["#3b2720", "#6b8d78", "#6293bf", "#20212a"].includes(v.eyes))
    return null;
  for (const key of ["height", "body", "face"])
    if (
      typeof v[key] !== "number" ||
      !Number.isFinite(v[key]) ||
      v[key] < 0.9 ||
      v[key] > 1.1
    )
      return null;
  if (
    !Array.isArray(v.accessories) ||
    v.accessories.length > 8 ||
    new Set(v.accessories).size !== v.accessories.length ||
    v.accessories.some((i) => !Number.isInteger(i) || i < 0 || i > 7)
  )
    return null;
  const sanitized = Object.fromEntries(
    Object.keys(defaultAvatar).map((k) => [
      k,
      k === "displayName" ? v[k].trim() : v[k],
    ]),
  );
  // Older profiles used a third procedural base. Keep those profiles valid,
  // while rendering them with one of the two official Meshy characters.
  if (sanitized.base === "custom") sanitized.base = "masc";
  return sanitized;
}
export const manifest = {
  version: 2,
  renderer: "meshy-glb",
  bases: [
    { id: "masc", label: "Central", url: "/avatars/meshy/central.glb" },
    { id: "fem", label: "Willow", url: "/avatars/meshy/willow.glb" },
  ],
  anchorPoints: ["head", "torso", "leftHand", "rightHand", "leftWrist", "back"],
  hairs: hairs.slice(0, 1).map((label, id) => ({
    id,
    category: "hair",
    label,
    variant: id,
    compatibility: ["masc", "fem"],
    anchor: "head",
    url: null,
  })),
  tops: tops.map((label, id) => ({
    id,
    category: "top",
    label,
    variant: id,
    compatibility: ["masc", "fem"],
    anchor: "torso",
    url: null,
  })),
};
export const obstacles = [
  ...[-9.3, -5.65, -1.75].flatMap((x) =>
    [-4.7, 0.2].map((z) => ({ x, z, w: 2.15, d: 1.05 })),
  ),
  { x: 7.6, z: -3.7, w: 5.5, d: 2 },
  { x: 7.8, z: 2.2, w: 3.4, d: 1.3 },
  { x: 5, z: 6, w: 4.5, d: 1.3 },
  { x: -8.6, z: 5.6, w: 3.6, d: 1.1 },
  { x: -4.9, z: 5.45, w: 1.55, d: 1.2 },
  { x: 3.05, z: -4.6, w: 0.12, d: 7.5 },
];
export function collides(x, z) {
  return obstacles.some(
    (o) =>
      Math.abs(x - o.x) < o.w / 2 + 0.28 && Math.abs(z - o.z) < o.d / 2 + 0.28,
  );
}
// Sweep along each axis, so a delayed packet cannot tunnel through thin furniture.
export function resolveMovement(x, z, targetX, targetZ) {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(targetX - x, targetZ - z) / 0.1),
  );
  const dx = (targetX - x) / steps,
    dz = (targetZ - z) / steps;
  for (let i = 0; i < steps; i++) {
    if (!collides(x + dx, z)) x += dx;
    if (!collides(x, z + dz)) z += dz;
  }
  return { x, z };
}
