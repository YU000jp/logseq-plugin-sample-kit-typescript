import '@logseq/libs' //https://plugins-doc.logseq.com/
import { t } from "logseq-l10n" //https://github.com/sethyuan/logseq-l10n
import { logseqModelCheck } from './logseqModelCheck'
import { settingsTemplate } from './settings'
import { loadLogseqL10n } from './translations/l10nSetup'

const PLUGIN_ID = 'logseq-plugin-template-typescript' // Plugin ID
export const consoleText = PLUGIN_ID + " :: "

// Variables (used within the same module, not exported)
let logseqVersion: string = "" // For version checking
let logseqMdModel: boolean = false // For model checking
let logseqDbGraph: boolean = false // For DB graph checking
// Exported for external reference
export const getLogseqVersion = () => logseqVersion // For version checking
export const replaceLogseqVersion = (version: string) => logseqVersion = version
export const booleanLogseqMdModel = () => logseqMdModel // For model checking
export const replaceLogseqMdModel = (mdModel: boolean) => logseqMdModel = mdModel

export const booleanDbGraph = () => logseqDbGraph // For DB graph checking
export const replaceLogseqDbGraph = (dbGraph: boolean) => logseqDbGraph = dbGraph


/* main */
/**
 * Initializes the Logseq plugin by performing the following steps:
 * 1. Checks the Logseq model type (Markdown or Database) and determines the graph type.
 * 2. Loads the user's preferred language and date format for localization (L10N).
 * 3. Initializes the user settings schema based on the detected Logseq model and graph type.
 * 4. Displays the settings UI if user settings are not yet configured.
 * 5. Shows a localized success message in the Logseq UI upon successful initialization.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when initialization is complete.
 */
const main = async () => {

  // Execute Logseq model check
  const [logseqDbGraph, logseqMdModel] = await logseqModelCheck()
  /**
    * logseqMdModel===true: MD model
    + logseqMdModel===false: DB model
    + logseqMdModel===false && logseqDbGraph===false: file-based graph
    * logseqMdModel===false && logseqDbGraph===true: DB graph
    */

  // Get user setting language and set up L10N
  const { preferredLanguage, preferredDateFormat } = await loadLogseqL10n()
  // preferredLanguage: user setting language
  // preferredDateFormat: user setting date format

  // User Settings
  logseq.useSettingsSchema(settingsTemplate(logseqDbGraph, logseqMdModel)) // Initialize user settings schema
  if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300) // Show settings UI if not configured yet

  // end initialization



  /**
   * logseq-l10n message sample
   * translations/ja.json
   */
  logseq.UI.showMsg(t("Hello!!"), "success", { timeout: 6000 }) //test
  console.log(t("Hello!!")) // test



  /**
   * Freespace
   */



}/* end_main */
logseq.ready(main).catch(console.error)