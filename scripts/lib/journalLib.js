const importToJournal = async function (content, journal) {
    if (!content.type || content.type != 'handout') {
        throw `Wrong type in JSON document ! Expected : handout`;
    }

    await journal.update({
        name: content.handout.name,
        img: content.handout.avatar,
        content: unescape(content.handout.notes) + `<p><img style=\"display:block;margin-left:auto;margin-right:auto\" src=\"${content.handout.avatar}\" width=\"500\" /></p>`
    });
}

export {importToJournal}