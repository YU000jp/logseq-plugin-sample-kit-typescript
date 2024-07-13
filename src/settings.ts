import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate = (): SettingSchemaDesc[] => [
    {
        key: "heading001",
        type: "heading",
        title: "heading title",
        default: "",
        description: "description here",
    },
    {
        key: "functionA",
        type: "boolean",
        title: "function A",
        default: true,
        description: "description here",
    },
    {
        key: "space",
        type: "string",
        title: "space",
        default: "",
        description: "description here",
        inputAs: "textarea",
    }
]
