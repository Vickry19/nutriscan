/*
|--------------------------------------------------------------------------
| NUTRITION CALCULATOR
|--------------------------------------------------------------------------
| Menghitung BMI, BMR, TDEE dan target nutrisi
| berdasarkan data Profile pengguna.
|--------------------------------------------------------------------------
*/

export function calculateNutrition(profile) {
    const age = Number(profile.age);
    const height = Number(profile.height);
    const weight = Number(profile.weight);
  
    if (
      !age ||
      !height ||
      !weight ||
      !profile.gender ||
      !profile.activity ||
      !profile.goal
    ) {
      return null;
    }
  
    /*
    |--------------------------------------------------------------------------
    | BMI
    |--------------------------------------------------------------------------
    */
  
    const heightMeter = height / 100;
  
    const bmi =
      weight /
      (heightMeter * heightMeter);
  
    /*
    |--------------------------------------------------------------------------
    | BMR
    |--------------------------------------------------------------------------
    | Mifflin-St Jeor
    |
    | Pria:
    | 10W + 6.25H - 5A + 5
    |
    | Wanita:
    | 10W + 6.25H - 5A - 161
    |--------------------------------------------------------------------------
    */
  
    let bmr;
  
    if (profile.gender === "male") {
      bmr =
        10 * weight +
        6.25 * height -
        5 * age +
        5;
    } else {
      bmr =
        10 * weight +
        6.25 * height -
        5 * age -
        161;
    }
  
    /*
    |--------------------------------------------------------------------------
    | ACTIVITY FACTOR
    |--------------------------------------------------------------------------
    */
  
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
  
    const activityFactor =
      activityFactors[
        profile.activity
      ] || 1.2;
  
    /*
    |--------------------------------------------------------------------------
    | TDEE
    |--------------------------------------------------------------------------
    */
  
    const tdee =
      bmr * activityFactor;
  
    /*
    |--------------------------------------------------------------------------
    | CALORIE TARGET
    |--------------------------------------------------------------------------
    */
  
    let calorieTarget = tdee;
  
    switch (profile.goal) {
      case "lose":
        calorieTarget =
          tdee - 400;
        break;
  
      case "gain":
        calorieTarget =
          tdee + 300;
        break;
  
      case "muscle":
        calorieTarget =
          tdee + 200;
        break;
  
      case "maintain":
      default:
        calorieTarget =
          tdee;
        break;
    }
  
    /*
    |--------------------------------------------------------------------------
    | MINIMUM SAFETY FLOOR
    |--------------------------------------------------------------------------
    */
  
    if (profile.gender === "male") {
      calorieTarget = Math.max(
        calorieTarget,
        1500
      );
    } else {
      calorieTarget = Math.max(
        calorieTarget,
        1200
      );
    }
  
    /*
    |--------------------------------------------------------------------------
    | PROTEIN
    |--------------------------------------------------------------------------
    |
    | Target dasar:
    | sekitar 1.2 g/kg berat badan.
    |
    | Untuk tujuan muscle:
    | sekitar 1.6 g/kg.
    |--------------------------------------------------------------------------
    */
  
    let proteinPerKg = 1.2;
  
    if (profile.goal === "muscle") {
      proteinPerKg = 1.6;
    }
  
    const proteinTarget =
      weight * proteinPerKg;
  
    /*
    |--------------------------------------------------------------------------
    | FIBER
    |--------------------------------------------------------------------------
    */
  
    const fiberTarget = Math.max(
      25,
      Math.round(
        calorieTarget / 1000 * 14
      )
    );
  
    /*
    |--------------------------------------------------------------------------
    | SUGAR
    |--------------------------------------------------------------------------
    */
  
    const sugarLimit =
      profile.gender === "male"
        ? 36
        : 25;
  
    /*
    |--------------------------------------------------------------------------
    | BMI CATEGORY
    |--------------------------------------------------------------------------
    */
  
    let bmiCategory;
  
    if (bmi < 18.5) {
      bmiCategory = "Berat badan kurang";
    } else if (bmi < 25) {
      bmiCategory = "Berat badan normal";
    } else if (bmi < 30) {
      bmiCategory = "Berat badan berlebih";
    } else {
      bmiCategory = "Obesitas";
    }
  
    /*
    |--------------------------------------------------------------------------
    | RESULT
    |--------------------------------------------------------------------------
    */
  
    return {
      bmi: round(bmi, 1),
  
      bmiCategory,
  
      bmr: Math.round(bmr),
  
      tdee: Math.round(tdee),
  
      calorieTarget: Math.round(
        calorieTarget
      ),
  
      proteinTarget: Math.round(
        proteinTarget
      ),
  
      fiberTarget,
  
      sugarLimit,
    };
  }
  
  /*
  |--------------------------------------------------------------------------
  | ROUND
  |--------------------------------------------------------------------------
  */
  
  function round(
    number,
    decimals = 0
  ) {
    const factor =
      10 ** decimals;
  
    return (
      Math.round(
        number * factor
      ) / factor
    );
  }