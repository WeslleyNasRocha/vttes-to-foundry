const LOG_PREFIX = 'VTTES2FVTT'

const vttLog = function (message) {
    console.log(`${LOG_PREFIX} - ${message}`)
}

const vttError = function (message) {
    console.error(`${LOG_PREFIX} - ${message}`)
}

const vttWarn = function (message) {
    console.warn(`${LOG_PREFIX} - ${message}`)
}

const capitalizeFirstLetter = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const  getSizeCode = function (size) {
   return VTTES_TO_FOUNDRY_SIZES[size]
}

const getAttackType = function(attackType) {
    return VTTES_TO_FOUNDRY_ATTACK_TYPES[attackType]
}

const VTTES_TO_FOUNDRY_SIZES = {
    tiny: "tiny",
    small: "sm",
    medium : "med",
    large: "lg",
    huge: "huge",
    gargantuan: "grg"
}

const VTTES_TO_FOUNDRY_ATTACK_TYPES = {
    "Melee": "mwak",
    "Ranged": "rwak",
    "Melee Spell Attack": "msak",
    "Ranged Spell Attack": "rsak"
    // test: "save",
    // test: "heal",
    // test: "abil",
    // test: "util",
    // test: "other",
}

export {vttLog, vttWarn, vttError, capitalizeFirstLetter, getSizeCode}