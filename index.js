const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config()

const firebase = require("firebase/app");
const firebaseConfig = require('./firebaseConfig');
firebase.initializeApp(firebaseConfig);

const admin = require('firebase-admin');
const dbAdmin = require('./firebaseAdmin');
admin.initializeApp(dbAdmin);

const db = admin.firestore()
db.settings({ ignoreUndefinedProperties: true })
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


app.post("/registerAccount", (req, res) => {
    let account = req.body.account;
    account.rank = 5;
    account.profile = "";
    players.get()
        .then(snapshot => {
            let size = snapshot.size + 1;
            account.id = size;
            players.add(account)
                .then(docRef => {
                    account.accountDocRef = docRef.id;
                    players.doc(docRef.id).update({ accountDocRef: docRef.id })
                        .then(ok => {
                            if (ok.writeTime) {
                                let player = {};
                                player = account;

                                res.json({ player });
                            }
                        })
                })
        })
})

app.post('/login', (req, res) => {
    let account = req.body.account;
    const { login, password, lastLogged } = account;
    players.where("login", "==", `${login}`).get()
        .then(snapshot => {
            if (snapshot.size === 0) {
                res.json({ msg: "Nie ma takiego gracza." })
            } else {
                snapshot.forEach(doc => {
                    const document = doc.data();

                    let player = {};
                    player = document;

                    res.json({ player });
                    console.log("Zalogowano");
                    players.doc(player.accountDocRef).set({ lastLog: lastLogged }, { merge: true });

                })
            }
        });
})

app.post('/edit-account', (req, res) => {
    let character = req.body.character;

    switch (character.changed) {
        case "character":
            players.doc(character.accountDocRef).set({ name: character.name, age: character.age, race: character.race, class: character.class }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        res.json({ saved: true })
                    }
                })

            break;
        case "name":
            players.doc(character.accountDocRef).set({ name: character.name }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        res.json({ saved: true })
                    }
                })
            break;
        case "profile":
            players.doc(character.accountDocRef).set({ profile: character.profile }, { merge: true })
                .then(ok => {
                    if (ok.writeTime) {
                        res.json({ saved: true })
                    }
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

                            })
                    }
                })
    }


})

app.post('/stories-fetch', (req, res) => {
    let storiesArray = [];
    stories.get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                let story = doc.data();
                storiesArray.push(story);
            })
            res.json({ storiesArray })
        })
})

app.post('/stories-update', (req, res) => {
    const { newChapter, seen, deleteChapter, createStory } = req.body;

    if (newChapter) {
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
                            }
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
                        stories.doc(chapter.storyID).set({ chapters: chaptersArray, spectators: spectatorsArray, nextTurn: chapter.nextTurn }, { merge: true })
                            .then(ok => {
                                if (ok.writeTime) {
                                    res.json({ saved: true })
                                }
                            })
                    } else {
                        stories.doc(chapter.storyID).set({ chapters: chaptersArray, spectators: spectatorsArray }, { merge: true })
                            .then(ok => {
                                if (ok.writeTime) {
                                    res.json({ saved: true })
                                }
                            })
                    }



                }
            })
    } else if (seen) {
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
                        }
                    })
            })
    } else if (deleteChapter) {
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
                        }
                    })
            })
    } else if (createStory) {

        let story = req.body.createStory;
        story.id = new Date().getTime();
        let spectator = {};
        spectator.name = story.author.name;
        spectator.id = story.author.id;
        spectator.seen = true;
        story.spectators = [];
        story.spectators.push(spectator);
        story.chapters = [];
        story.isReady = false;
        console.log(story);
        stories.add(story)
            .then((docRef) => {
                stories.doc(docRef.id).update({ refID: docRef.id });
                res.json({ id: story.id });
            })
    }
})

app.post('/characters-fetch', (req, res) => {
    let characters = [];

    players.orderBy("id").get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                let data = doc.data();
                if (data.name && data.race && data.class && data.age && data.profile) {
                    let character = {};
                    character = data;
                    characters.push(character)
                }
            })
            res.json({ characters });
        })

})

app.post('/mails-create', (req, res) => {
    const message = req.body.newMessage;
    const { addreesse, sender, text, title } = message;
    console.log(addreesse.id)

    let newMail = message;
    newMail.id = new Date().getTime();
    newMail.addreesse.read = false;
    newMail.sender.read = true;
    newMail.between = [addreesse.id, sender.id];
    newMail.records = [];
    console.log(newMail);

    mails.add(newMail)
        .then((docRef) => {
            mails.doc(docRef.id).update({ mailsDocRef: docRef.id });
            res.json({ isSaved: true });
        })
});

app.post('/mails-fetch', (req, res) => {
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
                                console.log("Nie ma maili")
                            } else {
                                snapshot.forEach(doc => {
                                    let story = doc.data();
                                    mailsArray.push(story);
                                })
                            }
                            res.json({ mailsArray })
                        })
                })
            }
        })

    // if (playerID === undefined) {
    //     console.log("Nie moge pobrać maili")
    //     res.json({ failed: true })
    // } else {
    //     mails.where("between", 'array-contains', playerID).orderBy("id", "asc").get()
    //         .then(snapshot => {
    //             if (snapshot.size === 0) {
    //                 console.log("Nie ma maili")
    //             } else {
    //                 snapshot.forEach(doc => {
    //                     let story = doc.data();
    //                     mailsArray.push(story);
    //                 })
    //             }
    //             res.json({ mailsArray })
    //         })
    // }

})

app.post('/mails-update', (req, res) => {
    if (req.body.newMessage) {
        const mailRecord = req.body.newMessage;
        let recordsArray = [];
        let addreesse = {};
        let sender = {};
        mails.doc(mailRecord.mailsDocRef).get()
            .then(doc => {
                let mail = doc.data()
                console.log(mail)
                recordsArray = mail.records;
                recordsArray.push(mailRecord);
                if (mailRecord.author.id === mail.sender.id) {
                    addreesse = mail.addreesse;
                    addreesse.read = false;
                    sender = mail.sender;
                    sender.read = true;
                } else if (mailRecord.author.id === mail.addreesse.id) {
                    sender = mail.sender;
                    sender.read = false;
                    addreesse = mail.addreesse;
                    addreesse.read = true;
                }
                mails.doc(mailRecord.mailsDocRef).set({ records: recordsArray, sender: sender, addreesse: addreesse }, { merge: true })
                    .then(ok => {
                        if (ok.writeTime) {
                            res.json({ saved: true })
                        }
                    })
            })
    } else if (req.body.read) {
        const { id, refID } = req.body.read;
        let addreesse = {};
        let sender = {};
        mails.doc(refID).get()
            .then(doc => {
                let mail = doc.data()

                if (id === mail.sender.id) {
                    sender = mail.sender;
                    sender.read = true;
                    console.log("Nadawca zmieniony na odczytaną.");
                    mails.doc(refID).set({ sender: sender }, { merge: true })
                } else if (id === mail.addreesse.id) {
                    addreesse = mail.addreesse;
                    addreesse.read = true;
                    console.log("Odbiorca zmieniony na odczytaną.")
                    mails.doc(refID).set({ addreesse: addreesse }, { merge: true })
                }
                res.json({ saved: true })
            })
    }

})

app.post('/stories/prive-create', (req, res) => {
    let story = req.body.story;

    let priveStory = {};
    let author = {};
    author.id = story.author.id;
    author.name = story.author.name;
    author.rank = story.author.rank;
    priveStory.author = author;
    priveStory.title = story.title;
    priveStory.id = new Date().getTime();
    priveStory.chapters = [];

    let players = [];

    let spectator = {};
    spectator.name = story.author.name;
    spectator.id = story.author.id;
    spectator.seen = true;
    players.push(spectator);

    story.players.map(playerInside => {
        let spectator = {};
        spectator.id = playerInside.id;
        spectator.name = playerInside.name;
        spectator.seen = false;
        players.push(spectator)
    });

    priveStory.players = players;
    priveStory.openMsg = story.text;
    priveStory.startDate = story.startDate;
    priveStory.nextTurn = story.nextTurn;
    let between = []
    players.map(player => {
        between.push(player.id);
    })
    priveStory.between = between;

    priveStories.add(priveStory)
        .then((docRef) => {
            priveStories.doc(docRef.id).update({ refID: docRef.id });
            let id = priveStory.id;
            res.json({ id: id })
        })

})

app.post('/stories/prive-fetch', (req, res) => {
    let mail = req.body.mail;
    let priveStoriesArray = []


    players.where('login', "==", `${mail}`).get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                let player = doc.data();
                let playerID = player.id;

                priveStories.where('between', 'array-contains', playerID).orderBy('id', 'asc').get()
                    .then(snapshot => {
                        snapshot.forEach(doc => {
                            let story = doc.data()
                            priveStoriesArray.push(story);
                        })
                        console.log(priveStoriesArray);
                        res.json({ saved: true, priveStoriesArray })
                    })
            })


        })

})
app.listen(port, () => console.log(`Listening on port ${port}`));

