"use strict"
CONFIG.debug.hooks = false
const numberRegex = /\d+/g;

const LOG_PREFIX = 'VTTES2FVTT'

Hooks.once('init', async function () {

});

Hooks.once('ready', async function () {

});

Hooks.on('renderActorSheet5e', async (app, html, data) => {
    const actionsTabButton = $('<a class="file-picker" data-tab="quick-actions" data-actorid="' + data.actor._id + '"> VTTES Import </a>');
    const closeButton = html.find('.close')
    actionsTabButton.insertBefore(closeButton)

    actionsTabButton.on('click', showFilePicker)
});

function _vttLog(message) {
    console.log(`${LOG_PREFIX} - ${message}`)
}

function _vttError(message) {
    console.error(`${LOG_PREFIX} - ${message}`)
}

function readFile(control) {
    console.log("Importing ...")

    var importer = control.find('.json-import')[0]

    var actor = game.actors.get(importer.dataset.actorid)
    var f = importer['files'][0]

    var fReader = new FileReader();
    fReader.readAsText(f);

    fReader.onload = function () {
        var content = JSON.parse(fReader.result)
        _importToActor(content, actor)
    }
    fReader.onerror = function () {
        _vttError(fReader.error)
    }
}

async function _importToActor(content, actor) {
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

    var abilities = getAbilities()
    var details = getDetails()
    var proficiencyModifier = getCalculatedProficiency(details.level)

    var proficiencies = getGlobalProficiencies()
    var tools = getToolProficiencies()

    var features = await getAndPrepareFeatures(vttesComp)
    var items = await getAndPrepareItems(vttesComp)
    var spells = await getAndPrepareSpells(vttesComp)

    await setActorMainClass(actor)

    var multiClasses = getAttribsStartsWith('multiclass')
    if (multiClasses.length > 0) {
        var activeMultClasses = multiClasses.filter(sc => sc.name.endsWith('_flag') && sc.current === '1')

        for (let index = 0; index < activeMultClasses.length; index++) {
            const multClass = activeMultClasses[index];
            var key = multClass.name.substring(0, multClass.name.indexOf('_'))

            var level = getAttribCurrentInt(key + '_lvl')
            var multClassName = getAttribCurrent(key)
            var multClassSubName = getAttribCurrent(key + '_subclass')

            await setClass(multClassName, multClassSubName, level, actor)
        }
    }

    var darkvision = getDarkvision(features);
    await updateActorSheet(darkvision);

    var allItemsToCreate = [...items, ...features, ...spells]

    var itemsPromises = actor.createEmbeddedDocuments("Item", allItemsToCreate)
    itemsPromises.then((value) => {
        _vttLog('Items created : ' + value.length)
    })

    if (content.character.defaulttoken && content.character.defaulttoken != '') {
        var tokenInfos = JSON.parse(content.character.defaulttoken)
        var actorToken = actor.data.token
        await actorToken.update({
            name: tokenInfos.name,
            vision: true,
            dimSight: tokenInfos.night_vision_distance ?? darkvision,
            img: tokenInfos.imgsrc,
            displayName: tokenInfos.showname ? CONST.TOKEN_DISPLAY_MODES.ALWAYS : CONST.TOKEN_DISPLAY_MODES.NONE
        })
    }

    async function updateActorSheet(darkvision) {

        await actor.update({
            name: content.character.name,
            img: content.character.avatar,
            data: {
                details: details,
                abilities: abilities,
                attributes: {
                    ac: {
                        value: getAttribCurrentInt("ac")
                    },
                    hp: getHp(),
                    init: {
                        mod: getAttribCurrentInt("initiative_bonus"),
                    },
                    movement: {
                        burrow: 0,
                        climb: 0,
                        fly: 0,
                        swim: 0,
                        walk: getAttribCurrentInt("speed"),
                        units: "ft",
                        hover: false
                    },
                    senses: {
                        darkvision: darkvision,
                        blindsight: 0,
                        tremorsense: 0,
                        truesight: 0,
                        units: "ft",
                        special: ""
                    },
                    spellcasting: getSpellcastingAbility(),
                    exhaustion: 0,
                    hd: 0,
                    prof: 1,
                    encumbrance: {
                        value: 0,
                        max: 120,
                        pct: 0,
                        encumbered: false
                    },
                },
                currency: {
                    pp: getAttribCurrentInt('pp'),
                    gp: getAttribCurrentInt('gp'),
                    ep: getAttribCurrentInt('ep'),
                    sp: getAttribCurrentInt('sp'),
                    cp: getAttribCurrentInt('cp')
                },
                skills: getSkills(),
                traits: {
                    size: "med",
                    di: {
                        value: [],
                        custom: ""
                    },
                    dr: {
                        value: [],
                        custom: ""
                    },
                    dv: {
                        value: [],
                        custom: ""
                    },
                    ci: {
                        value: [],
                        custom: ""
                    },
                    languages: {
                        value: [],
                        custom: getProficiencyAsCustom("LANGUAGE")
                    },
                    weaponProf: {
                        value: [],
                        custom: getProficiencyAsCustom("WEAPON")
                    },
                    armorProf: {
                        value: [],
                        custom: getProficiencyAsCustom("ARMOR")
                    },
                    toolProf: {
                        value: [],
                        custom: tools.join(';')
                    }
                }
            }
        });
        return darkvision;
    }

    async function manageCompendium(compediumEntryType, entrySuffix, nameSuffix) {
        var itemsCompendium = game.packs.filter(p => p.index.some(i => i.type === compediumEntryType));
        var compendiumEntries = []
        var notFoundEntries = []

        var items = getAttributesBySuffix(entrySuffix)
        for (let index = 0; index < items.length; index++) {
            var found = false

            const item = items[index];
            const key = getAttributeKey(item, entrySuffix)
            const itemName = getAttribCurrent(key + nameSuffix);

            for (let compIndex = 0; compIndex < itemsCompendium.length; compIndex++) {
                const compendium = itemsCompendium[compIndex];
                const itemFromComp = compendium.index.find(c => c.name.toLowerCase() === itemName.toLowerCase())
                if (itemFromComp != null) {
                    found = true
                    const compItem = await compendium.getDocument(itemFromComp._id, true)
                    var currObject = foundry.utils.deepClone(compItem.toObject())
                    compendiumEntries.push(currObject)
                    break
                }
            }
            if (!found) {
                notFoundEntries.push(key)
            }
        }

        return {
            compendiumEntries,
            notFoundEntries
        }
    }

    async function getAndPrepareSpells() {
        var {
            compendiumEntries,
            notFoundEntries
        } = await manageCompendium('spell', '_spellname', '_spellname')

        if (notFoundEntries.length > 0) {
            _vttLog(notFoundEntries.length + ' spells were not found in compendiums')
            _vttLog(notFoundEntries)
        }

        return compendiumEntries
    }

    async function getAndPrepareItems() {
        var {
            compendiumEntries,
            notFoundEntries
        } = await manageCompendium('equipment', '_itemname', '_itemname')

        if (notFoundEntries.length > 0) {
            _vttLog(notFoundEntries.length + ' items were not found in compendiums')
            _vttLog(notFoundEntries)
        }

        return compendiumEntries
    }


    async function getAndPrepareFeatures(vttesComp) {
        var {
            compendiumEntries,
            notFoundEntries
        } = await manageCompendium('feat', '_source', '_name')

        if (notFoundEntries.length > 0) {
            _vttLog(notFoundEntries.length + ' features were not found in compendiums')
            _vttLog(notFoundEntries)
        }

        for (let index = 0; index < notFoundEntries.length; index++) {
            const key = notFoundEntries[index];
            var attribs = getAttribsStartsWith(key);
            var desc = getAttribCurrent(key + '_description');
            var featName = getAttribCurrent(key + '_name')
            var require = attribs.find(a => a.name === key + '_source_type') ? getAttribCurrent(key + '_source_type') : getAttribCurrent(key + '_source');

            var newFeat = {
                name: featName,
                type: 'feat',
                data: {
                    description: {
                        value: desc
                    },
                    requirements: require
                }
            };

            actor.createEmbeddedDocuments('Item', [newFeat])
        }
        return compendiumEntries;
    }

    function getDarkvision(actorFeats) {
        var darkvisionEntry = actorFeats.find(a => a.name.toLowerCase() === 'darkvision');

        if (darkvisionEntry) {
            var darkVisionDesc = darkvisionEntry.data.description.value
            var regexOutput = numberRegex.exec(darkVisionDesc);
            if (regexOutput && regexOutput.length > 0) {
                return parseInt(regexOutput[0])
            }
        }

        return 0
    }

    function getToolProficiencies() {
        return getAttributesBySuffix("_toolname").reduce((acc, curr) => {
            acc.push(curr.current);
            return acc;
        }, []);
    }

    function getOrderedAttributesBySuffix(suffix) {
        return getAttributesBySuffix(suffix).reduce((acc, curr) => {
            var key = curr.current;
            var value = getAttributeKey(curr, suffix);
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(value);
            return acc;
        }, {});
    }

    function getGlobalProficiencies() {
        return getOrderedAttributesBySuffix('_prof_type')
    }

    function getAttributesBySuffix(suffix) {
        return content.character.attribs.filter(a => a.name.endsWith(suffix));
    }

    function getAttributeKey(entry, suffix) {
        return entry.name.substring(0, entry.name.length - suffix.length);
    }

    function getProficiencyAsCustom(profKey) {
        var keys = proficiencies[profKey]
        var values = keys.reduce((arr, curr) => {
            var profName = getAttribCurrent(curr + "_name").toLowerCase()
            arr.push(profName)
            return arr
        }, [])
        return values.join(';')
    }

    function getProficiency(profKey, keyMap, profMap) {
        var keys = proficiencies[profKey]

        return keys.reduce((arr, curr) => {
            var profNameKey = getAttribCurrent(curr + "_name").toLowerCase().replace(profKey.toLowerCase(), '').trim()
            if (keyMap[profNameKey]) {
                profNameKey = keyMap[profNameKey]
            }
            var profName = profMap[profNameKey]

            arr.push(profName)
            return arr
        }, [])
    }

    async function setActorMainClass(actor) {
        var className = getAttribCurrent("class")
        var subClassName = getAttribCurrent("subclass")
        var classLevel = getAttribCurrentInt("level")

        await setClass(className, subClassName, classLevel, actor)
    }

    async function setClass(className, subClassName, classLevel, actor) {
        var baseClass = null

        var classCompendium = game.packs.filter(p => p.index.some(i => i.type === "class"));
        for (let compIndex = 0; compIndex < classCompendium.length; compIndex++) {
            const compendium = classCompendium[compIndex];
            const classesFromComp = compendium.index.filter(c => c.name.toLowerCase() === className.toLowerCase())
            _vttLog('Found classes : ' + classesFromComp.length)
            if (classesFromComp.length > 0) {
                for (let index = 0; index < classesFromComp.length; index++) {
                    const classFromComp = classesFromComp[index];
                    const compendiumClass = await compendium.getDocument(classFromComp._id)

                    _vttLog('Class : ' + compendiumClass.name + ' SubClass : ' + compendiumClass.data.subclass)

                    if (compendiumClass.data.subclass === subClassName) {
                        _vttLog('Found Subclass')
                        baseClass = compendiumClass
                        break
                    }
                    if (!compendiumClass.data.subclass || compendiumClass.data.subclass === '') {
                        _vttLog('Found base class')
                        baseClass = compendiumClass
                    }
                }
            }
        }

        var newClass = getOverridenClassData(baseClass, subClassName, classLevel)
        await actor.createEmbeddedDocuments('Item', [newClass])
    }

    function getOverridenClassData(sourceClass, subClassName, level = 1) {
        var clonedClass = {
            name: sourceClass.name,
            type: "class",
            img: sourceClass.img,
            data: sourceClass.data.data
        }
        clonedClass.data.levels = level
        clonedClass.data.subclass = subClassName
        return clonedClass;
    }

    function getSkills() {
        return {
            acr: getSkill("acrobatics", "dex", proficiencyModifier),
            ani: getSkill("animal_handling", "wis", proficiencyModifier),
            arc: getSkill("arcana", "int", proficiencyModifier),
            ath: getSkill("athletics", "str", proficiencyModifier),
            dec: getSkill("deception", "cha", proficiencyModifier),
            his: getSkill("history", "int", proficiencyModifier),
            ins: getSkill("insight", "wis", proficiencyModifier),
            itm: getSkill("intimidation", "cha", proficiencyModifier),
            inv: getSkill("investigation", "int", proficiencyModifier),
            med: getSkill("medicine", "wis", proficiencyModifier),
            nat: getSkill("nature", "int", proficiencyModifier),
            prc: getSkill("perception", "wis", proficiencyModifier),
            prf: getSkill("performance", "int", proficiencyModifier),
            per: getSkill("persuasion", "cha", proficiencyModifier),
            rel: getSkill("religion", "int", proficiencyModifier),
            slt: getSkill("sleight_of_hand", "dex", proficiencyModifier),
            ste: getSkill("stealth", "dex", proficiencyModifier),
            sur: getSkill("survival", "wis", proficiencyModifier)
        };
    }

    function getCalculatedProficiency(level) {
        return Math.floor((level + 7) / 4);
    }

    function getSkill(skillName, abilityShort, proficiency) {

        var isProficent = getAttribCurrent(skillName + "_prof").length > 0
        var skillMod = getAttribCurrentInt(skillName + "_bonus")
        var proficiencyType = 0
        var abilityMod = abilities[abilityShort].mod

        if (isProficent) {
            proficiencyType = (skillMod - abilityMod) / proficiency
        }

        var profValue = (isProficent ? proficiency : 0) * proficiencyType
        var passive = 10 + skillMod

        return {
            ability: abilityShort,
            bonus: 0,
            mod: abilityMod,
            passive: passive,
            prof: profValue,
            value: proficiencyType,
            total: skillMod
        };
    }

    function getSpellcastingAbility() {
        var key = "spellcasting_ability"

        var abilityName = getAttribCurrent(key)
        if (abilityName.length <= 2) {
            return ""
        }

        return abilityName.substring(2, abilityName.length - 6).substring(0, 3);
    }

    function getHp() {
        var hpAttrib = getAttrib("hp")
        return {
            value: hpAttrib.current,
            max: hpAttrib.max
        };
    }

    function getAbilities() {
        return {
            str: getAbility('strength'),
            dex: getAbility('dexterity'),
            con: getAbility('constitution'),
            int: getAbility('intelligence'),
            wis: getAbility('wisdom'),
            cha: getAbility('charisma')
        };
    }

    function getDetails() {
        return {
            biography: {
                value: unescape(content.character.bio),
                public: ""
            },
            alignment: getAttribCurrent("alignment"),
            race: getAttribCurrent("race_display"),
            background: getAttribCurrent("background"),
            originalClass: getAttribCurrent("class"),
            xp: {
                value: getAttribCurrentInt("experience")
            },
            appearance: "",
            trait: getAttribCurrent("personality_traits"),
            ideal: getAttribCurrent("ideals"),
            bond: getAttribCurrent("bonds"),
            flaw: getAttribCurrent("flaws"),
            age: getAttribCurrent("age"),
            height: getAttribCurrent("height"),
            weight: getAttribCurrent("weight"),
            eyes: getAttribCurrent("eyes"),
            skin: getAttribCurrent("skin"),
            hair: getAttribCurrent("hair"),
            level: getAttribCurrentInt("level")
        };
    }

    function getAbility(ability) {
        return {
            value: getAttribCurrentInt(ability),
            proficient: getAttribCurrent(ability + '_save_prof') == 0 ? 0 : 1,
            mod: getAttribCurrentInt(ability + '_mod'),
            prof: getAttribCurrentInt(ability + '_save_prof'),
            saveBonus: getAttribCurrentInt(ability + '_save_bonus'),
            checkBonus: getAttribCurrentInt(ability + '_bonus')
        };
    }

    function getAttribCurrent(key, defaultValue = '') {
        var property = getAttrib(key)

        if (!property) {
            return defaultValue
        }

        return property.current
    }

    function getAttribCurrentInt(key, defaultValue = 0) {
        var attrib = getAttribCurrent(key)
        if (attrib === '') {
            return defaultValue
        }
        return parseInt(getAttribCurrent(key))
    }

    function getAttrib(key) {
        return content.character.attribs.find(att => att.name === key)
    }

    function getAttribsStartsWith(key) {
        return content.character.attribs.filter(att => att.name.startsWith(key))
    }
}

function showFilePicker(event) {
    var dialog = new Dialog({
        title: "Import VTTES File",
        content: "<div class='form-group'><label for='data'>Source Data</label><input type='file' class='json-import' name='data' data-actorid='" +
            event.currentTarget.dataset.actorid + "'></div>",
        buttons: {
            one: {
                icon: '<i class="fas fa-file-import"></i>',
                label: "Import file",
                callback: readFile
            },
            two: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("QACT.Cancel"),
                callback: () => _vttLog("Chose Cancel")
            }
        },
        default: "two",
        render: html => console.log("Register interactivity in the rendered dialog"),
        close: html => console.log("Cancel")
    })
    dialog.render(true)
}



function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}