/**
 * Fonte de dados dos produtos (vitrine).
 *
 * Hoje é um array tipado em memória. A ideia é que toda a UI consuma apenas as
 * funções abaixo (getAllProducts, getProductBySlug, ...), então trocar esta
 * fonte por um CMS, banco de dados ou API — quando entrar o e-commerce — não
 * exige mexer nas páginas.
 */

export type CategorySlug =
  | "poltronas"
  | "sofas"
  | "mesas"
  | "iluminacao"
  | "decoracao";

export type Category = {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
};

export type Product = {
  slug: string;
  name: string;
  category: CategorySlug;
  /** Preço em BRL. Ausente = "Sob consulta". */
  price?: number;
  priceNote?: string;
  badge?: string;
  shortDescription: string;
  description: string[];
  images: string[];
  materials: string[];
  finishes: string[];
  dimensions: { largura: string; profundidade: string; altura: string };
  leadTime: string;
  featured?: boolean;
};

export const categories: Category[] = [
  {
    slug: "poltronas",
    name: "Poltronas",
    description: "Assentos de assinatura para lobbies, suítes e áreas de estar.",
    image: "/img/gallery/product-detls/product-01.jpg",
  },
  {
    slug: "sofas",
    name: "Sofás",
    description: "Estofados de linhas generosas para ambientes de convívio.",
    image: "/img/about/about-banner-02.jpg",
  },
  {
    slug: "mesas",
    name: "Mesas & Apoio",
    description: "Centro, laterais e aparadores em madeiras nobres.",
    image: "/img/gallery/shop-01/shop-01.jpg",
  },
  {
    slug: "iluminacao",
    name: "Iluminação",
    description: "Luminárias autorais em latão e acabamentos sob medida.",
    image: "/img/home-v3/banner-slider-03.jpg",
  },
  {
    slug: "decoracao",
    name: "Decoração",
    description: "Peças de acabamento que dão alma ao ambiente.",
    image: "/img/home-v2/product/pdct-03.jpg",
  },
];

export const products: Product[] = [
  {
    slug: "poltrona-aurora",
    name: "Poltrona Aurora",
    category: "poltronas",
    price: 4890,
    badge: "Best-seller",
    shortDescription: "Curvas suaves em madeira laminada e linho natural.",
    description: [
      "A Poltrona Aurora combina a calidez da madeira curvada ao toque acolhedor do linho, criando um assento de presença serena para lobbies e suítes.",
      "Cada peça é montada à mão, com espuma de densidade controlada para conforto prolongado — pensada para o uso intenso da hotelaria.",
    ],
    images: [
      "/img/gallery/product-detls/product-01.jpg",
      "/img/gallery/product-detls/product-02.jpg",
      "/img/home-v2/product/pdct-01.jpg",
    ],
    materials: ["Madeira de nogueira", "Linho natural", "Espuma HR"],
    finishes: ["Linho areia", "Bouclé cru", "Veludo verde-musgo"],
    dimensions: { largura: "62 cm", profundidade: "58 cm", altura: "74 cm" },
    leadTime: "45 a 60 dias",
    featured: true,
  },
  {
    slug: "poltrona-vittoria",
    name: "Poltrona Vittoria",
    category: "poltronas",
    price: 5640,
    badge: "Novo",
    shortDescription: "Silhueta esguia com base em latão escovado.",
    description: [
      "Inspirada no design italiano dos anos 60, a Vittoria traz encosto alto e revestimento acetinado que valoriza qualquer paleta de ambientação.",
      "A base em latão escovado eleva a peça a um ponto focal — ideal para suítes de assinatura e espaços de recepção.",
    ],
    images: [
      "/img/about/about-banner-01.jpg",
      "/img/gallery/product-detls/product-04.jpg",
    ],
    materials: ["Latão escovado", "Veludo italiano", "Estrutura em eucalipto"],
    finishes: ["Mostarda", "Terracota", "Azul-noite"],
    dimensions: { largura: "68 cm", profundidade: "72 cm", altura: "82 cm" },
    leadTime: "60 dias",
    featured: true,
  },
  {
    slug: "poltrona-ibis",
    name: "Poltrona Íbis",
    category: "poltronas",
    price: 5120,
    shortDescription: "Giratória com base estrela em alumínio grafite.",
    description: [
      "Conforto executivo com giro suave de 360°. O contraste entre a trama clara e a base grafite confere sofisticação discreta a salas de reunião e lounges.",
    ],
    images: [
      "/img/gallery/product-detls/product-02.jpg",
      "/img/gallery/product-detls/product-01.jpg",
    ],
    materials: ["Trama bicolor", "Alumínio fundido", "Mecanismo giratório"],
    finishes: ["Cinza & areia", "Grafite & cru"],
    dimensions: { largura: "70 cm", profundidade: "70 cm", altura: "78 cm" },
    leadTime: "50 dias",
  },
  {
    slug: "poltrona-nordica",
    name: "Poltrona Nórdica",
    category: "poltronas",
    shortDescription: "Casca escultural sobre pés de madeira maciça.",
    description: [
      "Um clássico contemporâneo de linhas limpas. Empilhável e resistente, atende bem áreas de café da manhã e coworkings de hóspedes.",
    ],
    images: [
      "/img/gallery/product-detls/product-03.jpg",
      "/img/gallery/product-detls/product-04.jpg",
    ],
    materials: ["Polipropileno reforçado", "Faia maciça"],
    finishes: ["Grafite", "Branco", "Verde-oliva"],
    dimensions: { largura: "60 cm", profundidade: "55 cm", altura: "80 cm" },
    leadTime: "30 dias",
  },
  {
    slug: "sofa-serena",
    name: "Sofá Serena",
    category: "sofas",
    price: 12800,
    badge: "Best-seller",
    shortDescription: "Três lugares com estrutura em madeira aparente.",
    description: [
      "Linhas baixas e assento profundo para o máximo de conforto. A estrutura em madeira aparente traz leveza visual sem abrir mão da robustez.",
      "Enchimento em plumas sintéticas e espuma de alta resiliência garantem caimento impecável mesmo em uso contínuo.",
    ],
    images: [
      "/img/home-v3/banner-slider-01.jpg",
      "/img/home-v3/banner-slider-03.jpg",
    ],
    materials: ["Madeira maciça", "Espuma HR", "Plumas sintéticas"],
    finishes: ["Verde-água", "Cinza-pérola", "Bege-linho"],
    dimensions: { largura: "220 cm", profundidade: "95 cm", altura: "78 cm" },
    leadTime: "60 a 75 dias",
    featured: true,
  },
  {
    slug: "sofa-lombardia",
    name: "Sofá Lombardia",
    category: "sofas",
    price: 14200,
    shortDescription: "Volumes generosos em tecido acamurçado.",
    description: [
      "O Lombardia é o convite ao descanso: assentos largos, braços amplos e um caimento macio que ancora salas de estar e lounges de hotel.",
    ],
    images: [
      "/img/about/about-banner-02.jpg",
      "/img/home-v3/banner-slider-01.jpg",
    ],
    materials: ["Suede premium", "Base metálica oculta", "Espuma HR"],
    finishes: ["Verde-oliva", "Grafite", "Caramelo"],
    dimensions: { largura: "240 cm", profundidade: "100 cm", altura: "80 cm" },
    leadTime: "60 dias",
    featured: true,
  },
  {
    slug: "sofa-aurora-curve",
    name: "Sofá Aurora Curve",
    category: "sofas",
    priceNote: "Sob medida",
    badge: "Sob encomenda",
    shortDescription: "Módulo curvo em veludo para lounges de assinatura.",
    description: [
      "Peça de destaque para grandes áreas sociais. O desenho curvo cria ilhas de convívio e organiza o espaço com elegância escultural.",
      "Produzido sob medida, em módulos, para se adaptar ao layout de cada projeto.",
    ],
    images: [
      "/img/about/about-banner-03.jpg",
      "/img/about/about-banner-02.jpg",
    ],
    materials: ["Veludo de algodão", "Estrutura modular", "Espuma HR"],
    finishes: ["Terracota", "Areia", "Verde-inglês"],
    dimensions: { largura: "sob projeto", profundidade: "105 cm", altura: "78 cm" },
    leadTime: "75 a 90 dias",
  },
  {
    slug: "mesa-centro-tronco",
    name: "Mesa de Centro Tronco",
    category: "mesas",
    price: 3980,
    shortDescription: "Tampo orgânico em nogueira maciça.",
    description: [
      "Esculpida a partir de madeira maciça, a Tronco traz textura e naturalidade ao centro do ambiente. Cada peça tem veios únicos.",
    ],
    images: [
      "/img/about/about-banner-02.jpg",
      "/img/home-v3/banner-slider-03.jpg",
    ],
    materials: ["Nogueira maciça", "Verniz fosco"],
    finishes: ["Nogueira natural", "Freijó"],
    dimensions: { largura: "110 cm", profundidade: "70 cm", altura: "38 cm" },
    leadTime: "45 dias",
    featured: true,
  },
  {
    slug: "aparador-linha",
    name: "Aparador Linha",
    category: "mesas",
    price: 6450,
    shortDescription: "Console de linhas retas em madeira clara.",
    description: [
      "Discreto e funcional, o aparador Linha organiza halls e corredores com puxadores torneados e gavetas de deslize suave.",
    ],
    images: [
      "/img/gallery/shop-01/shop-01.jpg",
      "/img/home-v3/banner-slider-02.jpg",
    ],
    materials: ["Madeira de freijó", "Corrediças telescópicas"],
    finishes: ["Freijó natural", "Carvalho claro"],
    dimensions: { largura: "140 cm", profundidade: "42 cm", altura: "80 cm" },
    leadTime: "50 dias",
  },
  {
    slug: "luminaria-piso-halo",
    name: "Luminária de Piso Halo",
    category: "iluminacao",
    price: 2760,
    badge: "Novo",
    shortDescription: "Haste em madeira com cúpula de linho.",
    description: [
      "Luz difusa e aconchegante para cantos de leitura e suítes. A haste em madeira e a cúpula de linho criam uma atmosfera calorosa ao entardecer.",
    ],
    images: [
      "/img/home-v3/banner-slider-03.jpg",
      "/img/about/about-banner-03.jpg",
    ],
    materials: ["Madeira maciça", "Cúpula de linho", "Dimmer integrado"],
    finishes: ["Carvalho & cru", "Nogueira & areia"],
    dimensions: { largura: "35 cm", profundidade: "35 cm", altura: "150 cm" },
    leadTime: "40 dias",
    featured: true,
  },
  {
    slug: "vaso-ceramica-dune",
    name: "Vaso Cerâmica Dune",
    category: "decoracao",
    price: 420,
    shortDescription: "Cerâmica esmaltada em duas texturas.",
    description: [
      "Feito à mão, o Dune combina esmalte acetinado e base rústica. Perfeito para composições em recepções e mesas de apoio.",
    ],
    images: [
      "/img/home-v2/product/pdct-03.jpg",
      "/img/home-v2/product/pdct-04.jpg",
    ],
    materials: ["Cerâmica esmaltada"],
    finishes: ["Branco & pedra", "Areia"],
    dimensions: { largura: "18 cm", profundidade: "18 cm", altura: "28 cm" },
    leadTime: "15 dias",
  },
  {
    slug: "vaso-torneado-noz",
    name: "Vaso Torneado Noz",
    category: "decoracao",
    price: 560,
    shortDescription: "Madeira torneada com acabamento acetinado.",
    description: [
      "Torneado artesanalmente em madeira nobre, um objeto escultural que aquece prateleiras, aparadores e nichos.",
    ],
    images: [
      "/img/home-v2/arrival-01.jpg",
      "/img/home-v2/product/pdct-03.jpg",
    ],
    materials: ["Madeira nobre torneada", "Óleo natural"],
    finishes: ["Nogueira", "Imbuia"],
    dimensions: { largura: "16 cm", profundidade: "16 cm", altura: "24 cm" },
    leadTime: "20 dias",
  },
];

/* ------------------------------------------------------------------ *
 * API de acesso — use SEMPRE estas funções nas páginas/componentes.
 * ------------------------------------------------------------------ */

export function getAllProducts(): Product[] {
  return products;
}

export function getFeaturedProducts(limit = 6): Product[] {
  return products.filter((p) => p.featured).slice(0, limit);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: CategorySlug): Product[] {
  return products.filter((p) => p.category === category);
}

export function getCategory(slug: CategorySlug): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  return products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, limit);
}

/** Formata preço para exibição. Sem preço → "Sob consulta". */
export function formatPrice(product: Pick<Product, "price" | "priceNote">): string {
  if (product.priceNote) return product.priceNote;
  if (typeof product.price !== "number") return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(product.price);
}
