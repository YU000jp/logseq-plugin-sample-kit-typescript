import { PLUGIN_ID, replaceLogseqDbGraph, replaceLogseqMdModel, replaceLogseqVersion } from "."
import { settingsTemplate } from "./settings"

// Guard so that only the latest detection may update the flags (graph changes are async)
let latestCheckId = 0

// Fetch the app version and store it (informational only; never used for graph-type detection).
const fetchAppVersion = async (): Promise<void> => {
    const logseqInfo = (await logseq.App.getInfo("version")) as unknown
    // The version format is like "0.11.0" or "0.11.0-alpha+nightly.20250427".
    const version = typeof logseqInfo === "string" ? logseqInfo : "0.0.0"
    const match = version.match(/(\d+)\.(\d+)\.(\d+)/)
    replaceLogseqVersion(match ? match[0] : version)
}

// Check if the current graph is a DB graph. Returns null when detection fails
// (a rejected call or a non-boolean value, e.g. on 0.10.x hosts where the API does
// not exist — logseq.App is a dynamic proxy, so a typeof guard is useless).
const checkLogseqDbGraph = async (): Promise<boolean | null> => {
    try {
        const value = await logseq.App.checkCurrentIsDbGraph()
        return typeof value === "boolean" ? value : null
    } catch {
        return null
    }
}

// Show a warning message if the graph is a DB graph (only once).
const showDbGraphIncompatibilityMsg = () => {
    if (!logseq.settings!.warningMessageShownDbGraph) {
        logseq.updateSettings({
            warningMessageShownDbGraph: true
        })
        logseq.UI.showMsg(`The ’${PLUGIN_ID}’ plugin does not support Logseq DB graph.`, "warning", { timeout: 5000 })
    }
    return
}

/**
 * Checks whether the current graph is a DB graph or a file-based graph, and handles related state and UI updates.
 * `logseqMdModel` means "the current graph is file-based" (= `!isDbGraph`), not derived from the app version.
 * It is also true on DB-era apps (0.11+/2.x) running a file graph and on Logseq OG 1.x.
 * @returns Promise<boolean[]> - [isDbGraph, isFileGraph]
 */
export const logseqModelCheck = async (): Promise<boolean[]> => {
    await fetchAppVersion() // Save the app version (informational only; not used for graph-type detection)
    const checkId = ++latestCheckId
    const detected = await checkLogseqDbGraph() // Whether the current graph is a DB graph
    // Detection failure = a legacy host without the API, which cannot open DB graphs → file graph
    const isDbGraph = detected ?? false
    if (checkId === latestCheckId) { // Update the flags only if no newer detection has started
        replaceLogseqDbGraph(isDbGraph)
        replaceLogseqMdModel(!isDbGraph)
    }
    // Wait for 100ms
    await new Promise(resolve => setTimeout(resolve, 100))

    // if (isDbGraph === true) {
    //     // Not supported for DB graph
    //     showDbGraphIncompatibilityMsg()
    // }

    logseq.App.onCurrentGraphChanged(async () => { // Callback when the graph changes
        const id = ++latestCheckId
        const isDb = await checkLogseqDbGraph()
        // Keep the previous flags when detection fails, and discard stale results
        if (id !== latestCheckId || isDb === null) return
        replaceLogseqDbGraph(isDb)
        replaceLogseqMdModel(!isDb)
        // if (isDb === true) {
        //     // Not supported for DB graph
        //     showDbGraphIncompatibilityMsg()
        // }
        // Reload settings schema
        logseq.useSettingsSchema(settingsTemplate(isDb, !isDb))
    })
    return [isDbGraph, !isDbGraph] // Return [isDbGraph, isFileGraph]
}
