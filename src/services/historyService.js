const HISTORY_KEY =
  "nutriscan_history";


/*
|--------------------------------------------------------------------------
| GET HISTORY
|--------------------------------------------------------------------------
*/

export function getHistory() {
  try {
    const saved =
      localStorage.getItem(
        HISTORY_KEY
      );

    if (!saved) {
      return [];
    }

    const history =
      JSON.parse(saved);

    return Array.isArray(history)
      ? history
      : [];

  } catch (error) {
    console.error(
      "Gagal membaca history:",
      error
    );

    return [];
  }
}


/*
|--------------------------------------------------------------------------
| ADD HISTORY
|--------------------------------------------------------------------------
*/

export function addHistory(
  result,
  image = null
) {
  if (!result) {
    return;
  }

  const history =
    getHistory();

  const item = {
    id:
      Date.now().toString(),

    createdAt:
      new Date().toISOString(),

    productName:
      result.product_name ||
      result.productName ||
      result.name ||
      "Produk tidak diketahui",

    brand:
      result.brand ||
      "",

    calories:
      result.calories ??
      null,

    protein:
      result.protein ??
      null,

    sugar:
      result.sugar ??
      null,

    fiber:
      result.fiber ??
      null,

    sodium:
      result.sodium ??
      null,

    analysisType:
      result.analysis_type ||
      "meal",

    nutritionSource:
      result.nutrition_source ||
      "unknown",

    barcode:
      result.barcode ||
      null,

    image:
      image ||
      result.image ||
      null,

    result,
  };


  /*
   * History terbaru di paling atas
   */

  const updatedHistory = [
    item,
    ...history,
  ];


  /*
   * Batasi 50 history
   */

  const limitedHistory =
    updatedHistory.slice(
      0,
      50
    );


  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(
      limitedHistory
    )
  );

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
        item.id !== id
    );

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(
      updated
    )
  );

  return updated;
}


/*
|--------------------------------------------------------------------------
| CLEAR HISTORY
|--------------------------------------------------------------------------
*/

export function clearHistory() {
  localStorage.removeItem(
    HISTORY_KEY
  );
}