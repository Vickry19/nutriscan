import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  User,
  Ruler,
  Weight,
  Activity,
  Target,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  calculateNutrition,
} from "../utils/nutritionCalculator";

const DEFAULT_PROFILE = {
  name: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  activity: "",
  goal: "",
};

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState(DEFAULT_PROFILE);

  const [saved, setSaved] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD PROFILE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const savedProfile =
      localStorage.getItem(
        "nutriscan_profile"
      );

    if (!savedProfile) {
      return;
    }

    try {
      const parsed =
        JSON.parse(savedProfile);

      setProfile({
        ...DEFAULT_PROFILE,
        ...parsed,
      });
    } catch (error) {
      console.error(
        "Profile lama tidak dapat dibaca:",
        error
      );
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CALCULATE NUTRITION
  |--------------------------------------------------------------------------
  */

  const nutrition =
    calculateNutrition(profile);

  /*
  |--------------------------------------------------------------------------
  | HANDLE CHANGE
  |--------------------------------------------------------------------------
  */

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setProfile(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

    setSaved(false);
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE PROFILE
  |--------------------------------------------------------------------------
  */

  function handleSave(event) {
    event.preventDefault();

    if (
      !profile.name ||
      !profile.age ||
      !profile.gender ||
      !profile.height ||
      !profile.weight ||
      !profile.activity ||
      !profile.goal
    ) {
      alert(
        "Lengkapi semua data profile terlebih dahulu."
      );

      return;
    }

    localStorage.setItem(
      "nutriscan_profile",
      JSON.stringify(profile)
    );

    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-[#F5F8F6] text-[#17251C]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-2xl items-center px-4 py-4">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition hover:bg-gray-50"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="ml-4">

            <h1 className="font-black">
              Profile
            </h1>

            <p className="text-xs text-gray-500">
              Data untuk personalisasi nutrisi
            </p>

          </div>

        </div>

      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-2xl px-4 py-6">

        {/* ===================================================
            INTRO
        =================================================== */}

        <div className="rounded-[2rem] bg-[#439B62] p-6 text-white shadow-lg shadow-green-900/10">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <User size={28} />
            </div>

            <div>

              <h2 className="text-xl font-black">
                Kenali kebutuhanmu
              </h2>

              <p className="mt-1 text-sm leading-5 text-white/80">
                Data ini digunakan NutriScan
                untuk memberikan rekomendasi
                nutrisi yang lebih personal.
              </p>

            </div>

          </div>

        </div>

        {/* ===================================================
            FORM
        =================================================== */}

        <form
          onSubmit={handleSave}
          className="mt-5 space-y-5"
        >

          {/* =================================================
              DATA DIRI
          ================================================= */}

          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

            <h3 className="text-lg font-black">
              Data Diri
            </h3>

            <p className="mt-1 text-xs text-gray-400">
              Informasi dasar pengguna
            </p>

            <div className="mt-5 space-y-4">

              <InputField
                label="Nama"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Masukkan nama"
                icon={<User size={18} />}
              />

              <InputField
                label="Umur"
                name="age"
                type="number"
                value={profile.age}
                onChange={handleChange}
                placeholder="Contoh: 20"
                min="1"
                max="120"
                suffix="tahun"
                icon={<User size={18} />}
              />

              <SelectField
                label="Jenis Kelamin"
                name="gender"
                value={profile.gender}
                onChange={handleChange}
                icon={<User size={18} />}
                options={[
                  {
                    value: "male",
                    label: "Laki-laki",
                  },
                  {
                    value: "female",
                    label: "Perempuan",
                  },
                ]}
              />

            </div>

          </div>

          {/* =================================================
              DATA TUBUH
          ================================================= */}

          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#439B62]">
                <Ruler size={20} />
              </div>

              <div>

                <h3 className="font-black">
                  Data Tubuh
                </h3>

                <p className="text-xs text-gray-400">
                  Digunakan untuk menghitung
                  kebutuhan energi
                </p>

              </div>

            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <InputField
                label="Tinggi Badan"
                name="height"
                type="number"
                value={profile.height}
                onChange={handleChange}
                placeholder="Contoh: 170"
                min="50"
                max="250"
                suffix="cm"
                icon={<Ruler size={18} />}
              />

              <InputField
                label="Berat Badan"
                name="weight"
                type="number"
                value={profile.weight}
                onChange={handleChange}
                placeholder="Contoh: 65"
                min="10"
                max="300"
                suffix="kg"
                icon={<Weight size={18} />}
              />

            </div>

          </div>

          {/* =================================================
              AKTIVITAS
          ================================================= */}

          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#439B62]">
                <Activity size={20} />
              </div>

              <div>

                <h3 className="font-black">
                  Aktivitas Harian
                </h3>

                <p className="text-xs text-gray-400">
                  Seberapa aktif kamu setiap hari?
                </p>

              </div>

            </div>

            <div className="mt-5 space-y-3">

              <RadioOption
                name="activity"
                value="sedentary"
                checked={
                  profile.activity ===
                  "sedentary"
                }
                onChange={handleChange}
                title="Sedentary"
                description="Jarang atau tidak berolahraga"
              />

              <RadioOption
                name="activity"
                value="light"
                checked={
                  profile.activity ===
                  "light"
                }
                onChange={handleChange}
                title="Light"
                description="Olahraga ringan 1–3 hari/minggu"
              />

              <RadioOption
                name="activity"
                value="moderate"
                checked={
                  profile.activity ===
                  "moderate"
                }
                onChange={handleChange}
                title="Moderate"
                description="Olahraga sedang 3–5 hari/minggu"
              />

              <RadioOption
                name="activity"
                value="active"
                checked={
                  profile.activity ===
                  "active"
                }
                onChange={handleChange}
                title="Active"
                description="Olahraga berat 6–7 hari/minggu"
              />

              <RadioOption
                name="activity"
                value="very_active"
                checked={
                  profile.activity ===
                  "very_active"
                }
                onChange={handleChange}
                title="Very Active"
                description="Aktivitas fisik sangat tinggi"
              />

            </div>

          </div>

          {/* =================================================
              TUJUAN
          ================================================= */}

          <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#439B62]">
                <Target size={20} />
              </div>

              <div>

                <h3 className="font-black">
                  Tujuan Kesehatan
                </h3>

                <p className="text-xs text-gray-400">
                  Apa tujuan nutrisi utama kamu?
                </p>

              </div>

            </div>

            <div className="mt-5 space-y-3">

              <RadioOption
                name="goal"
                value="maintain"
                checked={
                  profile.goal ===
                  "maintain"
                }
                onChange={handleChange}
                title="Menjaga berat badan"
                description="Mempertahankan berat badan saat ini"
              />

              <RadioOption
                name="goal"
                value="lose"
                checked={
                  profile.goal ===
                  "lose"
                }
                onChange={handleChange}
                title="Menurunkan berat badan"
                description="Mencapai berat badan yang lebih rendah"
              />

              <RadioOption
                name="goal"
                value="gain"
                checked={
                  profile.goal ===
                  "gain"
                }
                onChange={handleChange}
                title="Menaikkan berat badan"
                description="Menambah berat badan secara bertahap"
              />

              <RadioOption
                name="goal"
                value="muscle"
                checked={
                  profile.goal ===
                  "muscle"
                }
                onChange={handleChange}
                title="Membangun otot"
                description="Mendukung pertumbuhan dan pemeliharaan otot"
              />

            </div>

          </div>

          {/* =================================================
              NUTRITION SUMMARY
          ================================================= */}

          {nutrition && (
            <NutritionSummary
              nutrition={nutrition}
              profile={profile}
            />
          )}

          {/* =================================================
              SAVE
          ================================================= */}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#439B62] px-5 py-4 font-black text-white shadow-sm transition hover:bg-[#358250]"
          >

            {saved ? (
              <>
                <CheckCircle2 size={20} />
                Profile Tersimpan
              </>
            ) : (
              <>
                <Save size={20} />
                Simpan Profile
              </>
            )}

          </button>

          {saved && (
            <div className="rounded-2xl border border-[#CBE8D5] bg-[#F0FAF3] p-4 text-center text-sm font-bold text-[#2E8150]">
              Data profile berhasil disimpan.
            </div>
          )}

        </form>

        <p className="pb-8 pt-5 text-center text-[11px] leading-5 text-gray-400">
          Data profile disimpan secara lokal di
          perangkat dan digunakan untuk personalisasi
          fitur NutriScan.
        </p>

      </section>

    </main>
  );
}


/*
|--------------------------------------------------------------------------
| NUTRITION SUMMARY
|--------------------------------------------------------------------------
*/

function NutritionSummary({
  nutrition,
  profile,
}) {
  return (
    <div className="rounded-[2rem] border border-[#CBE8D5] bg-white p-6 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF6EE] text-[#439B62]">
          <Activity size={22} />
        </div>

        <div>

          <h3 className="text-lg font-black">
            Kebutuhan Nutrisimu
          </h3>

          <p className="mt-1 text-xs text-gray-400">
            Perkiraan berdasarkan data profile
          </p>

        </div>

      </div>

      {/* BMI */}

      <div className="mt-5 rounded-2xl bg-[#F5F8FA] p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-bold text-gray-400">
              BMI
            </p>

            <p className="mt-1 text-3xl font-black text-[#17233A]">
              {nutrition.bmi}
            </p>

          </div>

          <div className="rounded-full bg-[#EAF6EE] px-4 py-2 text-xs font-black text-[#2E8150]">
            {nutrition.bmiCategory}
          </div>

        </div>

      </div>

      {/* TARGET */}

      <div className="mt-4 grid grid-cols-2 gap-3">

        <TargetCard
          label="Kalori"
          value={nutrition.calorieTarget}
          unit="kcal/hari"
        />

        <TargetCard
          label="Protein"
          value={nutrition.proteinTarget}
          unit="g/hari"
        />

        <TargetCard
          label="Serat"
          value={nutrition.fiberTarget}
          unit="g/hari"
        />

        <TargetCard
          label="Batas Gula"
          value={nutrition.sugarLimit}
          unit="g/hari"
        />

      </div>

      {/* DETAIL */}

      <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">

        <p className="text-xs font-black uppercase tracking-wider text-[#63758F]">
          Detail Perhitungan
        </p>

        <div className="mt-3 space-y-3">

          <DetailRow
            label="BMR"
            value={`${nutrition.bmr} kcal`}
          />

          <DetailRow
            label="TDEE"
            value={`${nutrition.tdee} kcal`}
          />

          <DetailRow
            label="Tujuan"
            value={getGoalLabel(profile.goal)}
          />

        </div>

      </div>

      {/* DISCLAIMER */}

      <div className="mt-4 rounded-2xl border border-[#DCE5EF] bg-[#F5F8FA] p-4">

        <p className="text-xs leading-5 text-gray-500">
          <strong className="text-[#40516B]">
            Catatan:
          </strong>{" "}
          kebutuhan nutrisi merupakan perkiraan untuk
          membantu memahami pola makan. Hasil dapat
          berbeda berdasarkan kondisi dan aktivitas
          individu.
        </p>

      </div>

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
    <div className="rounded-2xl border border-gray-100 bg-[#FAFCFB] p-4">

      <p className="text-xs font-bold text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-[#17233A]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold text-gray-400">
        {unit}
      </p>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-xs text-gray-500">
        {label}
      </span>

      <span className="text-sm font-black text-[#24344D]">
        {value}
      </span>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| INPUT FIELD
|--------------------------------------------------------------------------
*/

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  min,
  max,
  suffix,
  icon,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#34445A]">
        {label}
      </label>

      <div className="relative">

        <div className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center text-gray-400">
          {icon}
        </div>

        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          required
          className={`w-full rounded-2xl border border-gray-200 bg-[#FAFCFB] py-3.5 pl-11 text-sm font-semibold text-[#17251C] outline-none transition placeholder:text-gray-400 focus:border-[#439B62] focus:ring-4 focus:ring-[#439B62]/10 ${
            suffix
              ? "pr-16"
              : "pr-4"
          }`}
        />

        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
            {suffix}
          </span>
        )}

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| SELECT FIELD
|--------------------------------------------------------------------------
*/

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  icon,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#34445A]">
        {label}
      </label>

      <div className="relative">

        <div className="pointer-events-none absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center text-gray-400">
          {icon}
        </div>

        <select
          name={name}
          value={value}
          onChange={onChange}
          required
          className="w-full appearance-none rounded-2xl border border-gray-200 bg-[#FAFCFB] py-3.5 pl-11 pr-10 text-sm font-semibold text-[#17251C] outline-none transition focus:border-[#439B62] focus:ring-4 focus:ring-[#439B62]/10"
        >

          <option value="">
            Pilih jenis kelamin
          </option>

          {options.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}

        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          ▼
        </span>

      </div>

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| RADIO OPTION
|--------------------------------------------------------------------------
*/

function RadioOption({
  name,
  value,
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
        checked
          ? "border-[#73C493] bg-[#F0FAF3]"
          : "border-gray-100 bg-[#FAFCFB] hover:border-gray-200"
      }`}
    >

      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        required
        className="mt-1 h-4 w-4 accent-[#439B62]"
      />

      <div>

        <p className="text-sm font-black text-[#24344D]">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>

      </div>

    </label>
  );
}


/*
|--------------------------------------------------------------------------
| GOAL LABEL
|--------------------------------------------------------------------------
*/

function getGoalLabel(goal) {
  const labels = {
    maintain:
      "Menjaga berat badan",

    lose:
      "Menurunkan berat badan",

    gain:
      "Menaikkan berat badan",

    muscle:
      "Membangun otot",
  };

  return (
    labels[goal] ||
    "Belum ditentukan"
  );
}