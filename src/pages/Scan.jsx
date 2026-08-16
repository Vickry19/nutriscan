import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Camera,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Upload,
  X,
  CheckCircle,
  CircleAlert,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { analyzeNutrition } from "../services/nutritionService";


export default function Scan() {
  const navigate = useNavigate();

  /*
  |--------------------------------------------------------------------------
  | REFS
  |--------------------------------------------------------------------------
  */

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [cameraActive, setCameraActive] = useState(false);

  const [videoReady, setVideoReady] = useState(false);

  const [image, setImage] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [cameraError, setCameraError] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /*
   * Notification
   *
   * type:
   * - error
   * - success
   */

  const [notification, setNotification] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const showNotification = (
    message,
    type = "error"
  ) => {
    setNotification({
      message,
      type,
    });

    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };


  /*
  |--------------------------------------------------------------------------
  | CLEANUP CAMERA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | PASANG STREAM KE VIDEO
  |--------------------------------------------------------------------------
  */

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
        console.error(
          "Video play error:",
          error
        );

        setCameraError(
          "Video kamera tidak dapat diputar."
        );
      }
    };


    video.addEventListener(
      "loadedmetadata",
      handleReady
    );


    if (video.readyState >= 1) {
      handleReady();
    }


    return () => {
      video.removeEventListener(
        "loadedmetadata",
        handleReady
      );
    };

  }, [cameraActive]);


  /*
  |--------------------------------------------------------------------------
  | BUKA KAMERA
  |--------------------------------------------------------------------------
  */

  const startCamera = async () => {
    try {

      setCameraError("");

      setVideoReady(false);


      stopCamera();


      if (
        !navigator.mediaDevices?.getUserMedia
      ) {

        setCameraError(
          "Browser ini tidak mendukung akses kamera."
        );

        showNotification(
          "Browser ini tidak mendukung akses kamera."
        );

        return;
      }


      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
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
          }
        );


      streamRef.current = stream;


      setCameraActive(true);

    } catch (error) {

      console.error(
        "Camera error:",
        error
      );


      setCameraActive(false);


      if (
        error.name === "NotAllowedError"
      ) {

        setCameraError(
          "Akses kamera ditolak. Izinkan kamera pada browser."
        );

        showNotification(
          "Akses kamera ditolak. Izinkan kamera pada browser."
        );

      } else if (
        error.name === "NotFoundError"
      ) {

        setCameraError(
          "Kamera tidak ditemukan pada perangkat."
        );

        showNotification(
          "Kamera tidak ditemukan pada perangkat."
        );

      } else if (
        error.name === "NotReadableError"
      ) {

        setCameraError(
          "Kamera sedang digunakan oleh aplikasi lain."
        );

        showNotification(
          "Kamera sedang digunakan oleh aplikasi lain."
        );

      } else {

        setCameraError(
          "Kamera tidak dapat digunakan."
        );

        showNotification(
          "Kamera tidak dapat digunakan."
        );
      }
    }
  };


  /*
  |--------------------------------------------------------------------------
  | MATIKAN KAMERA
  |--------------------------------------------------------------------------
  */

  const stopCamera = () => {

    if (streamRef.current) {

      streamRef.current
        .getTracks()
        .forEach((track) => {
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


  /*
  |--------------------------------------------------------------------------
  | AMBIL FOTO DARI KAMERA
  |--------------------------------------------------------------------------
  */

  const capturePhoto = () => {

    const video = videoRef.current;

    const canvas = canvasRef.current;


    if (!video || !canvas) {
      return;
    }


    if (!videoReady) {

      showNotification(
        "Kamera belum siap. Tunggu sampai gambar muncul."
      );

      return;
    }


    const width = video.videoWidth;

    const height = video.videoHeight;


    if (!width || !height) {

      showNotification(
        "Kamera belum siap."
      );

      return;
    }


    canvas.width = width;

    canvas.height = height;


    const context =
      canvas.getContext("2d");


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

          showNotification(
            "Gagal mengambil foto."
          );

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


        showNotification(
          "Foto berhasil diambil.",
          "success"
        );

      },

      "image/jpeg",

      0.9
    );
  };


  /*
  |--------------------------------------------------------------------------
  | UPLOAD GAMBAR
  |--------------------------------------------------------------------------
  */

  const handleFileChange = (
    event
  ) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      showNotification(
        "File harus berupa gambar."
      );

      event.target.value = "";

      return;
    }


    if (
      file.size >
      10 * 1024 * 1024
    ) {

      showNotification(
        "Ukuran gambar maksimal 10 MB."
      );

      event.target.value = "";

      return;
    }


    const imageUrl =
      URL.createObjectURL(file);


    setSelectedFile(file);

    setImage(imageUrl);

    setCameraError("");


    showNotification(
      "Foto berhasil dipilih.",
      "success"
    );
  };


  /*
  |--------------------------------------------------------------------------
  | FOTO ULANG
  |--------------------------------------------------------------------------
  */

  const resetImage = () => {

    stopCamera();


    if (image) {

      URL.revokeObjectURL(
        image
      );
    }


    setImage(null);

    setSelectedFile(null);


    if (fileInputRef.current) {

      fileInputRef.current.value =
        "";
    }


    showNotification(
      "Foto dihapus. Silakan ambil foto baru.",
      "success"
    );
  };


  /*
  |--------------------------------------------------------------------------
  | ANALISIS
  |--------------------------------------------------------------------------
  */

  const handleAnalyze = async () => {

    if (!selectedFile) {

      showNotification(
        "Silakan pilih atau ambil foto terlebih dahulu."
      );

      return;
    }


    try {

      setIsAnalyzing(true);


      const result =
        await analyzeNutrition(
          selectedFile
        );


      showNotification(
        "Analisis berhasil. Menampilkan hasil...",
        "success"
      );


      /*
       * Sedikit delay supaya
       * notification sempat terlihat
       */

      setTimeout(() => {

        navigate(
          "/result",
          {
            state: {
              result,
              image,
            },
          }
        );

      }, 500);

    } catch (error) {

      console.error(
        "Analysis error:",
        error
      );


      showNotification(
        error?.message ||
          "Gagal menganalisis produk."
      );

    } finally {

      setIsAnalyzing(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | CLOSE NOTIFICATION
  |--------------------------------------------------------------------------
  */

  const closeNotification = () => {
    setNotification(null);
  };


  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return (

    <main className="min-h-screen bg-[#F7FAF8] text-[#17251C]">


      {/* =====================================================
          NOTIFICATION
      ===================================================== */}

      {notification && (

        <div className="fixed left-1/2 top-5 z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-[slideDown_.3s_ease-out]">

          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-sm ${
              notification.type ===
              "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >

            {/* ICON */}

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                notification.type ===
                "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >

              {notification.type ===
              "success" ? (

                <CheckCircle
                  size={22}
                />

              ) : (

                <CircleAlert
                  size={22}
                />

              )}

            </div>


            {/* TEXT */}

            <div className="min-w-0 flex-1">

              <p className="font-bold">

                {notification.type ===
                "success"
                  ? "Berhasil"
                  : "Terjadi Kesalahan"}

              </p>


              <p
                className={`mt-1 text-sm ${
                  notification.type ===
                  "success"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >

                {notification.message}

              </p>

            </div>


            {/* CLOSE */}

            <button
              type="button"
              onClick={
                closeNotification
              }
              className="rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
              aria-label="Tutup notifikasi"
            >

              <X size={18} />

            </button>

          </div>

        </div>
      )}


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-gray-100 bg-white">

        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">

          <button
            type="button"
            onClick={() => {

              stopCamera();

              navigate("/");

            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 transition hover:border-[#1F8A4C] hover:text-[#1F8A4C]"
            aria-label="Kembali"
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


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-3xl px-5 py-8">


        {/* ===================================================
            HALAMAN AWAL
        =================================================== */}

        {!image &&
          !cameraActive && (

            <>

              <div className="text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#DDF2E5] text-[#1F8A4C]">

                  <Camera size={30} />

                </div>


                <h2 className="mt-5 text-2xl font-extrabold">

                  Foto kemasan produk

                </h2>


                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">

                  Ambil foto menggunakan
                  kamera atau upload dari
                  galeri.

                </p>

              </div>


              <div className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">


                {/* BUKA KAMERA */}

                <button
                  type="button"
                  onClick={
                    startCamera
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1F8A4C] px-5 py-4 font-bold text-white transition hover:bg-[#176B3A]"
                >

                  <Camera size={21} />

                  Buka Kamera

                </button>


                {/* DIVIDER */}

                <div className="my-5 flex items-center gap-3">

                  <div className="h-px flex-1 bg-gray-200" />

                  <span className="text-xs text-gray-400">
                    ATAU
                  </span>

                  <div className="h-px flex-1 bg-gray-200" />

                </div>


                {/* UPLOAD */}

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold transition hover:border-[#1F8A4C] hover:text-[#1F8A4C]"
                >

                  <Upload size={20} />

                  Upload dari Galeri

                </button>


                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept="image/*"
                  onChange={
                    handleFileChange
                  }
                  className="hidden"
                />

              </div>


              {/* CAMERA ERROR */}

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


              {/* TIPS */}

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


        {/* ===================================================
            KAMERA
        =================================================== */}

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
                ref={
                  videoRef
                }
                autoPlay
                playsInline
                muted
                className="aspect-[3/4] w-full object-cover"
              />


              {/* CAMERA FRAME */}

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

                <div className="relative h-64 w-80 max-w-[80%] rounded-2xl border-2 border-white">

                  <div className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-white" />

                  <div className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-white" />

                  <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-white" />

                  <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-white" />

                </div>

              </div>


              {/* CAMERA LOADING */}

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


            {/* CAMERA BUTTONS */}

            <div className="mt-5 flex items-center justify-center gap-5">

              <button
                type="button"
                onClick={
                  stopCamera
                }
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-gray-100"
                aria-label="Tutup kamera"
              >

                <X size={22} />

              </button>


              <button
                type="button"
                onClick={
                  capturePhoto
                }
                disabled={
                  !videoReady
                }
                className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-white bg-[#1F8A4C] text-white shadow-xl transition hover:bg-[#176B3A] disabled:opacity-50"
                aria-label="Ambil foto"
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


        {/* ===================================================
            PREVIEW
        =================================================== */}

        {image &&
          !cameraActive && (

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


              {/* IMAGE */}

              <div className="mt-8 overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">

                <img
                  src={image}
                  alt="Preview produk"
                  className="max-h-[500px] w-full rounded-2xl object-contain"
                />

              </div>


              {/* BUTTONS */}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={
                    resetImage
                  }
                  disabled={
                    isAnalyzing
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold transition hover:border-[#1F8A4C] hover:text-[#1F8A4C] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <RotateCcw size={19} />

                  Foto Ulang

                </button>


                <button
                  type="button"
                  onClick={
                    handleAnalyze
                  }
                  disabled={
                    isAnalyzing
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F8A4C] px-5 py-4 font-bold text-white transition hover:bg-[#176B3A] disabled:cursor-not-allowed disabled:opacity-70"
                >

                  <Sparkles size={19} />

                  {isAnalyzing
                    ? "Menganalisis..."
                    : "Analisis Produk"}

                </button>

              </div>


              {/* ANALYZING */}

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


        {/* ===================================================
            CANVAS
        =================================================== */}

        <canvas
          ref={
            canvasRef
          }
          className="hidden"
        />

      </section>

    </main>
  );
}