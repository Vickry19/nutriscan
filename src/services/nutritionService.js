const API_URL =
  "https://nutriscan-pi-five.vercel.app/api/analyze";

/*
|--------------------------------------------------------------------------
| ANALYZE NUTRITION
|--------------------------------------------------------------------------
*/

export async function analyzeNutrition(imageFile) {
  if (!imageFile) {
    throw new Error(
      "Gambar produk tidak ditemukan."
    );
  }

  const formData = new FormData();

  formData.append(
    "image",
    imageFile
  );

  let response;

  try {
    response = await fetch(
      API_URL,
      {
        method: "POST",
        body: formData,
      }
    );
  } catch (error) {
    console.error(
      "❌ Network error:",
      error
    );

    throw new Error(
      "Tidak dapat terhubung ke server NutriScan."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | BACA RESPONSE
  |--------------------------------------------------------------------------
  */

  let data = null;

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  try {
    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();
    } else {
      const text =
        await response.text();

      console.error(
        "❌ Response bukan JSON:",
        text
      );

      throw new Error(
        "Server mengembalikan response yang tidak valid."
      );
    }
  } catch (error) {
    console.error(
      "❌ Gagal membaca response:",
      error
    );

    if (
      error?.message ===
      "Server mengembalikan response yang tidak valid."
    ) {
      throw error;
    }

    throw new Error(
      "Server mengembalikan response yang tidak valid."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SERVER ERROR
  |--------------------------------------------------------------------------
  */

  if (!response.ok) {
    console.error(
      "❌ API ERROR:",
      data
    );

    const message =
      data?.message ||
      data?.error?.message ||
      "";

    const upperMessage =
      String(message).toUpperCase();

    /*
    |--------------------------------------------------------------------------
    | GEMINI 503
    |--------------------------------------------------------------------------
    */

    if (
      response.status === 503 ||
      upperMessage.includes(
        "HIGH DEMAND"
      ) ||
      upperMessage.includes(
        "UNAVAILABLE"
      )
    ) {
      throw new Error(
        "Layanan AI sedang sibuk. Tunggu beberapa saat lalu coba lagi."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | GEMINI 429
    |--------------------------------------------------------------------------
    */

    if (
      response.status === 429 ||
      upperMessage.includes(
        "RESOURCE_EXHAUSTED"
      )
    ) {
      throw new Error(
        "Batas penggunaan AI sedang tercapai. Silakan coba lagi nanti."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SERVER 500
    |--------------------------------------------------------------------------
    */

    if (
      response.status >= 500
    ) {
      throw new Error(
        "Server NutriScan sedang mengalami gangguan. Silakan coba lagi."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ERROR LAIN
    |--------------------------------------------------------------------------
    */

    throw new Error(
      message ||
        "Server gagal menganalisis gambar."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDASI RESPONSE
  |--------------------------------------------------------------------------
  */

  if (!data) {
    throw new Error(
      "Server tidak mengembalikan data."
    );
  }

  if (
    data.success !== true
  ) {
    throw new Error(
      data.message ||
        "Analisis produk gagal."
    );
  }

  if (!data.result) {
    throw new Error(
      "Hasil analisis tidak ditemukan."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  console.log(
    "✅ Analisis berhasil:",
    data.result
  );

  return data.result;
}