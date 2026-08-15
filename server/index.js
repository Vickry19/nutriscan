import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

/*
|--------------------------------------------------------------------------
| MULTER
|--------------------------------------------------------------------------
*/

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NutriScan AI Server is running",
    gemini: Boolean(process.env.GEMINI_API_KEY),
  });
});

/*
|--------------------------------------------------------------------------
| GEMINI ANALYZER
|--------------------------------------------------------------------------
*/

async function analyzeWithGemini(file) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY belum ditemukan di file .env"
    );
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  /*
   * Convert image menjadi Base64
   */

  const base64Image =
    file.buffer.toString("base64");

  /*
  |--------------------------------------------------------------------------
  | PROMPT
  |--------------------------------------------------------------------------
  */

  const prompt = `
Kamu adalah NutriScan AI.

NutriScan adalah aplikasi untuk menganalisis:
1. makanan atau masakan yang terlihat dalam satu foto
2. produk makanan/minuman kemasan dalam satu foto

Tujuan utama adalah memberikan informasi nutrisi yang
berguna dari SATU FOTO.

Gunakan Bahasa Indonesia.

Jangan memberikan diagnosis medis.

==================================================
TAHAP 1 — IDENTIFIKASI GAMBAR
==================================================

Tentukan apakah gambar merupakan:

"meal"

atau

"packaged_product"

atau

"drink"

atau

"unknown"

Contoh MEAL:

- nasi ayam
- nasi goreng
- mie goreng
- burger
- pizza
- salad
- sup
- makanan di piring
- makanan yang sudah disajikan

Contoh PACKAGED_PRODUCT:

- Indomie
- biskuit
- snack
- susu kotak
- makanan beku
- minuman kemasan
- produk makanan dalam bungkus

==================================================
TAHAP 2 — JIKA MAKANAN / MASAKAN
==================================================

Jika gambar merupakan makanan atau masakan:

JANGAN mengembalikan semua data nutrisi sebagai null
hanya karena tidak ada tabel nutrisi.

Lakukan ESTIMASI berdasarkan:

- jenis makanan
- komponen makanan yang terlihat
- ukuran porsi
- perkiraan berat
- metode memasak
- bahan yang terlihat

Identifikasi semua komponen makanan.

Contoh:

Foto:
nasi + ayam goreng + telur + sayur

Maka:

items:

[
  {
    "name": "Nasi putih",
    "estimated_portion": "±150 g"
  },
  {
    "name": "Ayam goreng",
    "estimated_portion": "±100 g"
  },
  {
    "name": "Telur",
    "estimated_portion": "±1 butir"
  },
  {
    "name": "Sayuran",
    "estimated_portion": "±50 g"
  }
]

Kemudian hitung ESTIMASI TOTAL:

- kalori
- protein
- karbohidrat
- lemak
- lemak jenuh
- gula
- serat
- natrium

Untuk makanan:

nutrition_source = "estimated"

==================================================
TAHAP 3 — JIKA PRODUK KEMASAN
==================================================

Jika gambar merupakan produk kemasan:

Identifikasi:

- nama produk
- brand
- varian
- serving size
- berat bersih
- tabel informasi nilai gizi
- komposisi
- ingredients

Jika tabel nutrisi terlihat:

WAJIB membaca angka yang terlihat dari label.

Jangan mengubah angka.

Contoh:

Energi = 350 kcal
Protein = 8 g
Lemak = 15 g

maka gunakan angka tersebut.

nutrition_source:

"label"

Jika angka nutrisi tidak terlihat:

Jangan mengarang seolah-olah angka tersebut berasal
dari label.

Untuk produk yang sangat jelas dikenali, estimasi boleh
digunakan hanya jika diperlukan untuk memberikan
gambaran nutrisi.

Dalam kasus tersebut:

nutrition_source = "estimated"

Jika tidak dapat diestimasi dengan aman:

gunakan null.

==================================================
TAHAP 4 — KOMPOSISI
==================================================

Untuk produk kemasan:

Cari daftar komposisi pada kemasan.

Contoh:

ingredients:

[
  {
    "name": "Tepung terigu",
    "description": "Bahan utama"
  },
  {
    "name": "Minyak nabati",
    "description": "Sumber lemak"
  },
  {
    "name": "Garam",
    "description": "Memberikan rasa dan natrium"
  }
]

Jika komposisi tidak terlihat:

jangan mengarang daftar komposisi resmi.

Untuk makanan:

ingredients dapat berupa bahan atau komponen
yang dapat dikenali dari makanan.

==================================================
TAHAP 5 — UKURAN PORSI
==================================================

Untuk makanan:

Perkirakan ukuran porsi.

Gunakan:

- gram
- ml
- potong
- butir
- sendok
- mangkuk
- porsi

Contoh:

"±150 g"

Jangan menyatakan angka sebagai ukuran pasti.

==================================================
TAHAP 6 — NUTRISI
==================================================

Gunakan field berikut:

calories
protein
carbohydrates
fat
saturated_fat
sugar
fiber
sodium

Satuan:

calories = kcal

protein = g

carbohydrates = g

fat = g

saturated_fat = g

sugar = g

fiber = g

sodium = mg

==================================================
UNTUK MAKANAN
==================================================

Nutrisi adalah ESTIMASI TOTAL makanan yang terlihat.

Contoh:

{
  "calories": 620,
  "protein": 32,
  "carbohydrates": 67,
  "fat": 24,
  "saturated_fat": 7,
  "sugar": 4,
  "fiber": 4.5,
  "sodium": 780
}

==================================================
UNTUK PRODUK KEMASAN
==================================================

Jika label terlihat:

gunakan angka label.

Jika hanya dapat melakukan estimasi:

gunakan angka estimasi dan tandai:

nutrition_source = "estimated"

==================================================
TAHAP 7 — HEALTH SCORE
==================================================

Berikan health_score dari 0 sampai 100.

Pertimbangkan:

POSITIF:

- protein cukup
- serat tinggi
- bahan makanan sederhana
- sayuran
- buah
- sumber protein

NEGATIF:

- gula tinggi
- natrium tinggi
- lemak jenuh tinggi
- kalori sangat tinggi
- makanan sangat diproses

Grade:

90-100 = A

80-89 = B

70-79 = C

60-69 = D

0-59 = E

Jika informasi terlalu sedikit untuk memberikan score
secara bertanggung jawab:

health_score = null
grade = null

==================================================
TAHAP 8 — VERDICT
==================================================

Buat penjelasan singkat mengenai makanan tersebut.

Contoh:

"Makanan ini memiliki kandungan protein yang cukup,
tetapi kandungan lemak dan natrium perlu diperhatikan."

==================================================
TAHAP 9 — RECOMMENDATION
==================================================

Berikan rekomendasi praktis.

Contoh:

"Kurangi porsi makanan yang digoreng dan tambahkan
sayuran untuk meningkatkan serat."

==================================================
TAHAP 10 — CONFIDENCE
==================================================

Berikan confidence 0-100.

90-100:
gambar sangat jelas.

75-89:
gambar cukup jelas.

50-74:
terdapat ketidakpastian.

0-49:
identifikasi kurang yakin.

==================================================
ATURAN PENTING
==================================================

1. Jangan memberikan diagnosis medis.

2. Jangan mengarang angka sebagai angka label resmi.

3. Untuk makanan/masakan, lakukan estimasi nutrisi.

4. Untuk makanan yang jelas terlihat, jangan membuat
semua nilai nutrisi null.

5. Untuk produk kemasan, prioritaskan informasi label.

6. Komposisi harus diisi jika terlihat atau dapat
diidentifikasi dengan cukup yakin.

7. Gunakan null hanya jika informasi benar-benar
tidak dapat diperoleh.

8. Jangan mengembalikan Markdown.

9. Jangan memberikan teks di luar JSON.

==================================================
FORMAT JSON
==================================================

Kembalikan JSON dengan struktur berikut:

{
  "is_valid_product": true,

  "analysis_type": "meal",

  "product_name": "Nama makanan",

  "brand": "",

  "variant": "",

  "serving_size": "1 porsi",

  "net_weight": null,

  "nutrition_source": "estimated",

  "ingredient_source": "estimated",

  "nutrition_unit": "perkiraan total makanan",

  "items": [
    {
      "name": "Nasi putih",
      "estimated_portion": "±150 g"
    }
  ],

  "ingredients": [
    {
      "name": "Nasi putih",
      "description": "Sumber karbohidrat"
    }
  ],

  "calories": 500,

  "protein": 25,

  "carbohydrates": 55,

  "fat": 20,

  "saturated_fat": 6,

  "sugar": 4,

  "fiber": 3,

  "sodium": 600,

  "health_score": 70,

  "grade": "C",

  "confidence": 85,

  "verdict": "Analisis makanan.",

  "recommendation": "Perhatikan porsi dan lengkapi dengan sayuran."
}

Pastikan semua JSON valid.
`;

/*
|--------------------------------------------------------------------------
| SEND TO GEMINI
|--------------------------------------------------------------------------
*/

  const response =
    await ai.models.generateContent({
      model: "gemini-3.5-flash",

      contents: [
        {
          role: "user",

          parts: [
            {
              inlineData: {
                mimeType:
                  file.mimetype ||
                  "image/jpeg",

                data: base64Image,
              },
            },

            {
              text: prompt,
            },
          ],
        },
      ],

      config: {
        responseMimeType:
          "application/json",
      },
    });

/*
|--------------------------------------------------------------------------
| GET RESPONSE
|--------------------------------------------------------------------------
*/

  const text = response.text;

  if (!text) {
    throw new Error(
      "Gemini tidak memberikan hasil."
    );
  }

  console.log("");
  console.log(
    "================================"
  );

  console.log(
    "🤖 GEMINI RAW RESPONSE"
  );

  console.log(text);

  console.log(
    "================================"
  );

  /*
  |--------------------------------------------------------------------------
  | CLEAN JSON
  |--------------------------------------------------------------------------
  */

  const cleanText =
    text
      .replace(
        /^```json\s*/i,
        ""
      )
      .replace(
        /^```\s*/i,
        ""
      )
      .replace(
        /\s*```$/i,
        ""
      )
      .trim();

  /*
  |--------------------------------------------------------------------------
  | PARSE JSON
  |--------------------------------------------------------------------------
  */

  let result;

  try {
    result =
      JSON.parse(
        cleanText
      );
  } catch (error) {
    console.error(
      "JSON Gemini tidak valid:"
    );

    console.error(
      cleanText
    );

    throw new Error(
      "Gemini memberikan response JSON yang tidak valid."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | NORMALISASI
  |--------------------------------------------------------------------------
  */

  result.items =
    Array.isArray(
      result.items
    )
      ? result.items
      : [];

  result.ingredients =
    Array.isArray(
      result.ingredients
    )
      ? result.ingredients
      : [];

  /*
  |--------------------------------------------------------------------------
  | DEFAULT FIELD
  |--------------------------------------------------------------------------
  */

  if (!result.analysis_type) {
    result.analysis_type =
      "meal";
  }

  if (!result.nutrition_source) {
    result.nutrition_source =
      result.analysis_type ===
      "meal"
        ? "estimated"
        : "label";
  }

  if (!result.ingredient_source) {
    result.ingredient_source =
      result.analysis_type ===
      "meal"
        ? "estimated"
        : "label";
  }

  if (!result.nutrition_unit) {
    result.nutrition_unit =
      result.analysis_type ===
      "meal"
        ? "perkiraan total makanan"
        : "per sajian";
  }

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE NUMBERS
  |--------------------------------------------------------------------------
  */

  const numericFields = [
    "calories",
    "protein",
    "carbohydrates",
    "fat",
    "saturated_fat",
    "sugar",
    "fiber",
    "sodium",
    "health_score",
    "confidence",
  ];

  for (
    const field of numericFields
  ) {
    if (
      result[field] !== null &&
      result[field] !== undefined &&
      result[field] !== ""
    ) {
      const number =
        Number(
          result[field]
        );

      result[field] =
        Number.isFinite(number)
          ? number
          : null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | HEALTH SCORE LIMIT
  |--------------------------------------------------------------------------
  */

  if (
    result.health_score !==
      null &&
    result.health_score !==
      undefined
  ) {
    result.health_score =
      Math.max(
        0,
        Math.min(
          100,
          result.health_score
        )
      );
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIDENCE LIMIT
  |--------------------------------------------------------------------------
  */

  if (
    result.confidence !==
      null &&
    result.confidence !==
      undefined
  ) {
    result.confidence =
      Math.max(
        0,
        Math.min(
          100,
          result.confidence
        )
      );
  }

  /*
  |--------------------------------------------------------------------------
  | OUTPUT RESULT
  |--------------------------------------------------------------------------
  */

  console.log("");
  console.log(
    "================================"
  );

  console.log(
    "✅ HASIL ANALISIS"
  );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  console.log(
    "================================"
  );

  return result;
}

/*
|--------------------------------------------------------------------------
| ANALYZE API
|--------------------------------------------------------------------------
*/

app.post(
  "/api/analyze",

  upload.single("image"),

  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | VALIDASI FILE
      |--------------------------------------------------------------------------
      */

      if (!req.file) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Gambar tidak ditemukan.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | LOG GAMBAR
      |--------------------------------------------------------------------------
      */

      console.log("");
      console.log(
        "================================"
      );

      console.log(
        "📷 GAMBAR DITERIMA"
      );

      console.log(
        "Nama:",
        req.file.originalname
      );

      console.log(
        "MIME:",
        req.file.mimetype
      );

      console.log(
        "Ukuran:",
        req.file.size,
        "bytes"
      );

      console.log(
        "🤖 Mengirim ke Gemini..."
      );

      console.log(
        "================================"
      );

      /*
      |--------------------------------------------------------------------------
      | ANALYZE
      |--------------------------------------------------------------------------
      */

      const result =
        await analyzeWithGemini(
          req.file
        );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      console.log(
        "✅ Gemini berhasil."
      );

      return res.json({
        success: true,

        mode: "gemini",

        result,
      });
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */

      console.log("");

      console.log(
        "================================"
      );

      console.error(
        "❌ GEMINI ERROR"
      );

      console.error(
        error
      );

      console.log(
        "================================"
      );

      console.log("");

      return res
        .status(500)
        .json({
          success: false,

          message:
            error?.message ||
            "Gagal menganalisis gambar.",

          error:
            error?.status ||
            error?.code ||
            null,
        });
    }
  }
);
/*
|--------------------------------------------------------------------------
| BARCODE PRODUCT API
|--------------------------------------------------------------------------
*/

app.get(
    "/api/barcode/:code",
    async (req, res) => {
      try {
        const code =
          String(req.params.code || "")
            .trim();
  
        /*
         * Validasi barcode
         */
        if (!code) {
          return res.status(400).json({
            success: false,
            found: false,
            message:
              "Barcode tidak ditemukan.",
          });
        }
  
        if (
          !/^[0-9A-Za-z-]+$/.test(code)
        ) {
          return res.status(400).json({
            success: false,
            found: false,
            message:
              "Format barcode tidak valid.",
          });
        }
  
        console.log("");
        console.log(
          "================================"
        );
        console.log(
          "🔎 BARCODE REQUEST"
        );
        console.log(
          "Barcode:",
          code
        );
  
        /*
         * Ambil produk berdasarkan barcode
         */
        const response =
          await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
              code
            )}.json`,
            {
              headers: {
                "User-Agent":
                  "NutriScan/1.0",
                Accept:
                  "application/json",
              },
            }
          );
  
        if (!response.ok) {
          throw new Error(
            `Open Food Facts HTTP ${response.status}`
          );
        }
  
        const data =
          await response.json();
  
        /*
         * Produk tidak ditemukan
         */
        if (
          data.status !== 1 ||
          !data.product
        ) {
          console.log(
            "❌ Produk tidak ditemukan"
          );
  
          console.log(
            "================================"
          );
  
          return res.status(404).json({
            success: false,
            found: false,
            barcode: code,
            message:
              "Produk dengan barcode tersebut belum ditemukan di database.",
          });
        }
  
        const product =
          data.product;
  
        const nutriments =
          product.nutriments || {};
  
        /*
         * Bentuk response agar sesuai
         * dengan Result.jsx
         */
        const result = {
          is_valid_product:
            true,
  
          analysis_type:
            "packaged_product",
  
          nutrition_source:
            "barcode_database",
  
          barcode: code,
  
          product_name:
            product.product_name ||
            product.product_name_id ||
            product.generic_name ||
            "Produk tidak diketahui",
  
          brand:
            product.brands ||
            "",
  
          serving_size:
            product.serving_size ||
            null,
  
          net_weight:
            product.quantity ||
            null,
  
          nutrition_unit:
            "per sajian / data produk",
  
          calories:
            getBarcodeNutrient(
              nutriments,
              [
                "energy-kcal_serving",
                "energy-kcal_100g",
              ]
            ),
  
          protein:
            getBarcodeNutrient(
              nutriments,
              [
                "proteins_serving",
                "proteins_100g",
              ]
            ),
  
          carbohydrates:
            getBarcodeNutrient(
              nutriments,
              [
                "carbohydrates_serving",
                "carbohydrates_100g",
              ]
            ),
  
          fat:
            getBarcodeNutrient(
              nutriments,
              [
                "fat_serving",
                "fat_100g",
              ]
            ),
  
          saturated_fat:
            getBarcodeNutrient(
              nutriments,
              [
                "saturated-fat_serving",
                "saturated-fat_100g",
              ]
            ),
  
          sugar:
            getBarcodeNutrient(
              nutriments,
              [
                "sugars_serving",
                "sugars_100g",
              ]
            ),
  
          fiber:
            getBarcodeNutrient(
              nutriments,
              [
                "fiber_serving",
                "fiber_100g",
              ]
            ),
  
          sodium:
            getBarcodeNutrient(
              nutriments,
              [
                "sodium_serving",
                "sodium_100g",
              ]
            ),
  
          ingredients:
            normalizeBarcodeIngredients(
              product.ingredients_text ||
                product.ingredients_text_id
            ),
  
          items: [],
  
          confidence: 100,
  
          verdict:
            buildBarcodeVerdict(
              nutriments
            ),
  
          recommendation:
            "Perhatikan ukuran porsi dan sesuaikan konsumsi produk dengan kebutuhan nutrisi harian kamu.",
  
          image:
            product.image_front_url ||
            product.image_url ||
            product.image_front_small_url ||
            null,
        };
  
        console.log(
          "✅ PRODUK BARCODE DITEMUKAN"
        );
  
        console.log(
          JSON.stringify(
            result,
            null,
            2
          )
        );
  
        console.log(
          "================================"
        );
  
        return res.json({
          success: true,
          found: true,
          result,
        });
  
      } catch (error) {
        console.error("");
        console.error(
          "================================"
        );
  
        console.error(
          "❌ BARCODE ERROR"
        );
  
        console.error(error);
  
        console.error(
          "================================"
        );
  
        return res.status(500).json({
          success: false,
          found: false,
          message:
            error?.message ||
            "Gagal mencari produk berdasarkan barcode.",
        });
      }
    }
  );
  
  
  /*
  |--------------------------------------------------------------------------
  | BARCODE NUTRIENT HELPER
  |--------------------------------------------------------------------------
  */
  
  function getBarcodeNutrient(
    nutriments,
    keys
  ) {
    for (
      const key of keys
    ) {
      const value =
        nutriments[key];
  
      if (
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        const number =
          Number(value);
  
        if (
          Number.isFinite(number)
        ) {
          return number;
        }
      }
    }
  
    return null;
  }
  
  
  /*
  |--------------------------------------------------------------------------
  | BARCODE INGREDIENTS
  |--------------------------------------------------------------------------
  */
  
  function normalizeBarcodeIngredients(
    value
  ) {
    if (
      !value ||
      typeof value !== "string"
    ) {
      return [];
    }
  
    return value
      .split(/[,;\n]+/)
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean)
      .map(
        (item) => ({
          name: item,
          description: "",
        })
      );
  }
  
  
  /*
  |--------------------------------------------------------------------------
  | BARCODE VERDICT
  |--------------------------------------------------------------------------
  */
  
  function buildBarcodeVerdict(
    nutriments
  ) {
    const sodium =
      getBarcodeNutrient(
        nutriments,
        [
          "sodium_serving",
          "sodium_100g",
        ]
      );
  
    const sugar =
      getBarcodeNutrient(
        nutriments,
        [
          "sugars_serving",
          "sugars_100g",
        ]
      );
  
    const protein =
      getBarcodeNutrient(
        nutriments,
        [
          "proteins_serving",
          "proteins_100g",
        ]
      );
  
    const warnings = [];
  
    if (
      sodium !== null &&
      sodium >= 500
    ) {
      warnings.push(
        "natrium cukup tinggi"
      );
    }
  
    if (
      sugar !== null &&
      sugar >= 10
    ) {
      warnings.push(
        "gula perlu diperhatikan"
      );
    }
  
    if (
      warnings.length > 0
    ) {
      return `Berdasarkan data nutrisi yang tersedia, produk memiliki ${warnings.join(
        " dan "
      )}.`;
    }
  
    if (
      protein !== null &&
      protein >= 5
    ) {
      return `Produk menyediakan sekitar ${protein} g protein berdasarkan data yang tersedia.`;
    }
  
    return "Produk berhasil ditemukan berdasarkan barcode dan data nutrisi yang tersedia.";
  }
/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  () => {
    console.log("");

    console.log(
      "================================"
    );

    console.log(
      "🚀 NutriScan Server"
    );

    console.log(
      `http://localhost:${PORT}`
    );

    console.log(
      `Gemini API: ${
        process.env.GEMINI_API_KEY
          ? "CONNECTED"
          : "NOT CONFIGURED"
      }`
    );

    console.log(
      "================================"
    );

    console.log("");
  }
);