const OPEN_FOOD_FACTS_URL =
  "https://world.openfoodfacts.org/api/v3/product";

export async function getProductByBarcode(barcode) {
  if (!barcode) {
    throw new Error("Barcode tidak ditemukan.");
  }

  const cleanBarcode = barcode
    .toString()
    .replace(/\D/g, "");

  if (!cleanBarcode) {
    throw new Error("Barcode tidak valid.");
  }

  const url =
    `${OPEN_FOOD_FACTS_URL}/${cleanBarcode}` +
    "?fields=code,product_name,product_name_en,brands," +
    "image_front_url,image_front_small_url," +
    "ingredients_text,ingredients_text_en," +
    "serving_size,nutrition_data_per,nutriscore_grade," +
    "nutriments";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Open Food Facts error: ${response.status}`
    );
  }

  const data = await response.json();

  if (!data.product) {
    throw new Error(
      "Produk dengan barcode tersebut tidak ditemukan."
    );
  }

  return normalizeProduct(data.product, cleanBarcode);
}

function normalizeProduct(product, barcode) {
  const nutriments = product.nutriments || {};

  const calories =
    nutriments["energy-kcal_serving"] ??
    nutriments["energy-kcal_100g"] ??
    nutriments["energy-kcal"];

  const sugar =
    nutriments["sugars_serving"] ??
    nutriments["sugars_100g"] ??
    nutriments["sugars"];

  const fat =
    nutriments["fat_serving"] ??
    nutriments["fat_100g"] ??
    nutriments["fat"];

  const protein =
    nutriments["proteins_serving"] ??
    nutriments["proteins_100g"] ??
    nutriments["proteins"];

  const sodium =
    nutriments["sodium_serving"] ??
    nutriments["sodium_100g"] ??
    nutriments["sodium"];

  const grade = (
    product.nutriscore_grade || ""
  ).toUpperCase();

  return {
    barcode,

    product_name:
      product.product_name ||
      product.product_name_en ||
      "Produk Tidak Diketahui",

    brand:
      product.brands ||
      "",

    image:
      product.image_front_url ||
      product.image_front_small_url ||
      null,

    serving_size:
      product.serving_size ||
      "100 g",

    calories: numberOrNull(calories),
    sugar: numberOrNull(sugar),
    fat: numberOrNull(fat),
    protein: numberOrNull(protein),
    sodium: sodiumToMg(sodium),

    ingredients:
      product.ingredients_text ||
      product.ingredients_text_en ||
      "",

    grade: grade || "?",

    health_score: calculateHealthScore(grade),

    verdict: createVerdict(grade),

    recommendation:
      createRecommendation(grade),

    nutrition_unit:
      product.nutrition_data_per === "serving"
        ? "per sajian"
        : "per 100 g",
  };
}

function numberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? Math.round(number * 10) / 10
    : null;
}

function sodiumToMg(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  /*
   * Open Food Facts menyimpan sodium
   * dalam gram pada beberapa field.
   *
   * Kita ubah menjadi mg.
   */
  if (number < 20) {
    return Math.round(number * 1000);
  }

  return Math.round(number);
}

function calculateHealthScore(grade) {
  const scores = {
    A: 90,
    B: 80,
    C: 65,
    D: 45,
    E: 25,
  };

  return scores[grade] || 50;
}

function createVerdict(grade) {
  switch (grade) {
    case "A":
      return (
        "Produk memiliki profil nutrisi yang relatif baik " +
        "berdasarkan Nutri-Score. Tetap konsumsi sesuai " +
        "kebutuhan dan pola makan harian."
      );

    case "B":
      return (
        "Produk memiliki profil nutrisi yang cukup baik. " +
        "Tetap perhatikan jumlah konsumsi dan kandungan " +
        "gula, lemak, serta natrium."
      );

    case "C":
      return (
        "Produk memiliki profil nutrisi sedang. " +
        "Sebaiknya dikonsumsi secara wajar dan dibandingkan " +
        "dengan alternatif produk yang lebih sehat."
      );

    case "D":
      return (
        "Produk memiliki profil nutrisi yang perlu diperhatikan. " +
        "Pertimbangkan membatasi konsumsi dan memilih alternatif " +
        "dengan profil nutrisi yang lebih baik."
      );

    case "E":
      return (
        "Produk memiliki profil nutrisi yang kurang baik " +
        "berdasarkan Nutri-Score. Konsumsi sebaiknya dibatasi " +
        "sebagai bagian dari pola makan seimbang."
      );

    default:
      return (
        "Data Nutri-Score produk belum tersedia. " +
        "Periksa informasi nutrisi pada kemasan sebelum mengonsumsi."
      );
  }
}

function createRecommendation(grade) {
  switch (grade) {
    case "A":
      return "Pilihan relatif baik. Tetap perhatikan porsi konsumsi.";

    case "B":
      return "Masih cukup baik, tetapi tetap perhatikan porsi dan frekuensi konsumsi.";

    case "C":
      return "Bandingkan dengan produk lain dan pilih yang memiliki profil nutrisi lebih baik jika tersedia.";

    case "D":
      return "Batasi konsumsi dan pertimbangkan alternatif dengan kandungan gula, lemak, atau natrium lebih rendah.";

    case "E":
      return "Sebaiknya dibatasi dan tidak menjadi pilihan utama dalam konsumsi sehari-hari.";

    default:
      return "Periksa tabel nutrisi pada kemasan sebelum membuat keputusan konsumsi.";
  }
}