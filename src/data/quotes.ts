import type { Language } from '@/types'

export interface Quote {
  id: string
  text: string
  source: string
}

/**
 * Bundled, offline quote bank.
 * English/Uzbek/Russian: a mix of public-domain classics and original
 * lines about practice and typing. All texts are shipped inside the app;
 * nothing is fetched at runtime.
 */
export const QUOTES: Record<Language, Quote[]> = {
  en: [
    { id: 'en-1', text: 'The only way to do great work is to love what you do.', source: 'Steve Jobs' },
    { id: 'en-2', text: 'Practice is the best of all instructors.', source: 'Publilius Syrus' },
    { id: 'en-3', text: 'It always seems impossible until it is done.', source: 'Nelson Mandela' },
    { id: 'en-4', text: 'The secret of getting ahead is getting started.', source: 'Mark Twain' },
    { id: 'en-5', text: 'By failing to prepare, you are preparing to fail.', source: 'Benjamin Franklin' },
    { id: 'en-6', text: 'Genius is one percent inspiration and ninety-nine percent perspiration.', source: 'Thomas Edison' },
    { id: 'en-7', text: 'Well begun is half done.', source: 'Aristotle' },
    { id: 'en-8', text: 'The best time to plant a tree was twenty years ago. The second best time is now.', source: 'Chinese proverb' },
    { id: 'en-9', text: 'A journey of a thousand miles begins with a single step.', source: 'Lao Tzu' },
    { id: 'en-10', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', source: 'Winston Churchill' },
    { id: 'en-11', text: 'Whether you think you can, or you think you cannot, you are right.', source: 'Henry Ford' },
    { id: 'en-12', text: 'Do not wait to strike till the iron is hot, but make it hot by striking.', source: 'William Butler Yeats' },
    { id: 'en-13', text: 'Energy and persistence conquer all things.', source: 'Benjamin Franklin' },
    { id: 'en-14', text: 'The pain of discipline is nothing like the pain of disappointment.', source: 'Justin Langer' },
    { id: 'en-15', text: 'Slow progress is still progress. Keep typing, keep improving.', source: 'Original' },
    { id: 'en-16', text: 'Consistency before intensity: small daily practice beats occasional bursts.', source: 'Original' },
    { id: 'en-17', text: 'Every keystroke is practice, and practice is the road to mastery.', source: 'Original' },
    { id: 'en-18', text: 'Reading maketh a full man, conference a ready man, and writing an exact man.', source: 'Francis Bacon' },
    { id: 'en-19', text: 'The beautiful thing about learning is that nobody can take it away from you.', source: 'B.B. King' },
    { id: 'en-20', text: 'It is not that I am so smart, it is just that I stay with problems longer.', source: 'Albert Einstein' },
    { id: 'en-21', text: 'What we achieve inwardly will change outer reality.', source: 'Plutarch' },
    { id: 'en-22', text: 'Time you enjoy wasting is not wasted time.', source: 'Marthe Troly-Curtin' },
    { id: 'en-23', text: 'The way to get started is to quit talking and begin doing.', source: 'Walt Disney' },
    { id: 'en-24', text: 'Small steps in the right direction can turn out to be the biggest step of your life.', source: 'Original' },
    { id: 'en-25', text: 'An investment in knowledge always pays the best interest.', source: 'Benjamin Franklin' },
    { id: 'en-26', text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', source: 'Will Durant on Aristotle' },
    { id: 'en-27', text: 'Happiness is not something ready made. It comes from your own actions.', source: 'Dalai Lama' },
    { id: 'en-28', text: 'Don not watch the clock, do what it does. Keep going.', source: 'Sam Levenson' },
    { id: 'en-29', text: 'The more you practice, the smoother every keystroke becomes.', source: 'Original' },
    { id: 'en-30', text: 'Mistakes are proof that you are trying, and trying is how you improve.', source: 'Original' },
  ],
  uz: [
    { id: 'uz-1', text: 'Mehnat qilgan kishi maqsadiga albatta yetadi.', source: 'Maqol' },
    { id: 'uz-2', text: 'Bilim — boylikdan ulug‘, mehnat — tilakning kalitidir.', source: 'Maqol' },
    { id: 'uz-3', text: 'Avval o‘zingni o‘rgat, keyin o‘zgani o‘rgat.', source: 'Maqol' },
    { id: 'uz-4', text: 'Yomg‘ir yog‘sa, yerni sug‘aradi; mehnat qilsa, insonni yuksaltiradi.', source: 'Original' },
    { id: 'uz-5', text: 'Sabr qilsang, gumbur oshing pishadi.', source: 'Maqol' },
    { id: 'uz-6', text: 'Har kun ozgina mashq qilgan odam uzoq yo‘lni ham bosib o‘tadi.', source: 'Original' },
    { id: 'uz-7', text: 'Yozish — fikrni tartibga solishning eng yaxshi usulidir.', source: 'Original' },
    { id: 'uz-8', text: 'Tez yozish emas, aniq yozish mahorat belgisidir.', source: 'Original' },
    { id: 'uz-9', text: 'Bog‘ga suv quy, bog‘ seni g‘amlagay; ilmga mehnat, ilm seni quvvatlagay.', source: 'Maqol' },
    { id: 'uz-10', text: 'Bilimli yigit — bilamsiz boydan baholi qudrat.', source: 'Maqol' },
    { id: 'uz-11', text: 'Olim - dengiz, qolgan odamlar - sohil.', source: 'Maqol' },
    { id: 'uz-12', text: 'Kim so‘zsiz, so‘z bilmaydi, bilimli kishi so‘zni yaxshi biladi.', source: 'Original' },
    { id: 'uz-13', text: 'Mehnat bilan topilgan taom — shirin, mehnatdan qochgan kishiga yomon kun.', source: 'Maqol' },
    { id: 'uz-14', text: 'Ilm olamga nur sochadi, jaholat odamni zulmatga bosadi.', source: 'Maqol' },
    { id: 'uz-15', text: 'Har bir xatolik — o‘rganishning bir qadamidir.', source: 'Original' },
    { id: 'uz-16', text: 'To‘g‘ri urilgan har bir tugmani his qil, tezlik o‘z-o‘zidan keladi.', source: 'Original' },
    { id: 'uz-17', text: 'Barqaror mashq — muvaffaqiyatning eng xavfsiz yo‘li.', source: 'Original' },
    { id: 'uz-18', text: 'Kitob o‘qish — bilim bulog‘i, muntazam yozish — mahorat yo‘li.', source: 'Original' },
    { id: 'uz-19', text: 'O‘qib, so‘ng yozgan kishi xatosini tez topadi.', source: 'Original' },
    { id: 'uz-20', text: 'Ko‘p bilgan emas, ko‘p mehnat qilgan g‘olib chiqadi.', source: 'Maqol' },
  ],
  ru: [
    { id: 'ru-1', text: 'Терпение и труд всё перетрут.', source: 'Пословица' },
    { id: 'ru-2', text: 'Повторение — мать учения.', source: 'Пословица' },
    { id: 'ru-3', text: 'Ученье — свет, а неученье — тьма.', source: 'Пословица' },
    { id: 'ru-4', text: 'Дело мастера боится.', source: 'Пословица' },
    { id: 'ru-5', text: 'Кто хочет, тот добьётся; кто ищет, тот всегда найдёт.', source: 'Пословица' },
    { id: 'ru-6', text: 'Куй железо, пока горячо.', source: 'Пословица' },
    { id: 'ru-7', text: 'Не боги горшки обжигают.', source: 'Пословица' },
    { id: 'ru-8', text: 'Капля камень точит.', source: 'Пословица' },
    { id: 'ru-9', text: 'Семь раз отмерь, один раз отрежь.', source: 'Пословица' },
    { id: 'ru-10', text: 'Лучше меньше, да лучше.', source: 'Пословица' },
    { id: 'ru-11', text: 'Умение — это дисциплина, умноженная на время.', source: 'Оригинал' },
    { id: 'ru-12', text: 'Каждое нажатие клавиши приближает вас к мастерству.', source: 'Оригинал' },
    { id: 'ru-13', text: 'Не бойтесь ошибаться — бойтесь не пробовать снова.', source: 'Оригинал' },
    { id: 'ru-14', text: 'Регулярная практика сильнее редких рывков.', source: 'Оригинал' },
    { id: 'ru-15', text: 'Видеть цель, верить в себя и нажимать дальше.', source: 'Оригинал' },
    { id: 'ru-16', text: 'Дорогу осилит идущий.', source: 'Пословица' },
    { id: 'ru-17', text: 'Точность важнее скорости, скорость приходит сама.', source: 'Оригинал' },
    { id: 'ru-18', text: 'Мир принадлежит тем, кто делает.', source: 'Оригинал' },
    { id: 'ru-19', text: 'Любить скорость — значит любить чистую печать.', source: 'Оригинал' },
    { id: 'ru-20', text: 'Сколько бы ни говорили, пока не напечатаешь — не поймёшь.', source: 'Оригинал' },
  ],
}

export function allQuotes(language: Language): Quote[] {
  return QUOTES[language]
}