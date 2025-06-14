import { setup as l10nSetup } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
// import af from "./af.json"
// import de from "./de.json"
// import es from "./es.json"
// import fr from "./fr.json"
// import id from "./id.json"
// import it from "./it.json"
import ja from "./ja.json" // Sample
// import ko from "./ko.json"
// import nbNO from "./nb-NO.json"
// import nl from "./nl.json"
// import pl from "./pl.json"
// import ptBR from "./pt-BR.json"
// import ptPT from "./pt-PT.json"
// import ru from "./ru.json"
// import sk from "./sk.json"
// import tr from "./tr.json"
// import uk from "./uk.json"
// import zhCN from "./zh-CN.json"
// import zhHant from "./zh-Hant.json"


/**
 * Asynchronously retrieves the user's preferred language and date format from Logseq app configurations.
 *
 * Waits for 1 second before fetching the user configurations.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array containing the preferred language and preferred date format, in that order.
 */
const getUserConfigs = async (): Promise<string[]> => {
             // 1秒待つ
             await new Promise((resolve) => setTimeout(resolve, 1000))
             const { preferredLanguage, preferredDateFormat } = await logseq.App.getUserConfigs() as { preferredDateFormat: string; preferredLanguage: string }
             return [preferredLanguage, preferredDateFormat]
}

/**
 * Loads and sets up localization (l10n) for Logseq based on the user's preferred language and date format.
 *
 * This function retrieves the user's language and date format preferences, filters the available translations
 * accordingly, and initializes the localization setup with the appropriate translations.
 *
 * @returns A promise that resolves to an object containing the user's preferred language and date format.
 */
export const loadLogseqL10n = async () => {
             const [preferredLanguage, preferredDateFormat] = await getUserConfigs() //ユーザー設定言語を取得

             const translations = {
                          ja,
                          // af, de, es, fr, id, it, ko, "nb-NO": nbNO, nl, pl, "pt-BR": ptBR, "pt-PT": ptPT, ru, sk, tr, uk, "zh-CN": zhCN, "zh-Hant": zhHant
             }

             const filteredTranslations = preferredLanguage === ""
                          ? translations
                          : { [preferredLanguage]: translations[preferredLanguage] }

             await l10nSetup({
                          builtinTranslations: filteredTranslations
             })
             return { preferredLanguage, preferredDateFormat }
}
