const HISTORY_KEY = "nutriscan_history";

/*
|--------------------------------------------------------------------------
| GET HISTORY
|--------------------------------------------------------------------------
*/

export function getHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);

    if (!saved) {
      return [];
    }

    const history = JSON.parse(saved);

    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error("Gagal membaca history:", error);
    return [];
  }
}


/*
|--------------------------------------------------------------------------
| SAVE HISTORY
|--------------------------------------------------------------------------
*/

function saveHistory(history) {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );

    return true;
  } catch (error) {
    console.error(
      "Gagal menyimpan history:",
      error
    );

    /*
     * Jika localStorage penuh,
     * hapus history paling lama sampai
     * penyimpanan berhasil.
     */

    try {
      let reduced = [...history];

      while (reduced.length > 1) {
        reduced.pop();

        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(reduced)
        );

        return true;
      }
    } catch (retryError) {
      console.error(
        "LocalStorage tetap penuh:",
        retryError
      );
    }

    return false;
  }
}


/*
|--------------------------------------------------------------------------
| COMPRESS IMAGE
|--------------------------------------------------------------------------
|
| Blob URL / File / Data URL
| akan dikonversi menjadi JPEG Base64
| ukuran lebih kecil agar aman disimpan
| di localStorage.
|--------------------------------------------------------------------------
*/

export async function prepareImageForStorage(
  image
) {
  if (!image) {
    return null;
  }

  /*
   * Kalau sudah Base64,
   * tetap kita kompres lagi.
   */

  try {
    let blob;

    /*
     * DATA URL
     */

    if (
      typeof image === "string" &&
      image.startsWith("data:")
    ) {
      const response = await fetch(image);

      blob = await response.blob();
    }

    /*
     * BLOB URL
     */

    else if (
      typeof image === "string" &&
      image.startsWith("blob:")
    ) {
      const response = await fetch(image);

      blob = await response.blob();
    }

    /*
     * Kalau bukan gambar yang bisa diproses,
     * jangan dipaksakan.
     */

    else {
      return image;
    }

    const bitmap =
      await createImageBitmap(blob);

    /*
     * Maksimal ukuran gambar.
     */

    const MAX_SIZE = 900;

    let width = bitmap.width;
    let height = bitmap.height;

    if (width > MAX_SIZE || height > MAX_SIZE) {
      if (width > height) {
        height =
          Math.round(
            (height / width) *
              MAX_SIZE
          );

        width = MAX_SIZE;
      } else {
        width =
          Math.round(
            (width / height) *
              MAX_SIZE
          );

        height = MAX_SIZE;
      }
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d");

    context.drawImage(
      bitmap,
      0,
      0,
      width,
      height
    );

    bitmap.close();

    /*
     * Kompres JPEG.
     */

    const compressed =
      canvas.toDataURL(
        "image/jpeg",
        0.72
      );

    return compressed;

  } catch (error) {
    console.error(
      "Gagal memproses gambar:",
      error
    );

    /*
     * Jika gagal dikompres,
     * kembalikan gambar aslinya.
     */

    return image;
  }
}


/*
|--------------------------------------------------------------------------
| ADD HISTORY
|--------------------------------------------------------------------------
*/

export async function addHistory(
  result,
  image = null
) {
  if (!result) {
    return null;
  }

  const history = getHistory();

  /*
   * Persiapkan gambar terlebih dahulu.
   */

  let savedImage = null;

  if (image) {
    savedImage =
      await prepareImageForStorage(
        image
      );
  }

  /*
   * Jika gambar tidak tersedia dari parameter,
   * coba ambil dari hasil analisis.
   */

  if (
    !savedImage &&
    result.image
  ) {
    savedImage =
      await prepareImageForStorage(
        result.image
      );
  }

  const item = {
    id: Date.now().toString(),

    createdAt:
      new Date().toISOString(),

    productName:
      result.product_name ||
      result.productName ||
      result.name ||
      "Produk tidak diketahui",

    brand:
      result.brand ||
      result.manufacturer ||
      "",

    calories:
      result.calories ??
      result.total?.calories ??
      null,

    protein:
      result.protein ??
      result.total?.protein ??
      null,

    sugar:
      result.sugar ??
      result.total?.sugar ??
      null,

    fiber:
      result.fiber ??
      result.total?.fiber ??
      null,

    sodium:
      result.sodium ??
      result.total?.sodium ??
      null,

    analysisType:
      result.analysis_type ||
      result.analysisType ||
      "meal",

    nutritionSource:
      result.nutrition_source ||
      result.nutritionSource ||
      "unknown",

    barcode:
      result.barcode ||
      null,

    /*
     * Gambar sekarang sudah Base64 JPEG.
     */

    image: savedImage,

    result,
  };

  /*
   * History terbaru di paling atas.
   */

  const updatedHistory = [
    item,
    ...history,
  ];

  /*
   * Batasi 30 history.
   *
   * Sebelumnya 50.
   * Karena sekarang gambar ikut disimpan,
   * 30 lebih aman untuk localStorage.
   */

  const limitedHistory =
    updatedHistory.slice(
      0,
      30
    );

  const success =
    saveHistory(
      limitedHistory
    );

  if (!success) {
    console.error(
      "❌ History gagal disimpan."
    );

    return null;
  }

  return item;
}


/*
|--------------------------------------------------------------------------
| DELETE HISTORY
|--------------------------------------------------------------------------
*/

export function deleteHistory(
  id
) {
  const history =
    getHistory();

  const updated =
    history.filter(
      (item) =>
        String(item.id) !==
        String(id)
    );

  saveHistory(updated);

  return updated;
}


/*
|--------------------------------------------------------------------------
| CLEAR ALL HISTORY
|--------------------------------------------------------------------------
*/

export function clearHistory() {
  try {
    localStorage.removeItem(
      HISTORY_KEY
    );

    return true;
  } catch (error) {
    console.error(
      "Gagal menghapus semua history:",
      error
    );

    return false;
  }
}


/*
|--------------------------------------------------------------------------
| GET SINGLE HISTORY
|--------------------------------------------------------------------------
*/

export function getHistoryById(
  id
) {
  const history =
    getHistory();

  return (
    history.find(
      (item) =>
        String(item.id) ===
        String(id)
    ) || null
  );
}