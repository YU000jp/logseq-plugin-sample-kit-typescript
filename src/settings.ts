import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user' // https://logseq.github.io/plugins/types/SettingSchemaDesc.html
import { consoleText } from '.'


// Object to manage all keys in one place
const settingKeys = {
    heading000: "heading000",
    heading001: "heading001",
    toggle001: "toggle001",
    toggle001True: "toggle001True",
    toggle001TrueSpace: "toggle001TrueSpace",
}


/**
 * Generates a settings schema array for Logseq plugin settings UI, 
 * based on the current graph and model type.
 *
 * @param logseqDbGraph - Indicates if the current graph is a DB-based graph (`true`) or file-based (`false`).
 * @param logseqMdModel - Indicates if the current model is file-based (`true`) or DB model (`false`).
 * @returns An array of `SettingSchemaDesc` objects representing the settings schema for the plugin.
 *
 * The function determines the settings schema to return based on the combination of `logseqDbGraph` and `logseqMdModel`:
 * - If `logseqMdModel` is `true`, returns settings for the file-based model.
 * - If `logseqMdModel` is `false` and `logseqDbGraph` is `false`, returns settings for a file-based graph in DB model.
 * - If `logseqMdModel` is `false` and `logseqDbGraph` is `true`, returns settings for a DB graph.
 * 
 * In each case, a heading and common settings are included, and additional settings are conditionally added
 * if the `toggle001` setting is enabled.
 * 
 * Also displays a message in the Logseq UI and logs the detected model/graph type to the console.
 */
export const settingsTemplate = (logseqDbGraph: boolean, logseqMdModel: boolean): SettingSchemaDesc[] => {
    if (logseqMdModel === true) {
        // file-based model specific initialization
        console.log(consoleText + "File-based model detected.")
        logseq.UI.showMsg(consoleText + "file-based model", "info", { timeout: 6000 })
        return [
            {
                key: settingKeys.heading000,
                type: "heading",
                title: "File-based Model Settings",
                default: "",
                description: "Settings for File-based Model.",
            },
            ...commonSettings(),
            ...(logseq.settings!["toggle001"] as boolean ? toggle001True() : []), // Add new item only when Toggle 1 is true
        ]
    } else // DB model
        if (logseqDbGraph === false) {
            // file-based graph specific initialization
            console.log(consoleText + "File-based graph detected. (DB model)")
            logseq.UI.showMsg(consoleText + "fileBased graph + DB model", "info", { timeout: 6000 })
            return [
                {
                    key: settingKeys.heading000,
                    type: "heading",
                    title: "File-based Graph Settings (DB Model)",
                    default: "",
                    description: "Settings for File-based Graph in DB Model.",
                },
                ...commonSettings(),
                ...(logseq.settings!["toggle001"] as boolean ? toggle001True() : []), // Add new item only when Toggle 1 is true
            ]
        } else
            if (logseqDbGraph === true) {
                // DB graph specific initialization
                console.log(consoleText + "DB graph detected.")
                logseq.UI.showMsg(consoleText + "DB graph + DB model", "info", { timeout: 6000 })
                return [
                    {
                        key: settingKeys.heading000,
                        type: "heading",
                        title: "File-based Graph Settings (DB Model)",
                        default: "",
                        description: "Settings for DB graph.",
                    },
                    ...commonSettings(),
                    ...(logseq.settings!["toggle001"] as boolean ? toggle001True() : []), // Add new item only when Toggle 1 is true
                ]
            }
    return [] // Default empty array if no conditions match
}

/**
 * Returns an array of setting schema descriptions for the plugin.
 *
 * The settings include:
 * - A heading section labeled "no settings".
 * - A boolean toggle example with a default value of `true`.
 *
 * @returns {SettingSchemaDesc[]} An array of setting schema descriptions for configuring the plugin.
 */
const commonSettings = (): SettingSchemaDesc[] => [
    {
        key: settingKeys.heading001,
        type: "heading",
        title: "no settings",
        default: "",
        description: "",
    },
    {
        key: settingKeys.toggle001,
        type: "boolean",
        title: "Toggle Example",
        default: true,
        description: "This is an example of a toggle setting.",
    },
]


/**
 * Returns a setting schema array containing a single boolean toggle.
 *
 * @remarks
 * This function defines a setting schema for a boolean toggle named "toggle001True".
 * The setting is titled "Toggle 1 is True" and is intended to be visible only when Toggle 1 is true.
 *
 * @returns {SettingSchemaDesc[]} An array with one setting schema descriptor for the toggle.
 */
const toggle001True = (): SettingSchemaDesc[] => [
    {
        key: settingKeys.toggle001True,
        type: "boolean",
        title: "Toggle 1 is True",
        default: false,
        description: "This setting is only visible when Toggle 1 is true.",
    },
    {
        key: settingKeys.toggle001TrueSpace,
        type: "string",
        title: "space",
        default: "",
        description: "description here",
        inputAs: "textarea",
    }
]
