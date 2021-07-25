CONFIG.debug.hooks = false

Hooks.once('init', async function () {

});

Hooks.once('ready', async function () {

});

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
        console.error(fReader.error)
    }
}

async function _importToActor(content, actor) {
    var abilities = getAbilities()
    var details = getDetails()
    var proficiencyModifier = getCalculatedProficiency(details.level)

    var proficiencies = content.character.attribs.filter(a => a.name.endsWith("_prof_type")).reduce((acc, curr) => {
        var key = curr.current
        var value = curr.name.substring(0, curr.name.length - "_prof_type".length)
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(value)
        return acc
    }, {})


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
                    value: 0,
                    bonus: 0,
                    mod: getAttribCurrentInt("initiative_bonus"),
                    prof: 0,
                    total: 3
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
                    darkvision: 0,
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
                // spelldc: getAttribCurrentInt("spell_save_dc")
            },
            skills: getSkills(),
            traits: {
                size: getAttribCurrent("size"),
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
                    custom: ""
                }
            }
        }
    })

    await setActorClass();

    console.log(actor)

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

    async function setActorClass() {
        var itemClass = await Item.create({
            name: getAttribCurrent("class"),
            type: "class",
            img: "systems/dnd5e/icons/skills/fire_08.jpg",
            data: {
                description: {
                    value: "",
                    chat: "",
                    unidentified: ""
                },
                levels: getAttribCurrentInt("level"),
                subclass: getAttribCurrent("subclass"),
                hitDice: "d" + getAttribCurrentInt("hitdietype"),
                spellcasting: {
                    progression: "full",
                    ability: getSpellcastingAbility()
                },
            }
        });
        actor.addEmbeddedItems([itemClass], false);
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
                value: content.character.bio,
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
            hair: getAttribCurrent("hair")
            //,            level: getAttribCurrentInt("level")
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
        console.log(key)
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
                callback: () => console.log("Chose Two")
            }
        },
        default: "two",
        render: html => console.log("Register interactivity in the rendered dialog"),
        close: html => console.log("Cancel")
    })
    dialog.render(true)
}

Hooks.on('renderActorSheet5e', async (app, html, data) => {
    const actionsTabButton = $('<a class="file-picker" data-tab="quick-actions" data-actorid="' + data.actor._id + '"> VTTES Import </a>');
    const closeButton = html.find('.close')
    actionsTabButton.insertBefore(closeButton)

    actionsTabButton.on('click', showFilePicker)
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}