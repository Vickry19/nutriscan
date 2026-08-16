const API_URL =
  "https://nutriscan-pi-five.vercel.app/api/analyze";

export async function analyzeNutrition(
  imageFile
) {
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

  const response = await fetch(
    API_URL,
    {
      method: "POST",
      body: formData,
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Server mengembalikan response yang tidak valid."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Server gagal menganalisis gambar."
    );
  }

  if (!data.success) {
    throw new Error(
      data?.message ||
        "Analisis produk gagal."
    );
  }

  return data.result;
}