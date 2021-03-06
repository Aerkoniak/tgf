const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config()

const { htmlToText } = require('html-to-text');


const multer = require('multer')
const upload = multer({ dest: 'uploads/' })

// FUNKCJA DATY

const createDate = require('./createDate');

// FUNKCJE ZŁODZIEJSKIE 

const pickPocket = require('./logic/pickpocketing');

// FUNKCJE Szpiegowska

const checkInterceptedMsg = require('./logic/spying');
// const updateLastActiveDate = require('./logic/updateLastActiveDate');

// RAPORTOWANIE Błędów

const reportErrors = require('./logic/reportErrors');

// FIRESTORE 
const firebase = require("firebase/app");
const admin = require('firebase-admin');

const firebaseConfig = require('./firebaseConfig');
firebase.initializeApp(firebaseConfig);

const dbAdmin = require('./firebaseAdmin');
admin.initializeApp(dbAdmin);


const db = admin.firestore();

// const db = require('./db/firestore');

db.settings({ ignoreUndefinedProperties: true });
const FieldValue = require('firebase-admin').firestore.FieldValue;
const { merge } = require('lodash');

const players = db.collection("players");
const stories = db.collection('stories');
const mails = db.collection('mails');
const priveStories = db.collection('stories-prive');


const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// app.use(express.static(path.join(__dirname, 'build')));
// app.get('/*', function (req, res) {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

// const updateLastActiveDate = (req, res, next) => {

// }


app.post("/registerAccount", (req, res) => {
    console.log("/registerAccount")
    let account = req.body.account;
    account.rank = 5;
    account.profile = [{ name: "Pierwsza zakładka", text: "" }];
    account.diary = []
    account.priveField = 0;
    account.mailsField = 0;
    account.storyField = 0;
    account.FabularPoints = 5;
    players.get()
        .then(snapshot => {
            let size = snapshot.size;
            account.id = size;
            players.add(account)
                .then(docRef => {
                    account.accountDocRef = docRef.id;
                    players.doc(docRef.id).update({ accountDocRef: docRef.id })
                        .then(ok => {
                            if (ok.writeTime) {
                                let player = {};
                                player = account;
                                console.log("/registerAccount --- response")
                                res.json({ player });
                            }
                        })
                        .catch(err => {
                            reportErrors(err, "94")
                        })
                })
                .catch(err => {
                    reportErrors(err, "103")
                })

        })
})

app.post('/login', (req, res) => {
    console.log("/login")
    let account = req.body.account;
    const { login, password, lastLogged } = account;
    console.log(login)

    players.where("login", "==", `${login}`).get()
        .then(snapshot => {
            if (snapshot.size === 0) {
                console.log("nie ma gracza")
                res.json({ msg: "Nie ma takiego gracza." })

                reportErrors({ msg: "Nie ma takiego gracza." }, "121")

            } else {
                snapshot.forEach(doc => {
                    const document = doc.data();

                    let player = {};
                    player = document;


                    let lastActiveDate = new Date();
                    let lastActiveTime = lastActiveDate.getTime();
                    let lastDayActive = lastActiveDate.getDate();

                    let change = {
                        lastLog: lastLogged,
                        lastActiveTime: lastActiveTime
                    }

                    if (lastDayActive > player.lastDayActive || !player.lastDayActive) {
                        change.lastDayActive = lastDayActive;
                        let points = player.actionPoints || 0;
                        if (points <= 8 || !points) {
                            points += 2
                            change.actionPoints = points;
                        }
                    }

                    players.doc(player.accountDocRef).set(change, { merge: true });
                    players.doc(player.accountDocRef).get()
                        .then(doc => {
                            let player = doc.data()
                            res.json({ player })
                        })
                        .catch(err => {
                            reportErrors(err, "156")
                        })
                })
            }
        });
})

app.post('/fetch-player', (req, res) => {
    3
    console.log("/fetch-player")
    let docRef = req.body.docRef;
    console.log(docRef)
    players.doc(docRef).get()
        .then(doc => {
            let player = doc.data()
            console.log("/fetch-player --- done")
            res.json({ player })
        })
        .catch(err => {
            reportErrors(err, "175")
        })
})

app.post('/update-activeTime', (req, res) => {
    const { lastActiveTime, accountDocRef } = req.body.data;
    console.log("/update-activeTime", lastActiveTime, accountDocRef)
    if (!accountDocRef) {
        res.json({ data: "ok" })
    } else if (lastActiveTime && accountDocRef) {
        players.doc(accountDocRef).set({ lastActiveTime: lastActiveTime }, { merge: true })
            .catch(err => {
                reportErrors(err, "187")
            })
        res.json({ data: "ok" });
        // console.log("update-activeTime")
    }

})

app.post('/edit-account', (req, res) => {
    console.log("/edit-account")
    let character = req.body.character;

    switch (character.changed) {
        case "character - stageOne":
            {
                players.doc(character.accountDocRef).set({ name: character.name, race: character.race, class: character.class, origin: character.origin }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                            console.log("/edit-account -- stageOne --- done")
                        }
                    })
                    .catch(err => {
                        reportErrors(err, "210")
                    })
            }
            break;
        case 'character - stageTwo':
            {
                players.doc(character.accountDocRef).set({ age: character.age, height: character.height, posture: character.posture, hairColor: character.hairColor, eyeColor: character.eyeColor }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                            console.log("/edit-account -- stageTwo --- done")
                        }
                    })
                    .catch(err => {
                        reportErrors(err, "224")
                    })
            }
            break;
        case 'character - reset':
            {
                players.doc(character.accountDocRef).set({ name: "", race: "", class: "", age: null, height: null, posture: "", hairColor: "", eyeColor: "", stats: [], skills: [], FabularPoints: 100, }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {

                            console.log("/edit-account -- reset --- done")
                            players.doc(character.accountDocRef).get()
                                .then(doc => {
                                    let player = doc.data()
                                    res.json({ player })
                                })
                                .catch(err => {
                                    reportErrors(err, "241")
                                })
                        }
                    })
                    .catch(err => {
                        reportErrors(err, "246")
                    })
            }
            break;
        case 'character - profile':
            {
                players.doc(character.docRef).set({ profile: character.profile }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            players.doc(character.docRef).get()
                                .then(doc => {
                                    let player = doc.data()
                                    res.json({ player })
                                })
                                .catch(err => {
                                    reportErrors(err, "261")
                                })
                            console.log("/edit-account -- char-profile --- done")
                        }
                    })
                    .catch(err => {
                        reportErrors(err, "267")
                    })
            }
            break;
        case "name":
            players.doc(character.accountDocRef).set({ name: character.name }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        res.json({ saved: true })
                        console.log("/edit-account -- name --- done")
                    }
                })
                .catch(err => {
                    reportErrors(err, "280")
                })
            break;
        case "profile":
            players.doc(character.accountDocRef).set({ profile: character.profile }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        res.json({ saved: true })
                        console.log("/edit-account -- profile --- done")
                    }
                })
                .catch(err => {
                    reportErrors(err, "292")
                })
            break;
        case 'rank':
            players.doc(character.accountDocRef).set({ rank: character.newRank }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        // res.json({ saved: true })
                        players.doc(character.accountDocRef).get()
                            .then(doc => {
                                let player = doc.data()
                                res.json({ saved: true, player })
                                console.log("/edit-account -- rank --- done")
                            })
                            .catch(err => {
                                reportErrors(err, "307")
                            })
                    }
                })
                .catch(err => {
                    reportErrors(err, "312")
                })
            break;
        case 'skills':
            players.doc(character.docRef).set({ skills: character.skills, FabularPoints: character.PF }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        players.doc(character.docRef).get()
                            .then(doc => {
                                player = doc.data()
                                res.json(player)
                                console.log("/edit-account -- skills --- done")
                            })
                            .catch(err => {
                                reportErrors(err, "326")
                            })
                    }
                })
                .catch(err => {
                    reportErrors(err, "331")
                })
            break;
        case 'stats':
            players.doc(character.docRef).set({ stats: character.stats }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        let player = {};
                        players.doc(character.docRef).get()
                            .then(doc => {
                                player = doc.data()
                                res.json(player)
                                console.log("/edit-account -- stats --- done")
                            })
                            .catch(err => {
                                reportErrors(err, "346")
                            })
                    }
                })
                .catch(err => {
                    reportErrors(err, "351")
                })
            break;
        case 'diary':
            {
                players.doc(character.docRef).set({ diary: character.diary }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            players.orderBy("id").get()
                                .then(snapshot => {
                                    let characters = [];
                                    snapshot.forEach(doc => {
                                        let data = doc.data();
                                        if (data.name && data.race && data.class && (data.rank < 3 || data.rank === 10)) {
                                            let character = {};
                                            character = data;
                                            characters.push(character)
                                        }
                                    })
                                    res.json(characters);
                                    console.log("/edit-account -- diary --- done")
                                })
                                .catch(err => {
                                    reportErrors(err, "374")
                                })
                        }
                    })
                    .catch(err => {
                        reportErrors(err, "379")
                    })
            }
            break;
        case 'equipment':
            {
                players.doc(character.docRef).set({
                    equipment: {
                        privEq: character.store,
                        body: character.body
                    }
                }, { merge: true })
                    .then(() => {
                        players.doc(character.docRef).get()
                            .then((doc) => {
                                let player = doc.data();
                                res.json(player)
                            })
                    })
                    .catch(err => {
                        reportErrors(err, "399")
                    })
            }
            break;

    }
})

app.post('/stories-fetch', (req, res) => {
    console.log("/stories-fetch")
    let storiesArray = [];
    stories.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                let story = doc.data();
                storiesArray.push(story);
            })
            res.json({ storiesArray })
            console.log("/stories-fetch --- done")
        })
        .catch(err => {
            reportErrors(err, "420")
        })
})

app.post('/stories-update', (req, res) => {
    console.log("/stories-update")
    const { newChapter, seen, deleteChapter, createStory, closeStory, editChapter, modifiedSpectators } = req.body;

    if (newChapter) {
        console.log("/stories-update --- newChapter")
        let chapter = req.body.newChapter;
        let chaptersArray = [];
        let spectatorsArray = [];

        stories.doc(chapter.storyID).get()
            .then(doc => {
                let story = doc.data();

                if (!story.openMsg) {
                    stories.doc(chapter.storyID).set({ openMsg: chapter.msg, isReady: true, nextTurn: chapter.nextTurn }, { merge: true })
                        .then(ok => {
                            if (ok.writeTime) {
                                res.json({ saved: true })
                                console.log("/stories-update --- newChapter --- done")
                            }
                        })
                        .catch(err => {
                            reportErrors(err, "447")
                        })
                } else {

                    chaptersArray = story.chapters;
                    chaptersArray.push(chapter);
                    spectatorsArray = story.spectators

                    let isNewSpectator = false;
                    // Ustawiamy isSpectator na false i tworzymy obiekt spec. 
                    let spectator = {};
                    spectator.name = chapter.author.name;
                    spectator.id = chapter.author.id;
                    spectator.seen = true;
                    spectator.docRef = chapter.author.docRef;
                    // Mapujemy tablicę obecnych spectatorów, jeśli jeden z nich ma to samo ID co osoba odpisująca to ustawiamy isNewSpectator na true, a jednocześnie temu samemu spectatorowi zmieniami seen na true.
                    spectatorsArray.map(spectator => {
                        spectator.seen = false;
                        if (spectator.id === chapter.author.id) {
                            isNewSpectator = true;
                            spectator.seen = true;
                        }
                    })
                    // jeśli po zmapowaniu całej tablicy isNewSpectator wciąż jest false to pushujemy go do tablicy
                    if (!isNewSpectator) {
                        spectatorsArray.push(spectator)
                    }

                    if (story.author.id === chapter.author.id) {
                        let lastReply = new Date().getTime();
                        stories.doc(chapter.storyID).set({ lastReply: lastReply, chapters: chaptersArray, spectators: spectatorsArray, nextTurn: chapter.nextTurn }, { merge: true })
                            .then(ok => {
                                if (ok.writeTime) {
                                    res.json({ saved: true })
                                    console.log("/stories-update --- newChapter --- done")
                                }
                            })
                            .catch(err => {
                                reportErrors(err, "485")
                            })
                    } else {
                        let lastReply = new Date().getTime();
                        stories.doc(chapter.storyID).set({ lastReply: lastReply, chapters: chaptersArray, spectators: spectatorsArray }, { merge: true })
                            .then(ok => {
                                if (ok.writeTime) {
                                    res.json({ saved: true })
                                    console.log("/stories-update --- newChapter --- done")
                                }
                            })
                            .catch(err => {
                                reportErrors(err, "497")
                            })
                    };
                    players.doc(story.author.docRef).update({
                        storyField: FieldValue.increment(1),
                        FabularPoints: FieldValue.increment(1)
                    })
                        .catch(err => {
                            reportErrors(err, "505")
                        })

                    spectatorsArray.forEach(spectator => {
                        players.doc(spectator.docRef).update({
                            storyField: FieldValue.increment(1)
                        })
                            .catch(err => {
                                reportErrors(err, "513")
                            })
                    })
                }
            })
    } else if (seen) {
        console.log("/stories-update --- seen --- done")
        let { id, refID } = req.body.seen;
        let spectatorsArray = [];

        stories.doc(refID).get()
            .then(doc => {
                let story = doc.data();
                spectatorsArray = story.spectators

                spectatorsArray.map(spectator => {
                    if (spectator.id === id) {
                        spectator.seen = true;
                    }
                })
                stories.doc(refID).set({ spectators: spectatorsArray }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                            console.log("/stories-update --- seen --- done")
                        }
                    })
                    .catch(err => {
                        reportErrors(err, "541")
                    })
            })
            .catch(err => {
                reportErrors(err, "542")
            })
    } else if (deleteChapter) {
        console.log("/stories-update --- deleteChapter")
        let { chapterIndex, refID } = req.body.deleteChapter;
        let chapters = [];
        stories.doc(refID).get()
            .then(doc => {
                let story = doc.data();
                chapters = story.chapters;
                chapters.splice(chapterIndex, 1);
                stories.doc(refID).set({ chapters: chapters }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                            console.log("/stories-update --- deleteChapter --- done")
                        }
                    })
                    .catch(err => {
                        reportErrors(err, "564")
                    })
            })
            .catch(err => {
                reportErrors(err, "568")
            })
    } else if (createStory) {
        console.log("/stories-update --- createStory")

        let story = req.body.createStory;
        story.id = new Date().getTime();
        let spectator = {};
        spectator.name = story.author.name;
        spectator.id = story.author.id;
        spectator.seen = true;
        spectator.docRef = story.author.docRef;
        story.spectators = [];
        story.spectators.push(spectator);
        story.chapters = [];
        story.isReady = true;
        story.lastReply = new Date().getTime();
        stories.add(story)
            .then((docRef) => {
                stories.doc(docRef.id).update({ refID: docRef.id });
                res.json({ id: story.id });
                console.log("/stories-update --- createStory --- done")
            })
            .catch(err => {
                reportErrors(err, "592")
            })
    } else if (closeStory) {
        console.log("/stories-update --- closeStory")

        const { refID, place, closeTime, shutting } = req.body.closeStory;
        console.log(shutting)

        stories.doc(refID).set({ closeTime: closeTime, place: place, shutting: shutting }, { merge: true })
            .then(ok => {
                if (ok.writeTime) {
                    res.json({ saved: true })
                    console.log("/stories-update --- closeStory --- done")
                }
            })
            .catch(err => {
                reportErrors(err, "608")
            })
    } else if (editChapter) {
        console.log("/stories-update --- editChapter")
        const { storyID, chapters } = req.body.editChapter

        stories.doc(storyID).set({ chapters: chapters }, { merge: true })
            .then(ok => {
                if (ok.writeTime) {
                    res.json({ saved: true })
                    console.log("/stories-update --- editChapter --- done")
                }
            })
            .catch(err => {
                reportErrors(err, "622")
            })

    } else if (modifiedSpectators) {
        console.log("/stories-update --- modifiedSpectators")
        const { refID, spectators } = req.body.modifiedSpectators;

        stories.doc(refID).set({ spectators: spectators }, { merge: true })
            .then(ok => {
                if (ok.writeTime) {
                    res.json({ saved: true })
                    console.log("/stories-update --- modifiedSpectators --- done")
                }
            })
            .catch(err => {
                reportErrors(err, "637")
            })
    }
})

app.post('/characters-fetch', (req, res) => {
    console.log("/characters-fetch")
    let characters = [];

    players.orderBy("id").get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                let data = doc.data();
                if (data.name && data.race && data.class && (data.rank < 3 || data.rank === 10)) {
                    let character = {};
                    character = data;
                    characters.push(character)
                }
            })
            res.json({ characters });
            console.log("/characters-fetch --- done")

        })
        .catch(err => {
            reportErrors(err, "661")
        })

})

app.post('/mails-create', (req, res) => {
    console.log("/mails-create")

    const message = req.body.newMessage;
    const { addreesse, sender, text, title } = message;
    console.log(addreesse)

    let newMail = message;
    newMail.id = new Date().getTime();
    newMail.addreesse.read = false;
    newMail.sender.read = true;
    newMail.between = [addreesse.id, sender.id];
    newMail.records = [];
    newMail.lastReply = message.startDate;
    newMail.replyStamp = new Date().getTime();
    // console.log(newMail);

    mails.add(newMail)
        .then((docRef) => {
            mails.doc(docRef.id).update({ mailsDocRef: docRef.id });
            res.json({ isSaved: true });
            console.log("/mails-create --- done")

            players.doc(addreesse.docRef).update({
                mailsField: FieldValue.increment(1)
            })
                .catch(err => {
                    reportErrors(err, "693")
                })
        })
        .catch(err => {
            reportErrors(err, "697")
        })
});

app.post('/mails-fetch', (req, res) => {
    console.log("/mails-fetch")
    const playerLogin = req.body.login;
    let mailsArray = [];

    players.where("login", "==", `${playerLogin}`).get()
        .then(snapshot => {
            if (snapshot.size === 0) {
                res.json({ msg: "Nie ma takiego gracza." })
            } else {
                snapshot.forEach(doc => {
                    const document = doc.data();
                    let playerID = document.id;
                    mails.where("between", 'array-contains', playerID).orderBy("id", "asc").get()
                        .then(snapshot => {
                            if (snapshot.size === 0) {
                            } else {
                                snapshot.forEach(doc => {
                                    let story = doc.data();
                                    mailsArray.push(story);
                                })
                            }
                            res.json({ mailsArray })
                            console.log("/mails-fetch --- done")
                        })
                        .catch(err => {
                            reportErrors(err, "727")
                        })
                })
            }
        })
        .catch(err => {
            reportErrors(err, "733")
        })

})

app.post('/mails-update', async (req, res) => {
    console.log("/mails-update")
    const { newMessage, read, newViewer, deletedPlayer, mailList } = req.body;
    if (newMessage) {
        console.log("/mails-update --- newMessage")
        const mailRecord = req.body.newMessage;
        let recordsArray = [];
        let addreesse = {};
        let sender = {};
        let viewers = [];
        mails.doc(mailRecord.mailsDocRef).get()
            .then(doc => {
                let mail = doc.data()
                console.log(mail);
                recordsArray = mail.records;
                viewers = mail.viewers;

                let inform = [];

                recordsArray.push(mailRecord);


                if (mailRecord.author.id === mail.sender.id) {
                    addreesse = mail.addreesse;
                    addreesse.read = false;
                    inform.push(addreesse.docRef);
                    sender = mail.sender;
                    sender.read = true;
                    viewers.map(viewer => {
                        viewer.read = false;
                        inform.push(viewer.docRef)
                    })
                } else if (mailRecord.author.id === mail.addreesse.id) {
                    sender = mail.sender;
                    sender.read = false;
                    inform.push(sender.docRef);
                    addreesse = mail.addreesse;
                    addreesse.read = true;
                    viewers.map(viewer => {
                        viewer.read = false;
                        inform.push(viewer.docRef)
                    })
                } else if (mailRecord.author.id != mail.sender.id && mail.addreesse.id) {
                    addreesse = mail.addreesse;
                    addreesse.read = false;
                    inform.push(addreesse.docRef);
                    sender = mail.sender;
                    sender.read = false;
                    inform.push(sender.docRef);
                    viewers.map(viewer => {
                        if (viewer.name === mailRecord.author.name) {
                            viewer.read = true;
                        } else {
                            viewer.read = false;
                            inform.push(viewer.docRef)
                        }
                    })
                }
                let lastReply = mailRecord.replyDate;
                let replyStamp = new Date().getTime()

                mails.doc(mailRecord.mailsDocRef).set({ records: recordsArray, sender: sender, addreesse: addreesse, viewers: viewers, lastReply: lastReply, replyStamp: replyStamp }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                            console.log("/mails-update --- newMessage --- done")

                        }
                    })
                    .catch(err => {
                        reportErrors(err, "808")
                    })
                inform.forEach(docRef => {
                    players.doc(docRef).update({
                        mailsField: FieldValue.increment(1)
                    })
                        .catch(err => {
                            reportErrors(err, "815")
                        })
                })
            })
            .catch(err => {
                reportErrors(err, "820")
            })
    } else if (read) {
        console.log("/mails-update --- read")

        const { id, refID } = req.body.read;
        let addreesse = {};
        let sender = {};
        let viewers = [];
        mails.doc(refID).get()
            .then(doc => {
                let mail = doc.data()
                viewers = mail.viewers;

                if (id === mail.sender.id) {
                    sender = mail.sender;
                    sender.read = true;
                    mails.doc(refID).set({ sender: sender }, { merge: true })
                        .catch(err => {
                            reportErrors(err, "839")
                        })
                } else if (id === mail.addreesse.id) {
                    addreesse = mail.addreesse;
                    addreesse.read = true;
                    mails.doc(refID).set({ addreesse: addreesse }, { merge: true })
                        .catch(err => {
                            reportErrors(err, "846")
                        })
                } else if (id != mail.sender.id && mail.addreesse.id) {
                    viewers.map(viewer => {
                        if (id === viewer.id) {
                            viewer.read = true;
                        }
                    })
                    mails.doc(refID).set({ viewers: viewers }, { merge: true })
                        .catch(err => {
                            reportErrors(err, "856")
                        })
                }


                res.json({ saved: true })
                console.log("/mails-update --- read --- done")

            })
            .catch(err => {
                reportErrors(err, "866")
            })
    } else if (newViewer) {
        console.log("/mails-update --- newViewer")

        const { mailsDocRef, viewer } = req.body.newViewer;
        let between = [];
        let viewers = [];

        mails.doc(mailsDocRef).get()
            .then(doc => {
                let mail = doc.data();
                between = mail.between;
                between.push(viewer.id);
                viewers = mail.viewers;
                viewers.push(viewer);
                mails.doc(mailsDocRef).set({ between: between, viewers: viewers }, { merge: true })
                    .catch(err => {
                        reportErrors(err, "884")
                    })
                console.log("/mails-update --- newViewer --- done")

            })
            .catch(err => {
                reportErrors(err, "890")
            })
        players.doc(viewer.docRef).update({
            mailsField: FieldValue.increment(1)
        })
            .catch(err => {
                reportErrors(err, "896")
            })
    } else if (deletedPlayer) {
        console.log("/mails-update --- deletePlayer")

        const { name, mailsDocRef } = req.body.deletedPlayer;

        let between = [];
        let viewers = [];
        let removedIndex = null;
        let deletedID = null;

        mails.doc(mailsDocRef).get()
            .then(doc => {
                let mail = doc.data();
                between = mail.between;
                viewers = mail.viewers;
                viewers.map((viewer, index) => {
                    if (viewer.name === name) {
                        removedIndex = index;
                        deletedID = viewer.id;
                    }
                });
                viewers.splice(removedIndex, 1);
                between.map((id, index) => {
                    if (id === deletedID) removedIndex = index;
                })
                between.splice(removedIndex, 1)
                mails.doc(mailsDocRef).set({ between: between, viewers: viewers }, { merge: true })
                    .catch(err => {
                        reportErrors(err, "926")
                    })
                console.log("/mails-update --- deletePlayer --- done")

            })
            .catch(err => {
                reportErrors(err, "932")
            })
    } else if (mailList) {
        const { type, refsArray, fullMailsArray, playerID } = mailList;

        switch (type) {
            case "delete":
                {
                    refsArray.map(ref => {
                        mails.doc(ref).delete()
                            .catch(err => {
                                reportErrors(err, "943")
                            })
                    })

                }
                break;
            case "archive":
                {
                    refsArray.map(ref => {
                        mails.doc(ref).set({ archived: true }, { merge: true })
                            .catch(err => {
                                reportErrors(err, "954")
                            })
                    })
                }
                break;
            case "read":
                {
                    fullMailsArray.map((mail, index) => {
                        let flag = refsArray.includes(mail.mailsDocRef);
                        if (flag) {
                            if (playerID === mail.addreesse.id) {
                                mails.doc(mail.mailsDocRef).set({
                                    addreesse: {
                                        read: true
                                    }
                                }, { merge: true })
                                    .catch(err => {
                                        reportErrors(err, "971")
                                    })

                            } else if (playerID === mail.sender.id) {
                                mails.doc(mail.mailsDocRef).set({
                                    sender: {
                                        read: true
                                    }
                                }, { merge: true })
                                    .catch(err => {
                                        reportErrors(err, "981")
                                    })
                            } else {
                                let modViewers = [...mail.viewers];
                                modViewers.map(viewer => {
                                    if (viewer.id === playerID) {
                                        viewer.read = true;
                                    }
                                })
                                mails.doc(mail.mailsDocRef).set({
                                    viewers: modViewers
                                }, { merge: true })
                                    .catch(err => {
                                        reportErrors(err, "994")
                                    })
                            }
                        }
                    })

                }
                break;
            case "unread":
                {
                    fullMailsArray.map((mail, index) => {
                        let flag = refsArray.includes(mail.mailsDocRef);
                        if (flag) {
                            if (playerID === mail.addreesse.id) {
                                mails.doc(mail.mailsDocRef).set({
                                    addreesse: {
                                        read: false
                                    }
                                }, { merge: true })
                                    .catch(err => {
                                        reportErrors(err, "1014")
                                    })

                            } else if (playerID === mail.sender.id) {
                                mails.doc(mail.mailsDocRef).set({
                                    sender: {
                                        read: false
                                    }
                                }, { merge: true })
                                    .catch(err => {
                                        reportErrors(err, "1024")
                                    })


                            } else {
                                let modViewers = [...mail.viewers];
                                modViewers.map(viewer => {
                                    if (viewer.id === playerID) {
                                        viewer.read = false;
                                    }
                                })
                                mails.doc(mail.mailsDocRef).set({
                                    viewers: modViewers
                                }, { merge: true })
                                    .catch(err => {
                                        reportErrors(err, "1039")
                                    })
                            }
                        }
                    })
                }
                break;
            default: {
                return
            }
        }
        res.json({ saved: true })
    }

})

app.post('/stories/prive-create', (req, res) => {
    console.log("/stories/prive-create")

    let story = req.body.story;

    let priveStory = {};
    let author = {};
    author.id = story.author.id;
    author.name = story.author.name;
    author.rank = story.author.rank;
    author.docRef = story.author.accountDocRef;
    priveStory.author = author;
    priveStory.title = story.title;
    priveStory.id = new Date().getTime();
    priveStory.chapters = [];

    let spectators = [];

    let spectator = {};
    spectator.name = story.author.name;
    spectator.id = story.author.id;
    spectator.seen = true;
    spectator.docRef = story.author.accountDocRef;
    spectators.push(spectator);

    story.players.map(playerInside => {
        let spectator = {};
        spectator.id = playerInside.id;
        spectator.name = playerInside.name;
        spectator.seen = false;
        spectator.docRef = playerInside.accountDocRef;
        spectators.push(spectator)
    });

    priveStory.spectators = spectators;
    priveStory.openMsg = story.text;
    priveStory.startDate = story.startDate;
    priveStory.nextTurn = story.nextTurn;
    let between = []
    spectators.map(player => {
        between.push(player.id);
    })
    priveStory.between = between;

    priveStories.add(priveStory)
        .then((docRef) => {
            priveStories.doc(docRef.id).update({ refID: docRef.id });
            let id = priveStory.id;
            res.json({ id: id })
            console.log("/stories/prive-create --- done")

        })
        .catch(err => {
            reportErrors(err, "1108")
        })
    spectators.forEach(spectator => {
        players.doc(spectator.docRef).update({
            priveField: FieldValue.increment(1)
        })
            .catch(err => {
                reportErrors(err, "1115")
            })
    })

})

app.post('/stories/prive-fetch', (req, res) => {
    console.log("/stories/prive-fetch")

    let playerID = req.body.id;
    let priveStoriesArray = []


    priveStories.where('between', 'array-contains', playerID).orderBy('id', 'asc').get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                let story = doc.data()
                priveStoriesArray.push(story);
            })
            res.json({ saved: true, priveStoriesArray });
            console.log("/stories/prive-fetch --- done")

        })
        .catch(err => {
            reportErrors(err, "1139")
        })
})


app.post('/stories/prive-update', (req, res) => {
    console.log("/stories/prive-update")

    const { newChapter, seen, deleteChapter, deletedPlayer, addedPlayer, closedPrive, editChapter } = req.body;

    if (seen) {
        console.log("/stories/prive-update --- seen")

        let { id, refID } = req.body.seen;
        let spectatorsArray = [];

        priveStories.doc(refID).get()
            .then(doc => {
                let story = doc.data();
                spectatorsArray = story.spectators

                spectatorsArray.map(spectator => {
                    if (spectator.id === id) {
                        spectator.seen = true;
                    }
                })
                priveStories.doc(refID).set({ spectators: spectatorsArray }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            console.log("seen")
                            res.json({ saved: true })
                            console.log("/stories/prive-update --- seen --- done")

                        }
                    })
                    .catch(err => {
                        reportErrors(err, "1175")
                    })
            })
    } else if (newChapter) {
        console.log("/stories/prive-update --- newChapter")

        let chapter = req.body.newChapter;
        let chaptersArray = [];
        let spectatorsArray = [];

        priveStories.doc(chapter.storyID).get()
            .then(doc => {
                let story = doc.data();

                if (!story.openMsg) {
                    priveStories.doc(chapter.storyID).set({ openMsg: chapter.msg, isReady: true, nextTurn: chapter.nextTurn }, { merge: true })
                        .then(ok => {
                            if (ok.writeTime) {
                                res.json({ saved: true })
                                console.log("/stories/prive-update --- newChapter --- done")

                            }
                        })
                        .catch(err => {
                            reportErrors(err, "1199")
                        })
                } else {
                    chaptersArray = story.chapters;
                    chaptersArray.push(chapter);
                    spectatorsArray = story.spectators

                    let isNewSpectator = false;
                    // Ustawiamy isSpectator na false i tworzymy obiekt spec. 
                    let spectator = {};
                    spectator.name = chapter.author.name;
                    spectator.id = chapter.author.id;
                    spectator.seen = true;
                    // Mapujemy tablicę obecnych spectatorów, jeśli jeden z nich ma to samo ID co osoba odpisująca to ustawiamy isNewSpectator na true, a jednocześnie temu samemu spectatorowi zmieniami seen na true.
                    spectatorsArray.map(spectator => {
                        spectator.seen = false;
                        if (spectator.id === chapter.author.id) {
                            isNewSpectator = true;
                            spectator.seen = true;
                        }
                    })
                    // jeśli po zmapowaniu całej tablicy isNewSpectator wciąż jest false to pushujemy go do tablicy
                    if (!isNewSpectator) {
                        spectatorsArray.push(spectator)
                    }

                    if (story.author.id === chapter.author.id) {
                        priveStories.doc(chapter.storyID).set({ chapters: chaptersArray, spectators: spectatorsArray, nextTurn: chapter.nextTurn }, { merge: true })
                            .then(ok => {
                                if (ok.writeTime) {
                                    res.json({ saved: true })
                                }
                            })
                            .catch(err => {
                                reportErrors(err, "1233")
                            })
                    } else {
                        priveStories.doc(chapter.storyID).set({ chapters: chaptersArray, spectators: spectatorsArray }, { merge: true })
                            .then(ok => {
                                if (ok.writeTime) {
                                    res.json({ saved: true })
                                }
                            })
                            .catch(err => {
                                reportErrors(err, "1243")
                            })
                    }
                    spectatorsArray.forEach(spectator => {
                        players.doc(spectator.docRef).update({
                            priveField: FieldValue.increment(1)
                        })
                            .catch(err => {
                                reportErrors(err, "1251")
                            })
                    })


                }
            })
    } else if (deleteChapter) {
        console.log("/stories/prive-update --- deleteChapter")

        let { chapterIndex, refID } = req.body.deleteChapter;
        let chapters = [];
        priveStories.doc(refID).get()
            .then(doc => {
                let story = doc.data();
                chapters = story.chapters;
                chapters.splice(chapterIndex, 1);
                priveStories.doc(refID).set({ chapters: chapters }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                            console.log("/stories/prive-update --- deleteChapter --- done")

                        }
                    })
                    .catch(err => {
                        reportErrors(err, "1277")
                    })
            })
            .catch(err => {
                reportErrors(err, "1281")
            })
    } else if (deletedPlayer) {
        console.log("/stories/prive-update --- deletedPlayer")

        const { name, refID } = req.body.deletedPlayer;

        let between = [];
        let spectators = [];
        let playerID = null;

        priveStories.doc(refID).get()
            .then(doc => {
                let story = doc.data();
                let deletedIndex = null;
                between = story.between;
                spectators = story.spectators;
                spectators.map((spectator, index) => {
                    if (spectator.name === name) {
                        deletedIndex = index;
                        playerID = spectator.id;
                    }
                });
                spectators.splice(deletedIndex, 1);
                between.map((player, index) => {
                    if (player === playerID) {
                        deletedIndex = index;
                    }
                });
                between.splice(deletedIndex, 1);
                console.log(between, spectators);
                priveStories.doc(refID).set({ between: between, spectators: spectators }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                            console.log("/stories/prive-update --- deletedPlayer  --- done")

                        }
                    })
                    .catch(err => {
                        reportErrors(err, "1321")
                    })

            })
    } else if (addedPlayer) {
        console.log("/stories/prive-update --- addPlayer")

        const { player, refID } = req.body.addedPlayer;

        let between = [];
        let spectators = [];


        priveStories.doc(refID).get()
            .then(doc => {
                let story = doc.data();
                between = story.between;
                between.push(player.id);
                spectators = story.spectators;
                let spectator = {
                    name: player.name,
                    id: player.id,
                    seen: false,
                    docRef: player.accountDocRef
                }
                spectators.push(spectator);
                priveStories.doc(refID).set({ between: between, spectators: spectators }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                            console.log("/stories/prive-update --- addPlayer --- done")

                        }
                    })
                    .catch(err => {
                        reportErrors(err, "1356")
                    })
                players.doc(player.accountDocRef).update({
                    priveField: FieldValue.increment(1)
                })
                    .catch(err => {
                        reportErrors(err, "1362")
                    })

            })
    } else if (closedPrive) {
        console.log("/stories/prive-update --- closedPrive")

        const { refID, closed, closeTime } = req.body.closedPrive;

        priveStories.doc(refID).set({ closed: closed, closeTime: closeTime }, { merge: true })
            .then(ok => {
                if (ok.writeTime) {
                    res.json({ saved: true })
                    console.log("/stories/prive-update --- closedPrive --- done")

                }
            })
            .catch(err => {
                reportErrors(err, "1380")
            })
    } else if (editChapter) {
        console.log("/stories/prive-update --- editChapter")
        const { storyID, chapters } = req.body.editChapter

        priveStories.doc(storyID).set({ chapters: chapters }, { merge: true })
            .then(ok => {
                if (ok.writeTime) {
                    res.json({ saved: true })
                    console.log("/stories/prive-update --- editChapter --- done")
                }
            })
            .catch(err => {
                reportErrors(err, "1394")
            })
    }
})


app.post('/atelier', (req, res) => {
    const { docRef, item, privEq } = req.body.data;

    switch (req.body.data.type) {
        case "magazine":
            {
                console.log("Wewnątrz magazine")
                players.doc(docRef).set({
                    equipment: {
                        privEq: privEq
                    }
                }, { merge: true })
                    .then(() => {
                        players.doc(docRef).get()
                            .then(doc => {
                                let player = doc.data()
                                res.json({ player })
                            })

                    })
                    .catch(err => {
                        reportErrors(err, "1421")
                    })
            }
            break;

        default: {
            res.json({ msg: "ok" })
        }
    }
})

app.post('/theft', (req, res) => {
    const { data } = req.body;

    switch (data.type) {
        case 'pocket':
            {
                players.doc(data.targetDocRef).get()
                    .then(doc => {
                        let victim = doc.data();

                        let victimsEq = [...victim.equipment.body];
                        let thiefEq = [...data.thief.equipment.privEq];
                        let victimChronicle = [...victim.chronicles];
                        let thiefChronicle = [...data.thief.chronicles];

                        const date = createDate();
                        const chronicleEntry = {};
                        chronicleEntry.date = date;
                        // FN pickPocket zwraca rezultat i efekt kradzieży na podstawie danych. 
                        let ret = pickPocket(data.thief, victim);
                        // console.log(ret.result);
                        console.log(ret.effect);



                        // jeśli result wynosi 1 lub 2 to przesuwam pomiędzy eq kradziony przedmiot
                        if (ret.result === 1 || ret.result === 2) {

                            let stolenItem = null;
                            let stolenIndex = 0;

                            victimsEq.forEach((eq, index) => {
                                if (eq != null) {
                                    if (eq.id === data.itemID) {
                                        stolenItem = eq;
                                        stolenIndex = index;
                                    }
                                }
                            })
                            victimsEq.splice(stolenIndex, 1, null);

                            // console.log("stolenItem to ---", stolenItem)
                            // console.log("victimsEq to ---", victimsEq)

                            thiefEq.push(stolenItem);
                            // console.log("thiefEq to ---", thiefEq)

                            if (ret.result === 2) {
                                chronicleEntry.observation = `Ktoś wpadł na Ciebie nagle i poczułeś dziwne wrażenie tracenia czegoś. ${stolenItem.name} zniknął!
                                Przypomniałeś sobie istotę z posturą ${data.thief.posture}, mającą ${data.thief.eyeColor} oczy i ${data.thief.hairColor} włosy. Miała też około ${data.thief.height} wzrostu.
                                To musiał być złodziej.`
                                victimChronicle.push(chronicleEntry);

                            } else {
                                chronicleEntry.observation = `Ktoś wpadł na Ciebie nagle i poczułeś dziwne wrażenie tracenia czegoś. ${stolenItem.name} zniknął! Dramat, nic nawet nie zauważyłeś.`
                                victimChronicle.push(chronicleEntry);
                            }
                        } else if (ret.result === 3) {
                            chronicleEntry.observation = `Ktoś wpadł na Ciebie nagle i poczułeś czyjeś palce przy swojej biżuteri! Szarpnąłeś się i odskoczyła od Ciebie jakaś istota. Wszystko stało się zbyt szybko i nic nie zauważyłeś.`
                            victimChronicle.push(chronicleEntry);
                        } else if (ret.result === 4) {
                            chronicleEntry.observation = `Ktoś wpadł na Ciebie nagle i poczułeś czyjeś palce przy swojej biżuteri! Szarpnąłeś się i odskoczyła od Ciebie istota z posturą ${data.thief.posture}, mającą ${data.thief.eyeColor} oczy i ${data.thief.hairColor} włosy. Miała też około ${data.thief.height} wzrostu.
                            To musiał być złodziej.`
                            victimChronicle.push(chronicleEntry);
                        } else if (ret.result === 5) {
                            chronicleEntry.observation = `Ktoś wpadł na Ciebie nagle i poczułeś czyjeś palce przy swojej biżuteri! Szarpnąłeś się i zobaczyłeś jak ${data.thief.name} odskakuje od Ciebie. To on był złodziejem!`
                            victimChronicle.push(chronicleEntry);
                        }

                        let thiefChronEntry = {
                            date: date,
                            observation: ret.effect
                        }
                        thiefChronicle.push(thiefChronEntry);

                        reportErrors(thiefChronEntry, "Złodziejstwo - 1507")




                        players.doc(data.targetDocRef).set({
                            chronicles: victimChronicle,
                            equipment: {
                                body: victimsEq
                            }
                        }, { merge: true })
                            .catch(err => {
                                reportErrors(err, "1516")
                            })
                        players.doc(data.thief.accountDocRef).set({
                            chronicles: thiefChronicle,
                            equipment: {
                                privEq: thiefEq
                            }
                        }, { merge: true })
                            .then(() => {
                                res.json({ msg: ret.effect })
                            })
                            .catch(err => {
                                reportErrors(err, "1528")
                            })


                    })

            }
            break;
        default: {
            res.json({ ok: true })
        }
    }

})


// app.post('/everyone', (req, res) => {
//     let characters = [];

//     console.log(createDate())
//     players.orderBy("id").get()
//         .then(snapshot => {
//             snapshot.forEach(doc => {
//                 let player = doc.data();
//                 characters.push(player.accountDocRef)
//             })
//             console.log(characters)
//             characters.map(char => {
//                 // if (char == "vEeFufqeuA3dPNHiAb6l") {
//                 //     console.log("Nic nie zmienione")
//                 // } else {
//                 //     console.log("Zmiana")
//                 //     players.doc(char).set({
//                 //         chronicles: []
//                 //     }, { merge: true })

//                 // }
//                 console.log("Zmiana")
//                 players.doc(char).set({
//                     chronicles: []
//                 }, { merge: true })

//             })
//         })
//     let date = createDate();
//     res.json({ ok: date })
// })

app.post('/everyone', (req, res) => {
    // reportErrors(req.body.player.login, "/everyone")
})



app.post(
    "/set-avatar",
    upload.single("avatar" /* name attribute of <file> element in your form */),
    (req, res) => {
        console.log(req.file)
        const tempPath = req.file.path;
        const targetPathJpg = path.join(__dirname, `./uploads/${req.file.originalname}`);
        const targetPathJpeg = path.join(__dirname, `./uploads/${req.file.originalname}`);

        let docRef = (req.file.originalname).split('.');
        console.log(docRef[0]);

        if (path.extname(req.file.originalname).toLowerCase() === ".jpg") {
            fs.rename(tempPath, targetPathJpg, err => {
                if (err) return handleError(err, res);
            });
        } else if (path.extname(req.file.originalname).toLowerCase() === '.jpeg') {
            fs.rename(tempPath, targetPathJpeg, err => {
                if (err) return handleError(err, res);
            });
        }
        else {
            fs.unlink(tempPath, err => {
                if (err) return handleError(err, res);

                res.json({ saved: false })
            });
        };

        setTimeout(() => {
            let b64avatar = fs.readFileSync(`./uploads/${req.file.originalname}`, 'base64');
            players.doc(docRef[0]).set({ avatar64: b64avatar }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        console.log("Zapisano w bazie danych w formacie b64");
                        res.json({ saved: true });
                    }
                })
                .catch(err => {
                    reportErrors(err, "1624")
                })
        }, 500)

    }
);

// downloading files to computer

app.post('/download-file', async (req, res) => {


    let { refID, type } = req.query;

    let filePath = `./${refID}.txt`;


    let database = false;
    switch (type) {
        case "prive":
            {
                database = db.collection('stories-prive');
            }
            break;
        case "global":
            {
                database = db.collection('stories');
            }
            break;
        default: {

        }
    }

    try {
        const doc = await database.doc(`${refID}`).get();
        if (!doc.exists) {
            // console.log("Nie ma takiej sesji");
        } else {
            const story = doc.data();
            // console.log(story.chapters.length);
            let header = `
        ---

${story.title}

        ---
        
`;
            fs.appendFileSync(`${refID}.txt`, header, function (err) {
                if (err) throw err;
                // console.log('File is created successfully.');
            });

            story.chapters.map((record, index) => {
                let msg = htmlToText(record.msg);
                let line = `${record.author.name} - ${record.replyDate}

${msg}

        ---
        
`;
                fs.appendFileSync(`${refID}.txt`, line, function (err) {
                    if (err) throw err;
                    // console.log('File is created successfully.');
                });
            });
            // const file = fs.readFileSync(filePath,
            //     { encoding: 'utf8', flag: 'r' });
            // console.log(file);

            const file = fs.readFileSync(filePath,
                { encoding: 'utf8', flag: 'r' });
            // console.log(file);
            res.json({ file });
            // console.log("Wysłano.")

            setTimeout(() => {
                fs.unlinkSync(filePath);
                // console.log("Skasowano.")

            }, 10000);

        }
    } catch (err) {
        console.log(err)
    }

    // data.map((record, index) => {
    //     let msg = htmlToText(record.msg);

    //     let line = `${record.author.name} - ${record.replyDate}

    // ${msg}


    // `
    //     fs.appendFileSync(`downloadedStory.txt`, line, function (err) {
    //         if (err) throw err;
    //         console.log('File is created successfully.');
    //     });

    // })


    // const file = fs.readFileSync(filePath,
    //     { encoding: 'utf8', flag: 'r' });
    // console.log(file)
    // res.download(filePath, "your_story.txt")
    // setTimeout(() => {
    //     fs.unlinkSync(filePath);
    // }, 15000);


})

app.listen(port, () => console.log(`Listening on port ${port}`));

