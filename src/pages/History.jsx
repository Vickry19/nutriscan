import {
    ArrowLeft,
    Clock3,
    Flame,
    Trash2,
  } from "lucide-react";
  
  import {
    useEffect,
    useState,
  } from "react";
  
  import {
    useNavigate,
  } from "react-router-dom";
  
  import {
    clearHistory,
    deleteHistory,
    getHistory,
  } from "../services/historyService";
  
  
  /*
  |--------------------------------------------------------------------------
  | HISTORY PAGE
  |--------------------------------------------------------------------------
  */
  
  export default function History() {
    const navigate =
      useNavigate();
  
    const [history, setHistory] =
      useState([]);
  
  
    /*
    |--------------------------------------------------------------------------
    | LOAD HISTORY
    |--------------------------------------------------------------------------
    */
  
    useEffect(() => {
      loadHistory();
    }, []);
  
  
    function loadHistory() {
      const data =
        getHistory();
  
      setHistory(
        Array.isArray(data)
          ? data
          : []
      );
    }
  
  
    /*
    |--------------------------------------------------------------------------
    | DELETE ITEM
    |--------------------------------------------------------------------------
    */
  
    function handleDelete(id) {
      const updated =
        deleteHistory(id);
  
      setHistory(
        Array.isArray(updated)
          ? updated
          : []
      );
    }
  
  
    /*
    |--------------------------------------------------------------------------
    | DELETE ALL
    |--------------------------------------------------------------------------
    */
  
    function handleClear() {
      if (
        history.length === 0
      ) {
        return;
      }
  
      const confirmed =
        window.confirm(
          "Apakah kamu yakin ingin menghapus semua riwayat analisis?"
        );
  
      if (!confirmed) {
        return;
      }
  
      clearHistory();
  
      setHistory([]);
    }
  
  
    /*
    |--------------------------------------------------------------------------
    | OPEN RESULT
    |--------------------------------------------------------------------------
    */
  
    function openResult(item) {
      if (!item?.result) {
        return;
      }
  
      navigate(
        "/result",
        {
          state: {
            result:
              item.result,
  
            image:
              item.image ||
              null,
  
            /*
             * Penting:
             * Result.jsx menggunakan
             * historyId untuk mengetahui
             * bahwa hasil berasal dari history.
             */
  
            historyId:
              item.id,
          },
        }
      );
    }
  
  
    return (
      <main className="min-h-screen bg-[#F5F8F6] text-[#17251C]">
  
        {/* HEADER */}
  
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
  
          <div className="mx-auto flex max-w-3xl items-center px-4 py-4">
  
            <button
              onClick={() =>
                navigate(-1)
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:bg-gray-50"
            >
              <ArrowLeft
                size={20}
              />
            </button>
  
  
            <div className="ml-4 min-w-0">
  
              <h1 className="font-black">
                Riwayat Analisis
              </h1>
  
              <p className="text-xs text-gray-500">
                Produk dan makanan yang
                pernah dianalisis
              </p>
  
            </div>
  
  
            {history.length > 0 && (
              <button
                onClick={
                  handleClear
                }
                className="ml-auto flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
              >
                <Trash2
                  size={14}
                />
  
                <span className="hidden sm:inline">
                  Hapus Semua
                </span>
              </button>
            )}
  
          </div>
  
        </header>
  
  
        {/* CONTENT */}
  
        <section className="mx-auto max-w-3xl px-4 py-6 sm:px-5">
  
  
          {/* EMPTY STATE */}
  
          {history.length === 0 && (
            <div className="rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-sm">
  
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF6EE] text-[#439B62]">
  
                <Clock3
                  size={30}
                />
  
              </div>
  
  
              <h2 className="mt-5 text-xl font-black">
                Belum Ada Riwayat
              </h2>
  
  
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Hasil analisis makanan
                dan produk yang kamu
                scan akan muncul di
                halaman ini.
              </p>
  
  
              <button
                onClick={() =>
                  navigate("/scan")
                }
                className="mt-6 rounded-2xl bg-[#439B62] px-6 py-3 font-black text-white transition hover:bg-[#358250]"
              >
                Mulai Analisis
              </button>
  
            </div>
          )}
  
  
          {/* HISTORY LIST */}
  
          {history.length > 0 && (
            <div className="space-y-4">
  
              {history.map(
                (item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    onOpen={() =>
                      openResult(
                        item
                      )
                    }
                    onDelete={() =>
                      handleDelete(
                        item.id
                      )
                    }
                  />
                )
              )}
  
            </div>
          )}
  
        </section>
  
      </main>
    );
  }
  
  
  /*
  |--------------------------------------------------------------------------
  | HISTORY CARD
  |--------------------------------------------------------------------------
  */
  
  function HistoryCard({
    item,
    onOpen,
    onDelete,
  }) {
    const productName =
      item?.productName ||
      "Produk tidak diketahui";
  
    const brand =
      item?.brand ||
      "";
  
    const calories =
      item?.calories;
  
    const image =
      item?.image ||
      null;
  
    const isBarcode =
      item?.analysisType ===
      "packaged_product";
  
    const isEstimated =
      item?.nutritionSource ===
      "estimated";
  
  
    const date = item?.createdAt
      ? new Date(
          item.createdAt
        )
      : null;
  
  
    return (
      <article className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
  
  
        {/* MAIN */}
  
        <button
          onClick={onOpen}
          className="flex w-full gap-4 text-left"
        >
  
          {/* IMAGE */}
  
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EAF4ED]">
  
            {image ? (
              <img
                src={image}
                alt={productName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl">
                🍽️
              </span>
            )}
  
          </div>
  
  
          {/* INFORMATION */}
  
          <div className="min-w-0 flex-1">
  
            <p className="text-[10px] font-black uppercase tracking-wider text-[#439B62]">
              {brand ||
                (isBarcode
                  ? "Produk Kemasan"
                  : "Makanan")}
            </p>
  
  
            <h2 className="mt-1 line-clamp-2 text-base font-black leading-5 text-[#17233A]">
              {productName}
            </h2>
  
  
            {date && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
  
                <Clock3
                  size={13}
                />
  
                {formatDate(
                  date
                )}
  
              </div>
            )}
  
          </div>
  
  
          {/* CALORIES */}
  
          <div className="hidden shrink-0 text-right sm:block">
  
            <div className="flex items-center justify-end gap-1 text-[#F07B35]">
  
              <Flame
                size={15}
              />
  
              <span className="text-sm font-black">
                {formatValue(
                  calories
                )}
              </span>
  
            </div>
  
  
            <p className="mt-1 text-[10px] text-gray-400">
              kcal
            </p>
  
          </div>
  
        </button>
  
  
        {/* FOOTER */}
  
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
  
  
          {/* BADGES */}
  
          <div className="flex flex-wrap gap-2">
  
            {isBarcode && (
              <span className="rounded-full bg-[#EAF0FF] px-3 py-1 text-[10px] font-bold text-[#4169B5]">
                Barcode
              </span>
            )}
  
  
            {isEstimated && (
              <span className="rounded-full bg-[#FFF7E5] px-3 py-1 text-[10px] font-bold text-[#A67500]">
                Estimasi AI
              </span>
            )}
  
  
            {!isBarcode &&
              !isEstimated && (
                <span className="rounded-full bg-[#EAF6EE] px-3 py-1 text-[10px] font-bold text-[#2E8150]">
                  Analisis
                </span>
              )}
  
          </div>
  
  
          {/* DELETE */}
  
          <button
            onClick={(event) => {
              event.stopPropagation();
  
              onDelete();
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-400 transition hover:bg-red-50"
          >
  
            <Trash2
              size={14}
            />
  
            Hapus
  
          </button>
  
        </div>
  
      </article>
    );
  }
  
  
  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */
  
  function formatValue(
    value
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }
  
    const number =
      Number(value);
  
    if (
      !Number.isFinite(number)
    ) {
      return "--";
    }
  
    return new Intl.NumberFormat(
      "id-ID",
      {
        maximumFractionDigits: 1,
      }
    ).format(number);
  }
  
  
  function formatDate(
    date
  ) {
    if (
      !(date instanceof Date) ||
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "--";
    }
  
    return new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);
  }