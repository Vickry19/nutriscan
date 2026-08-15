import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { analyzeNutrition } from "../services/nutritionService";

export default function Scan() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Bersihkan kamera saat keluar halaman
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Pasang stream ke video setelah video muncul
  useEffect(() => {
    if (!cameraActive) return;
    if (!videoRef.current) return;
    if (!streamRef.current) return;

    const video = videoRef.current;
    const stream = streamRef.current;

    video.srcObject = stream;

    const handleReady = async () => {
      try {
        await video.play();
        setVideoReady(true);
      } catch (error) {
        console.error("Video play error:", error);
        setCameraError("Video kamera tidak dapat diputar.");
      }
    };

    video.addEventListener("loadedmetadata", handleReady);

    if (video.readyState >= 1) {
      handleReady();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleReady);
    };
  }, [cameraActive]);

  // Buka kamera
  const startCamera = async () => {
    try {
      setCameraError("");
      setVideoReady(false);

      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Browser ini tidak mendukung akses kamera."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      setCameraActive(true);
    } catch (error) {
      console.error("Camera error:", error);

      setCameraActive(false);

      if (error.name === "NotAllowedError") {
        setCameraError(
          "Akses kamera ditolak. Izinkan kamera pada browser."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError(
          "Kamera tidak ditemukan pada perangkat."
        );
      } else if (error.name === "NotReadableError") {
        setCameraError(
          "Kamera sedang digunakan oleh aplikasi lain."
        );
      } else {
        setCameraError(
          "Kamera tidak dapat digunakan."
        );
      }
    }
  };

  // Matikan kamera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setVideoReady(false);
  };

  // Ambil foto dari kamera
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    if (!videoReady) {
      alert("Kamera belum siap. Tunggu sampai gambar muncul.");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      alert("Kamera belum siap.");
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.drawImage(
      video,
      0,
      0,
      width,
      height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert("Gagal mengambil foto.");
          return;
        }

        const file = new File(
          [blob],
          "nutriscan-photo.jpg",
          {
            type: "image/jpeg",
          }
        );

        const imageUrl =
          URL.createObjectURL(blob);

        setSelectedFile(file);
        setImage(imageUrl);

        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  // Upload gambar
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 10 MB.");
      return;
    }

    const imageUrl =
      URL.createObjectURL(file);

    setSelectedFile(file);
    setImage(imageUrl);
    setCameraError("");
  };

  // Foto ulang
  const resetImage = () => {
    stopCamera();

    if (image) {
      URL.revokeObjectURL(image);
    }

    setImage(null);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Analisis
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setIsAnalyzing(true);

      const result =
        await analyzeNutrition(selectedFile);

      navigate("/result", {
        state: {
          result,
          image,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Gagal menganalisis produk.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FAF8] text-[#17251C]">

      {/* HEADER */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">

          <button
            onClick={() => {
              stopCamera();
              navigate("/");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="font-bold">
              Foto Kemasan
            </h1>

            <p className="text-xs text-gray-500">
              Analisis informasi nutrisi produk
            </p>
          </div>

        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-8">

        {/* HALAMAN AWAL */}
        {!image && !cameraActive && (
          <>
            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DDF2E5] text-[#1F8A4C]">
                <Camera size={30} />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold">
                Foto kemasan produk
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Ambil foto menggunakan kamera atau
                upload dari galeri.
              </p>

            </div>

            <div className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

              <button
                onClick={startCamera}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F8A4C] px-5 py-4 font-bold text-white hover:bg-[#176B3A]"
              >
                <Camera size={21} />
                Buka Kamera
              </button>

              <div className="my-5 flex items-center gap-3">

                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-xs text-gray-400">
                  ATAU
                </span>

                <div className="h-px flex-1 bg-gray-200" />

              </div>

              <button
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold hover:border-[#1F8A4C] hover:text-[#1F8A4C]"
              >
                <Upload size={20} />
                Upload dari Galeri
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

            </div>

            {cameraError && (
              <div className="mt-5 rounded-2xl bg-red-50 p-5 text-center">

                <p className="font-bold text-red-600">
                  Kamera tidak tersedia
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  {cameraError}
                </p>

              </div>
            )}

            <div className="mt-6 rounded-2xl bg-[#EAF6EE] p-5">

              <p className="font-bold text-[#1F8A4C]">
                💡 Tips
              </p>

              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>
                  • Pastikan tulisan nutrisi jelas.
                </li>

                <li>
                  • Hindari pantulan cahaya.
                </li>

                <li>
                  • Pegang kamera tetap stabil.
                </li>
              </ul>

            </div>
          </>
        )}

        {/* KAMERA */}
        {cameraActive && (
          <div>

            <div className="text-center">

              <h2 className="text-2xl font-extrabold">
                Ambil Foto Produk
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Arahkan kamera ke kemasan produk.
              </p>

            </div>

            <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-black shadow-xl">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[3/4] w-full object-cover"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div className="relative h-64 w-80 max-w-[80%] rounded-2xl border-2 border-white">

                  <div className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-white" />

                  <div className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-white" />

                  <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-white" />

                  <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-white" />

                </div>

              </div>

              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">

                  <div className="text-center text-white">

                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />

                    <p className="mt-3 text-sm font-semibold">
                      Menyiapkan kamera...
                    </p>

                  </div>

                </div>
              )}

            </div>

            <div className="mt-5 flex items-center justify-center gap-5">

              <button
                onClick={stopCamera}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
              >
                <X size={22} />
              </button>

              <button
                onClick={capturePhoto}
                disabled={!videoReady}
                className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-[#1F8A4C] text-white shadow-xl disabled:opacity-50"
              >
                <Camera size={30} />
              </button>

              <div className="h-12 w-12" />

            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              {videoReady
                ? "Tekan tombol kamera untuk mengambil foto"
                : "Menyiapkan kamera..."}
            </p>

          </div>
        )}

        {/* PREVIEW */}
        {image && !cameraActive && (
          <div>

            <div className="text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#DDF2E5] text-[#1F8A4C]">
                <ImagePlus size={24} />
              </div>

              <h2 className="mt-4 text-2xl font-extrabold">
                Periksa Foto
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Pastikan informasi kemasan terlihat jelas.
              </p>

            </div>

            <div className="mt-8 overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">

              <img
                src={image}
                alt="Preview produk"
                className="max-h-[500px] w-full rounded-2xl object-contain"
              />

            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">

              <button
                onClick={resetImage}
                disabled={isAnalyzing}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold hover:border-[#1F8A4C] hover:text-[#1F8A4C]"
              >
                <RotateCcw size={19} />
                Foto Ulang
              </button>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F8A4C] px-5 py-4 font-bold text-white hover:bg-[#176B3A] disabled:opacity-70"
              >
                <Sparkles size={19} />

                {isAnalyzing
                  ? "Menganalisis..."
                  : "Analisis Produk"}
              </button>

            </div>

            {isAnalyzing && (
              <div className="mt-5 rounded-2xl bg-white p-5 text-center shadow-sm">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#1F8A4C]" />

                <p className="mt-3 font-bold">
                  NutriScan sedang menganalisis...
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Membaca informasi nutrisi pada kemasan.
                </p>

              </div>
            )}

          </div>
        )}

        <canvas
          ref={canvasRef}
          className="hidden"
        />

      </section>
    </main>
  );
}

