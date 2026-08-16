import {
  ArrowLeft,
  Clock3,
  Trash2,
  History as HistoryIcon,
  AlertTriangle,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function History() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showDeleteAll, setShowDeleteAll] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD HISTORY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nutriscan_history");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error("Gagal membaca history:", error);

      setHistory([]);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | DELETE ONE
  |--------------------------------------------------------------------------
  */

  const confirmDelete = () => {
    if (!deleteTarget) {
      return;
    }

    const updated = history.filter(
      (item) => item.id !== deleteTarget.id
    );

    setHistory(updated);

    localStorage.setItem(
      "nutriscan_history",
      JSON.stringify(updated)
    );

    setDeleteTarget(null);
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE ALL
  |--------------------------------------------------------------------------
  */

  const confirmDeleteAll = () => {
    setHistory([]);

    localStorage.removeItem("nutriscan_history");

    setShowDeleteAll(false);
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT DATE
  |--------------------------------------------------------------------------
  */

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    } catch {
      return "-";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | GET IMAGE
  |--------------------------------------------------------------------------
  */

  const getImage = (item) => {
    if (
      item?.image &&
      typeof item.image === "string"
    ) {
      return item.image;
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | GET ANALYSIS METHOD
  |--------------------------------------------------------------------------
  */

  const getAnalysisMethod = (item) => {
    const analysisType =
      item?.analysisType ||
      item?.result?.analysis_type ||
      "";

    const barcode =
      item?.barcode ||
      item?.result?.barcode ||
      null;

    /*
     * Jika mempunyai barcode,
     * berarti analisis dilakukan melalui barcode.
     */

    if (
      barcode ||
      analysisType === "barcode" ||
      analysisType === "packaged_product"
    ) {
      return "Scan Barcode";
    }

    /*
     * Jika meal berarti foto makanan.
     */

    if (analysisType === "meal") {
      return "Foto Makanan";
    }

    /*
     * Default untuk analisis gambar kemasan.
     */

    return "Foto Kemasan";
  };

  /*
  |--------------------------------------------------------------------------
  | GET DATA SOURCE
  |--------------------------------------------------------------------------
  */

  const getDataSource = (item) => {
    const nutritionSource =
      item?.nutritionSource ||
      item?.result?.nutrition_source ||
      "";

    /*
     * Data dari database / barcode
     */

    if (
      nutritionSource === "label" ||
      nutritionSource === "database" ||
      nutritionSource === "product"
    ) {
      return "Data Produk";
    }

    /*
     * Estimasi AI
     */

    if (nutritionSource === "estimated") {
      return "Estimasi AI";
    }

    /*
     * Analisis gambar oleh AI
     */

    if (
      nutritionSource === "vision" ||
      nutritionSource === "ai"
    ) {
      return "AI Vision";
    }

    /*
     * Fallback berdasarkan tipe analisis
     */

    const analysisType =
      item?.analysisType ||
      item?.result?.analysis_type ||
      "";

    if (
      analysisType === "meal"
    ) {
      return "Estimasi AI";
    }

    if (
      analysisType === "packaged_product"
    ) {
      return "AI Vision";
    }

    return "AI Vision";
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN RESULT
  |--------------------------------------------------------------------------
  */

  const openHistory = (item) => {
    navigate("/result", {
      state: {
        result: item.result,

        image: item.image || null,

        fromHistory: true,
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | EMPTY
  |--------------------------------------------------------------------------
  */

  if (history.length === 0) {
    return (
      <main className="min-h-screen bg-[#F7FAF8] text-[#17251C]">

        <header className="border-b border-gray-100 bg-white">

          <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-5">

            <button
              onClick={() => navigate("/")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 transition hover:border-[#1F8A4C] hover:text-[#1F8A4C]"
            >
              <ArrowLeft size={21} />
            </button>

            <div>

              <h1 className="text-xl font-extrabold">
                Riwayat Analisis
              </h1>

              <p className="text-sm text-gray-500">
                Produk dan makanan
                yang pernah dianalisis
              </p>

            </div>

          </div>

        </header>

        <section className="mx-auto max-w-3xl px-5 py-20">

          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DDF2E5] text-[#1F8A4C]">

              <HistoryIcon size={30} />

            </div>

            <h2 className="mt-5 text-xl font-extrabold">
              Belum ada riwayat
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Produk yang sudah kamu
              analisis akan muncul di
              halaman ini.
            </p>

            <button
              onClick={() => navigate("/scan")}
              className="mt-6 rounded-2xl bg-[#1F8A4C] px-6 py-3 font-bold text-white transition hover:bg-[#176B3A]"
            >
              Mulai Analisis
            </button>

          </div>

        </section>

      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | HISTORY PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#F7FAF8] text-[#17251C]">

      {/* HEADER */}

      <header className="border-b border-gray-100 bg-white">

        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5">

          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate("/")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 transition hover:border-[#1F8A4C] hover:text-[#1F8A4C]"
            >
              <ArrowLeft size={21} />
            </button>

            <div>

              <h1 className="text-xl font-extrabold">
                Riwayat Analisis
              </h1>

              <p className="text-sm text-gray-500">
                Produk dan makanan yang
                pernah dianalisis
              </p>

            </div>

          </div>

          {/* DELETE ALL */}

          <button
            onClick={() => setShowDeleteAll(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50"
            title="Hapus semua riwayat"
          >
            <Trash2 size={21} />
          </button>

        </div>

      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-3xl px-5 py-7">

        <div className="mb-5 flex items-center justify-between">

          <p className="text-sm font-semibold text-gray-500">
            {history.length} analisis
          </p>

          <span className="rounded-full bg-[#EAF6EE] px-3 py-1 text-xs font-bold text-[#1F8A4C]">
            Tersimpan di perangkat
          </span>

        </div>

        <div className="space-y-5">

          {history.map((item) => {

            const image =
              getImage(item);

            const productName =
              item.productName ||
              item.result?.product_name ||
              item.result?.name ||
              "Produk";

            const brand =
              item.brand ||
              item.result?.brand ||
              "";

            const analysisMethod =
              getAnalysisMethod(item);

            const dataSource =
              getDataSource(item);

            return (

              <article
                key={item.id}
                className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm"
              >

                {/* =================================================
                    PRODUCT
                ================================================= */}

                <button
                  type="button"
                  onClick={() =>
                    openHistory(item)
                  }
                  className="flex w-full gap-4 p-5 text-left transition hover:bg-gray-50"
                >

                  {/* IMAGE */}

                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#EAF6EE]">

                    {image ? (

                      <img
                        src={image}
                        alt={productName}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                    ) : (

                      <div className="flex h-full items-center justify-center text-3xl">
                        🥗
                      </div>

                    )}

                  </div>

                  {/* INFO */}

                  <div className="min-w-0 flex-1">

                    <p className="font-bold text-[#1F8A4C]">
                      {brand || "NutriScan"}
                    </p>

                    <h2 className="mt-1 line-clamp-2 text-lg font-extrabold">
                      {productName}
                    </h2>

                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">

                      <Clock3 size={17} />

                      {formatDate(
                        item.createdAt
                      )}

                    </div>

                  </div>

                </button>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">

                  {/* BADGES */}

                  <div className="flex flex-wrap gap-2">

                    {/* METODE ANALISIS */}

                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                      {analysisMethod}
                    </span>

                    {/* SUMBER DATA */}

                    <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700">
                      {dataSource}
                    </span>

                  </div>

                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget(item)
                    }
                    className="flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-red-500 transition hover:bg-red-50"
                  >

                    <Trash2 size={18} />

                    Hapus

                  </button>

                </div>

              </article>

            );

          })}

        </div>

      </section>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      {deleteTarget && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">

                <AlertTriangle size={24} />

              </div>

              <button
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            <h2 className="mt-5 text-xl font-extrabold">
              Hapus riwayat?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Riwayat analisis ini akan
              dihapus dari perangkat kamu.
            </p>

            <div className="mt-6 flex gap-3">

              <button
                onClick={() =>
                  setDeleteTarget(null)
                }
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-bold"
              >
                Batal
              </button>

              <button
                onClick={confirmDelete}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-3 font-bold text-white hover:bg-red-600"
              >
                Hapus
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          DELETE ALL
      ===================================================== */}

      {showDeleteAll && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">

          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">

              <Trash2 size={24} />

            </div>

            <h2 className="mt-5 text-xl font-extrabold">
              Hapus semua riwayat?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Semua riwayat analisis
              yang tersimpan di perangkat
              akan dihapus.
            </p>

            <div className="mt-6 flex gap-3">

              <button
                onClick={() =>
                  setShowDeleteAll(false)
                }
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-bold"
              >
                Batal
              </button>

              <button
                onClick={confirmDeleteAll}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-3 font-bold text-white hover:bg-red-600"
              >
                Hapus Semua
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}