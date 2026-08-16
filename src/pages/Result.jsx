import { useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Dumbbell,
  Flame,
  Leaf,
  Sparkles,
  Wheat,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  calculateNutrition,
} from "../utils/nutritionCalculator";

import {
  calculatePersonalNutrition,
} from "../utils/personalNutrition";

import {
  addHistory,
} from "../services/historyService";


/*
|--------------------------------------------------------------------------
| RESULT PAGE
|--------------------------------------------------------------------------
*/

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();

  const result =
    location.state?.result;

  const image =
    location.state?.image;

  const [activeTab, setActiveTab] =
    useState("overview");

/*
|--------------------------------------------------------------------------
| SIMPAN HISTORY
|--------------------------------------------------------------------------
*/

  const historySaveRef = useRef(false);

  useEffect(() => {
    if (!result) {
      return;
    }
  
    const historyId =
      location.state?.historyId;
  
    if (
      historyId ||
      historySaveRef.current
    ) {
      return;
    }
  
    historySaveRef.current = true;
  
    const saveResult = async () => {
      try {
        const saved =
          await addHistory(
            result,
            image
          );
  
        if (saved) {
          console.log(
            "✅ Hasil analisis disimpan ke history:",
            saved.id
          );
        } else {
          console.warn(
            "⚠️ History tidak berhasil disimpan."
          );
        }
  
      } catch (error) {
        console.error(
          "❌ Gagal menyimpan history:",
          error
        );
      }
    };
  
    saveResult();
  
  }, [
    result,
    image,
    location.state,
  ]);
  /*
  |--------------------------------------------------------------------------
  | DATA TIDAK DITEMUKAN
  |--------------------------------------------------------------------------
  */

  if (!result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F8F6] px-5">

        <div className="w-full max-w-md rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF6EE] text-[#439B62]">
            <AlertTriangle size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#17251C]">
            Data tidak ditemukan
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Silakan lakukan analisis makanan atau
            produk terlebih dahulu.
          </p>

          <button
            onClick={() =>
              navigate("/scan")
            }
            className="mt-6 w-full rounded-2xl bg-[#439B62] px-5 py-4 font-bold text-white transition hover:bg-[#358250]"
          >
            Kembali ke Scanner
          </button>

        </div>

      </main>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NORMALISASI DATA PRODUK
  |--------------------------------------------------------------------------
  */

  const productName =
    result.product_name ||
    result.productName ||
    result.name ||
    "Makanan Tidak Dikenali";

  const brand =
    result.brand ||
    result.manufacturer ||
    "";

  const analysisType =
    result.analysis_type ||
    result.analysisType ||
    "meal";

  const isEstimate =
    analysisType === "meal" ||
    result.nutrition_source ===
      "estimated" ||
    result.is_estimated === true ||
    result.isEstimated === true;

  const servingSize =
    result.serving_size ||
    result.servingSize ||
    result.nutrition_unit ||
    (isEstimate
      ? "Perkiraan total makanan"
      : "Per sajian");


  /*
  |--------------------------------------------------------------------------
  | NUTRITION
  |--------------------------------------------------------------------------
  */

  const calories = toNumber(
    result.calories ??
      result.total?.calories
  );

  const protein = toNumber(
    result.protein ??
      result.total?.protein
  );

  const carbohydrates = toNumber(
    result.carbohydrates ??
      result.carbs ??
      result.total?.carbohydrates
  );

  const fat = toNumber(
    result.fat ??
      result.total?.fat
  );

  const saturatedFat = toNumber(
    result.saturated_fat ??
      result.saturatedFat ??
      result.total?.saturated_fat
  );

  const sugar = toNumber(
    result.sugar ??
      result.total?.sugar
  );

  const fiber = toNumber(
    result.fiber ??
      result.total?.fiber
  );

  const sodium = toNumber(
    result.sodium ??
      result.total?.sodium
  );


  /*
  |--------------------------------------------------------------------------
  | ITEMS
  |--------------------------------------------------------------------------
  */

  const items = Array.isArray(
    result.items
  )
    ? result.items
    : [];


  /*
  |--------------------------------------------------------------------------
  | INGREDIENTS
  |--------------------------------------------------------------------------
  */

  const ingredients =
    normalizeIngredients(
      result.ingredients
    );


  /*
  |--------------------------------------------------------------------------
  | VERDICT
  |--------------------------------------------------------------------------
  */

  const verdict =
    result.verdict ||
    "NutriScan telah menganalisis makanan berdasarkan informasi yang tersedia.";

  const recommendation =
    result.recommendation ||
    "Perhatikan porsi dan sesuaikan konsumsi dengan kebutuhan nutrisi harian.";


  /*
  |--------------------------------------------------------------------------
  | POSITIVES
  |--------------------------------------------------------------------------
  */

  const positives = useMemo(
    () =>
      buildPositives({
        protein,
        fiber,
        calories,
        items,
      }),
    [
      protein,
      fiber,
      calories,
      items,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | WARNINGS
  |--------------------------------------------------------------------------
  */

  const warnings = useMemo(
    () =>
      buildWarnings({
        sodium,
        sugar,
        saturatedFat,
        fat,
        fiber,
      }),
    [
      sodium,
      sugar,
      saturatedFat,
      fat,
      fiber,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | PROFILE
  |--------------------------------------------------------------------------
  */

  const savedProfile =
    localStorage.getItem(
      "nutriscan_profile"
    );

  let profile = null;

  if (savedProfile) {
    try {
      profile =
        JSON.parse(
          savedProfile
        );
    } catch {
      profile = null;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | PERSONAL TARGET
  |--------------------------------------------------------------------------
  */

  const personalTarget =
    profile
      ? calculateNutrition(
          profile
        )
      : null;


  /*
  |--------------------------------------------------------------------------
  | PERSONAL NUTRITION
  |--------------------------------------------------------------------------
  */

  const personalNutrition =
    calculatePersonalNutrition(
      {
        calories,
        protein,
        fiber,
        sugar,
        sodium,
      },
      personalTarget
    );


  /*
  |--------------------------------------------------------------------------
  | TABS
  |--------------------------------------------------------------------------
  */

  const tabs = [
    ["overview", "Overview"],

    [
      "composition",
      `Komposisi (${items.length})`,
    ],

    ["nutrition", "Kandungan"],

    ...(personalTarget
      ? [
          [
            "personal",
            "Untuk Kamu",
          ],
        ]
      : []),
  ];


  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#F5F8F6] text-[#18241C]">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">

          <button
            onClick={() =>
              navigate("/scan")
            }
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-[#34445A] shadow-sm transition hover:border-[#439B62]"
          >
            <ArrowLeft size={18} />

            Kembali ke Scanner
          </button>

          <div className="ml-auto rounded-full bg-[#E9EFF7] px-4 py-2 text-xs font-bold text-[#50627C]">

            {isEstimate
              ? "Estimasi AI"
              : "Data Label"}

          </div>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="mx-auto max-w-3xl px-4 py-5 sm:px-5">


        {/* ===================================================
            PRODUCT SUMMARY
        =================================================== */}

        <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">

          <div className="p-6">

            <div className="flex gap-4">


              {/* IMAGE */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EAF4ED]">

                {image ? (
                  <img
                    src={image}
                    alt={productName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-3xl">
                    🍽️
                  </div>
                )}

              </div>


              {/* PRODUCT INFO */}

              <div className="min-w-0 flex-1">

                <p className="text-xs font-black uppercase tracking-wider text-[#439B62]">
                  {brand ||
                    "HASIL ANALISIS"}
                </p>

                <h1 className="mt-1 text-xl font-black leading-tight sm:text-2xl">
                  {productName}
                </h1>

                <p className="mt-1 text-sm leading-5 text-[#526887]">
                  Analisis nutrisi dan
                  komposisi berdasarkan
                  foto
                </p>

                <p className="mt-2 text-xs font-semibold text-gray-400">
                  {servingSize}
                </p>

              </div>

            </div>


            {/* SOURCE NOTICE */}

            <div
              className={`mt-6 rounded-2xl border p-4 ${
                isEstimate
                  ? "border-[#F2D99A] bg-[#FFF9E9]"
                  : "border-[#CBE8D5] bg-[#F0FAF3]"
              }`}
            >

              <div className="flex gap-3">

                <span className="text-lg">
                  {isEstimate
                    ? "💡"
                    : "✓"}
                </span>

                <div>

                  <p
                    className={`text-sm font-black ${
                      isEstimate
                        ? "text-[#8B6500]"
                        : "text-[#2E8150]"
                    }`}
                  >
                    {isEstimate
                      ? "Estimasi Visual AI"
                      : "Data Label Produk"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {isEstimate
                      ? "Nilai nutrisi diperkirakan dari jenis makanan, komponen yang terlihat, dan perkiraan ukuran porsi."
                      : "Nilai nutrisi berasal dari informasi yang terbaca pada label produk."}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            AI VERDICT
        =================================================== */}

        <div className="mt-5 overflow-hidden rounded-[2rem] bg-[#2161F5] text-white shadow-lg shadow-blue-900/10">

          <div className="p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles size={22} />
              </div>

              <div>

                <h2 className="font-black">
                  AI Verdict
                </h2>

                <p className="text-xs text-white/70">
                  Insight dari NutriScan
                </p>

              </div>

            </div>

            <p className="mt-5 text-sm font-medium leading-7 text-white/95">
              {verdict}
            </p>


            {/* RECOMMENDATION */}

            <div className="mt-5 rounded-2xl bg-white p-4 text-[#24344D]">

              <div className="flex items-center gap-2">

                <span className="text-lg">
                  💡
                </span>

                <p className="text-xs font-black uppercase tracking-wider text-[#439B62]">
                  Rekomendasi
                </p>

              </div>

              <p className="mt-2 text-xs leading-6">
                {recommendation}
              </p>

            </div>

          </div>

        </div>


        {/* ===================================================
            TABS
        =================================================== */}

        <div className="mt-5 rounded-2xl border border-[#DCE4EF] bg-[#E9EEF6] p-1">

          <div
            className={`grid gap-1 ${
              tabs.length === 4
                ? "grid-cols-4"
                : "grid-cols-3"
            }`}
          >

            {tabs.map(
              ([value, label]) => (
                <button
                  key={value}
                  onClick={() =>
                    setActiveTab(
                      value
                    )
                  }
                  className={`rounded-xl px-2 py-3 text-xs font-black transition ${
                    activeTab === value
                      ? "bg-[#439B62] text-white shadow-sm"
                      : "text-[#4E607B] hover:bg-white/60"
                  }`}
                >
                  {label}
                </button>
              )
            )}

          </div>

        </div>


        {/* ===================================================
            OVERVIEW
        =================================================== */}

        {activeTab ===
          "overview" && (
          <OverviewTab
            items={items}
            positives={positives}
            warnings={warnings}
            calories={calories}
            protein={protein}
            sugar={sugar}
            fiber={fiber}
          />
        )}


        {/* ===================================================
            KOMPOSISI
        =================================================== */}

        {activeTab ===
          "composition" && (
          <CompositionTab
            items={items}
            ingredients={
              ingredients
            }
            isEstimate={
              isEstimate
            }
          />
        )}


        {/* ===================================================
            KANDUNGAN
        =================================================== */}

        {activeTab ===
          "nutrition" && (
          <NutritionTab
            calories={calories}
            protein={protein}
            carbohydrates={
              carbohydrates
            }
            fat={fat}
            saturatedFat={
              saturatedFat
            }
            sugar={sugar}
            fiber={fiber}
            sodium={sodium}
          />
        )}


        {/* ===================================================
            PERSONAL
        =================================================== */}

        {activeTab ===
          "personal" &&
          personalTarget && (
            <PersonalInsight
              personalNutrition={
                personalNutrition
              }
              target={
                personalTarget
              }
              profile={profile}
            />
          )}


        {/* ===================================================
            BUTTON
        =================================================== */}

        <button
          onClick={() =>
            navigate("/scan")
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#439B62] px-5 py-4 font-black text-white shadow-sm transition hover:bg-[#358250]"
        >

          <Sparkles size={19} />

          Analisis Makanan Lain

        </button>


        <p className="mt-4 pb-8 text-center text-[11px] leading-5 text-gray-400">
          Hasil NutriScan merupakan
          informasi edukasi dan
          estimasi, bukan pengganti
          saran dari tenaga kesehatan.
        </p>

      </section>

    </main>
  );
}


/*
|--------------------------------------------------------------------------
| PERSONAL INSIGHT
|--------------------------------------------------------------------------
*/

function PersonalInsight({
  personalNutrition,
  target,
  profile,
}) {
  return (
    <div className="mt-5 space-y-4">


      {/* HEADER */}

      <div className="rounded-[2rem] border border-[#D9E5FF] bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0FF] text-[#2161F5]">
            <Sparkles size={22} />
          </div>

          <div>

            <h3 className="text-lg font-black text-[#17233A]">
              Personal Insight
            </h3>

            <p className="mt-1 text-xs text-gray-400">
              Disesuaikan dengan kebutuhan{" "}
              {profile?.name ||
                "kamu"}
            </p>

          </div>

        </div>


        {/* INTRO */}

        <div className="mt-5 rounded-2xl bg-[#F4F7FF] p-4">

          <p className="text-sm leading-6 text-[#40516B]">
            Berikut gambaran kontribusi
            makanan ini terhadap
            kebutuhan nutrisi harianmu.
          </p>

        </div>


        {/* CALORIES */}

        <PersonalNutritionRow
          label="Kalori"
          value={
            personalNutrition
              ?.calories
          }
          actual={getActualValue(
            personalNutrition?.calories,
            target?.calorieTarget
          )}
          target={
            target?.calorieTarget
          }
          unit="kcal"
          type="calorie"
        />


        {/* PROTEIN */}

        <PersonalNutritionRow
          label="Protein"
          value={
            personalNutrition
              ?.protein
          }
          actual={getActualValue(
            personalNutrition?.protein,
            target?.proteinTarget
          )}
          target={
            target?.proteinTarget
          }
          unit="g"
          type="protein"
        />


        {/* FIBER */}

        <PersonalNutritionRow
          label="Serat"
          value={
            personalNutrition
              ?.fiber
          }
          actual={getActualValue(
            personalNutrition?.fiber,
            target?.fiberTarget
          )}
          target={
            target?.fiberTarget
          }
          unit="g"
          type="fiber"
        />


        {/* SUGAR */}

        <PersonalNutritionRow
          label="Gula"
          value={
            personalNutrition
              ?.sugar
          }
          actual={getActualValue(
            personalNutrition?.sugar,
            target?.sugarLimit
          )}
          target={
            target?.sugarLimit
          }
          unit="g"
          type="sugar"
        />


        {/* SODIUM */}

        <PersonalNutritionRow
          label="Natrium"
          value={
            personalNutrition
              ?.sodium
          }
          actual={getActualValue(
            personalNutrition?.sodium,
            2000
          )}
          target={2000}
          unit="mg"
          type="sodium"
        />


        {/* RECOMMENDATION */}

        <PersonalRecommendation
          personalNutrition={
            personalNutrition
          }
        />

      </div>


      {/* DAILY TARGET */}

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

        <h3 className="text-sm font-black uppercase tracking-wider text-[#63758F]">
          Target Harian
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-3">

          <TargetCard
            label="Kalori"
            value={
              target.calorieTarget
            }
            unit="kcal/hari"
          />

          <TargetCard
            label="Protein"
            value={
              target.proteinTarget
            }
            unit="g/hari"
          />

          <TargetCard
            label="Serat"
            value={
              target.fiberTarget
            }
            unit="g/hari"
          />

          <TargetCard
            label="Batas Gula"
            value={
              target.sugarLimit
            }
            unit="g/hari"
          />

        </div>

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| PERSONAL NUTRITION ROW
|--------------------------------------------------------------------------
*/

function PersonalNutritionRow({
  label,
  value,
  actual,
  target,
  unit,
  type,
}) {
  if (
    value === null ||
    value === undefined
  ) {
    return (
      <div className="mt-5 rounded-2xl bg-[#F7F9FB] p-4">

        <div className="flex items-center justify-between gap-3">

          <span className="text-sm font-bold text-[#40516B]">
            {label}
          </span>

          <span className="text-xs font-bold text-gray-400">
            Data tidak tersedia
          </span>

        </div>

      </div>
    );
  }

  const safePercentage =
    Math.min(
      Math.max(
        Number(value),
        0
      ),
      100
    );

  const isHigh =
    (type === "sugar" ||
      type === "sodium") &&
    value >= 70;

  return (
    <div className="mt-5">

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-sm font-black text-[#24344D]">
            {label}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {value}% dari target
          </p>

        </div>

        <div className="text-right">

          <p
            className={`text-sm font-black ${
              isHigh
                ? "text-[#D56B28]"
                : "text-[#439B62]"
            }`}
          >
            {formatValue(actual)}{" "}
            {unit}
          </p>

          <p className="text-[10px] text-gray-400">
            dari{" "}
            {formatValue(target)}{" "}
            {unit}
          </p>

        </div>

      </div>


      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EDF2F6]">

        <div
          className={`h-full rounded-full transition-all ${
            isHigh
              ? "bg-[#F1A333]"
              : "bg-[#54B978]"
          }`}
          style={{
            width: `${safePercentage}%`,
          }}
        />

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| PERSONAL RECOMMENDATION
|--------------------------------------------------------------------------
*/

function PersonalRecommendation({
  personalNutrition,
}) {
  const recommendations =
    [];

  if (
    personalNutrition?.sugar !==
      null &&
    personalNutrition?.sugar !==
      undefined &&
    personalNutrition.sugar >=
      70
  ) {
    recommendations.push(
      "Perhatikan konsumsi gula karena makanan ini menggunakan porsi yang cukup besar dari batas gula harian."
    );
  }

  if (
    personalNutrition?.sodium !==
      null &&
    personalNutrition?.sodium !==
      undefined &&
    personalNutrition.sodium >=
      70
  ) {
    recommendations.push(
      "Perhatikan natrium. Jika makanan lain hari ini juga tinggi natrium, sebaiknya pilih makanan yang lebih rendah garam."
    );
  }

  if (
    personalNutrition?.protein !==
      null &&
    personalNutrition?.protein !==
      undefined &&
    personalNutrition.protein <
      15
  ) {
    recommendations.push(
      "Kontribusi protein dari makanan ini relatif kecil. Sumber protein lain dapat membantu memenuhi kebutuhan harian."
    );
  }

  if (
    personalNutrition?.fiber !==
      null &&
    personalNutrition?.fiber !==
      undefined &&
    personalNutrition.fiber <
      10
  ) {
    recommendations.push(
      "Tambahkan sayuran, buah, atau sumber serat lainnya untuk membantu memenuhi kebutuhan serat harian."
    );
  }

  if (
    recommendations.length ===
    0
  ) {
    recommendations.push(
      "Secara umum, makanan ini memberikan kontribusi nutrisi yang cukup baik terhadap kebutuhan harianmu."
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#CBE8D5] bg-[#F0FAF3] p-4">

      <div className="flex items-center gap-2">

        <span className="text-lg">
          💡
        </span>

        <p className="text-sm font-black text-[#2E8150]">
          Rekomendasi untukmu
        </p>

      </div>

      <ul className="mt-3 space-y-2">

        {recommendations.map(
          (
            recommendation,
            index
          ) => (
            <li
              key={index}
              className="flex gap-2 text-xs leading-5 text-[#40516B]"
            >

              <span className="mt-1">
                •
              </span>

              <span>
                {recommendation}
              </span>

            </li>
          )
        )}

      </ul>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| TARGET CARD
|--------------------------------------------------------------------------
*/

function TargetCard({
  label,
  value,
  unit,
}) {
  return (
    <div className="rounded-2xl border border-[#DCE5EF] bg-[#F8FAFC] p-4">

      <p className="text-xs font-bold text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-[#17233A]">
        {formatValue(value)}
      </p>

      <p className="mt-1 text-[10px] font-bold text-gray-400">
        {unit}
      </p>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| OVERVIEW TAB
|--------------------------------------------------------------------------
*/

function OverviewTab({
  items,
  positives,
  warnings,
  calories,
  protein,
  sugar,
  fiber,
}) {
  return (
    <div className="mt-5 space-y-4">


      {/* KOMPONEN */}

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

        <SectionTitle
          icon={<Leaf size={17} />}
          title="Komponen yang Terdeteksi"
          positive
        />

        {items.length === 0 ? (
          <EmptyBox
            text="Komponen makanan belum dapat diidentifikasi dari foto."
          />
        ) : (
          <div className="mt-4 space-y-3">

            {items
              .slice(0, 6)
              .map(
                (item, index) => (
                  <DetectedItem
                    key={`${item?.name || "item"}-${index}`}
                    item={item}
                  />
                )
              )}

          </div>
        )}

      </div>


      {/* POSITIVE */}

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

        <SectionTitle
          icon={
            <CheckCircle2
              size={17}
            />
          }
          title="Nutritional Positives"
          positive
        />

        <ul className="mt-4 space-y-3">

          {positives.map(
            (item, index) => (
              <li
                key={index}
                className="flex gap-3 text-sm leading-5 text-[#40516B]"
              >

                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#54B978]" />

                {item}

              </li>
            )
          )}

        </ul>

      </div>


      {/* WARNINGS */}

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

        <SectionTitle
          icon={
            <AlertTriangle
              size={17}
            />
          }
          title="Yang Perlu Diperhatikan"
          warning
        />

        <ul className="mt-4 space-y-3">

          {warnings.map(
            (item, index) => (
              <li
                key={index}
                className="flex gap-3 text-sm leading-5 text-[#40516B]"
              >

                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#F1A333]" />

                {item}

              </li>
            )
          )}

        </ul>

      </div>


      {/* RINGKASAN */}

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

        <h3 className="text-sm font-black uppercase tracking-wider text-[#63758F]">
          Ringkasan Kandungan
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <MiniMacro
            icon={<Flame size={16} />}
            label="Kalori"
            value={formatValue(
              calories
            )}
            unit="kcal"
          />

          <MiniMacro
            icon={
              <Dumbbell
                size={16}
              />
            }
            label="Protein"
            value={formatValue(
              protein
            )}
            unit="g"
          />

          <MiniMacro
            icon={
              <Droplets
                size={16}
              />
            }
            label="Gula"
            value={formatValue(
              sugar
            )}
            unit="g"
          />

          <MiniMacro
            icon={
              <Wheat size={16} />
            }
            label="Serat"
            value={formatValue(
              fiber
            )}
            unit="g"
          />

        </div>

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| COMPOSITION TAB
|--------------------------------------------------------------------------
*/

function CompositionTab({
  items,
  ingredients,
  isEstimate,
}) {
  return (
    <div className="mt-5 space-y-4">


      {/* KOMPONEN MAKANAN */}

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between gap-3">

          <div>

            <h3 className="text-lg font-black">
              Komponen Makanan
            </h3>

            <p className="mt-1 text-xs text-gray-400">
              {items.length} komponen
              teridentifikasi
            </p>

          </div>

          <span className="rounded-full bg-[#EAF6EE] px-3 py-1 text-xs font-bold text-[#439B62]">
            {isEstimate
              ? "Estimasi AI"
              : "Analisis AI"}
          </span>

        </div>


        {items.length === 0 ? (
          <EmptyBox
            text="Belum ada komponen makanan yang berhasil dikenali."
          />
        ) : (
          <div className="mt-5 space-y-3">

            {items.map(
              (item, index) => (
                <DetectedItem
                  key={`${item?.name || "item"}-${index}`}
                  item={item}
                  large
                />
              )
            )}

          </div>
        )}

      </div>


      {/* BAHAN */}

      <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

        <div>

          <h3 className="text-lg font-black">
            Bahan / Komposisi
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            {ingredients.length} bahan
            teridentifikasi
          </p>

        </div>


        {ingredients.length === 0 ? (
          <EmptyBox
            text="Bahan atau komposisi belum dapat dibaca dari foto."
          />
        ) : (
          <div className="mt-5 space-y-3">

            {ingredients.map(
              (
                ingredient,
                index
              ) => (
                <div
                  key={`${ingredient.name}-${index}`}
                  className="rounded-2xl bg-[#F6F8FB] p-4"
                >

                  <p className="text-sm font-black text-[#17233A]">
                    {ingredient.name}
                  </p>

                  {ingredient.description && (
                    <p className="mt-1 text-xs leading-5 text-[#53657F]">
                      {
                        ingredient.description
                      }
                    </p>
                  )}

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| NUTRITION TAB
|--------------------------------------------------------------------------
*/

function NutritionTab({
  calories,
  protein,
  carbohydrates,
  fat,
  saturatedFat,
  sugar,
  fiber,
  sodium,
}) {
  const rows = [
    {
      label: "Kalori",
      value: calories,
      unit: "kcal",
      max: 800,
      icon: <Flame size={17} />,
    },

    {
      label: "Protein",
      value: protein,
      unit: "g",
      max: 50,
      icon: <Dumbbell size={17} />,
    },

    {
      label: "Karbohidrat Total",
      value: carbohydrates,
      unit: "g",
      max: 100,
      icon: <Wheat size={17} />,
    },

    {
      label: "Lemak Total",
      value: fat,
      unit: "g",
      max: 50,
      icon: <Droplets size={17} />,
    },

    {
      label: "Gula",
      value: sugar,
      unit: "g",
      max: 25,
      icon: <Droplets size={17} />,
    },

    {
      label: "Lemak Jenuh",
      value: saturatedFat,
      unit: "g",
      max: 20,
      icon: <Droplets size={17} />,
    },

    {
      label: "Natrium / Garam",
      value: sodium,
      unit: "mg",
      max: 2000,
      icon: <Droplets size={17} />,
    },

    {
      label: "Serat Pangan",
      value: fiber,
      unit: "g",
      max: 10,
      icon: <Wheat size={17} />,
    },
  ];


  return (
    <div className="mt-5 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

      <h3 className="text-lg font-black">
        Kandungan Nutrisi
      </h3>

      <p className="mt-1 text-xs text-gray-400">
        Semua nilai berdasarkan hasil
        analisis NutriScan.
      </p>

      <div className="mt-6 space-y-6">

        {rows.map(
          (row) => (
            <NutritionRow
              key={row.label}
              {...row}
            />
          )
        )}

      </div>

      <div className="mt-6 rounded-2xl bg-[#F5F8FA] p-4 text-xs leading-5 text-gray-500">

        <strong className="text-[#40516B]">
          Catatan:
        </strong>{" "}
        indikator batang hanya
        membantu melihat besarnya
        kandungan secara visual dan
        bukan merupakan target
        kebutuhan harian pribadi.

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| DETECTED ITEM
|--------------------------------------------------------------------------
*/

function DetectedItem({
  item,
  large = false,
}) {
  const name =
    item?.name ||
    item?.food_name ||
    item?.foodName ||
    "Komponen makanan";

  const portion =
    item?.estimated_portion ||
    item?.estimatedPortion ||
    item?.portion ||
    item?.quantity ||
    "";

  const description =
    item?.description ||
    "Komponen makanan yang terdeteksi dari foto.";

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl bg-[#F5F8FA] ${
        large
          ? "p-4"
          : "px-4 py-3"
      }`}
    >

      <div className="min-w-0">

        <p className="text-sm font-black text-[#17233A]">
          {name}
        </p>

        {large && (
          <p className="mt-1 text-xs leading-5 text-[#53657F]">
            {description}
          </p>
        )}

      </div>

      {portion && (
        <span className="shrink-0 rounded-full bg-[#EAF6EE] px-3 py-1 text-xs font-bold text-[#2E8150]">
          {portion}
        </span>
      )}

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| MINI MACRO
|--------------------------------------------------------------------------
*/

function MiniMacro({
  icon,
  label,
  value,
  unit,
}) {
  return (
    <div className="rounded-2xl border border-[#DCE5EF] bg-[#F8FAFC] p-4">

      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#439B62]">
        {icon}
      </div>

      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-[#63758F]">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-[#17233A]">

        {value}

        {value !== "--" && (
          <span className="ml-1 text-xs font-bold text-gray-400">
            {unit}
          </span>
        )}

      </p>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| NUTRITION ROW
|--------------------------------------------------------------------------
*/

function NutritionRow({
  label,
  value,
  unit,
  max,
  icon,
}) {
  const percent =
    value === null ||
    value === undefined ||
    max <= 0
      ? 0
      : Math.min(
          100,
          (value / max) * 100
        );

  return (
    <div>

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#439B62]">
            {icon}
          </div>

          <span className="text-sm font-bold text-[#24344D]">
            {label}
          </span>

        </div>

        <span className="text-sm font-black text-[#526887]">

          {formatValue(value)}

          {value !== null && (
            <span className="ml-1 text-xs font-semibold text-gray-400">
              {unit}
            </span>
          )}

        </span>

      </div>


      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDF2F6]">

        <div
          className="h-full rounded-full bg-[#54B978] transition-all"
          style={{
            width: `${percent}%`,
          }}
        />

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| SECTION TITLE
|--------------------------------------------------------------------------
*/

function SectionTitle({
  icon,
  title,
  positive = false,
  warning = false,
}) {
  return (
    <div
      className={`flex items-center gap-2 text-sm font-black uppercase tracking-wider ${
        positive
          ? "text-[#398557]"
          : warning
          ? "text-[#C85C1B]"
          : "text-[#526887]"
      }`}
    >
      {icon}
      {title}
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| EMPTY BOX
|--------------------------------------------------------------------------
*/

function EmptyBox({
  text,
}) {
  return (
    <div className="mt-5 rounded-2xl bg-[#F5F8FA] p-5 text-sm leading-6 text-gray-500">
      {text}
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  const parsed = Number(
    String(value)
      .replace(",", ".")
      .replace(
        /[^\d.-]/g,
        ""
      )
  );

  return Number.isFinite(parsed)
    ? parsed
    : null;
}


function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "--";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}


function normalizeIngredients(
  value
) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {

        if (
          typeof item ===
          "string"
        ) {
          return {
            name: item,
            description: "",
          };
        }

        return {
          name:
            item?.name ||
            item?.ingredient ||
            "Bahan",

          description:
            item?.description ||
            item?.reason ||
            "",
        };
      })
      .filter(
        (item) =>
          item.name
      );
  }

  if (
    typeof value ===
    "string"
  ) {
    return value
      .split(/[,;\n]+/)
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean)
      .map(
        (item) => ({
          name: item,
          description: "",
        })
      );
  }

  return [];
}


/*
|--------------------------------------------------------------------------
| PERSONAL ACTUAL VALUE
|--------------------------------------------------------------------------
*/

function getActualValue(
  percentage,
  target
) {
  if (
    percentage === null ||
    percentage ===
      undefined ||
    target === null ||
    target ===
      undefined
  ) {
    return null;
  }

  return (
    Number(percentage) *
    Number(target) /
    100
  );
}


/*
|--------------------------------------------------------------------------
| POSITIVES
|--------------------------------------------------------------------------
*/

function buildPositives({
  protein,
  fiber,
  calories,
  items,
}) {
  const positives = [];

  if (
    protein !== null &&
    protein >= 5
  ) {
    positives.push(
      "Mengandung protein yang dapat berkontribusi pada kebutuhan harian."
    );
  }

  if (
    fiber !== null &&
    fiber >= 2
  ) {
    positives.push(
      "Mengandung serat yang membantu melengkapi asupan harian."
    );
  }

  const hasVegetables =
    items.some(
      (item) =>
        /sayur|wortel|kol|selada|bayam|brokoli|daun/i.test(
          item?.name || ""
        )
    );

  if (
    hasVegetables
  ) {
    positives.push(
      "Terdapat komponen sayuran yang dapat menambah variasi zat gizi."
    );
  }

  if (
    calories !== null &&
    calories <= 350
  ) {
    positives.push(
      "Energi makanan berada pada tingkat yang relatif moderat."
    );
  }

  if (
    positives.length ===
    0
  ) {
    positives.push(
      "Informasi positif disesuaikan berdasarkan kandungan yang berhasil dianalisis."
    );
  }

  return positives;
}


/*
|--------------------------------------------------------------------------
| WARNINGS
|--------------------------------------------------------------------------
*/

function buildWarnings({
  sodium,
  sugar,
  saturatedFat,
  fat,
  fiber,
}) {
  const warnings = [];

  if (
    sodium !== null &&
    sodium >= 500
  ) {
    warnings.push(
      "Perhatikan jumlah natrium atau garam."
    );
  }

  if (
    sugar !== null &&
    sugar >= 10
  ) {
    warnings.push(
      "Perhatikan jumlah gula."
    );
  }

  if (
    saturatedFat !== null &&
    saturatedFat >= 5
  ) {
    warnings.push(
      "Lemak jenuh perlu diperhatikan."
    );
  }

  if (
    fat !== null &&
    fat >= 25
  ) {
    warnings.push(
      "Kandungan lemak cukup tinggi."
    );
  }

  if (
    fiber !== null &&
    fiber < 2
  ) {
    warnings.push(
      "Kandungan serat relatif rendah."
    );
  }

  if (
    warnings.length ===
    0
  ) {
    warnings.push(
      "Tidak ada indikator utama yang perlu diperhatikan dari data yang tersedia."
    );
  }

  return warnings;
}