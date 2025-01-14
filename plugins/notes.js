/* Codded by @Ravindu Manoj

Telegram: t.me/RavinduManoj
Facebook: https://www.facebook.com/ravindu.manoj.79

Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.

Whats bot - Ravindu Manoj
*/

const fs = require('fs/promises')
const path = require('path')
const { MessageType } = require('@adiwajshing/baileys')
const QueenSew = require('../events');
const { successfullMessage, errorMessage, infoMessage } = require('../helpers');
const NotesDB = require('./sql/notes');
const Language = require('../language')
const Lang = Language.getString('notes')
const SAVED = " *The Owner MSG👇*"

QueenSew.newcmdaddtosew({ pattern: 'notes', fromMe: false, desc: Lang.NOTES_USAGE }, async (message, match) => {


    const _notes = await NotesDB.getNotes()
    const notes = []
    _notes.map(note => {
        if (!note.note.includes('IMG;;;')) {
            notes.push('💗' + note.note)
        }
    })

    if (notes.length < 1) {
        return await message.sendMessage(infoMessage(Lang.NO_SAVED))
    }

    await message.sendMessage(infoMessage(SAVED))

    await message.sendMessage(notes.join('\n\n'))
    _notes.filter(note => note.note.includes('IMG;;;')).forEach(async (note) => {
        const imageName = note.note.replace('IMG;;;', '')
        const image = await fs.readFile(path.resolve('media', imageName))
        await message.sendMessage(image, MessageType.image)
    })


})



QueenSew.newcmdaddtosew({ pattern: 'save ?(.*)', fromMe: true, desc: Lang.SAVE_USAGE }, async (message, match) => {

    const userNote = match[1]

    if (!userNote && !message.reply_message) {
        await message.sendMessage(errorMessage(Lang.REPLY))

        return
    }

    if (userNote) {
        await NotesDB.saveNote(userNote)
        await message.sendMessage(successfullMessage(Lang.SUCCESSFULLY_ADDED), MessageType.text)

        return

    } else if (!userNote && message.reply_message) {
        if (!message.reply_message.video) {

            if (message.reply_message.image) {
                const savedFileName = await message.client.downloadAndSaveMediaMessage({
                    key: {
                        remoteJid: message.reply_message.jid,
                        id: message.reply_message.id
                    },
                    message: message.reply_message.data.quotedMessage
                })

                const randomFileName = savedFileName.split('.')[0] + Math.floor(Math.random() * 50) + path.extname(savedFileName)
                await fs.copyFile(savedFileName, path.resolve('media', randomFileName))
                await NotesDB.saveNote("IMG;;;" + randomFileName)
                await message.sendMessage(successfullMessage(Lang.SUCCESSFULLY_ADDED), MessageType.text)


            }

            await NotesDB.saveNote(message.reply_message.text)
            await message.sendMessage(successfullMessage(Lang.SUCCESSFULLY_ADDED), MessageType.text)

            return
        }
    } else {
        await message.sendMessage(errorMessage(Lang.UNSUCCESSFUL))

        return
    }
})

QueenSew.newcmdaddtosew({ pattern: 'deleteNotes', fromMe: true, desc: Lang.DELETE_USAGE }, async (message, match) => {

    await NotesDB.deleteAllNotes()

    const mediaFolder = await fs.readdir(path.resolve('media'))

    mediaFolder.forEach(async (file) => {
        await fs.unlink(path.resolve('media', file))
    })

    return await message.sendMessage(successfullMessage(Lang.SUCCESSFULLY_DELETED))
})

