import '@logseq/libs' //https://plugins-doc.logseq.com/
import { settingsTemplate } from './settings'

// L10n
// import { setup as l10nSetup, t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
// import ja from "./translations/ja.json"


/* main */
const main = async () => {

  // L10n
  // await l10nSetup({ builtinTranslations: { ja } })


  /* user settings */
  logseq.useSettingsSchema(settingsTemplate())

  // First time setup for user settings
  if (!logseq.settings)
    setTimeout(() => logseq.showSettingsUI(), 300)


 // Run when this plugin is loaded
  
  

  // TEST
  logseq.UI.showMsg('Hello!!', "success", { timeout: 6000 })
  console.log('Hello!!')
  



}/* end_main */

logseq.ready(main).catch(console.error) // init [required for plugin to load]