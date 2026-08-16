import {
  Camera,
  ScanBarcode,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  History,
  UserRound,
  Utensils,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#F7FAF8] text-[#17251C]">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="mx-auto max-w-6xl px-5 py-4 md:py-5">

        <div className="flex items-center justify-between">

          {/* LOGO */}

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F8A4C] text-xl">
              🥗
            </div>

            <span className="text-xl font-bold tracking-tight">
              Nutri
              <span className="text-[#1F8A4C]">
                Scan
              </span>
            </span>

          </button>


          {/* DESKTOP MENU */}

          <div className="hidden items-center gap-3 text-sm font-medium md:flex">

            <a
              href="#cara-kerja"
              className="px-3 py-2 transition hover:text-[#1F8A4C]"
            >
              Cara Kerja
            </a>

            <a
              href="#tentang"
              className="px-3 py-2 transition hover:text-[#1F8A4C]"
            >
              Tentang
            </a>

            <button
              onClick={() => navigate("/history")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-[#EAF6EE] hover:text-[#1F8A4C]"
            >
              <History size={17} />
              Riwayat
            </button>

            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-[#EAF6EE] hover:text-[#1F8A4C]"
            >
              <UserRound size={17} />
              Profile
            </button>

            <button
              onClick={() => navigate("/scan")}
              className="ml-2 flex items-center justify-center gap-2 rounded-2xl bg-[#1F8A4C] px-5 py-3 font-bold text-white shadow-lg shadow-green-900/10 transition hover:-translate-y-0.5 hover:bg-[#176B3A]"
            >
              Mulai Scan
              <ArrowRight size={17} />
            </button>

          </div>

        </div>


        {/* =================================================
            MOBILE MENU
        ================================================= */}

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 md:hidden">

          {/* RIWAYAT */}

          <button
            onClick={() => navigate("/history")}
            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold text-gray-600 transition hover:bg-[#EAF6EE] hover:text-[#1F8A4C]"
          >
            <History size={20} />
            <span>Riwayat</span>
          </button>


          {/* PROFILE */}

          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#EAF6EE] px-2 py-2 text-xs font-bold text-[#1F8A4C] transition hover:bg-[#DDF2E5]"
          >
            <UserRound size={20} />
            <span>Profile</span>
          </button>


          {/* SCAN */}

          <button
            onClick={() => navigate("/scan")}
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-[#1F8A4C] px-2 py-2 text-xs font-bold text-white transition hover:bg-[#176B3A]"
          >
            <Camera size={20} />
            <span>Mulai Scan</span>
          </button>

        </div>

      </nav>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-2 md:pt-16">

        {/* LEFT */}

        <div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#E4F4EA] px-4 py-2 text-sm font-semibold text-[#1F8A4C]">

            <Sparkles size={16} />

            Smart Nutrition Scanner

          </div>


          <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">

            Kenali makananmu.

            <span className="block text-[#1F8A4C]">
              Pilih lebih sehat.
            </span>

          </h1>


          <p className="mt-6 max-w-lg text-base leading-7 text-gray-600 sm:text-lg">

            NutriScan membantu kamu memahami
            kandungan makanan dan minuman
            hanya dengan satu foto atau scan
            barcode.

          </p>


          {/* BUTTON */}

          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">

            <button
              onClick={() => navigate("/scan")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#1F8A4C] px-5 py-4 font-bold text-white shadow-lg transition hover:bg-[#176B3A]"
            >

              <Camera size={20} />

              Foto Makanan

              <ArrowRight size={18} />

            </button>


            <button
              onClick={() => navigate("/barcode")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold text-[#17251C] transition hover:border-[#1F8A4C] hover:text-[#1F8A4C]"
            >

              <ScanBarcode size={20} />

              Scan Barcode

            </button>

          </div>


          {/* TRUST */}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500">

            <div className="flex items-center gap-2">

              <ShieldCheck
                size={18}
                className="text-[#1F8A4C]"
              />

              Mudah digunakan

            </div>


            <div className="flex items-center gap-2">

              <Sparkles
                size={18}
                className="text-[#1F8A4C]"
              />

              AI-powered

            </div>


            <div className="flex items-center gap-2">

              <BarChart3
                size={18}
                className="text-[#1F8A4C]"
              />

              Data nutrisi

            </div>

          </div>

        </div>


        {/* =================================================
            HERO VISUAL
        ================================================= */}

        <div className="relative mx-auto w-full max-w-md">

          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[#DDF2E5] blur-2xl" />

          <div className="absolute -bottom-5 -left-5 h-24 w-24 rounded-full bg-[#E8F4FF] blur-2xl" />


          <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-green-900/10">

            <div className="rounded-3xl bg-gradient-to-br from-[#E5F5EA] to-[#F8FCF9] p-7">

              {/* FOOD ICON */}

              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white text-6xl shadow-lg">
                🍜
              </div>


              <div className="mt-6 text-center">

                <p className="text-xs font-bold uppercase tracking-wider text-[#1F8A4C]">
                  NutriScan Analysis
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Mie Instan
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Informasi nutrisi
                </p>

              </div>


              {/* NUTRITION */}

              <div className="mt-6 grid grid-cols-2 gap-3">

                <NutritionPreview
                  label="Kalori"
                  value="350"
                  unit="kcal"
                />

                <NutritionPreview
                  label="Protein"
                  value="8"
                  unit="g"
                />

                <NutritionPreview
                  label="Karbohidrat"
                  value="50"
                  unit="g"
                />

                <NutritionPreview
                  label="Gula"
                  value="5"
                  unit="g"
                />

              </div>


              {/* INSIGHT */}

              <div className="mt-4 rounded-2xl bg-white p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DDF2E5] text-[#1F8A4C]">

                    <Sparkles size={18} />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-gray-400">
                      AI INSIGHT
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      Pahami kandungan makananmu
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          QUICK ACTION
      ===================================================== */}

      <section className="px-5 pb-20">

        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">

          <QuickAction
            icon={<Camera size={23} />}
            title="Foto Makanan"
            description="Analisis makanan atau masakan dari satu foto."
            onClick={() => navigate("/scan")}
          />


          <QuickAction
            icon={<ScanBarcode size={23} />}
            title="Scan Barcode"
            description="Cari data produk kemasan menggunakan barcode."
            onClick={() => navigate("/barcode")}
          />


          <QuickAction
            icon={<History size={23} />}
            title="Riwayat Analisis"
            description="Lihat kembali makanan yang pernah dianalisis."
            onClick={() => navigate("/history")}
          />

        </div>

      </section>


      {/* =====================================================
          CARA KERJA
      ===================================================== */}

      <section
        id="cara-kerja"
        className="bg-white px-5 py-20"
      >

        <div className="mx-auto max-w-6xl">

          <div className="mx-auto max-w-2xl text-center">

            <p className="font-bold text-[#1F8A4C]">
              CARA KERJA
            </p>

            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Dari makanan menjadi informasi
            </h2>

            <p className="mt-4 text-gray-600">
              Pilih metode analisis yang sesuai
              dengan makanan yang ingin kamu
              periksa.
            </p>

          </div>


          <div className="mt-12 grid gap-6 md:grid-cols-3">

            <StepCard
              number="01"
              icon={<Camera size={26} />}
              title="Foto Makanan"
              description="Ambil satu foto makanan, masakan, atau kemasan yang ingin dianalisis."
            />


            <StepCard
              number="02"
              icon={<Sparkles size={26} />}
              title="AI Menganalisis"
              description="NutriScan menggunakan AI untuk mengenali makanan dan memperkirakan kandungan nutrisinya."
            />


            <StepCard
              number="03"
              icon={<BarChart3 size={26} />}
              title="Dapatkan Insight"
              description="Lihat kalori, protein, karbohidrat, lemak, gula, serat, natrium, dan insight lainnya."
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          FITUR
      ===================================================== */}

      <section className="px-5 py-20">

        <div className="mx-auto max-w-6xl">

          <div className="mx-auto max-w-2xl text-center">

            <p className="font-bold text-[#1F8A4C]">
              FITUR NUTRISCAN
            </p>

            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Satu aplikasi untuk memahami makanan
            </h2>

          </div>


          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            <FeatureCard
              icon={<Utensils size={22} />}
              title="Analisis Makanan"
              description="Kenali makanan dan masakan melalui foto."
            />


            <FeatureCard
              icon={<ScanBarcode size={22} />}
              title="Barcode Scanner"
              description="Cari informasi produk kemasan berdasarkan barcode."
            />


            <FeatureCard
              icon={<BarChart3 size={22} />}
              title="Informasi Nutrisi"
              description="Lihat kandungan nutrisi dalam tampilan sederhana."
            />


            <FeatureCard
              icon={<History size={22} />}
              title="Riwayat Scan"
              description="Simpan hasil analisis agar mudah dilihat kembali."
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          CTA
      ===================================================== */}

      <section
        id="tentang"
        className="px-5 pb-20"
      >

        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#1F8A4C] px-6 py-12 text-center text-white sm:px-12">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            🥗
          </div>


          <h2 className="mt-5 text-3xl font-extrabold sm:text-4xl">
            Siap memahami makananmu?
          </h2>


          <p className="mx-auto mt-4 max-w-xl leading-6 text-green-50">
            Ambil foto makanan atau scan barcode
            produk untuk mendapatkan informasi
            nutrisi dengan lebih mudah.
          </p>


          <button
            onClick={() => navigate("/scan")}
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 font-bold text-[#1F8A4C] transition hover:bg-green-50"
          >

            Mulai dengan NutriScan

            <ArrowRight size={18} />

          </button>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-gray-200 bg-white px-5 py-8">

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row">

          <div className="font-bold text-[#17251C]">
            🥗 Nutri
            <span className="text-[#1F8A4C]">
              Scan
            </span>
          </div>

          <p className="text-center sm:text-right">
            Smart nutrition scanner
            untuk pilihan yang lebih sehat.
          </p>

        </div>

      </footer>

    </main>
  );
}


/*
|--------------------------------------------------------------------------
| NUTRITION PREVIEW
|--------------------------------------------------------------------------
*/

function NutritionPreview({
  label,
  value,
  unit,
}) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center">

      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>

      <p className="text-[10px] text-gray-400">
        {unit}
      </p>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| QUICK ACTION
|--------------------------------------------------------------------------
*/

function QuickAction({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#CDE8D6] hover:shadow-lg"
    >

      <div className="flex items-start gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DDF2E5] text-[#1F8A4C] transition group-hover:bg-[#1F8A4C] group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0">

          <h3 className="font-black">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-5 text-gray-500">
            {description}
          </p>

        </div>

      </div>

    </button>
  );
}


/*
|--------------------------------------------------------------------------
| STEP CARD
|--------------------------------------------------------------------------
*/

function StepCard({
  number,
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-[#F7FAF8] p-7 transition hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-center justify-between">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDF2E5] text-[#1F8A4C]">
          {icon}
        </div>

        <span className="text-sm font-bold text-gray-300">
          {number}
        </span>

      </div>


      <h3 className="mt-6 text-xl font-bold">
        {title}
      </h3>


      <p className="mt-2 leading-6 text-gray-600">
        {description}
      </p>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| FEATURE CARD
|--------------------------------------------------------------------------
*/

function FeatureCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DDF2E5] text-[#1F8A4C]">
        {icon}
      </div>


      <h3 className="mt-5 font-black">
        {title}
      </h3>


      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>

    </div>
  );
}