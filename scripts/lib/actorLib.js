const numberRegex = /\d+/g;

import {
    vttLog,
    getSizeCode
} from './moduleLib.js'
import NPCActorImport from './NPCActor.js';
import PCActorImport from './PCActor.js';


const importToActor = async function importToActor(content, actor, compendiums = []) {
    var vttesComp = game.packs.get('world.vttes-items')
    if (!vttesComp) {
        vttesComp = await CompendiumCollection.createCompendium({
            "name": "vttes-items",
            "label": "vttes-items",
            "path": "packs/from-vttes.db",
            "private": false,
            "entity": "Item",
            "system": "dnd5e",
            "package": "world"
        })
    }

    ui.notifications.info(`Importing ...`)

    var isNPC = (getAttribCurrentInt(content, "npc") == 1)

    if (isNPC) {
        const imp = new NPCActorImport(actor)
        await imp.import(content, compendiums)
    } else {
        const imp = new PCActorImport(actor)
        await imp.import(content, compendiums)
    }

    ui.notifications.info(`Import successfull actor ${actor.name} is playable`)

}

// async function updateActorSheet(content, actor, darkvision, abilities, mainClass) {
//     var details = getPCDetails(content, mainClass)

//     var skills = getSkills(content, abilities)
//     var tools = getToolProficiencies(content)

//     var proficiencies = getGlobalProficiencies(content)

//     await actor.update({
//         name: content.character.name,
//         img: content.character.avatar,
//         data: {
//             details: details,
//             abilities: abilities,
//             attributes: {
//                 ac: {
//                     value: getAttribCurrentInt(content, "ac")
//                 },
//                 hp: getHp(content),
//                 init: {
//                     mod: getAttribCurrentInt(content, "initiative_bonus"),
//                 },
//                 movement: {
//                     burrow: 0,
//                     climb: 0,
//                     fly: 0,
//                     swim: 0,
//                     walk: getAttribCurrentInt(content, "speed"),
//                     units: "ft",
//                     hover: false
//                 },
//                 senses: {
//                     darkvision: darkvision,
//                     blindsight: 0,
//                     tremorsense: 0,
//                     truesight: 0,
//                     units: "ft",
//                     special: ""
//                 },
//                 spellcasting: getSpellcastingAbility(content),
//                 exhaustion: 0,
//                 hd: 0,
//                 prof: 1,
//                 encumbrance: {
//                     value: 0,
//                     max: 120,
//                     pct: 0,
//                     encumbered: false
//                 },
//             },
//             currency: {
//                 pp: getAttribCurrentInt(content, 'pp'),
//                 gp: getAttribCurrentInt(content, 'gp'),
//                 ep: getAttribCurrentInt(content, 'ep'),
//                 sp: getAttribCurrentInt(content, 'sp'),
//                 cp: getAttribCurrentInt(content, 'cp')
//             },
//             skills: skills,
//             traits: {
//                 size: "med",
//                 di: {
//                     value: [],
//                     custom: ""
//                 },
//                 dr: {
//                     value: [],
//                     custom: ""
//                 },
//                 dv: {
//                     value: [],
//                     custom: ""
//                 },
//                 ci: {
//                     value: [],
//                     custom: ""
//                 },
//                 languages: {
//                     value: [],
//                     custom: getProficiencyAsCustom(content, proficiencies, "LANGUAGE")
//                 },
//                 weaponProf: {
//                     value: [],
//                     custom: getProficiencyAsCustom(content, proficiencies, "WEAPON")
//                 },
//                 armorProf: {
//                     value: [],
//                     custom: getProficiencyAsCustom(content, proficiencies, "ARMOR")
//                 },
//                 toolProf: {
//                     value: [],
//                     custom: tools.join(';')
//                 }
//             }
//         }
//     });
//     return darkvision;
// }

// async function manageCompendium(content, compediumEntryType, entrySuffix, nameSuffix) {
//     var itemsCompendium = game.packs.filter(p => p.index.some(i => i.type === compediumEntryType));
//     var compendiumEntries = []
//     var notFoundEntries = []

//     var items = getAttributesBySuffix(content, entrySuffix)
//     for (let index = 0; index < items.length; index++) {
//         var found = false

//         const item = items[index];
//         const key = getAttributeKey(item, entrySuffix)
//         const itemName = getAttribCurrent(content, key + nameSuffix);

//         for (let compIndex = 0; compIndex < itemsCompendium.length; compIndex++) {
//             const compendium = itemsCompendium[compIndex];
//             const itemFromComp = compendium.index.find(c => c.name.toLowerCase() === itemName.toLowerCase())
//             if (itemFromComp != null) {
//                 found = true
//                 const compItem = await compendium.getDocument(itemFromComp._id, true)
//                 var currObject = foundry.utils.deepClone(compItem.toObject())
//                 compendiumEntries.push(currObject)
//                 break
//             }
//         }
//         if (!found) {
//             notFoundEntries.push(key)
//         }
//     }

//     return {
//         compendiumEntries,
//         notFoundEntries
//     }
// }

// async function getAndPrepareSpells(content, actor) {
//     var {
//         compendiumEntries,
//         notFoundEntries
//     } = await manageCompendium(content, 'spell', '_spellname', '_spellname')

//     if (notFoundEntries.length > 0) {
//         vttLog(notFoundEntries.length + ' spells were not found in compendiums')
//         vttLog(notFoundEntries)
//     }

//     return compendiumEntries
// }

// async function getAndPrepareItems(content, actor) {
//     var {
//         compendiumEntries,
//         notFoundEntries
//     } = await manageCompendium(content, 'equipment', '_itemname', '_itemname')

//     if (notFoundEntries.length > 0) {
//         vttLog(notFoundEntries.length + ' items were not found in compendiums')

//         for (let index = 0; index < notFoundEntries.length; index++) {
//             const notFoundItemKey = notFoundEntries[index];
//             vttLog(notFoundItemKey)

//             var itemInfos = getAttribsStartsWith(content, notFoundItemKey)
//             console.log(itemInfos)
//         }

//         // vttLog(notFoundEntries)
//     }

//     return compendiumEntries
// }


// async function getAndPrepareFeatures(content, actor) {
//     var {
//         compendiumEntries,
//         notFoundEntries
//     } = await manageCompendium(content, 'feat', '_source', '_name')

//     if (notFoundEntries.length > 0) {
//         vttLog(notFoundEntries.length + ' features were not found in compendiums')
//         vttLog(notFoundEntries)
//     }

//     for (let index = 0; index < notFoundEntries.length; index++) {
//         const key = notFoundEntries[index];
//         var attribs = getAttribsStartsWith(content, key);
//         var desc = getAttribCurrent(content, key + '_description');
//         var featName = getAttribCurrent(content, key + '_name')
//         var require = attribs.find(a => a.name === key + '_source_type') ? getAttribCurrent(content, key + '_source_type') : getAttribCurrent(content, key + '_source');

//         var newFeat = {
//             name: featName,
//             type: 'feat',
//             data: {
//                 description: {
//                     value: desc
//                 },
//                 requirements: require
//             }
//         };

//         actor.createEmbeddedDocuments('Item', [newFeat])
//     }
//     return compendiumEntries;
// }

// function getDarkvision(actorFeats) {
//     var darkvisionEntry = actorFeats.find(a => a.name.toLowerCase() === 'darkvision');

//     if (darkvisionEntry) {
//         var darkVisionDesc = darkvisionEntry.data.description.value
//         var regexOutput = numberRegex.exec(darkVisionDesc);
//         if (regexOutput && regexOutput.length > 0) {
//             return parseInt(regexOutput[0])
//         }
//     }

//     return 0
// }

// function getToolProficiencies(content) {
//     return getAttributesBySuffix(content, "_toolname").reduce((acc, curr) => {
//         acc.push(curr.current);
//         return acc;
//     }, []);
// }

// function getOrderedAttributesBySuffix(content, suffix) {
//     return getAttributesBySuffix(content, suffix).reduce((acc, curr) => {
//         var key = curr.current;
//         var value = getAttributeKey(curr, suffix);
//         if (!acc[key]) {
//             acc[key] = [];
//         }
//         acc[key].push(value);
//         return acc;
//     }, {});
// }

// function getGlobalProficiencies(content) {
//     return getOrderedAttributesBySuffix(content, '_prof_type')
// }

// function getAttributesBySuffix(content, suffix) {
//     return content.character.attribs.filter(a => a.name.endsWith(suffix));
// }

// function getAttributeKey(entry, suffix) {
//     return entry.name.substring(0, entry.name.length - suffix.length);
// }

// function getProficiencyAsCustom(content, proficiencies, profKey) {
//     var keys = proficiencies[profKey]
//     if (!keys) {
//         return []
//     }
//     var values = keys.reduce((arr, curr) => {
//         var profName = getAttribCurrent(content, curr + "_name").toLowerCase()
//         arr.push(profName)
//         return arr
//     }, [])
//     return values.join(';')
// }

// function getProficiency(profKey, keyMap, profMap) {
//     var keys = proficiencies[profKey]

//     return keys.reduce((arr, curr) => {
//         var profNameKey = getAttribCurrent(content, curr + "_name").toLowerCase().replace(profKey.toLowerCase(), '').trim()
//         if (keyMap[profNameKey]) {
//             profNameKey = keyMap[profNameKey]
//         }
//         var profName = profMap[profNameKey]

//         arr.push(profName)
//         return arr
//     }, [])
// }

// async function setActorMainClass(content, actor) {
//     var className = getAttribCurrent(content, "class")
//     var subClassName = getAttribCurrent(content, "subclass")
//     var classLevel = getAttribCurrentInt(content, "level")

//     await setClass(className, subClassName, classLevel, actor)
// }

// async function setClass(className, subClassName, classLevel, actor) {
//     var baseClass = null

//     var classCompendium = game.packs.filter(p => p.index.some(i => i.type === "class"));
//     for (let compIndex = 0; compIndex < classCompendium.length; compIndex++) {
//         const compendium = classCompendium[compIndex];
//         const classesFromComp = compendium.index.filter(c => c.name.toLowerCase() === className.toLowerCase())
//         vttLog('Found classes : ' + classesFromComp.length)
//         if (classesFromComp.length > 0) {
//             for (let index = 0; index < classesFromComp.length; index++) {
//                 const classFromComp = classesFromComp[index];
//                 const compendiumClass = await compendium.getDocument(classFromComp._id)

//                 vttLog('Class : ' + compendiumClass.name + ' SubClass : ' + compendiumClass.data.subclass)

//                 if (compendiumClass.data.subclass === subClassName) {
//                     vttLog('Found Subclass')
//                     baseClass = compendiumClass
//                     break
//                 }
//                 if (!compendiumClass.data.subclass || compendiumClass.data.subclass === '') {
//                     vttLog('Found base class')
//                     baseClass = compendiumClass
//                 }
//             }
//         }
//     }

//     var newClass = getOverridenClassData(baseClass, subClassName, classLevel)
//     await actor.createEmbeddedDocuments('Item', [newClass])
// }

// function getOverridenClassData(sourceClass, subClassName, level = 1) {
//     var clonedClass = {
//         name: sourceClass.name,
//         type: "class",
//         img: sourceClass.img,
//         data: sourceClass.data.data
//     }
//     clonedClass.data.levels = level
//     clonedClass.data.subclass = subClassName
//     return clonedClass;
// }

// function getSkills(content, abilities) {
//     var level = getAttribCurrentInt(content, "level")
//     var proficiencyModifier = getCalculatedProficiency(level)

//     return {
//         acr: getSkill(content, abilities, "acrobatics", "dex", proficiencyModifier),
//         ani: getSkill(content, abilities, "animal_handling", "wis", proficiencyModifier),
//         arc: getSkill(content, abilities, "arcana", "int", proficiencyModifier),
//         ath: getSkill(content, abilities, "athletics", "str", proficiencyModifier),
//         dec: getSkill(content, abilities, "deception", "cha", proficiencyModifier),
//         his: getSkill(content, abilities, "history", "int", proficiencyModifier),
//         ins: getSkill(content, abilities, "insight", "wis", proficiencyModifier),
//         itm: getSkill(content, abilities, "intimidation", "cha", proficiencyModifier),
//         inv: getSkill(content, abilities, "investigation", "int", proficiencyModifier),
//         med: getSkill(content, abilities, "medicine", "wis", proficiencyModifier),
//         nat: getSkill(content, abilities, "nature", "int", proficiencyModifier),
//         prc: getSkill(content, abilities, "perception", "wis", proficiencyModifier),
//         prf: getSkill(content, abilities, "performance", "cha", proficiencyModifier),
//         per: getSkill(content, abilities, "persuasion", "cha", proficiencyModifier),
//         rel: getSkill(content, abilities, "religion", "int", proficiencyModifier),
//         slt: getSkill(content, abilities, "sleight_of_hand", "dex", proficiencyModifier),
//         ste: getSkill(content, abilities, "stealth", "dex", proficiencyModifier),
//         sur: getSkill(content, abilities, "survival", "wis", proficiencyModifier)
//     };
// }

// function getCalculatedProficiency(level) {
//     return Math.floor((level + 7) / 4);
// }

// function getSkill(content, abilities, skillName, abilityShort, proficiency) {

//     var isProficent = getAttribCurrent(content, skillName + "_prof").length > 0
//     var skillMod = getAttribCurrentInt(content, skillName + "_bonus")
//     var proficiencyType = 0
//     var abilityMod = abilities[abilityShort].mod

//     if (isProficent) {
//         proficiencyType = (skillMod - abilityMod) / proficiency
//     }

//     var profValue = (isProficent ? proficiency : 0) * proficiencyType
//     var passive = 10 + skillMod

//     return {
//         ability: abilityShort,
//         bonus: 0,
//         mod: abilityMod,
//         passive: passive,
//         prof: profValue,
//         value: proficiencyType,
//         total: skillMod
//     };
// }

// function getSpellcastingAbility(content) {
//     var key = "spellcasting_ability"

//     var abilityName = getAttribCurrent(content, key)
//     if (abilityName.length <= 2) {
//         return ""
//     }

//     return abilityName.substring(2, abilityName.length - 6).substring(0, 3);
// }

// function getHp(content) {
//     var hpAttrib = getAttrib(content, "hp")
//     return {
//         value: hpAttrib.current,
//         max: hpAttrib.max
//     };
// }

// function getAbilities(content) {
//     return {
//         str: getAbility(content, 'strength'),
//         dex: getAbility(content, 'dexterity'),
//         con: getAbility(content, 'constitution'),
//         int: getAbility(content, 'intelligence'),
//         wis: getAbility(content, 'wisdom'),
//         cha: getAbility(content, 'charisma')
//     };
// }

// function getNPCDetails(content, alignment, type) {

//     return {
//         biography: {
//             value: unescape(content.character.bio),
//             public: ""
//         },
//         alignment: alignment,
//         race: getAttribCurrent(content, "race_display"),
//         cr: parseFloat(eval(getAttribCurrent(content, "npc_challenge"))),
//         type: {
//             value: type
//         }
//     };
// }

// function getPCDetails(content, mainClass) {
//     return {
//         biography: {
//             value: unescape(content.character.bio),
//             public: ""
//         },
//         alignment: getAttribCurrent(content, "alignment"),
//         race: getAttribCurrent(content, "race_display"),
//         background: getAttribCurrent(content, "background"),
//         originalClass: mainClass._id,
//         xp: {
//             value: getAttribCurrentInt(content, "experience")
//         },
//         appearance: "",
//         trait: getAttribCurrent(content, "personality_traits"),
//         ideal: getAttribCurrent(content, "ideals"),
//         bond: getAttribCurrent(content, "bonds"),
//         flaw: getAttribCurrent(content, "flaws"),
//         age: getAttribCurrent(content, "age"),
//         height: getAttribCurrent(content, "height"),
//         weight: getAttribCurrent(content, "weight"),
//         eyes: getAttribCurrent(content, "eyes"),
//         skin: getAttribCurrent(content, "skin"),
//         hair: getAttribCurrent(content, "hair"),
//         level: getAttribCurrentInt(content, "level")
//     };
// }

// function getAbility(content, ability) {
//     return {
//         value: getAttribCurrentInt(content, ability),
//         proficient: getAttribCurrent(content, ability + '_save_prof') == 0 ? 0 : 1,
//         mod: getAttribCurrentInt(content, ability + '_mod'),
//         prof: getAttribCurrentInt(content, ability + '_save_prof'),
//         saveBonus: getAttribCurrentInt(content, ability + '_save_bonus'),
//         checkBonus: getAttribCurrentInt(content, ability + '_bonus')
//     };
// }

function getAttribCurrent(content, key, defaultValue = '') {
    var property = getAttrib(content, key)

    if (!property) {
        return defaultValue
    }

    return property.current
}

function getAttribCurrentInt(content, key, defaultValue = 0) {
    var attrib = getAttribCurrent(content, key)
    if (attrib === '') {
        return defaultValue
    }
    return parseInt(getAttribCurrent(content, key))
}

function getAttrib(content, key) {
    return content.character.attribs.find(att => att.name === key)
}

// function getAttribsStartsWith(content, key) {
//     return content.character.attribs.filter(att => att.name.startsWith(key))
// }



export {
    importToActor
}