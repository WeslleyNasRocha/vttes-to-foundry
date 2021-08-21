import {
    default as ActorImporter
} from "./ActorImporter.js"
import * as moduleLib from './moduleLib.js'

export default class NPCActorImport extends ActorImporter {

    constructor(actor) {
        super(actor)
    }

    async import(content, compendiums) {
        await super.import(content, compendiums)

        var isNPC = (this.getAttribCurrentInt("npc") == 1)
        if (!isNPC) {
            ui.notifications.error('Actor is in incorrect format (expected : NPC)')
        }

        var monsterFeatures = await game.packs.get('dnd5e.monsterfeatures')

        moduleLib.vttLog('Iterating on Features ...')
        var embedFeaturesQueue = []
        var {
            embedQueue: embedFeaturesQueue,
            creationQueue: creationFeaturesQueue
        } = await this.embedMonsterFeatures(monsterFeatures)

        moduleLib.vttLog('Iterating on Actions ...')
        var embedActionsQueue = []
        var {
            embedQueue: embedActionsQueue,
            creationQueue: creationActionQueue
        } = await this.embedFromRepeating([monsterFeatures], 'npcaction', this.updateDamage)

        var allItemsToCreate = [...embedFeaturesQueue, ...embedActionsQueue];

        await this.actor.createEmbeddedDocuments("Item", allItemsToCreate);

        var abilities = this.getAbilities(content)

        var skills = this.getSkills(abilities)

        var typeInfos = this.getAttribCurrent(content, "npc_type")
        var spaceIndex = typeInfos.indexOf(' ')
        var comaIndex = typeInfos.indexOf(',')
        var alignment = typeInfos.substring(comaIndex + 1)
        var size = moduleLib.getSizeCode(typeInfos.substring(0, spaceIndex).toLowerCase())
        var type = typeInfos.substring(spaceIndex, comaIndex)

        this.actor.update({
            name: content.character.name,
            img: content.character.avatar,
            data: {
                skills: skills,
                abilities: abilities,
                details: this.getNPCDetails(alignment, type),
                traits: {
                    size: size,
                    languages: {
                        custom: this.getAttribCurrent("npc_languages")
                    },
                    ci: {
                        custom: this.getAttribCurrent("npc_condition_immunities")
                    },
                    di: {
                        custom: this.getAttribCurrent("npc_immunities")
                    },
                    dr: {
                        custom: this.getAttribCurrent("npc_resistances")
                    },
                    dv: {
                        custom: this.getAttribCurrent("npc_vulnerabilities")
                    }
                }
            }
        })

    }



    async embedMonsterFeatures(monsterFeatures) {
        return await this.embedFromRepeating([monsterFeatures], 'npctrait', this.updateDescription)
    }

    updateDescription(content, currObject) {
        currObject.data.description.value = currObject.data.description.value.replaceAll('{creature}', content.character.name)
    }

    updateDamage(content, currObject, currFeat) {
        currObject.data.description.value = currObject.data.description.value.replaceAll('{creature}', content.character.name)
        if (currFeat.attack_damage) {
            currObject.data.damage.parts = [
                [currFeat.attack_damage.current, currFeat.attack_damagetype.current]
            ]
            currObject.data.attackBonus = parseInt(currFeat.attack_tohit.current)
        }
    }

    async embedFromRepeating(compendiums, repeatingKey, transformAction) {
        var features = this.repeatingFeatures[repeatingKey]
        var featureIds = this.repeatingFeaturesIds[repeatingKey]
        var embedQueue = []
        var creationQueue = []

        if (featureIds) {
            for (let featIndex = 0; featIndex < featureIds.length; featIndex++) {
                const featId = featureIds[featIndex]
                const currFeat = features[featId]
                var found = false

                for (let cpdIdx = 0; cpdIdx < compendiums.length; cpdIdx++) {
                    const compendium = compendiums[cpdIdx];
                    var mfIndex = compendium.index.find(m => m.name.toLowerCase() === currFeat.name.current.toLowerCase())
                    if (mfIndex) {
                        var feature = await compendium.getDocument(mfIndex._id)
                        var currObject = foundry.utils.deepClone(feature.toObject())
                        transformAction(this.content, currObject, currFeat)
                        embedQueue.push(currObject)
                        found = true
                        break
                    }
                }
                if (!found) {
                    moduleLib.vttLog(`EmbedFromRepeating - ${repeatingKey} not found in compendium - Adding it to creation queue`)
                    creationQueue.push(currFeat)
                }
            }
        }

        return {
            embedQueue,
            creationQueue
        }
    }

    getNPCDetails(alignment, type) {

        return {
            biography: {
                value: unescape(this.content.character.bio),
                public: ""
            },
            alignment: alignment,
            race: this.getAttribCurrent("race_display"),
            cr: parseFloat(eval(this.getAttribCurrent("npc_challenge"))),
            type: {
                value: type
            }
        };
    }

    updateItemAsWeapon() {
        return {
            name: "Bite",
            type: "weapon",
            img: "systems/dnd5e/icons/skills/red_29.jpg",
            data: {
                description: {
                    value: "",
                    chat: "",
                    unidentified: ""
                },
                source: "",
                quantity: 1,
                weight: 0,
                price: null,
                attunement: 0,
                equipped: true,
                rarity: "",
                identified: false,
                activation: {
                    type: "action",
                    cost: 1,
                    condition: ""
                },
                duration: {
                    value: null,
                    units: ""
                },
                target: {
                    value: null,
                    width: null,
                    units: "",
                    type: ""
                },
                range: {
                    value: 5,
                    long: 0,
                    units: "ft"
                },
                uses: {
                    value: 0,
                    max: 0,
                    per: null
                },
                consume: {
                    type: "",
                    target: null,
                    amount: null
                },
                ability: "str",
                actionType: "mwak",
                attackBonus: 0,
                chatFlavor: "",
                critical: null,
                damage: {
                    parts: [
                        ["2d10  + @mod", "piercing"]
                    ],
                    versatile: ""
                },
                formula: "",
                save: {
                    ability: "",
                    dc: null,
                    scaling: "spell"
                },
                armor: {
                    value: 10
                },
                hp: {
                    value: 0,
                    max: 0,
                    dt: null,
                    conditions: ""
                },
                weaponType: "natural",
                properties: {},
                proficient: true
            },
            effects: {},
            folder: null,
            sort: 0,
            permission: {
                default: 0
            },
            flags: {}
        }
    }
}