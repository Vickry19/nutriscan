/*
|--------------------------------------------------------------------------
| PERSONAL NUTRITION
|--------------------------------------------------------------------------
| Membandingkan kandungan makanan dengan kebutuhan
| nutrisi pengguna dari Profile.
|--------------------------------------------------------------------------
*/

export function calculatePersonalNutrition(
    nutrition,
    target
  ) {
    if (!nutrition || !target) {
      return null;
    }
  
    return {
      calories: calculatePercentage(
        nutrition.calories,
        target.calorieTarget
      ),
  
      protein: calculatePercentage(
        nutrition.protein,
        target.proteinTarget
      ),
  
      fiber: calculatePercentage(
        nutrition.fiber,
        target.fiberTarget
      ),
  
      sugar: calculatePercentage(
        nutrition.sugar,
        target.sugarLimit
      ),
  
      sodium: calculatePercentage(
        nutrition.sodium,
        2000
      ),
    };
  }
  
  
  /*
  |--------------------------------------------------------------------------
  | PERCENTAGE
  |--------------------------------------------------------------------------
  */
  
  function calculatePercentage(
    value,
    target
  ) {
    if (
      value === null ||
      value === undefined ||
      target === null ||
      target === undefined ||
      target <= 0
    ) {
      return null;
    }
  
    return Math.round(
      (Number(value) /
        Number(target)) *
        100
    );
  }
  
  
  /*
  |--------------------------------------------------------------------------
  | FORMAT PROFILE TARGET
  |--------------------------------------------------------------------------
  */
  
  export function getProfileNutritionTarget() {
    const savedProfile =
      localStorage.getItem(
        "nutriscan_profile"
      );
  
    if (!savedProfile) {
      return null;
    }
  
    try {
      const profile =
        JSON.parse(savedProfile);
  
      return profile;
    } catch {
      return null;
    }
  }