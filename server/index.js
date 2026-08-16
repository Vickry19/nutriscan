import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| GEMINI CONFIG
|--------------------------------------------------------------------------
*/

// Bisa diganti lewat .env
const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// Cache hasil analisis gambar selama 24 jam.
// Catatan: cache hilang ketika server restart/redeploy.
const CACHE_TTL =
  24 * 60 * 60 * 1000;

const analysisCache = new Map();

// Menyimpan request yang sedang berjalan.
// Berguna agar double-click tidak mengirim 2 request Gemini.
const inFlightRequests = new Map();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://vickry19.github.io",
    ],

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
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
    fileSize:
      10 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.mimetype
      )
    ) {
      return cb(
        new Error(
          "Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP."
        )
      );
    }

    cb(null, true);
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

    message:
      "NutriScan AI Server is running",

    gemini:
      Boolean(
        process.env.GEMINI_API_KEY
      ),

    model:
      GEMINI_MODEL,
  });
});

/*
|--------------------------------------------------------------------------
| API HOME
|--------------------------------------------------------------------------
*/

app.get("/api", (req, res) => {
  res.json({
    success: true,

    message:
      "NutriScan API is running",

    gemini:
      Boolean(
        process.env.GEMINI_API_KEY
      ),

    model:
      GEMINI_MODEL,
  });
});

/*
|--------------------------------------------------------------------------
| HELPER
|--------------------------------------------------------------------------
*/

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms
      )
  );
}

/*
|--------------------------------------------------------------------------
| IMAGE HASH
|--------------------------------------------------------------------------
|
| Gambar yang sama akan menghasilkan hash yang sama.
| Ini digunakan untuk cache.
|
*/

function getImageHash(file) {
  return crypto
    .createHash("sha256")
    .update(file.buffer)
    .digest("hex");
}

/*
|--------------------------------------------------------------------------
| ERROR HELPERS
|--------------------------------------------------------------------------
*/

function getErrorStatus(error) {
  return String(
    error?.status ??
      error?.code ??
      error?.response?.status ??
      ""
  );
}

function getErrorText(error) {
  return String(
    error?.message ||
      error ||
      ""
  ).toUpperCase();
}

/*
|--------------------------------------------------------------------------
| QUOTA ERROR
|--------------------------------------------------------------------------
*/

function isQuotaError(error) {
  const text =
    getErrorText(error);

  const status =
    getErrorStatus(error);

  return (
    status === "429" ||
    text.includes("429") ||
    text.includes(
      "RESOURCE_EXHAUSTED"
    ) ||
    text.includes(
      "RATE LIMIT"
    ) ||
    text.includes(
      "QUOTA"
    )
  );
}

/*
|--------------------------------------------------------------------------
| TEMPORARY SERVER ERROR
|--------------------------------------------------------------------------
*/

function isTemporaryServerError(
  error
) {
  const text =
    getErrorText(error);

  const status =
    getErrorStatus(error);

  return (
    status === "408" ||
    status === "500" ||
    status === "502" ||
    status === "503" ||
    status === "504" ||
    text.includes("408") ||
    text.includes("500") ||
    text.includes("502") ||
    text.includes("503") ||
    text.includes("504") ||
    text.includes(
      "UNAVAILABLE"
    ) ||
    text.includes(
      "HIGH DEMAND"
    ) ||
    text.includes(
      "SERVICE UNAVAILABLE"
    ) ||
    text.includes(
      "TIMEOUT"
    )
  );
}

/*
|--------------------------------------------------------------------------
| CLEAN JSON
|--------------------------------------------------------------------------
*/

function cleanJsonText(text) {
  let clean =
    String(text || "")
      .trim();

  clean =
    clean
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

  const firstBrace =
    clean.indexOf("{");

  const lastBrace =
    clean.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    clean =
      clean.substring(
        firstBrace,
        lastBrace + 1
      );
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

function normalizeNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

/*
|--------------------------------------------------------------------------
| NORMALIZE RESULT
|--------------------------------------------------------------------------
*/

function normalizeResult(
  result
) {
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
    result[field] =
      normalizeNumber(
        result[field]
      );
  }

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

  result.product_name =
    result.product_name ||
    result.productName ||
    result.name ||
    "Produk tidak diketahui";

  result.brand =
    result.brand || "";

  result.variant =
    result.variant || "";

  result.analysis_type =
    result.analysis_type ||
    "unknown";

  result.nutrition_source =
    result.nutrition_source ||
    (
      result.analysis_type ===
      "meal"
        ? "estimated"
        : "unknown"
    );

  result.ingredient_source =
    result.ingredient_source ||
    (
      result.analysis_type ===
      "meal"
        ? "estimated"
        : "unknown"
    );

  result.nutrition_unit =
    result.nutrition_unit ||
    (
      result.analysis_type ===
      "meal"
        ? "perkiraan total makanan"
        : "per sajian"
    );

  if (
    result.health_score !==
      null
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

  if (
    result.confidence !==
      null
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

  return result;
}

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

function getCachedResult(
  hash
) {
  const cached =
    analysisCache.get(
      hash
    );

  if (!cached) {
    return null;
  }

  if (
    Date.now() -
      cached.createdAt >
    CACHE_TTL
  ) {
    analysisCache.delete(
      hash
    );

    return null;
  }

  return cached.result;
}

function saveCachedResult(
  hash,
  result
) {
  analysisCache.set(
    hash,
    {
      createdAt:
        Date.now(),

      result,
    }
  );

  // Bersihkan cache lama.
  for (
    const [
      key,
      value,
    ] of analysisCache
  ) {
    if (
      Date.now() -
        value.createdAt >
      CACHE_TTL
    ) {
      analysisCache.delete(
        key
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| GEMINI PROMPT
|--------------------------------------------------------------------------
*/

const ANALYSIS_PROMPT = `
Kamu adalah NutriScan AI.

Analisis SATU gambar makanan,
minuman, atau produk makanan/minuman
kemasan.

Gunakan Bahasa Indonesia.

Jangan memberikan diagnosis medis.

==================================================
TAHAP 1 - IDENTIFIKASI
==================================================

Tentukan:

meal
atau
packaged_product
atau
drink
atau
unknown

MEAL:
- nasi goreng
- nasi ayam
- mie
- burger
- pizza
- salad
- makanan di piring
- makanan yang sudah disajikan

PACKAGED_PRODUCT:
- Indomie
- biskuit
- snack
- susu
- makanan kemasan
- minuman kemasan

==================================================
TAHAP 2 - MAKANAN
==================================================

Jika makanan:

Identifikasi komponen yang terlihat.

Perkirakan:

- ukuran porsi
- berat
- kalori
- protein
- karbohidrat
- lemak
- lemak jenuh
- gula
- serat
- natrium

Gunakan:

nutrition_source = "estimated"

Jangan membuat semua nutrisi null
hanya karena tidak ada label.

==================================================
TAHAP 3 - PRODUK KEMASAN
==================================================

Jika produk kemasan:

Prioritaskan:

- nama produk
- brand
- varian
- serving size
- berat bersih
- tabel nutrisi
- komposisi

Jika angka terlihat pada label,
gunakan angka tersebut.

Jangan mengarang angka sebagai
angka label.

Jika label tidak terbaca tetapi
produk cukup jelas dikenali,
boleh menggunakan estimasi.

Gunakan:

nutrition_source = "label"

atau:

nutrition_source = "estimated"

==================================================
TAHAP 4 - KOMPOSISI
==================================================

Jika komposisi terlihat,
masukkan komposisi.

Jika tidak terlihat,
jangan mengarang komposisi resmi.

==================================================
TAHAP 5 - NUTRISI
==================================================

calories = kcal

protein = g

carbohydrates = g

fat = g

saturated_fat = g

sugar = g

fiber = g

sodium = mg

==================================================
TAHAP 6 - HEALTH SCORE
==================================================

Berikan health_score 0 sampai 100.

90-100 = A
80-89 = B
70-79 = C
60-69 = D
0-59 = E

Jika informasi tidak cukup:
health_score = null
grade = null

==================================================
TAHAP 7 - CONFIDENCE
==================================================

Berikan confidence 0 sampai 100.

90-100:
gambar sangat jelas.

75-89:
gambar cukup jelas.

50-74:
ada ketidakpastian.

0-49:
identifikasi kurang yakin.

==================================================
TAHAP 8 - VERDICT
==================================================

Buat penjelasan singkat.

==================================================
TAHAP 9 - RECOMMENDATION
==================================================

Buat rekomendasi singkat
dan praktis.

==================================================
ATURAN PENTING
==================================================

1. Jangan memberikan diagnosis medis.

2. Jangan mengarang angka label.

3. Untuk makanan lakukan estimasi.

4. Untuk produk kemasan prioritaskan label.

5. Gunakan null jika data benar-benar tidak tersedia.

6. Jangan menggunakan Markdown.

7. Jangan memberikan teks di luar JSON.

==================================================
FORMAT
==================================================

Kembalikan JSON:

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
      "name": "Nasi",
      "estimated_portion": "±150 g"
    }
  ],

  "ingredients": [
    {
      "name": "Nasi",
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

  "verdict": "Penjelasan singkat.",
  "recommendation": "Rekomendasi singkat."
}

Jika gambar tidak dapat dianalisis:

"is_valid_product": false

"analysis_type": "unknown"

Gunakan null untuk nutrisi
yang tidak diketahui.
`;

/*
|--------------------------------------------------------------------------
| JSON SCHEMA
|--------------------------------------------------------------------------
*/

const RESPONSE_SCHEMA = {
  type: "object",

  properties: {
    is_valid_product: {
      type: "boolean",
    },

    analysis_type: {
      type: "string",

      enum: [
        "meal",
        "packaged_product",
        "drink",
        "unknown",
      ],
    },

    product_name: {
      type: "string",
    },

    brand: {
      type: "string",
    },

    variant: {
      type: "string",
    },

    serving_size: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "null",
        },
      ],
    },

    net_weight: {
      anyOf: [
        {
          type: "string",
        },
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    nutrition_source: {
      type: "string",
    },

    ingredient_source: {
      type: "string",
    },

    nutrition_unit: {
      type: "string",
    },

    items: {
      type: "array",

      items: {
        type: "object",

        properties: {
          name: {
            type: "string",
          },

          estimated_portion: {
            type: "string",
          },
        },

        required: [
          "name",
          "estimated_portion",
        ],

        additionalProperties: false,
      },
    },

    ingredients: {
      type: "array",

      items: {
        type: "object",

        properties: {
          name: {
            type: "string",
          },

          description: {
            type: "string",
          },
        },

        required: [
          "name",
          "description",
        ],

        additionalProperties: false,
      },
    },

    calories: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    protein: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    carbohydrates: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    fat: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    saturated_fat: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    sugar: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    fiber: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    sodium: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    health_score: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    grade: {
      anyOf: [
        {
          type: "string",

          enum: [
            "A",
            "B",
            "C",
            "D",
            "E",
          ],
        },

        {
          type: "null",
        },
      ],
    },

    confidence: {
      anyOf: [
        {
          type: "number",
        },
        {
          type: "null",
        },
      ],
    },

    verdict: {
      type: "string",
    },

    recommendation: {
      type: "string",
    },
  },

  required: [
    "is_valid_product",
    "analysis_type",
    "product_name",
    "brand",
    "variant",
    "serving_size",
    "net_weight",
    "nutrition_source",
    "ingredient_source",
    "nutrition_unit",
    "items",
    "ingredients",
    "calories",
    "protein",
    "carbohydrates",
    "fat",
    "saturated_fat",
    "sugar",
    "fiber",
    "sodium",
    "health_score",
    "grade",
    "confidence",
    "verdict",
    "recommendation",
  ],

  additionalProperties: false,
};

/*
|--------------------------------------------------------------------------
| GEMINI ANALYZER
|--------------------------------------------------------------------------
*/

async function analyzeWithGemini(
  file
) {
  if (
    !process.env.GEMINI_API_KEY
  ) {
    throw new Error(
      "GEMINI_API_KEY belum ditemukan di file .env"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IMAGE CACHE
  |--------------------------------------------------------------------------
  */

  const hash =
    getImageHash(file);

  const cached =
    getCachedResult(hash);

  if (cached) {
    console.log(
      "♻️ HASIL DIAMBIL DARI CACHE"
    );

    return {
      result: cached,
      fromCache: true,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | DUPLICATE REQUEST PROTECTION
  |--------------------------------------------------------------------------
  */

  if (
    inFlightRequests.has(hash)
  ) {
    console.log(
      "⏳ REQUEST GAMBAR YANG SAMA SEDANG BERJALAN"
    );

    const result =
      await inFlightRequests.get(
        hash
      );

    return {
      result,
      fromCache: true,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | GEMINI CLIENT
  |--------------------------------------------------------------------------
  */

  const ai =
    new GoogleGenAI({
      apiKey:
        process.env.GEMINI_API_KEY,
    });

  const base64Image =
    file.buffer.toString(
      "base64"
    );

  const mimeType =
    file.mimetype ||
    "image/jpeg";

  /*
  |--------------------------------------------------------------------------
  | REQUEST GEMINI
  |--------------------------------------------------------------------------
  */

  const requestToGemini =
    async () => {
      const response =
        await ai.models.generateContent(
          {
            model:
              GEMINI_MODEL,

            contents: [
              {
                role: "user",

                parts: [
                  {
                    inlineData: {
                      mimeType:
                        mimeType,

                      data:
                        base64Image,
                    },
                  },

                  {
                    text:
                      ANALYSIS_PROMPT,
                  },
                ],
              },
            ],

            config: {
              /*
              |--------------------------------------------------------------------------
              | MEDIA RESOLUTION
              |--------------------------------------------------------------------------
              |
              | MEDIUM mengurangi token gambar
              | dibanding resolusi tinggi.
              |
              */

              mediaResolution:
                "MEDIA_RESOLUTION_MEDIUM",

              /*
              |--------------------------------------------------------------------------
              | OUTPUT LIMIT
              |--------------------------------------------------------------------------
              */

              maxOutputTokens:
                900,

              /*
              |--------------------------------------------------------------------------
              | JSON
              |--------------------------------------------------------------------------
              */

              responseMimeType:
                "application/json",

              responseJsonSchema:
                RESPONSE_SCHEMA,

              /*
              |--------------------------------------------------------------------------
              | SDK RETRY
              |--------------------------------------------------------------------------
              |
              | Kita matikan retry otomatis
              | supaya request tidak diam-diam
              | berulang.
              |
              */

              httpOptions: {
                timeout:
                  60000,

                retryOptions: {
                  attempts: 1,
                },
              },
            },
          }
        );

      const text =
        response?.text;

      if (!text) {
        throw new Error(
          "Gemini tidak memberikan hasil."
        );
      }

      const cleanText =
        cleanJsonText(text);

      let result;

      try {
        result =
          JSON.parse(
            cleanText
          );
      } catch (
        error
      ) {
        console.error(
          "❌ JSON Gemini tidak valid:"
        );

        console.error(
          cleanText
        );

        throw new Error(
          "Gemini memberikan response JSON yang tidak valid."
        );
      }

      return normalizeResult(
        result
      );
    };

  /*
  |--------------------------------------------------------------------------
  | REQUEST CONTROL
  |--------------------------------------------------------------------------
  */

  const requestPromise =
    (async () => {
      let lastError =
        null;

      /*
      |--------------------------------------------------------------------------
      | MAKSIMAL 2 REQUEST
      |--------------------------------------------------------------------------
      |
      | Request pertama.
      |
      | Jika 503/500/502/504:
      | retry SATU kali.
      |
      | Jika 429:
      | STOP.
      |
      */

      for (
        let attempt = 1;
        attempt <= 2;
        attempt++
      ) {
        try {
          console.log("");

          console.log(
            "================================"
          );

          console.log(
            `🤖 GEMINI REQUEST ${attempt}/2`
          );

          console.log(
            `MODEL: ${GEMINI_MODEL}`
          );

          console.log(
            "================================"
          );

          const result =
            await requestToGemini();

          /*
          |--------------------------------------------------------------------------
          | SAVE CACHE
          |--------------------------------------------------------------------------
          */

          saveCachedResult(
            hash,
            result
          );

          console.log(
            "✅ ANALISIS BERHASIL"
          );

          console.log(
            JSON.stringify(
              result,
              null,
              2
            )
          );

          return result;

        } catch (
          error
        ) {
          lastError =
            error;

          console.error(
            "❌ GEMINI ERROR"
          );

          console.error(
            error?.message ||
              error
          );

          console.error(
            "STATUS:",
            getErrorStatus(
              error
            )
          );

          /*
          |--------------------------------------------------------------------------
          | QUOTA ERROR
          |--------------------------------------------------------------------------
          |
          | JANGAN RETRY 429.
          |
          */

          if (
            isQuotaError(
              error
            )
          ) {
            throw new Error(
              "Batas penggunaan AI sedang tercapai. Silakan coba lagi setelah quota Gemini reset."
            );
          }

          /*
          |--------------------------------------------------------------------------
          | NON TEMPORARY ERROR
          |--------------------------------------------------------------------------
          |
          | API key salah, request invalid,
          | JSON schema error, dll.
          |
          | Tidak perlu retry.
          |
          */

          if (
            !isTemporaryServerError(
              error
            )
          ) {
            throw error;
          }

          /*
          |--------------------------------------------------------------------------
          | RETRY SEKALI
          |--------------------------------------------------------------------------
          */

          if (
            attempt === 1
          ) {
            const delay =
              2500 +
              Math.floor(
                Math.random() *
                  1000
              );

            console.log(
              `⏳ Gemini sedang sibuk. Retry 1 kali dalam ${Math.ceil(
                delay / 1000
              )} detik...`
            );

            await sleep(
              delay
            );
          }
        }
      }

      throw (
        lastError ||
        new Error(
          "Gagal menganalisis gambar."
        )
      );
    })();

  /*
  |--------------------------------------------------------------------------
  | SIMPAN REQUEST YANG SEDANG BERJALAN
  |--------------------------------------------------------------------------
  */

  inFlightRequests.set(
    hash,
    requestPromise
  );

  try {
    const result =
      await requestPromise;

    return {
      result,
      fromCache: false,
    };

  } finally {
    inFlightRequests.delete(
      hash
    );
  }
}

/*
|--------------------------------------------------------------------------
| ANALYZE API
|--------------------------------------------------------------------------
*/

app.post(
  "/api/analyze",

  upload.single(
    "image"
  ),

  async (
    req,
    res
  ) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | VALIDASI
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
      | LOG
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
        `${(
          req.file.size /
          1024 /
          1024
        ).toFixed(2)} MB`
      );

      console.log(
        "================================"
      );

      /*
      |--------------------------------------------------------------------------
      | ANALYZE
      |--------------------------------------------------------------------------
      */

      const analysis =
        await analyzeWithGemini(
          req.file
        );

      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.json({
        success: true,

        mode:
          analysis.fromCache
            ? "cache"
            : "gemini",

        result:
          analysis.result,
      });

    } catch (
      error
    ) {
      console.error("");

      console.error(
        "================================"
      );

      console.error(
        "❌ ANALYZE API ERROR"
      );

      console.error(
        error
      );

      console.error(
        "================================"
      );

      const status =
        getErrorStatus(
          error
        );

      const message =
        error?.message ||
        "Gagal menganalisis gambar.";

      /*
      |--------------------------------------------------------------------------
      | QUOTA
      |--------------------------------------------------------------------------
      */

      if (
        isQuotaError(
          error
        )
      ) {
        return res
          .status(429)
          .json({
            success: false,

            message:
              "Batas penggunaan AI sedang tercapai. Silakan coba lagi setelah quota Gemini reset.",

            error:
              status || 429,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | TEMPORARY SERVER
      |--------------------------------------------------------------------------
      */

      if (
        isTemporaryServerError(
          error
        )
      ) {
        return res
          .status(503)
          .json({
            success: false,

            message:
              "Layanan AI sedang sibuk. Silakan coba lagi beberapa saat.",

            error:
              status || 503,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | OTHER ERROR
      |--------------------------------------------------------------------------
      */

      return res
        .status(500)
        .json({
          success: false,

          message,

          error:
            status || 500,
        });
    }
  }
);

/*
|--------------------------------------------------------------------------
| BARCODE PRODUCT API
|--------------------------------------------------------------------------
|
| Barcode TIDAK menggunakan Gemini.
| Data diambil dari Open Food Facts.
|
*/

app.get(
  "/api/barcode/:code",

  async (
    req,
    res
  ) => {
    try {
      const code =
        String(
          req.params.code ||
            ""
        ).trim();

      /*
      |--------------------------------------------------------------------------
      | VALIDASI BARCODE
      |--------------------------------------------------------------------------
      */

      if (!code) {
        return res
          .status(400)
          .json({
            success: false,

            found: false,

            message:
              "Barcode tidak ditemukan.",
          });
      }

      if (
        !/^[0-9A-Za-z-]+$/.test(
          code
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            found: false,

            message:
              "Format barcode tidak valid.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | LOG
      |--------------------------------------------------------------------------
      */

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

      console.log(
        "================================"
      );

      /*
      |--------------------------------------------------------------------------
      | OPEN FOOD FACTS
      |--------------------------------------------------------------------------
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

      if (
        !response.ok
      ) {
        throw new Error(
          `Open Food Facts HTTP ${response.status}`
        );
      }

      const data =
        await response.json();

      /*
      |--------------------------------------------------------------------------
      | PRODUCT NOT FOUND
      |--------------------------------------------------------------------------
      */

      if (
        data.status !== 1 ||
        !data.product
      ) {
        return res
          .status(404)
          .json({
            success: false,

            found: false,

            barcode: code,

            message:
              "Produk dengan barcode tersebut belum ditemukan di database.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | PRODUCT
      |--------------------------------------------------------------------------
      */

      const product =
        data.product;

      const nutriments =
        product.nutriments ||
        {};

      /*
      |--------------------------------------------------------------------------
      | RESULT
      |--------------------------------------------------------------------------
      */

      const result = {
        is_valid_product:
          true,

        analysis_type:
          "packaged_product",

        nutrition_source:
          "barcode_database",

        barcode:
          code,

        product_name:
          product.product_name ||
          product.product_name_id ||
          product.generic_name ||
          "Produk tidak diketahui",

        brand:
          product.brands ||
          "",

        variant:
          product.quantity ||
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

      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      console.log(
        "✅ PRODUK BARCODE DITEMUKAN"
      );

      return res.json({
        success: true,

        found: true,

        result,
      });

    } catch (
      error
    ) {
      console.error(
        "❌ BARCODE ERROR"
      );

      console.error(
        error
      );

      return res
        .status(500)
        .json({
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
        Number.isFinite(
          number
        )
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
    typeof value !==
      "string"
  ) {
    return [];
  }

  return value
    .split(
      /[,;\n]+/
    )
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
| MULTER ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Ukuran gambar terlalu besar. Maksimal 10 MB.",
          });
      }
    }

    if (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error.message ||
            "Request tidak valid.",
        });
    }

    next();
  }
);

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

if (
  process.env.NODE_ENV !==
  "production"
) {
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
        `Gemini Model: ${GEMINI_MODEL}`
      );

      console.log(
        `Gemini API: ${
          process.env.GEMINI_API_KEY
            ? "CONNECTED"
            : "NOT CONFIGURED"
        }`
      );

      console.log(
        "Retry: maksimal 1x untuk error server"
      );

      console.log(
        "429 retry: DISABLED"
      );

      console.log(
        "Image cache: ENABLED"
      );

      console.log(
        "================================"
      );

      console.log("");
    }
  );
}

/*
|--------------------------------------------------------------------------
| VERCEL
|--------------------------------------------------------------------------
*/

export default app;