export type KiaErrorLocale = 'es' | 'ru';

const ES: Record<string, string> = {
  kia_error: 'Ups… he tropezado con un cable invisible 😅. Prueba otra vez y seguimos.',
  network_error: 'Parece que internet y yo nos hemos perdido de vista un momento 📡😅. Inténtalo de nuevo.',
  timeout: 'Me he quedado pensando más de la cuenta… y eso ya es decir 😄. Inténtalo otra vez.',
  rate_limited: 'Me has puesto a trabajar a velocidad de crucero 😅. Dame un momento y seguimos.',
  daily_cost_cap_reached: 'Mi café digital de hoy se ha terminado ☕🙂. En cuanto se renueve el límite, seguimos donde lo dejamos.',
  invalid_context_token: 'Este enlace se me ha quedado viejito 🕰️🙂. Abre uno nuevo desde EXPERT y retomamos el expediente.',
  context_unavailable: 'Se me ha escapado el hilo de este enlace por un momento 🧵😅. Puedes abrirlo de nuevo desde EXPERT.',
  profile_lookup_failed: 'No encuentro una pieza de tu ficha EXPERT 🧩🙂. Prueba otra vez en un momento.',
  policy_context_failed: 'Estoy comprobando tus permisos y una puerta se me ha quedado atascada 🔐🙂. Inténtalo de nuevo.',
  policy_denied: 'Esta puerta tiene candado 🔐🙂. Si crees que debería abrirse, revisamos el acceso contigo.',
  account_inactive: 'Tu acceso EXPERT aparece pausado ⏸️🙂. Cuando vuelva a estar activo, retomamos desde aquí.',
  company_forbidden: 'Esa empresa no aparece vinculada a tu cuenta 🔎🙂. Selecciona una de tus entidades disponibles.',
  active_company_invalid: 'La empresa activa se me ha movido de sitio 😅🏢. Elige otra entidad y seguimos.',
  company_membership_check_failed: 'No he podido comprobar la empresa con seguridad 🧩🙂. Prueba otra vez en un momento.',
  session_scope_check_failed: 'He perdido el marcador de esta conversación por un segundo 🔖😅. Inténtalo de nuevo.',
  invalid_case_context: 'Este enlace del expediente ya no me lleva a la puerta correcta 🗂️🙂. Abre uno nuevo desde EXPERT.',
  link_rejected: 'Ese código ya no abre la puerta 🔑🙂. Genera uno nuevo desde EXPERT y volvemos a intentarlo.',
  generic: 'Algo se ha puesto creativo por su cuenta 😅. Prueba otra vez y seguimos.',
};

const RU: Record<string, string> = {
  kia_error: 'Ой… я споткнулась о невидимый провод 😅 Попробуйте ещё раз — и продолжим.',
  network_error: 'Похоже, интернет и я на секунду потеряли друг друга 📡😅 Попробуйте ещё раз.',
  timeout: 'Я задумалась чуть дольше обычного… а это уже достижение 😄 Попробуйте снова.',
  rate_limited: 'Вы заставили меня работать на крейсерской скорости 😅 Дайте мне минутку — и продолжим.',
  daily_cost_cap_reached: 'Мой цифровой кофе на сегодня закончился ☕🙂 Как только лимит обновится, продолжим.',
  invalid_context_token: 'Эта ссылка уже немного состарилась 🕰️🙂 Откройте новую из EXPERT.',
  context_unavailable: 'Я на секунду потеряла ниточку этой ссылки 🧵😅 Откройте её снова из EXPERT.',
  profile_lookup_failed: 'Не хватает одной детали вашей карточки EXPERT 🧩🙂 Попробуйте ещё раз чуть позже.',
  policy_context_failed: 'Проверяю права доступа, но одна дверь заела 🔐🙂 Попробуйте ещё раз.',
  policy_denied: 'На этой двери сейчас замок 🔐🙂 Если доступ должен быть, мы его проверим.',
  account_inactive: 'Доступ EXPERT сейчас приостановлен ⏸️🙂 Как только он снова станет активным, продолжим.',
  company_forbidden: 'Эта компания не привязана к вашей учётной записи 🔎🙂 Выберите доступную компанию.',
  active_company_invalid: 'Активная компания куда-то переехала 😅🏢 Выберите другую — и продолжим.',
  company_membership_check_failed: 'Не удалось безопасно проверить компанию 🧩🙂 Попробуйте ещё раз.',
  session_scope_check_failed: 'Я на секунду потеряла закладку этой беседы 🔖😅 Попробуйте снова.',
  invalid_case_context: 'Эта ссылка на дело уже ведёт не к той двери 🗂️🙂 Откройте новую из EXPERT.',
  link_rejected: 'Этот код уже не открывает дверь 🔑🙂 Создайте новый в EXPERT.',
  generic: 'Что-то решило проявить самостоятельность 😅 Попробуйте ещё раз — и продолжим.',
};

export function kiaFriendlyError(code: string | null | undefined, locale: KiaErrorLocale = 'es'): string {
  const table = locale === 'ru' ? RU : ES;
  return table[code ?? 'generic'] ?? table.generic;
}
