import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Barcode as BarcodeIcon,
  Camera,
  CheckCircle2,
  RotateCcw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { getProductByBarcode } from "../services/productService";

export default function BarcodeScanner() {
  const navigate = useNavigate();

  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const isStartingRef = useRef(false);
  const mountedRef = useRef(false);

  const [scannedCode, setScannedCode] = useState("");
  const [isStarting, setIsStarting] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  /*
   * START SAAT HALAMAN DIBUKA
   */
  useEffect(() => {
    mountedRef.current = true;

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);

      mountedRef.current = false;

      stopScanner();
    };
  }, []);

  /*
   * START SCANNER
   */
  const startScanner = async () => {
    if (!mountedRef.current) {
      return;
    }

    if (
      isRunningRef.current ||
      isStartingRef.current
    ) {
      return;
    }

    try {
      isStartingRef.current = true;

      setError("");
      setScannedCode("");
      setIsStarting(true);

      await stopScanner();

      const reader =
        document.getElementById(
          "barcode-reader"
        );

      if (!reader) {
        throw new Error(
          "Barcode reader tidak ditemukan."
        );
      }

      const scanner = new Html5Qrcode(
        "barcode-reader"
      );

      scannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,

          qrbox: {
            width: 280,
            height: 160,
          },

          aspectRatio: 1.777778,

          disableFlip: false,
        },

        async (decodedText) => {
          console.log(
            "Barcode berhasil:",
            decodedText
          );

          if (!mountedRef.current) {
            return;
          }

          setScannedCode(decodedText);

          await stopScanner();
        },

        () => {
          // Tidak melakukan apa-apa
          // ketika barcode belum terbaca.
        }
      );

      if (mountedRef.current) {
        isRunningRef.current = true;
        setIsStarting(false);
      }
    } catch (err) {
      console.error(
        "Barcode scanner error:",
        err
      );

      isRunningRef.current = false;

      if (mountedRef.current) {
        setIsStarting(false);

        if (
          err?.name === "NotAllowedError"
        ) {
          setError(
            "Akses kamera ditolak. Silakan izinkan kamera pada browser."
          );
        } else if (
          err?.name === "NotFoundError"
        ) {
          setError(
            "Kamera tidak ditemukan pada perangkat."
          );
        } else {
          setError(
            "Kamera barcode tidak dapat digunakan."
          );
        }
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  /*
   * STOP SCANNER
   */
  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      isRunningRef.current = false;
      return;
    }

    try {
      if (isRunningRef.current) {
        await scanner.stop();
      }
    } catch (err) {
      console.warn(
        "Scanner stop error:",
        err
      );
    }

    try {
      await scanner.clear();
    } catch (err) {
      console.warn(
        "Scanner clear error:",
        err
      );
    }

    scannerRef.current = null;
    isRunningRef.current = false;
  };

  /*
   * CARI PRODUK DARI BARCODE
   */
  const handleSearchProduct = async () => {
    if (!scannedCode) {
      return;
    }
  
    try {
      setIsSearching(true);
      setError("");
  
      console.log(
        "🔎 Mencari barcode:",
        scannedCode
      );
  
      const response = await fetch(
        `https://nutriscan-pi-five.vercel.app/api/barcode/${encodeURIComponent(
          scannedCode
        )}`
      );
  
      const data =
        await response.json();
  
      console.log(
        "📦 NutriScan Barcode Response:",
        data
      );
  
      if (
        !response.ok ||
        !data.success ||
        !data.found
      ) {
        throw new Error(
          data.message ||
            "Produk tidak ditemukan."
        );
      }
  
      const product =
        data.result;
  
      console.log(
        "✅ Produk ditemukan:",
        product
      );
  
      navigate("/result", {
        state: {
          result: product,
          image:
            product.image ||
            null,
        },
      });
  
    } catch (err) {
      console.error(
        "❌ Product lookup error:",
        err
      );
  
      setError(
        err?.message ||
          "Produk tidak ditemukan."
      );
  
    } finally {
      setIsSearching(false);
    }
  };
  /*
   * SCAN ULANG
   */
  const handleScanAgain = async () => {
    await stopScanner();

    setScannedCode("");
    setError("");
    setIsStarting(true);

    setTimeout(() => {
      if (mountedRef.current) {
        startScanner();
      }
    }, 300);
  };

  /*
   * KEMBALI KE HOME
   */
  const handleBack = async () => {
    await stopScanner();

    navigate("/");
  };

  /*
   * RENDER
   */
  return (
    <main className="min-h-screen bg-[#F7FAF8] text-[#17251C]">

      {/* HEADER */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">

          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="font-bold">
              Scan Barcode
            </h1>

            <p className="text-xs text-gray-500">
              Identifikasi produk dengan barcode
            </p>
          </div>

        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-3xl px-5 py-8">

        {/* TITLE */}
        <div className="text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DDF2E5] text-[#1F8A4C]">
            <BarcodeIcon size={30} />
          </div>

          <h2 className="mt-5 text-2xl font-extrabold">
            Scan Barcode Produk
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Arahkan kamera ke barcode yang terdapat
            pada kemasan produk.
          </p>

        </div>

        {/* CAMERA */}
        <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-black shadow-xl">

          <div
            id="barcode-reader"
            className="min-h-[360px] w-full"
          />

          {isStarting && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">

              <div className="text-center text-white">

                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-white/30 border-t-white" />

                <p className="mt-3 font-semibold">
                  Menyiapkan kamera...
                </p>

                <p className="mt-1 text-xs text-white/70">
                  Izinkan akses kamera jika diminta.
                </p>

              </div>

            </div>
          )}

        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-6 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-500">
              <Camera size={24} />
            </div>

            <h3 className="mt-4 font-bold">
              Terjadi Masalah
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {error}
            </p>

            <button
              onClick={handleScanAgain}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#1F8A4C] px-5 py-3 font-bold text-white"
            >
              <RotateCcw size={18} />
              Coba Lagi
            </button>

          </div>
        )}

        {/* BARCODE BERHASIL */}
        {scannedCode && (
          <div className="mt-5 rounded-3xl border border-[#DDF2E5] bg-[#EAF6EE] p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F8A4C] text-white">
                <CheckCircle2 size={24} />
              </div>

              <div>
                <h3 className="font-extrabold">
                  Barcode berhasil dibaca
                </h3>

                <p className="text-sm text-gray-500">
                  Nomor barcode produk
                </p>
              </div>

            </div>

            {/* NOMOR BARCODE */}
            <div className="mt-5 rounded-2xl bg-white p-5 text-center">

              <p className="break-all text-xl font-black tracking-wider">
                {scannedCode}
              </p>

            </div>

            {/* CARI PRODUK */}
            <button
              onClick={handleSearchProduct}
              disabled={isSearching}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F8A4C] px-5 py-4 font-bold text-white transition hover:bg-[#176B3A] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Search size={19} />

              {isSearching
                ? "Mencari Produk..."
                : "Cari Informasi Produk"}
            </button>

            {/* SCAN ULANG */}
            <button
              onClick={handleScanAgain}
              disabled={isSearching}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 font-bold transition hover:border-[#1F8A4C] hover:text-[#1F8A4C] disabled:opacity-50"
            >
              <RotateCcw size={18} />
              Scan Barcode Lain
            </button>

          </div>
        )}

        {/* TIPS */}
        {!scannedCode && !error && (
          <div className="mt-6 rounded-2xl bg-[#EAF6EE] p-5">

            <p className="font-bold text-[#1F8A4C]">
              💡 Tips Scan Barcode
            </p>

            <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600">

              <li>
                • Pastikan seluruh barcode terlihat.
              </li>

              <li>
                • Hindari pantulan cahaya.
              </li>

              <li>
                • Jaga kamera tetap stabil.
              </li>

              <li>
                • Gunakan pencahayaan yang cukup.
              </li>

            </ul>

          </div>
        )}

        {/* FOTO KEMASAN */}
        <button
          onClick={async () => {
            await stopScanner();
            navigate("/scan");
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold transition hover:border-[#1F8A4C] hover:text-[#1F8A4C]"
        >
          <Camera size={19} />
          Gunakan Foto Kemasan
        </button>

      </section>
    </main>
  );
}